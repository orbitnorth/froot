/**
 * Standard IETF Rate Limiter middleware for Froot.
 * Enforces per-client request quotas with sliding/fixed window counters,
 * standard RateLimit headers, and automatic HTTP 429 Retry-After rejection.
 */

import type { MiddlewareHandler, Context, Next } from '../types/index.js';
import { HTTPException } from '../core/errors.js';

export interface RateLimitStoreRecord {
  totalHits: number;
  resetTime: number; // Unix timestamp in milliseconds
}

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitStoreRecord> | RateLimitStoreRecord;
  resetKey?(key: string): Promise<void> | void;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private hits = new Map<string, RateLimitStoreRecord>();
  private sweepInterval: ReturnType<typeof setInterval> | null = null;

  constructor(sweepIntervalMs: number = 60_000) {
    if (typeof setInterval !== 'undefined') {
      this.sweepInterval = setInterval(() => this.sweep(), sweepIntervalMs);
      if (this.sweepInterval && typeof this.sweepInterval.unref === 'function') {
        this.sweepInterval.unref();
      }
    }
  }

  increment(key: string, windowMs: number): RateLimitStoreRecord {
    const now = Date.now();
    const existing = this.hits.get(key);

    if (!existing || now >= existing.resetTime) {
      const record: RateLimitStoreRecord = {
        totalHits: 1,
        resetTime: now + windowMs,
      };
      this.hits.set(key, record);
      return record;
    }

    existing.totalHits += 1;
    return existing;
  }

  resetKey(key: string): void {
    this.hits.delete(key);
  }

  sweep(): void {
    const now = Date.now();
    for (const [key, record] of this.hits.entries()) {
      if (now >= record.resetTime) {
        this.hits.delete(key);
      }
    }
  }

  clear(): void {
    this.hits.clear();
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval);
      this.sweepInterval = null;
    }
  }
}

export interface RateLimiterOptions {
  /**
   * The duration of the rate limit window in milliseconds.
   * @default 60_000 (1 minute)
   */
  windowMs?: number;

  /**
   * Maximum number of requests allowed within the window.
   * @default 100
   */
  limit?: number;

  /**
   * Function to generate a unique key for each client.
   * Defaults to extracting the client IP from proxy headers, or '127.0.0.1'.
   */
  keyGenerator?: (c: Context) => string | Promise<string>;

  /**
   * Custom handler invoked when rate limit is exceeded.
   * If omitted, throws HTTPException(429, 'Too Many Requests').
   */
  handler?: (c: Context, next: Next) => Response | Promise<Response>;

  /**
   * Custom error message when limit is exceeded.
   * @default 'Too Many Requests'
   */
  message?: string;

  /**
   * Custom storage adapter. Defaults to in-memory store.
   */
  store?: RateLimitStore;

  /**
   * Whether to send standard RateLimit headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset).
   * @default true
   */
  standardHeaders?: boolean;
}

function defaultKeyGenerator(c: Context): string {
  const xForwardedFor = c.req.header('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0]!.trim();
  }
  return (
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Creates a rate limiting middleware enforcing request volume controls.
 */
export function rateLimiter(options: RateLimiterOptions = {}): MiddlewareHandler {
  const windowMs = options.windowMs ?? 60_000;
  const limit = options.limit ?? 100;
  const keyGen = options.keyGenerator ?? defaultKeyGenerator;
  const sendHeaders = options.standardHeaders ?? true;
  const store = options.store ?? new MemoryRateLimitStore(windowMs);

  return async (c, next) => {
    const key = await keyGen(c);
    const { totalHits, resetTime } = await store.increment(key, windowMs);
    const now = Date.now();
    const resetSeconds = Math.max(0, Math.ceil((resetTime - now) / 1000));
    const remaining = Math.max(0, limit - totalHits);

    if (sendHeaders) {
      c.header('RateLimit-Limit', String(limit));
      c.header('RateLimit-Remaining', String(remaining));
      c.header('RateLimit-Reset', String(resetSeconds));
    }

    if (totalHits > limit) {
      if (sendHeaders) {
        c.header('RateLimit-Remaining', '0');
        c.header('Retry-After', String(resetSeconds));
      }

      if (options.handler) {
        return await options.handler(c, next);
      }

      throw new HTTPException(429, options.message || 'Too Many Requests', {
        detail: `Rate limit of ${limit} requests per ${Math.ceil(windowMs / 1000)}s exceeded. Try again in ${resetSeconds} seconds.`,
      });
    }

    return await next();
  };
}

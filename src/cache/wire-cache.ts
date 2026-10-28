/**
 * High-performance Zero-Copy Binary Wire Cache for Froot Framework.
 * Caches fully assembled HTTP/1.1 binary wire frames directly in memory,
 * bypassing handler dispatch, JSON serialization, and header formatting on cache hits.
 */

import { buildHttpFrame } from '../core/date-ticker.js';
import type { Context, MiddlewareHandler } from '../types/index.js';

export interface WireCacheOptions {
  ttl?: number; // TTL in milliseconds, default 5000ms (5s)
  maxEntries?: number; // Maximum entries in LRU store, default 10,000
  keyGenerator?: (c: Context<any, any>) => string;
}

export interface WireCacheEntry {
  frame: Buffer;
  expiresAt: number;
}

export class WireCacheStore {
  private cache = new Map<string, WireCacheEntry>();
  private readonly maxEntries: number;

  constructor(maxEntries = 10000) {
    this.maxEntries = maxEntries;
  }

  public get(key: string): Buffer | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU order only when cache is nearing capacity
    if (this.cache.size > this.maxEntries * 0.8) {
      this.cache.delete(key);
      this.cache.set(key, entry);
    }
    return entry.frame;
  }

  public set(key: string, frame: Buffer, ttlMs = 5000): void {
    if (this.cache.size >= this.maxEntries) {
      // Evict oldest entry (first item in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      frame,
      expiresAt: Date.now() + ttlMs
    });
  }

  public preWarm(key: string, frame: Buffer, ttlMs = 86400000): void {
    this.set(key, frame, ttlMs);
  }

  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public get size(): number {
    return this.cache.size;
  }
}

// Global default singleton wire cache
export const globalWireCache = new WireCacheStore();

/**
 * Creates an ultra-fast Wire-Caching middleware.
 * If a pre-assembled binary frame exists for the request key, it immediately serves it.
 */
export function wireCache(options: WireCacheOptions = {}): MiddlewareHandler<any, any> {
  const ttl = options.ttl ?? 5000;
  const store = options.maxEntries ? new WireCacheStore(options.maxEntries) : globalWireCache;
  const getKey = options.keyGenerator ?? ((c) => `${c.req.method}:${c.req.path}`);

  return async (c, next) => {
    // Only cache GET and HEAD requests
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      return next();
    }

    const key = getKey(c);
    const cachedFrame = store.get(key);

    if (cachedFrame) {
      // Cache hit: Attach raw pre-rendered wire frame directly onto Context & Response
      (c as unknown as { _wireFrame?: Buffer })._wireFrame = cachedFrame;
      c.header('x-cache', 'HIT');
      const res = c.text('', 200);
      (res as unknown as { _wireFrame?: Buffer })._wireFrame = cachedFrame;
      return res;
    }

    await next();

    // After handler execution: If response is successful (200), compile and cache wire frame
    if (c.statusCode === 200) {
      const internalRes = (c as unknown as { _res?: Response })._res;
      let bodyBuf: Buffer;

      const rawBody = (internalRes as unknown as { _rawBody?: string | Buffer | null })?._rawBody;
      if (Buffer.isBuffer(rawBody)) {
        bodyBuf = rawBody;
      } else if (typeof rawBody === 'string') {
        bodyBuf = Buffer.from(rawBody);
      } else if (internalRes) {
        const cloned = internalRes.clone();
        const arrayBuf = await cloned.arrayBuffer();
        bodyBuf = Buffer.from(arrayBuf);
      } else {
        bodyBuf = Buffer.alloc(0);
      }

      const contentType = c.header('content-type') || 'application/json';
      const frame = buildHttpFrame(200, contentType, bodyBuf, {
        'x-cache': 'HIT'
      });

      store.set(key, frame, ttl);
      (c as unknown as { _wireFrame?: Buffer })._wireFrame = frame;
      c.header('x-cache', 'MISS');
    }
  };
}

/**
 * High-performance request body size limiter middleware for Froot.
 * Protects servers against memory exhaustion and Denial-of-Service (DoS) attacks.
 */

import type { MiddlewareHandler } from '../types/index.js';
import { HTTPException } from '../core/errors.js';

export interface BodyLimitOptions {
  /**
   * Maximum allowed body size. Supports numbers in bytes or human-readable strings ('100kb', '5mb', '1gb').
   */
  maxSize: number | string;

  /**
   * Custom error handler invoked when the payload exceeds maxSize.
   */
  onError?: (c: import('../types/index.js').Context) => Response | Promise<Response>;
}

/**
 * Parses a byte size number or human-readable string ('500kb', '2mb') into integer bytes.
 */
export function parseSize(size: number | string): number {
  if (typeof size === 'number') {
    return size;
  }
  const match = size.trim().match(/^(\d+(?:\.\d+)?)\s*([kmgb]?b?)$/i);
  if (!match) {
    throw new Error(`Invalid size format for bodyLimit: ${size}`);
  }
  const val = parseFloat(match[1]!);
  const unit = (match[2] || '').toLowerCase();
  if (unit.startsWith('k')) return Math.floor(val * 1024);
  if (unit.startsWith('m')) return Math.floor(val * 1024 * 1024);
  if (unit.startsWith('g')) return Math.floor(val * 1024 * 1024 * 1024);
  return Math.floor(val);
}

/**
 * Creates a body limit middleware that rejects requests exceeding the specified byte size with HTTP 413.
 */
export function bodyLimit(options: BodyLimitOptions): MiddlewareHandler {
  const maxBytes = parseSize(options.maxSize);

  return async (c, next) => {
    // 1. Fast Content-Length inspection
    const contentLengthHeader = c.req.header('content-length');
    if (contentLengthHeader) {
      const contentLength = parseInt(contentLengthHeader, 10);
      if (!isNaN(contentLength) && contentLength > maxBytes) {
        if (options.onError) {
          return await options.onError(c);
        }
        throw new HTTPException(413, 'Payload Too Large', {
          detail: `Request body exceeds maximum allowed size of ${maxBytes} bytes`
        });
      }
    }

    return await next();
  };
}

/**
 * High-performance ETag and HTTP 304 Not Modified conditional caching middleware for Froot.
 * Computes fast non-cryptographic FNV-1a digests of response bodies and negotiates If-None-Match headers.
 */

import type { MiddlewareHandler } from '../types/index.js';

export interface ETagOptions {
  /**
   * Whether to generate a weak ETag (prefixed with W/).
   * @default true
   */
  weak?: boolean;

  /**
   * Custom hash generator function. Defaults to fast FNV-1a.
   */
  hashFn?: (body: string) => string;
}

/**
 * 32-bit Fowler–Noll–Vo (FNV-1a) fast hashing algorithm.
 * Optimized for V8 single-pass execution.
 */
export function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

/**
 * Creates ETag middleware that injects ETag headers and negotiates If-None-Match with 304 Not Modified.
 */
export function etag(options: ETagOptions = {}): MiddlewareHandler {
  const isWeak = options.weak ?? true;
  const hash = options.hashFn ?? fnv1a;

  return async (c, next) => {
    await next();

    // Conditional caching applies to GET and HEAD requests
    const method = c.req.method;
    if (method !== 'GET' && method !== 'HEAD') {
      return undefined;
    }

    const internalRes = (c as unknown as { _res?: Response })._res;
    if (!internalRes) {
      return undefined;
    }

    const status = internalRes.status;
    if (status < 200 || status >= 300 || status === 204) {
      return undefined;
    }

    // Inspect fast raw string body
    const rawBody = (internalRes as unknown as { _rawBody?: string | null })._rawBody;
    if (rawBody === undefined || rawBody === null) {
      return undefined;
    }

    const digest = hash(rawBody);
    const tag = isWeak
      ? `W/"${rawBody.length.toString(16)}-${digest}"`
      : `"${rawBody.length.toString(16)}-${digest}"`;

    internalRes.headers.set('etag', tag);

    const ifNoneMatch = c.req.header('if-none-match');
    if (ifNoneMatch) {
      const clientTags = ifNoneMatch.split(',').map((t) => t.trim());
      const normTag = tag.replace(/^W\//, '');

      const isMatch = clientTags.some((t) => {
        if (t === '*') return true;
        if (t === tag) return true;
        return t.replace(/^W\//, '') === normTag;
      });

      if (isMatch) {
        c.status(304);
        (internalRes as unknown as { _rawBody?: string | null })._rawBody = null;

        const res304 = new Response(null, {
          status: 304,
          headers: internalRes.headers
        });
        (res304 as unknown as { _rawBody?: string | null })._rawBody = null;
        (c as unknown as { _res?: Response })._res = res304;
        return res304;
      }
    }

    return undefined;
  };
}

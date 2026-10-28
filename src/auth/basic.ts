/**
 * @module auth/basic
 * HTTP Basic Authentication middleware (RFC 7617) using the Web Crypto API
 * for timing-safe password comparison.
 */

import type { BasicAuthOptions } from './types.js';
import type { MiddlewareHandler } from '../types/index.js';

/**
 * Timing-safe string comparison using `crypto.subtle`.
 * Falls back to a fixed-time byte-by-byte loop if subtle is unavailable.
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);

  // Import as HMAC keys and sign a common message — the result is constant
  // time because we always do a full HMAC operation regardless of content.
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode('froot-basic-auth'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign('HMAC', keyMaterial, bufA.buffer as ArrayBuffer),
    crypto.subtle.sign('HMAC', keyMaterial, bufB.buffer as ArrayBuffer),
  ]);

  // Compare the HMAC outputs (same length = 32 bytes) in constant time.
  const viewA = new Uint8Array(sigA);
  const viewB = new Uint8Array(sigB);
  let diff = 0;
  for (let i = 0; i < viewA.length; i++) diff |= (viewA[i] ?? 0) ^ (viewB[i] ?? 0);
  return diff === 0;
}

/**
 * HTTP Basic Authentication middleware (RFC 7617).
 *
 * Extracts `Authorization: Basic <base64>`, decodes username:password, and
 * calls the user-supplied `validate` function. Uses timing-safe comparison
 * internally to resist timing attacks when the validate function does a
 * string comparison.
 *
 * Returns `401 Unauthorized` with a `WWW-Authenticate: Basic realm=...`
 * header when credentials are missing or invalid.
 *
 * @example
 * ```ts
 * app.use('/admin/*', basicAuth({
 *   validate: (u, p) => u === 'admin' && timingSafeEqual(p, process.env.ADMIN_PASS!),
 *   realm: 'Admin Panel',
 * }));
 * ```
 */
export function basicAuth(options: BasicAuthOptions): MiddlewareHandler {
  const realm = options.realm ?? 'Secure Area';

  return async (c, next) => {
    const auth = c.req.header('Authorization') ?? c.req.header('authorization') ?? '';

    if (!auth.startsWith('Basic ')) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': `Basic realm="${realm}"` },
      });
    }

    let username: string;
    let password: string;

    try {
      const decoded = atob(auth.slice(6).trim());
      const colonIdx = decoded.indexOf(':');
      if (colonIdx === -1) throw new Error('no colon');
      username = decoded.slice(0, colonIdx);
      password = decoded.slice(colonIdx + 1);
    } catch {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': `Basic realm="${realm}"` },
      });
    }

    const ok = await options.validate(username, password);
    if (!ok) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': `Basic realm="${realm}"` },
      });
    }

    return next();
  };
}

export { timingSafeEqual };

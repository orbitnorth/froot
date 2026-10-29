/**
 * @module auth/jwt
 * Zero-dependency JWT sign & verify using the Web Crypto API
 * (`globalThis.crypto.subtle`), available in Node.js 19+, Bun, Deno,
 * Cloudflare Workers, and all modern browsers.
 *
 * Supported algorithms:
 * - HS256 / HS384 / HS512  (HMAC-SHA-*)
 * - RS256 / RS384 / RS512  (RSASSA-PKCS1-v1_5)
 * - ES256 / ES384 / ES512  (ECDSA)
 */

import type {
  JWTAlgorithm,
  JWTClaims,
  JWTHeader,
  SignOptions,
  VerifyOptions,
} from './types.js';
import type { MiddlewareHandler } from '../types/index.js';

// ---------------------------------------------------------------------------
// Internal algorithm maps
// ---------------------------------------------------------------------------

interface AlgoSpec {
  name: string;
  hash: string;
  namedCurve?: string;
}

const ALGO_MAP: Record<JWTAlgorithm, AlgoSpec> = {
  HS256: { name: 'HMAC', hash: 'SHA-256' },
  HS384: { name: 'HMAC', hash: 'SHA-384' },
  HS512: { name: 'HMAC', hash: 'SHA-512' },
  RS256: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
  RS384: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-384' },
  RS512: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' },
  ES256: { name: 'ECDSA', hash: 'SHA-256', namedCurve: 'P-256' },
  ES384: { name: 'ECDSA', hash: 'SHA-384', namedCurve: 'P-384' },
  ES512: { name: 'ECDSA', hash: 'SHA-512', namedCurve: 'P-521' },
};

// ---------------------------------------------------------------------------
// Base64url helpers (no external deps)
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64urlEncode(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (padded.length % 4)) % 4;
  const b64 = padded + '='.repeat(pad);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ---------------------------------------------------------------------------
// Key import helpers
// ---------------------------------------------------------------------------

async function importSignKey(
  secret: string | CryptoKey,
  spec: AlgoSpec,
): Promise<CryptoKey> {
  if (secret instanceof CryptoKey) return secret;
  if (spec.name === 'HMAC') {
    return crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: spec.hash },
      false,
      ['sign'],
    );
  }
  throw new TypeError(
    'For RS*/ES* algorithms pass a CryptoKey obtained from crypto.subtle.importKey()',
  );
}

async function importVerifyKey(
  secret: string | CryptoKey,
  spec: AlgoSpec,
): Promise<CryptoKey> {
  if (secret instanceof CryptoKey) return secret;
  if (spec.name === 'HMAC') {
    return crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: spec.hash },
      false,
      ['verify'],
    );
  }
  throw new TypeError(
    'For RS*/ES* algorithms pass a CryptoKey obtained from crypto.subtle.importKey()',
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sign a JWT and return the compact serialization string.
 *
 * @param claims  The payload claims object.
 * @param secret  A string secret (HMAC) or a `CryptoKey` (RSA/ECDSA).
 * @param options Algorithm and expiry options.
 *
 * @example
 * ```ts
 * const token = await sign({ sub: 'user-1', role: 'admin' }, 'my-secret', { expiresIn: 3600 });
 * ```
 */
export async function sign(
  claims: JWTClaims,
  secret: string | CryptoKey,
  options: SignOptions = {},
): Promise<string> {
  const alg: JWTAlgorithm = options.algorithm ?? 'HS256';
  const spec = ALGO_MAP[alg];

  const now = Math.floor(Date.now() / 1000);
  const payload: JWTClaims = {
    iat: now,
    ...claims,
  };

  if (options.expiresIn !== undefined) {
    payload.exp =
      options.expiresIn < 1e9
        ? now + options.expiresIn // relative delta
        : options.expiresIn;      // absolute timestamp
  }

  const header: JWTHeader = { alg, typ: 'JWT' };

  const headerB64  = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const payloadB64 = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importSignKey(secret, spec);

  const signature = await crypto.subtle.sign(
    spec.namedCurve ? { name: spec.name, hash: spec.hash } : spec.name,
    key,
    encoder.encode(signingInput),
  );

  return `${signingInput}.${base64urlEncode(signature)}`;
}

/**
 * Verify a JWT and return the decoded payload claims.
 * Throws if the token is invalid, expired, or the signature doesn't match.
 *
 * @param token   The compact JWT string.
 * @param secret  The same secret/key used to sign.
 * @param options Algorithm and clock-skew options.
 *
 * @example
 * ```ts
 * const claims = await verify(token, 'my-secret');
 * console.log(claims.sub); // 'user-1'
 * ```
 */
export async function verify(
  token: string,
  secret: string | CryptoKey,
  options: VerifyOptions = {},
): Promise<JWTClaims> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('JWT: malformed token');

  const headerB64  = parts[0]!;
  const payloadB64 = parts[1]!;
  const sigB64     = parts[2]!;

  let header: JWTHeader;
  let payload: JWTClaims;
  try {
    header  = JSON.parse(decoder.decode(base64urlDecode(headerB64)));
    payload = JSON.parse(decoder.decode(base64urlDecode(payloadB64)));
  } catch {
    throw new Error('JWT: failed to parse header or payload');
  }

  const alg: JWTAlgorithm = options.algorithm ?? (header.alg as JWTAlgorithm) ?? 'HS256';
  const spec = ALGO_MAP[alg];
  if (!spec) throw new Error(`JWT: unsupported algorithm "${alg}"`);

  if (header.alg !== alg) {
    throw new Error(`JWT: algorithm mismatch — token uses ${header.alg}, expected ${alg}`);
  }

  const key = await importVerifyKey(secret, spec);

  const valid = await crypto.subtle.verify(
    spec.namedCurve ? { name: spec.name, hash: spec.hash } : spec.name,
    key,
    base64urlDecode(sigB64).buffer as ArrayBuffer,
    encoder.encode(`${headerB64}.${payloadB64}`).buffer as ArrayBuffer,
  );

  if (!valid) throw new Error('JWT: signature verification failed');

  const now = Math.floor(Date.now() / 1000);
  const skew = options.clockTolerance ?? 0;

  if (!options.ignoreExpiration && payload.exp !== undefined) {
    if (now > payload.exp + skew) {
      throw new Error('JWT: token has expired');
    }
  }

  if (!options.ignoreNotBefore && payload.nbf !== undefined) {
    if (now < payload.nbf - skew) {
      throw new Error('JWT: token is not yet valid (nbf)');
    }
  }

  return payload;
}

/**
 * JWT bearer-token middleware.
 *
 * Reads the `Authorization: Bearer <token>` header, verifies the token,
 * and stores the decoded claims in `c.get('jwtClaims')`.
 * Returns `401` if the header is missing or the token is invalid.
 *
 * @example
 * ```ts
 * app.use('/api/*', jwt('my-secret'));
 * ```
 */
export function jwt(
  secret: string | CryptoKey,
  options: VerifyOptions = {},
): MiddlewareHandler {
  return async (c, next) => {
    const auth = c.req.header('Authorization') ?? c.req.header('authorization');
    if (!auth || !auth.startsWith('Bearer ')) {
      return new Response('Unauthorized', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Bearer' },
      });
    }

    const token = auth.slice(7).trim();
    try {
      const claims = await verify(token, secret, options);
      c.set('jwtClaims', claims);
    } catch (err) {
      return new Response(`Unauthorized: ${(err as Error).message}`, {
        status: 401,
        headers: { 'WWW-Authenticate': 'Bearer error="invalid_token"' },
      });
    }

    return next();
  };
}

export { sign as signJwt, verify as verifyJwt };


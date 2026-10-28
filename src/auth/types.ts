/**
 * @module auth/types
 * Shared types for Froot's auth & crypto helpers.
 */

/** Supported HMAC-based JWT algorithms. */
export type JWTAlgorithmHMAC = 'HS256' | 'HS384' | 'HS512';

/** Supported asymmetric JWT algorithms. */
export type JWTAlgorithmAsym = 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512';

/** All supported JWT algorithms. */
export type JWTAlgorithm = JWTAlgorithmHMAC | JWTAlgorithmAsym;

/**
 * JWT header (RFC 7519 §5).
 */
export interface JWTHeader {
  alg: JWTAlgorithm;
  typ: 'JWT';
  [key: string]: unknown;
}

/**
 * Standard JWT claims (RFC 7519 §4.1).
 * All are optional; `sign()` will fill `iat` automatically if not provided.
 */
export interface JWTClaims {
  /** Issuer */
  iss?: string;
  /** Subject */
  sub?: string;
  /** Audience */
  aud?: string | string[];
  /** Expiration Time (Unix timestamp, seconds) */
  exp?: number;
  /** Not Before (Unix timestamp, seconds) */
  nbf?: number;
  /** Issued At (Unix timestamp, seconds) */
  iat?: number;
  /** JWT ID */
  jti?: string;
  /** Any additional claims */
  [key: string]: unknown;
}

/**
 * Options for {@link sign}.
 */
export interface SignOptions {
  algorithm?: JWTAlgorithm;
  /**
   * Expiration as a number of seconds from now, or an absolute Unix timestamp.
   * If less than 1e9 it is treated as a delta, otherwise as an absolute time.
   */
  expiresIn?: number;
}

/**
 * Options for {@link verify}.
 */
export interface VerifyOptions {
  algorithm?: JWTAlgorithm;
  /** Skip expiration check. Defaults to false. */
  ignoreExpiration?: boolean;
  /** Skip notBefore check. Defaults to false. */
  ignoreNotBefore?: boolean;
  /** Clock skew tolerance in seconds. Defaults to 0. */
  clockTolerance?: number;
}

/**
 * Options for {@link basicAuth} middleware.
 */
export interface BasicAuthOptions {
  /**
   * Validate credentials.
   * Return `true` to allow, `false` to deny.
   * Can be async.
   */
  validate(username: string, password: string): boolean | Promise<boolean>;
  /** Value sent in `WWW-Authenticate` header. Defaults to `'Secure Area'`. */
  realm?: string;
}


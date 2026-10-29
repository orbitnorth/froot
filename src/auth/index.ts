/**
 * @module auth
 * Froot Auth & Crypto module — zero-dependency, Web Crypto-based.
 *
 * Exports:
 * - JWT sign / verify / middleware (`jwt()`)
 * - HTTP Basic Auth middleware (`basicAuth()`)
 * - Crypto utilities: random tokens, PBKDF2 password hashing, AES-GCM encrypt/decrypt
 *
 * @example
 * ```ts
 * import { sign, verify, jwt, basicAuth, hashPassword, verifyPassword, randomToken } from 'froot/auth';
 * ```
 */

// JWT
export { sign, verify, jwt, signJwt, verifyJwt } from './jwt.js';

// Basic Auth
export { basicAuth, timingSafeEqual } from './basic.js';

// Crypto utilities
export {
  randomBytes,
  randomToken,
  randomHex,
  hashPassword,
  verifyPassword,
  generateAESKey,
  importAESKey,
  encrypt,
  decrypt,
  encryptString,
  decryptString,
} from './crypto.js';

// Types
export type {
  JWTAlgorithm,
  JWTAlgorithmHMAC,
  JWTAlgorithmAsym,
  JWTHeader,
  JWTClaims,
  SignOptions,
  VerifyOptions,
  BasicAuthOptions,
} from './types.js';


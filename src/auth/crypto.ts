/**
 * @module auth/crypto
 * General-purpose Web Crypto utilities:
 * - Random bytes / token generation
 * - PBKDF2 password hashing & verification
 * - AES-GCM symmetric encryption & decryption
 *
 * All operations use `globalThis.crypto.subtle` — no external dependencies.
 */

// ---------------------------------------------------------------------------
// Random utilities
// ---------------------------------------------------------------------------

/**
 * Generate `n` cryptographically random bytes as a `Uint8Array`.
 */
export function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
}

/**
 * Generate a URL-safe random token of `byteLength` random bytes,
 * encoded as Base64url (no padding).
 *
 * @param byteLength Default 32 → produces a 43-character token.
 */
export function randomToken(byteLength = 32): string {
  const bytes = randomBytes(byteLength);
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Generate a hex-encoded random token of `byteLength` bytes.
 */
export function randomHex(byteLength = 16): string {
  return Array.from(randomBytes(byteLength))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// PBKDF2 password hashing
// ---------------------------------------------------------------------------

const ENC = new TextEncoder();
const DEC = new TextDecoder();

const PBKDF2_ITERS = 310_000; // OWASP minimum recommendation for PBKDF2-HMAC-SHA256
const SALT_LEN     = 32;
const KEY_LEN      = 32; // 256-bit derived key

/**
 * Hash a plaintext password with PBKDF2-HMAC-SHA256.
 *
 * Returns a self-contained string in the format:
 * `pbkdf2:sha256:<iterations>$<base64Salt>$<base64Hash>`
 *
 * Store this string in your database — you never need to store the salt
 * separately.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    ENC.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LEN * 8,
  );

  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = btoa(String.fromCharCode(...new Uint8Array(bits)));
  return `pbkdf2:sha256:${PBKDF2_ITERS}$${saltB64}$${hashB64}`;
}

/**
 * Verify a plaintext password against a stored hash produced by
 * {@link hashPassword}.
 *
 * Returns `true` on match, `false` otherwise.
 * Uses constant-time comparison via `crypto.subtle.verify` to prevent
 * timing attacks.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 3) return false;

  const [header, saltB64, hashB64] = parts as [string, string, string];
  const headerParts = header.split(':');
  if (headerParts.length < 3 || headerParts[0] !== 'pbkdf2') return false;

  const iters = parseInt(headerParts[2]!, 10);
  if (!Number.isFinite(iters) || iters < 1) return false;

  let salt: Uint8Array;
  let expectedHash: Uint8Array;
  try {
    salt         = Uint8Array.from(atob(saltB64), (c) => c.charCodeAt(0));
    expectedHash = Uint8Array.from(atob(hashB64), (c) => c.charCodeAt(0));
  } catch {
    return false;
  }

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    ENC.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: iters, hash: 'SHA-256' },
    keyMaterial,
    expectedHash.length * 8,
  );

  const derived = new Uint8Array(bits);

  // Constant-time comparison.
  if (derived.length !== expectedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < derived.length; i++) diff |= (derived[i] ?? 0) ^ (expectedHash[i] ?? 0);
  return diff === 0;
}

// ---------------------------------------------------------------------------
// AES-GCM symmetric encryption
// ---------------------------------------------------------------------------

const AES_KEY_LEN = 256; // bits
const IV_LEN      = 12;  // bytes — 96-bit IV is recommended for AES-GCM

/**
 * Generate a fresh AES-256-GCM `CryptoKey` suitable for use with
 * {@link encrypt} and {@link decrypt}.
 */
export async function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_LEN },
    true,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Import a raw 32-byte AES key from a `Uint8Array` or hex string.
 */
export async function importAESKey(raw: Uint8Array | string): Promise<CryptoKey> {
  const bytes =
    typeof raw === 'string'
      ? Uint8Array.from({ length: raw.length / 2 }, (_, i) =>
          parseInt(raw.slice(i * 2, i * 2 + 2), 16),
        )
      : raw;

  return crypto.subtle.importKey(
    'raw',
    bytes.buffer as ArrayBuffer,
    { name: 'AES-GCM', length: AES_KEY_LEN },
    false,
    ['encrypt', 'decrypt'],
  );
}

/**
 * Encrypt `plaintext` with AES-256-GCM using the given `key`.
 *
 * Returns a `Uint8Array` in the format `[IV (12 bytes) | ciphertext+tag]`.
 * The IV is randomly generated per call and prepended to the output so
 * {@link decrypt} can reconstruct it without needing separate storage.
 */
export async function encrypt(plaintext: string | Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  const iv = randomBytes(IV_LEN);
  const data = typeof plaintext === 'string' ? ENC.encode(plaintext) : plaintext;

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    data instanceof Uint8Array ? data.buffer as ArrayBuffer : data,
  );

  const result = new Uint8Array(IV_LEN + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), IV_LEN);
  return result;
}

/**
 * Decrypt a `Uint8Array` produced by {@link encrypt}.
 *
 * Throws `DOMException` if the ciphertext or tag is tampered with
 * (AES-GCM authentication failure).
 */
export async function decrypt(ciphertext: Uint8Array, key: CryptoKey): Promise<Uint8Array> {
  const iv   = ciphertext.slice(0, IV_LEN);
  const data = ciphertext.slice(IV_LEN);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer,
  );

  return new Uint8Array(plaintext);
}

/**
 * Convenience: encrypt a string and return the result as a Base64 string.
 */
export async function encryptString(plaintext: string, key: CryptoKey): Promise<string> {
  const bytes = await encrypt(plaintext, key);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Convenience: decrypt a Base64 string produced by {@link encryptString}.
 */
export async function decryptString(b64: string, key: CryptoKey): Promise<string> {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const plain = await decrypt(bytes, key);
  return DEC.decode(plain);
}

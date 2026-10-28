/**
 * Web Cryptography API utilities for Froot Framework.
 * Pure Web Standards (crypto.subtle) compatible with Node 20+, Bun, Deno, and Cloudflare Workers.
 */

const encoder = new TextEncoder();

/**
 * Encodes Uint8Array into URL-safe base64 string.
 */
export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decodes URL-safe base64 string into Uint8Array.
 */
export function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) base64 += '=';
  if (typeof atob === 'function') {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Signs a string value using HMAC-SHA256 and appends the signature: `${value}.${sig}`
 */
export async function signValue(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  const sigBase64 = base64UrlEncode(new Uint8Array(signature));
  return `${value}.${sigBase64}`;
}

/**
 * Verifies an HMAC-SHA256 signed value using constant-time cryptographic verification.
 * Returns the un-signed value string if valid, or false if tampered.
 */
export async function verifySignedValue(signedValue: string, secret: string): Promise<string | false> {
  const lastDot = signedValue.lastIndexOf('.');
  if (lastDot === -1) return false;

  const value = signedValue.slice(0, lastDot);
  const sigStr = signedValue.slice(lastDot + 1);

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const signatureBytes = base64UrlDecode(sigStr);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as BufferSource,
      encoder.encode(value)
    );
    return isValid ? value : false;
  } catch {
    return false;
  }
}

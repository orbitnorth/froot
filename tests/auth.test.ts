/**
 * Tests for Froot Auth & Crypto module:
 * - JWT sign / verify / middleware
 * - Basic Auth middleware
 * - Crypto utilities (randomBytes, randomToken, randomHex, PBKDF2, AES-GCM)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { sign, verify, jwt }             from '../dist/auth/jwt.js';
import { basicAuth, timingSafeEqual }    from '../dist/auth/basic.js';
import {
  randomBytes, randomToken, randomHex,
  hashPassword, verifyPassword,
  generateAESKey, importAESKey,
  encrypt, decrypt, encryptString, decryptString,
} from '../dist/auth/crypto.js';
import type { Context, Middleware } from '../dist/types/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal context stub for middleware tests */
function fakeCtx(headers: Record<string, string> = {}): Context {
  const h = new Headers(headers);
  return {
    req: {
      raw: new Request('http://localhost/', { headers: h }),
      header: (name: string) => h.get(name) ?? h.get(name.toLowerCase()) ?? undefined,
    },
    get: (_key: string) => undefined,
    set: (_key: string, _val: unknown) => {},
  } as unknown as Context;
}

async function runMiddleware(mw: Middleware, ctx: Context): Promise<Response | undefined> {
  let nextCalled = false;
  const result = await mw(ctx, async () => { nextCalled = true; return new Response('OK'); });
  if (nextCalled) return new Response('OK');
  return result as Response | undefined;
}

// ---------------------------------------------------------------------------
// JWT — sign & verify
// ---------------------------------------------------------------------------
describe('JWT sign() / verify()', () => {
  const secret = 'super-secret-key-for-testing';

  it('sign() returns a 3-part dot-separated string', async () => {
    const token = await sign({ sub: 'u1' }, secret);
    const parts = token.split('.');
    assert.equal(parts.length, 3);
  });

  it('verify() returns the original claims', async () => {
    const token = await sign({ sub: 'u1', role: 'admin' }, secret);
    const claims = await verify(token, secret);
    assert.equal(claims.sub, 'u1');
    assert.equal(claims.role, 'admin');
  });

  it('iat is automatically added by sign()', async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await sign({ sub: 'u1' }, secret);
    const claims = await verify(token, secret);
    assert.ok(typeof claims.iat === 'number');
    assert.ok(claims.iat! >= before);
  });

  it('expiresIn (relative) sets exp claim', async () => {
    const token = await sign({ sub: 'u1' }, secret, { expiresIn: 3600 });
    const claims = await verify(token, secret);
    const now = Math.floor(Date.now() / 1000);
    assert.ok(typeof claims.exp === 'number');
    assert.ok(claims.exp! > now);
    assert.ok(claims.exp! <= now + 3601);
  });

  it('expiresIn (absolute timestamp) is passed through as-is', async () => {
    const absExp = Math.floor(Date.now() / 1000) + 7200;
    const token = await sign({ sub: 'u1' }, secret, { expiresIn: absExp });
    const claims = await verify(token, secret);
    assert.equal(claims.exp, absExp);
  });

  it('verify() throws on invalid signature', async () => {
    const token = await sign({ sub: 'u1' }, secret);
    const tampered = token.slice(0, -5) + 'XXXXX';
    await assert.rejects(() => verify(tampered, 'wrong-secret'), /signature/i);
  });

  it('verify() throws on expired token', async () => {
    // exp in the past
    const token = await sign({ sub: 'u1', exp: Math.floor(Date.now() / 1000) - 10 }, secret);
    await assert.rejects(() => verify(token, secret), /expired/i);
  });

  it('verify() respects ignoreExpiration option', async () => {
    const token = await sign({ sub: 'u1', exp: Math.floor(Date.now() / 1000) - 10 }, secret);
    const claims = await verify(token, secret, { ignoreExpiration: true });
    assert.equal(claims.sub, 'u1');
  });

  it('verify() throws on malformed token', async () => {
    await assert.rejects(() => verify('not.a.jwt.at.all', secret), /malformed/i);
  });

  it('verify() throws on wrong secret', async () => {
    const token = await sign({ sub: 'u1' }, secret);
    await assert.rejects(() => verify(token, 'other-secret'), /signature/i);
  });

  it('clockTolerance allows slight expiry window', async () => {
    const token = await sign({ sub: 'u1', exp: Math.floor(Date.now() / 1000) - 5 }, secret);
    // Within 10s tolerance → should pass
    const claims = await verify(token, secret, { clockTolerance: 10 });
    assert.equal(claims.sub, 'u1');
  });

  it('HS384 round-trip', async () => {
    const token = await sign({ sub: 'u2' }, secret, { algorithm: 'HS384' });
    const claims = await verify(token, secret, { algorithm: 'HS384' });
    assert.equal(claims.sub, 'u2');
  });

  it('HS512 round-trip', async () => {
    const token = await sign({ sub: 'u3' }, secret, { algorithm: 'HS512' });
    const claims = await verify(token, secret, { algorithm: 'HS512' });
    assert.equal(claims.sub, 'u3');
  });
});

// ---------------------------------------------------------------------------
// JWT middleware
// ---------------------------------------------------------------------------
describe('jwt() middleware', () => {
  const secret = 'middleware-secret';

  it('passes valid Bearer token and stores claims', async () => {
    const token = await sign({ sub: 'user42' }, secret);
    let storedClaims: unknown;
    const ctx = {
      req: {
        header: (name: string) =>
          name.toLowerCase() === 'authorization' ? `Bearer ${token}` : undefined,
      },
      get: (_k: string) => undefined,
      set: (_k: string, v: unknown) => { storedClaims = v; },
    } as unknown as Context;

    let nextCalled = false;
    await jwt(secret)(ctx, async () => { nextCalled = true; return new Response('OK'); });
    assert.ok(nextCalled, 'next() should be called');
    assert.ok(storedClaims !== undefined, 'claims should be stored');
  });

  it('returns 401 when Authorization header is missing', async () => {
    const ctx = fakeCtx({});
    const res = await runMiddleware(jwt(secret), ctx);
    assert.equal(res?.status, 401);
  });

  it('returns 401 for invalid token', async () => {
    const ctx = fakeCtx({ Authorization: 'Bearer bad.token.here' });
    const res = await runMiddleware(jwt(secret), ctx);
    assert.equal(res?.status, 401);
  });
});

// ---------------------------------------------------------------------------
// Basic Auth middleware
// ---------------------------------------------------------------------------
describe('basicAuth() middleware', () => {
  const mw = basicAuth({
    validate: (u, p) => u === 'alice' && p === 'secret',
    realm: 'Test',
  });

  function authHeader(user: string, pass: string): string {
    return 'Basic ' + btoa(`${user}:${pass}`);
  }

  it('allows valid credentials', async () => {
    const ctx = fakeCtx({ Authorization: authHeader('alice', 'secret') });
    const res = await runMiddleware(mw, ctx);
    assert.equal(res?.status, 200);
  });

  it('rejects wrong password', async () => {
    const ctx = fakeCtx({ Authorization: authHeader('alice', 'wrong') });
    const res = await runMiddleware(mw, ctx);
    assert.equal(res?.status, 401);
  });

  it('rejects wrong username', async () => {
    const ctx = fakeCtx({ Authorization: authHeader('bob', 'secret') });
    const res = await runMiddleware(mw, ctx);
    assert.equal(res?.status, 401);
  });

  it('returns 401 with WWW-Authenticate when no header', async () => {
    const ctx = fakeCtx({});
    const res = await runMiddleware(mw, ctx);
    assert.equal(res?.status, 401);
    assert.ok(res?.headers.get('www-authenticate')?.includes('Test'));
  });

  it('rejects malformed base64', async () => {
    const ctx = fakeCtx({ Authorization: 'Basic !!notbase64!!' });
    const res = await runMiddleware(mw, ctx);
    assert.equal(res?.status, 401);
  });
});

// ---------------------------------------------------------------------------
// timingSafeEqual
// ---------------------------------------------------------------------------
describe('timingSafeEqual()', () => {
  it('returns true for equal strings', async () => {
    assert.ok(await timingSafeEqual('hello', 'hello'));
  });

  it('returns false for different strings', async () => {
    assert.ok(!(await timingSafeEqual('hello', 'world')));
  });

  it('returns false for different length strings', async () => {
    assert.ok(!(await timingSafeEqual('abc', 'abcd')));
  });
});

// ---------------------------------------------------------------------------
// Crypto utilities
// ---------------------------------------------------------------------------
describe('randomBytes()', () => {
  it('returns correct length', () => {
    const b = randomBytes(32);
    assert.equal(b.length, 32);
  });

  it('produces different values on each call', () => {
    const a = randomBytes(16);
    const b = randomBytes(16);
    assert.notDeepEqual(a, b);
  });
});

describe('randomToken()', () => {
  it('returns a URL-safe Base64url string', () => {
    const t = randomToken();
    assert.match(t, /^[A-Za-z0-9_-]+$/);
  });

  it('default length is 43 chars (32 bytes)', () => {
    // 32 bytes → 43 base64url chars
    assert.equal(randomToken(32).length, 43);
  });

  it('tokens are unique', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => randomToken()));
    assert.equal(tokens.size, 100);
  });
});

describe('randomHex()', () => {
  it('returns lowercase hex', () => {
    assert.match(randomHex(), /^[0-9a-f]+$/);
  });

  it('length is 2× byteLength', () => {
    assert.equal(randomHex(16).length, 32);
    assert.equal(randomHex(8).length, 16);
  });
});

describe('hashPassword() / verifyPassword()', () => {
  it('hash format starts with pbkdf2:', async () => {
    const h = await hashPassword('mypassword');
    assert.ok(h.startsWith('pbkdf2:sha256:'));
  });

  it('verify returns true for correct password', async () => {
    const h = await hashPassword('correct-horse');
    assert.ok(await verifyPassword('correct-horse', h));
  });

  it('verify returns false for wrong password', async () => {
    const h = await hashPassword('correct-horse');
    assert.ok(!(await verifyPassword('battery-staple', h)));
  });

  it('two hashes of same password are different (different salts)', async () => {
    const h1 = await hashPassword('same');
    const h2 = await hashPassword('same');
    assert.notEqual(h1, h2);
  });

  it('verify returns false for malformed hash', async () => {
    assert.ok(!(await verifyPassword('pw', 'not-a-valid-hash')));
  });
});

describe('AES-GCM encrypt() / decrypt()', () => {
  it('round-trip Uint8Array', async () => {
    const key = await generateAESKey();
    const plain = new TextEncoder().encode('hello aes-gcm');
    const cipher = await encrypt(plain, key);
    const decrypted = await decrypt(cipher, key);
    assert.deepEqual(decrypted, plain);
  });

  it('round-trip string via encryptString / decryptString', async () => {
    const key = await generateAESKey();
    const msg = 'froot framework 🍉';
    const b64 = await encryptString(msg, key);
    const out = await decryptString(b64, key);
    assert.equal(out, msg);
  });

  it('different ciphertexts for same plaintext (random IV)', async () => {
    const key = await generateAESKey();
    const c1 = await encryptString('same', key);
    const c2 = await encryptString('same', key);
    assert.notEqual(c1, c2);
  });

  it('tampered ciphertext throws on decrypt', async () => {
    const key = await generateAESKey();
    const plain = new TextEncoder().encode('tamper me');
    const cipher = await encrypt(plain, key);
    cipher[cipher.length - 1] ^= 0xff; // flip last byte (tag)
    await assert.rejects(() => decrypt(cipher, key));
  });

  it('importAESKey from Uint8Array round-trips', async () => {
    const original = await generateAESKey();
    const raw = await crypto.subtle.exportKey('raw', original);
    const imported = await importAESKey(new Uint8Array(raw));
    const msg = 'imported key test';
    const cipher = await encryptString(msg, imported);
    const out = await decryptString(cipher, imported);
    assert.equal(out, msg);
  });
});


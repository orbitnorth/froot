import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Froot } from 'frootjs';
import { cors, security, timing, logger, etag, bodyLimit, bearerAuth, rateLimiter, serveStatic } from 'frootjs/middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Built-in Batteries & Middleware', () => {
  it('should apply CORS headers on regular requests and handle preflight OPTIONS', async () => {
    const app = new Froot();
    app.use('*', cors({
      origin: 'https://example.com',
      allowMethods: ['GET', 'POST', 'PUT'],
      allowHeaders: ['content-type', 'authorization'],
      maxAge: 86400
    }));

    app.get('/api/data', (c) => c.json({ ok: true }));

    // 1. Regular GET request
    const resGet = await app.fetch(new Request('http://localhost/api/data', {
      headers: { origin: 'https://example.com' }
    }));
    assert.equal(resGet.status, 200);
    assert.equal(resGet.headers.get('access-control-allow-origin'), 'https://example.com');

    // 2. Preflight OPTIONS request
    const resOptions = await app.fetch(new Request('http://localhost/api/data', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://example.com',
        'access-control-request-method': 'POST'
      }
    }));
    assert.equal(resOptions.status, 204);
    assert.equal(resOptions.headers.get('access-control-allow-origin'), 'https://example.com');
    assert.equal(resOptions.headers.get('access-control-allow-methods'), 'GET, POST, PUT');
    assert.equal(resOptions.headers.get('access-control-allow-headers'), 'content-type, authorization');
    assert.equal(resOptions.headers.get('access-control-max-age'), '86400');
  });

  it('should apply security headers (Helmet equivalent)', async () => {
    const app = new Froot();
    app.use('*', security());
    app.get('/secure', (c) => c.text('safe'));

    const res = await app.fetch(new Request('http://localhost/secure'));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
    assert.equal(res.headers.get('x-xss-protection'), '0');
    assert.ok(res.headers.get('strict-transport-security')?.includes('max-age='));
    assert.ok(res.headers.get('content-security-policy')?.includes("default-src 'self'"));
  });

  it('should inject Server-Timing header via timing middleware', async () => {
    const app = new Froot();
    app.use('*', timing());
    app.get('/timed', (c) => c.text('timed response'));

    const res = await app.fetch(new Request('http://localhost/timed'));
    assert.equal(res.status, 200);
    const serverTiming = res.headers.get('server-timing');
    assert.ok(serverTiming, 'Server-Timing header should exist');
    assert.ok(serverTiming?.includes('total;dur='));
  });

  it('should invoke logger output callback', async () => {
    const app = new Froot();
    const logs: string[] = [];

    app.use('*', logger({
      printer: (str) => logs.push(str)
    }));

    app.get('/log-me', (c) => c.text('logged'));

    const res = await app.fetch(new Request('http://localhost/log-me'));
    assert.equal(res.status, 200);
    assert.ok(logs.length > 0);
    assert.ok(logs.some((l) => l.includes('GET') && l.includes('/log-me')));
  });

  it('should generate ETags and handle HTTP 304 conditional caching with If-None-Match', async () => {
    const app = new Froot();
    app.use('*', etag());

    app.get('/api/resource', (c) => c.json({ data: 'static-content', version: 1 }));
    app.get('/api/strong', (c) => c.text('strong-etag-data'));

    // 1. Initial request without If-None-Match -> generates 200 with ETag
    const res1 = await app.fetch(new Request('http://localhost/api/resource'));
    assert.equal(res1.status, 200);
    const tag1 = res1.headers.get('etag');
    assert.ok(tag1, 'ETag should exist');
    assert.match(tag1, /^W\/"/); // Default is weak ETag
    assert.deepEqual(await res1.json(), { data: 'static-content', version: 1 });

    // 2. Subsequent request with matching If-None-Match -> returns 304 Not Modified
    const res2 = await app.fetch(new Request('http://localhost/api/resource', {
      headers: { 'if-none-match': tag1! }
    }));
    assert.equal(res2.status, 304);
    assert.equal(res2.headers.get('etag'), tag1);
    assert.equal(await res2.text(), ''); // Body must be empty on 304

    // 3. Request with mismatched If-None-Match -> returns 200 with fresh body
    const res3 = await app.fetch(new Request('http://localhost/api/resource', {
      headers: { 'if-none-match': 'W/"mismatched-etag-hash"' }
    }));
    assert.equal(res3.status, 200);
    assert.deepEqual(await res3.json(), { data: 'static-content', version: 1 });

    // 4. Test strong ETag option
    const appStrong = new Froot();
    appStrong.use('*', etag({ weak: false }));
    appStrong.get('/strong', (c) => c.text('unmodified'));

    const resStrong = await appStrong.fetch(new Request('http://localhost/strong'));
    assert.equal(resStrong.status, 200);
    const strongTag = resStrong.headers.get('etag');
    assert.ok(strongTag);
    assert.ok(!strongTag.startsWith('W/'), 'Strong ETag should not start with W/');
  });

  it('should enforce request body limits and reject oversized payloads with HTTP 413', async () => {
    const app = new Froot();
    app.use('/api/upload', bodyLimit({ maxSize: '1kb' }));
    app.post('/api/upload', (c) => c.json({ uploaded: true }));

    // 1. Allowed request (small body ~30 bytes)
    const allowedRes = await app.fetch(new Request('http://localhost/api/upload', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '35'
      },
      body: JSON.stringify({ message: 'within limits' })
    }));
    assert.equal(allowedRes.status, 200);
    assert.deepEqual(await allowedRes.json(), { uploaded: true });

    // 2. Oversized request (exceeds 1kb)
    const oversizedBody = 'x'.repeat(2048);
    const rejectedRes = await app.fetch(new Request('http://localhost/api/upload', {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
        'content-length': '2048'
      },
      body: oversizedBody
    }));
    assert.equal(rejectedRes.status, 413);
    const errBody = await rejectedRes.json();
    assert.equal(errBody.title, 'Payload Too Large');

    // 3. Custom onError handler
    const customApp = new Froot();
    customApp.use('*', bodyLimit({
      maxSize: 100,
      onError: (c) => c.text('Too big!', 413)
    }));
    customApp.post('/test', (c) => c.text('ok'));

    const customRes = await customApp.fetch(new Request('http://localhost/test', {
      method: 'POST',
      headers: { 'content-length': '500' },
      body: 'large'.repeat(100)
    }));
    assert.equal(customRes.status, 413);
    assert.equal(await customRes.text(), 'Too big!');
  });

  it('should authenticate requests using RFC 6750 bearerAuth middleware', async () => {
    const VALID_TOKEN = 'froot_live_secret_token_123';
    const app = new Froot();

    app.use('/api/protected/*', bearerAuth({
      token: VALID_TOKEN,
      realm: 'secure-api'
    }));
    app.get('/api/protected/profile', (c) => c.json({ user: 'authenticated-user' }));

    // 1. Success with valid bearer token
    const resValid = await app.fetch(new Request('http://localhost/api/protected/profile', {
      headers: { authorization: `Bearer ${VALID_TOKEN}` }
    }));
    assert.equal(resValid.status, 200);
    assert.deepEqual(await resValid.json(), { user: 'authenticated-user' });

    // 2. Reject missing Authorization header
    const resMissing = await app.fetch(new Request('http://localhost/api/protected/profile'));
    assert.equal(resMissing.status, 401);
    assert.equal(resMissing.headers.get('www-authenticate'), 'Bearer realm="secure-api"');

    // 3. Reject malformed Authorization header (e.g. Basic instead of Bearer)
    const resMalformed = await app.fetch(new Request('http://localhost/api/protected/profile', {
      headers: { authorization: 'Basic dXNlcjpwYXNz' }
    }));
    assert.equal(resMalformed.status, 401);
    assert.match(resMalformed.headers.get('www-authenticate') || '', /error="invalid_request"/);

    // 4. Reject incorrect bearer token
    const resInvalid = await app.fetch(new Request('http://localhost/api/protected/profile', {
      headers: { authorization: 'Bearer wrong-token-xyz' }
    }));
    assert.equal(resInvalid.status, 401);
    assert.match(resInvalid.headers.get('www-authenticate') || '', /error="invalid_token"/);

    // 5. Custom async verify function
    const customAuthApp = new Froot();
    customAuthApp.use('*', bearerAuth({
      verify: async (token) => token === 'dynamic-valid-key'
    }));
    customAuthApp.get('/test', (c) => c.text('verified'));

    const resCustom = await customAuthApp.fetch(new Request('http://localhost/test', {
      headers: { authorization: 'Bearer dynamic-valid-key' }
    }));
    assert.equal(resCustom.status, 200);
    assert.equal(await resCustom.text(), 'verified');
  });

  it('should enforce rate limits and attach RateLimit headers using rateLimiter middleware', async () => {
    const app = new Froot();
    // Allow 3 requests per 60 seconds
    app.use('/api/limited', rateLimiter({
      windowMs: 60_000,
      limit: 3,
    }));
    app.get('/api/limited', (c) => c.json({ allowed: true }));

    // Request 1: Allowed, 2 remaining
    const res1 = await app.fetch(new Request('http://localhost/api/limited', {
      headers: { 'x-forwarded-for': '192.168.1.100' }
    }));
    assert.equal(res1.status, 200);
    assert.equal(res1.headers.get('ratelimit-limit'), '3');
    assert.equal(res1.headers.get('ratelimit-remaining'), '2');
    assert.ok(Number(res1.headers.get('ratelimit-reset')) > 0);

    // Request 2: Allowed, 1 remaining
    const res2 = await app.fetch(new Request('http://localhost/api/limited', {
      headers: { 'x-forwarded-for': '192.168.1.100' }
    }));
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get('ratelimit-remaining'), '1');

    // Request 3: Allowed, 0 remaining
    const res3 = await app.fetch(new Request('http://localhost/api/limited', {
      headers: { 'x-forwarded-for': '192.168.1.100' }
    }));
    assert.equal(res3.status, 200);
    assert.equal(res3.headers.get('ratelimit-remaining'), '0');

    // Request 4: Blocked with HTTP 429 Too Many Requests
    const res4 = await app.fetch(new Request('http://localhost/api/limited', {
      headers: { 'x-forwarded-for': '192.168.1.100' }
    }));
    assert.equal(res4.status, 429);
    assert.equal(res4.headers.get('ratelimit-remaining'), '0');
    assert.ok(Number(res4.headers.get('retry-after')) > 0);
    const errBody = await res4.json();
    assert.equal(errBody.status, 429);
    assert.equal(errBody.title, 'Too Many Requests');

    // Request 5: From a different IP address should succeed under its own quota
    const resOtherIp = await app.fetch(new Request('http://localhost/api/limited', {
      headers: { 'x-forwarded-for': '10.0.0.1' }
    }));
    assert.equal(resOtherIp.status, 200);
    assert.equal(resOtherIp.headers.get('ratelimit-remaining'), '2');

    // Custom limit handler
    const customApp = new Froot();
    customApp.use('*', rateLimiter({
      limit: 1,
      handler: (c) => c.text('Calm down!', 429)
    }));
    customApp.get('/test', (c) => c.text('ok'));

    const customRes1 = await customApp.fetch(new Request('http://localhost/test'));
    assert.equal(customRes1.status, 200);

    const customRes2 = await customApp.fetch(new Request('http://localhost/test'));
    assert.equal(customRes2.status, 429);
    assert.equal(await customRes2.text(), 'Calm down!');
  });

  it('should serve static files securely with ETag and reject path traversal attacks', async () => {
    const webFroot = path.resolve(__dirname, '../web/.froot');
    const webDist = path.resolve(__dirname, '../web/dist');
    const webDir = fs.existsSync(webFroot) ? webFroot : webDist;
    const app = new Froot();

    app.use('/*', serveStatic({
      root: webDir,
      index: 'index.html',
      cacheControl: 'public, max-age=3600',
    }));

    app.get('/api/fallback', (c) => c.json({ api: 'fallback-reached' }));

    // 1. Serve index.html on root request
    const resRoot = await app.fetch(new Request('http://localhost/'));
    assert.equal(resRoot.status, 200);
    assert.equal(resRoot.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.ok(resRoot.headers.get('etag'), 'ETag header should be present');
    assert.ok(resRoot.headers.get('last-modified'), 'Last-Modified header should be present');
    assert.equal(resRoot.headers.get('cache-control'), 'public, max-age=3600');
    const rootHtml = await resRoot.text();
    assert.ok(rootHtml.includes('Froot'), 'index.html content should be returned');

    // 2. HTTP 304 conditional request with If-None-Match
    const etagValue = resRoot.headers.get('etag')!;
    const res304 = await app.fetch(new Request('http://localhost/', {
      headers: { 'if-none-match': etagValue }
    }));
    assert.equal(res304.status, 304);
    assert.equal(await res304.text(), '');

    // 3. Serve CSS stylesheet
    const resCss = await app.fetch(new Request('http://localhost/styles.css'));
    assert.equal(resCss.status, 200);
    assert.equal(resCss.headers.get('content-type'), 'text/css; charset=utf-8');

    // 4. Fallthrough to dynamic API route when static file not found
    const resDynamic = await app.fetch(new Request('http://localhost/api/fallback'));
    assert.equal(resDynamic.status, 200);
    assert.deepEqual(await resDynamic.json(), { api: 'fallback-reached' });

    // 5. Defend against path traversal attack (e.g. ../package.json)
    const resTraversal = await app.fetch(new Request('http://localhost/../../package.json'));
    // Traversal is blocked from exiting root; falls through to 404
    assert.equal(resTraversal.status, 404);

    // 6. Defend against percent-encoded traversal (%2e%2e)
    const resEncodedTraversal = await app.fetch(new Request('http://localhost/%2e%2e/%2e%2e/package.json'));
    assert.equal(resEncodedTraversal.status, 404);

    // 7. Defend against null-byte injection
    const resNullByte = await app.fetch(new Request('http://localhost/index.html%00.png'));
    assert.equal(resNullByte.status, 404);

    // 8. HEAD request should return headers without body
    const resHead = await app.fetch(new Request('http://localhost/styles.css', { method: 'HEAD' }));
    assert.equal(resHead.status, 200);
    assert.equal(resHead.headers.get('content-type'), 'text/css; charset=utf-8');
    assert.equal(await resHead.text(), '');
  });
});

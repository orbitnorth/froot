import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Froot } from 'froot';
import { cors, security, timing, logger, etag, bodyLimit } from 'froot/middleware';

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
});

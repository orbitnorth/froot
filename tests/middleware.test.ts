import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Froot } from 'froot';
import { cors, security, timing, logger } from 'froot/middleware';

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
});

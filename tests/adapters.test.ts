import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Froot } from 'froot';
import { handle, type LambdaEventV2 } from 'froot/adapters/aws-lambda';
import { getRuntime } from 'froot/runtime';

describe('Multi-Runtime & Serverless Adapters', () => {
  it('should detect current runtime as node', () => {
    const runtime = getRuntime();
    assert.equal(runtime, 'node');
  });

  it('should handle AWS Lambda API Gateway v2 GET request', async () => {
    const app = new Froot();
    app.get('/lambda/test', (c) => {
      c.header('x-lambda-custom', 'active');
      return c.json({ lambda: true, runtime: 'aws-lambda' });
    });

    const handler = handle(app);
    const event: LambdaEventV2 = {
      rawPath: '/lambda/test',
      rawQueryString: '',
      headers: {
        host: 'api.example.com',
        'x-forwarded-proto': 'https'
      },
      requestContext: {
        http: {
          method: 'GET',
          path: '/lambda/test'
        }
      }
    };

    const result = await handler(event);
    assert.equal(result.statusCode, 200);
    assert.equal(result.headers?.['x-lambda-custom'], 'active');
    assert.equal(result.isBase64Encoded, false);
    const body = JSON.parse(result.body || '{}');
    assert.deepEqual(body, { lambda: true, runtime: 'aws-lambda' });
  });

  it('should handle AWS Lambda POST request with body and cookies', async () => {
    const app = new Froot();
    app.post('/auth/session', async (c) => {
      const body = await c.req.json<{ username: string }>();
      c.header('set-cookie', 'session_id=abc123; Secure; HttpOnly');
      return c.json({ authenticated: true, user: body.username }, 201);
    });

    const handler = handle(app);
    const event: LambdaEventV2 = {
      rawPath: '/auth/session',
      headers: {
        host: 'api.example.com',
        'content-type': 'application/json'
      },
      cookies: ['auth_token=prev_token'],
      requestContext: {
        http: {
          method: 'POST',
          path: '/auth/session'
        }
      },
      body: JSON.stringify({ username: 'mallahi' }),
      isBase64Encoded: false
    };

    const result = await handler(event);
    assert.equal(result.statusCode, 201);
    assert.ok(result.cookies && result.cookies.length > 0);
    assert.ok(result.cookies?.[0]?.includes('session_id=abc123'));
    const body = JSON.parse(result.body || '{}');
    assert.deepEqual(body, { authenticated: true, user: 'mallahi' });
  });

  it('should handle AWS Lambda base64 encoded request body', async () => {
    const app = new Froot();
    app.post('/upload', async (c) => {
      const text = await c.req.text();
      return c.text(`Received: ${text}`);
    });

    const handler = handle(app);
    const rawContent = 'Hello Base64 World';
    const base64Body = Buffer.from(rawContent, 'utf-8').toString('base64');

    const event: LambdaEventV2 = {
      rawPath: '/upload',
      headers: {
        host: 'api.example.com',
        'content-type': 'text/plain'
      },
      requestContext: {
        http: {
          method: 'POST',
          path: '/upload'
        }
      },
      body: base64Body,
      isBase64Encoded: true
    };

    const result = await handler(event);
    assert.equal(result.statusCode, 200);
    assert.equal(result.body, 'Received: Hello Base64 World');
  });

  it('should process background tasks using c.waitUntil without delaying response', async () => {
    const app = new Froot();
    let backgroundDone = false;

    app.post('/async-task', (c) => {
      c.waitUntil(
        new Promise<void>((resolve) => {
          setTimeout(() => {
            backgroundDone = true;
            resolve();
          }, 20);
        })
      );
      return c.json({ accepted: true }, 202);
    });

    const res = await app.fetch(new Request('http://localhost/async-task', { method: 'POST' }));
    assert.equal(res.status, 202);
    // Main response returns immediately before background promise completes
    assert.equal(backgroundDone, false);

    // Wait for background promise to finish
    await new Promise((r) => setTimeout(r, 40));
    assert.equal(backgroundDone, true);
  });

  it('should stream POST request body and cork responses over native Node.js TCP socket', async () => {
    const app = new Froot();
    app.post('/api/upload', async (c) => {
      const data = await c.req.json<{ message: string; count: number }>();
      c.header('x-powered-by', 'Froot');
      return c.json({ echo: data.message, multiplied: data.count * 2 }, 200);
    });

    const server = await new Promise<import('node:http').Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });

    try {
      const addr = server.address() as import('node:net').AddressInfo;
      const port = addr.port;

      const payload = JSON.stringify({ message: 'event-driven-io', count: 21 });
      const res = await fetch(`http://127.0.0.1:${port}/api/upload`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': String(Buffer.byteLength(payload))
        },
        body: payload
      });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get('x-powered-by'), 'Froot');
      const json = await res.json();
      assert.deepEqual(json, { echo: 'event-driven-io', multiplied: 42 });
    } finally {
      await new Promise((r) => server.close(r));
    }
  });
});

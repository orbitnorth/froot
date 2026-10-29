import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LazyHeaders } from '../dist/utils/headers.js';
import { Froot } from 'frootjs';

describe('LazyHeaders & Fast Header Resolution', () => {
  it('should read raw headers case-insensitively without mutation', () => {
    const raw = {
      'content-type': 'application/json',
      'authorization': 'Bearer secret_token',
      'x-multi-value': ['val1', 'val2']
    };

    const headers = new LazyHeaders(raw);

    assert.equal(headers.get('content-type'), 'application/json');
    assert.equal(headers.get('Content-Type'), 'application/json');
    assert.equal(headers.get('CONTENT-TYPE'), 'application/json');

    assert.equal(headers.get('authorization'), 'Bearer secret_token');
    assert.equal(headers.get('Authorization'), 'Bearer secret_token');

    assert.equal(headers.get('x-multi-value'), 'val1, val2');
    assert.equal(headers.get('non-existent'), null);

    assert.equal(headers.has('content-type'), true);
    assert.equal(headers.has('Content-Type'), true);
    assert.equal(headers.has('non-existent'), false);
  });

  it('should support mutations (set, append, delete) in isolated mutation maps', () => {
    const raw = { 'user-agent': 'autocannon' };
    const headers = new LazyHeaders(raw);

    // 1. set
    headers.set('x-custom', 'custom_value');
    assert.equal(headers.get('x-custom'), 'custom_value');
    assert.equal(headers.get('X-Custom'), 'custom_value');

    // 2. append
    headers.append('x-custom', 'another_value');
    assert.equal(headers.get('x-custom'), 'custom_value, another_value');

    // 3. delete
    headers.delete('user-agent');
    assert.equal(headers.has('user-agent'), false);
    assert.equal(headers.get('user-agent'), null);

    // Ensure raw source was not mutated
    assert.equal(raw['user-agent'], 'autocannon');
  });

  it('should iterate over all entries, keys, and values accurately', () => {
    const raw = {
      'host': 'localhost:3000',
      'accept': '*/*'
    };
    const headers = new LazyHeaders(raw);
    headers.set('x-added', '123');

    const entries = Array.from(headers.entries());
    assert.equal(entries.length, 3);
    assert.deepEqual(
      entries.sort((a, b) => a[0].localeCompare(b[0])),
      [
        ['accept', '*/*'],
        ['host', 'localhost:3000'],
        ['x-added', '123']
      ]
    );

    const forEachMap: Record<string, string> = {};
    headers.forEach((val, key) => {
      forEachMap[key] = val;
    });
    assert.equal(forEachMap['host'], 'localhost:3000');
    assert.equal(forEachMap['accept'], '*/*');
    assert.equal(forEachMap['x-added'], '123');
  });

  it('should extract Set-Cookie arrays correctly via getSetCookie', () => {
    const raw = {
      'set-cookie': ['session=123; HttpOnly', 'theme=dark; Path=/']
    };
    const headers = new LazyHeaders(raw);
    const cookies = headers.getSetCookie();
    assert.deepEqual(cookies, ['session=123; HttpOnly', 'theme=dark; Path=/']);
  });

  it('should use raw dictionary fast-path in Context header accessor', async () => {
    const app = new Froot();
    app.get('/test-header', (c) => {
      const auth = c.req.header('authorization');
      const custom = c.header('x-client-id');
      return c.json({ auth, custom });
    });

    const webReq = new Request('http://localhost/test-header', {
      headers: { authorization: 'Bearer token_abc' }
    });
    // Attach rawHeaders simulating Node adapter
    (webReq as any)._rawHeaders = {
      'authorization': 'Bearer token_abc',
      'x-client-id': 'client_999'
    };

    const res = await app.fetch(webReq);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.deepEqual(json, {
      auth: 'Bearer token_abc',
      custom: 'client_999'
    });
  });
});

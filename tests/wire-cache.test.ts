import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Froot, wireCache, WireCacheStore } from '../dist/index.js';

describe('Zero-Copy Binary Wire Cache', () => {
  it('should store and retrieve pre-compiled wire frames with TTL expiration', async () => {
    const store = new WireCacheStore(10);
    const frame = Buffer.from('HTTP/1.1 200 OK\r\n\r\n{"cached":true}');

    store.set('item:1', frame, 50); // 50ms TTL
    assert.equal(store.size, 1);

    const retrieved = store.get('item:1');
    assert.ok(retrieved !== null);
    assert.equal(retrieved.toString(), frame.toString());

    // Wait for TTL expiration
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(store.get('item:1'), null);
    assert.equal(store.size, 0);
  });

  it('should evict oldest entry when maxEntries capacity is reached (LRU)', () => {
    const store = new WireCacheStore(2);
    store.set('k1', Buffer.from('v1'), 10000);
    store.set('k2', Buffer.from('v2'), 10000);
    assert.equal(store.size, 2);

    // Adding 3rd entry evicts k1
    store.set('k3', Buffer.from('v3'), 10000);
    assert.equal(store.size, 2);
    assert.equal(store.get('k1'), null);
    assert.ok(store.get('k2') !== null);
    assert.ok(store.get('k3') !== null);
  });

  it('should serve cached responses via wireCache middleware and track cache hit/miss', async () => {
    const app = new Froot();
    let computeCount = 0;

    app.get('/cached-data', wireCache({ ttl: 5000 }), (c) => {
      computeCount++;
      return c.json({ computeCount, timestamp: Date.now() });
    });

    // 1st Request: Cache MISS
    const res1 = await app.fetch(new Request('http://localhost/cached-data'));
    assert.equal(res1.status, 200);
    const data1 = (await res1.json()) as { computeCount: number };
    assert.equal(data1.computeCount, 1);
    assert.equal(computeCount, 1);

    // 2nd Request: Cache HIT (handler should not execute again)
    const res2 = await app.fetch(new Request('http://localhost/cached-data'));
    assert.equal(res2.status, 200);
    assert.equal(res2.headers.get('x-cache'), 'HIT');
    assert.equal(computeCount, 1);
  });
});


/**
 * Tests for Froot WebSocket module:
 * - createHub()
 * - createWSContext()
 * - upgradeWebSocket() (runtime fallback path)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createHub }       from '../dist/ws/hub.js';
import { createWSContext } from '../dist/ws/context.js';
import { upgradeWebSocket } from '../dist/ws/upgrade.js';
import type { WSContext, WSHandlers } from '../dist/ws/types.js';
import type { Context } from '../dist/types/index.js';

// ---------------------------------------------------------------------------
// Minimal stub WSContext for hub tests
// ---------------------------------------------------------------------------
function makeWS(readyState = 1 /* OPEN */): WSContext {
  const sent: string[] = [];
  const binSent: Uint8Array[] = [];
  return {
    get readyState() { return readyState; },
    state: {},
    raw: null,
    send(data: string) { sent.push(data); },
    sendBinary(data: Uint8Array | ArrayBuffer) {
      binSent.push(data instanceof Uint8Array ? data : new Uint8Array(data));
    },
    close() {},
    // Expose internals for assertions
    _sent: sent,
    _binSent: binSent,
  } as unknown as WSContext & { _sent: string[]; _binSent: Uint8Array[] };
}

// ---------------------------------------------------------------------------
// createHub()
// ---------------------------------------------------------------------------
describe('createHub()', () => {
  it('publish sends to all subscribers on a topic', () => {
    const hub = createHub();
    const ws1 = makeWS() as WSContext & { _sent: string[] };
    const ws2 = makeWS() as WSContext & { _sent: string[] };

    hub.subscribe(ws1, 'chat');
    hub.subscribe(ws2, 'chat');
    hub.publish('chat', 'hello');

    assert.deepEqual((ws1 as any)._sent, ['hello']);
    assert.deepEqual((ws2 as any)._sent, ['hello']);
  });

  it('unsubscribed peers do not receive messages', () => {
    const hub = createHub();
    const ws = makeWS() as any;

    hub.subscribe(ws, 'room');
    hub.unsubscribe(ws, 'room');
    hub.publish('room', 'msg');

    assert.deepEqual(ws._sent, []);
  });

  it('publish to empty topic does nothing', () => {
    const hub = createHub();
    assert.doesNotThrow(() => hub.publish('nonexistent', 'data'));
  });

  it('publishBinary sends binary data', () => {
    const hub = createHub();
    const ws = makeWS() as any;
    hub.subscribe(ws, 'bin');

    const data = new Uint8Array([1, 2, 3]);
    hub.publishBinary('bin', data);

    assert.equal(ws._binSent.length, 1);
    assert.deepEqual(ws._binSent[0], data);
  });

  it('subscriberCount returns correct count', () => {
    const hub = createHub();
    const ws1 = makeWS();
    const ws2 = makeWS();

    assert.equal(hub.subscriberCount('t'), 0);
    hub.subscribe(ws1, 't');
    assert.equal(hub.subscriberCount('t'), 1);
    hub.subscribe(ws2, 't');
    assert.equal(hub.subscriberCount('t'), 2);
    hub.unsubscribe(ws1, 't');
    assert.equal(hub.subscriberCount('t'), 1);
  });

  it('closed peers are pruned on publish', () => {
    const hub = createHub();
    const closedWS = makeWS(3 /* CLOSED */) as any;
    const openWS   = makeWS(1) as any;

    hub.subscribe(closedWS, 'ch');
    hub.subscribe(openWS, 'ch');

    hub.publish('ch', 'ping');

    // Open peer should receive, closed peer should not (and be pruned)
    assert.deepEqual(openWS._sent, ['ping']);
    assert.equal(hub.subscriberCount('ch'), 1, 'closed peer pruned');
  });

  it('multiple topics are isolated', () => {
    const hub = createHub();
    const ws1 = makeWS() as any;
    const ws2 = makeWS() as any;

    hub.subscribe(ws1, 'a');
    hub.subscribe(ws2, 'b');

    hub.publish('a', 'msg-a');
    hub.publish('b', 'msg-b');

    assert.deepEqual(ws1._sent, ['msg-a']);
    assert.deepEqual(ws2._sent, ['msg-b']);
  });

  it('same peer subscribed to multiple topics receives from each', () => {
    const hub = createHub();
    const ws = makeWS() as any;

    hub.subscribe(ws, 'x');
    hub.subscribe(ws, 'y');
    hub.publish('x', 'from-x');
    hub.publish('y', 'from-y');

    assert.deepEqual(ws._sent, ['from-x', 'from-y']);
  });
});

// ---------------------------------------------------------------------------
// createWSContext()
// ---------------------------------------------------------------------------
describe('createWSContext()', () => {
  /** Build a minimal WebSocket-like mock */
  function makeSocket(readyState = 1) {
    const sent: Array<string | Uint8Array | ArrayBuffer> = [];
    let closed = false;
    let closeCode = 0;
    let closeReason = '';
    return {
      get readyState() { return closed ? 3 : readyState; },
      send(data: string | ArrayBuffer | Uint8Array) { sent.push(data); },
      close(code = 1000, reason = '') { closed = true; closeCode = code; closeReason = reason; },
      addEventListener() {},
      _sent: sent,
      get _closed() { return closed; },
      get _closeCode() { return closeCode; },
      get _closeReason() { return closeReason; },
    };
  }

  it('send() delegates to socket.send()', () => {
    const sock = makeSocket();
    const ws = createWSContext(sock as unknown as WebSocket);
    ws.send('hi');
    assert.deepEqual(sock._sent, ['hi']);
  });

  it('sendBinary() delegates to socket.send() with binary', () => {
    const sock = makeSocket();
    const ws = createWSContext(sock as unknown as WebSocket);
    const buf = new Uint8Array([0, 1, 2]);
    ws.sendBinary(buf);
    assert.deepEqual(sock._sent, [buf]);
  });

  it('close() delegates with default code 1000', () => {
    const sock = makeSocket();
    const ws = createWSContext(sock as unknown as WebSocket);
    ws.close();
    assert.equal(sock._closed, true);
    assert.equal(sock._closeCode, 1000);
    assert.equal(sock._closeReason, '');
  });

  it('close() passes custom code and reason', () => {
    const sock = makeSocket();
    const ws = createWSContext(sock as unknown as WebSocket);
    ws.close(4000, 'bye');
    assert.equal(sock._closeCode, 4000);
    assert.equal(sock._closeReason, 'bye');
  });

  it('readyState mirrors socket', () => {
    const sock = makeSocket(1);
    const ws = createWSContext(sock as unknown as WebSocket);
    assert.equal(ws.readyState, 1);
  });

  it('state is an empty object per context', () => {
    const sock = makeSocket();
    const ws = createWSContext(sock as unknown as WebSocket);
    assert.deepEqual(ws.state, {});
    ws.state['userId'] = 42;
    assert.equal(ws.state['userId'], 42);
  });

  it('raw returns the underlying socket', () => {
    const sock = makeSocket();
    const ws = createWSContext(sock as unknown as WebSocket);
    assert.strictEqual(ws.raw, sock);
  });
});

// ---------------------------------------------------------------------------
// upgradeWebSocket() — fallback path (no Deno/CF globals in Node.js)
// ---------------------------------------------------------------------------
describe('upgradeWebSocket()', () => {
  function fakeCtx(): Context {
    return {
      req: { raw: new Request('http://localhost/ws', { headers: { Upgrade: 'websocket' } }) },
    } as unknown as Context;
  }

  it('returns a 426 response on Node.js (no native WS upgrade support in test env)', () => {
    const handler = upgradeWebSocket(() => ({}));
    const res = handler(fakeCtx());
    // In the Node.js test environment there is no WebSocketPair or Deno global
    // so the fallback 426 path is exercised.
    assert.equal(res.status, 426);
  });

  it('factory receives the context', () => {
    let receivedCtx: Context | null = null;
    const ctx = fakeCtx();
    const handler = upgradeWebSocket((c) => {
      receivedCtx = c;
      return {};
    });
    handler(ctx);
    assert.strictEqual(receivedCtx, ctx);
  });

  it('returned Response has Upgrade header', () => {
    const handler = upgradeWebSocket(() => ({}));
    const res = handler(fakeCtx());
    assert.equal(res.headers.get('upgrade'), 'websocket');
  });
});

/**
 * Tests for Froot streaming helpers: stream(), streamText(), streamSSE(), sleep()
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { stream }     from '../dist/streaming/stream.js';
import { streamText } from '../dist/streaming/text.js';
import { streamSSE, sleep } from '../dist/streaming/sse.js';
import type { Context } from '../dist/types/index.js';

// ---------------------------------------------------------------------------
// Minimal stub Context – only used to satisfy the type, not actually consumed
// by any of the three helpers (they only read c.req.raw.headers in stream()).
// ---------------------------------------------------------------------------
function fakeCtx(): Context {
  return {
    req: {
      raw: {
        headers: new Headers(),
      },
    },
  } as unknown as Context;
}

/** Collect all chunks from a Response body into a single string. */
async function readAll(res: Response): Promise<string> {
  const buf: string[] = [];
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf.push(dec.decode(value, { stream: true }));
  }
  return buf.join('');
}

// ---------------------------------------------------------------------------
// sleep()
// ---------------------------------------------------------------------------
describe('sleep()', () => {
  it('resolves after the given delay', async () => {
    const start = Date.now();
    await sleep(50);
    assert.ok(Date.now() - start >= 40, 'should wait at least ~50 ms');
  });

  it('resolves early when the signal is aborted', async () => {
    const ctrl = new AbortController();
    const start = Date.now();
    setTimeout(() => ctrl.abort(), 20);
    await sleep(5_000, ctrl.signal);
    assert.ok(Date.now() - start < 200, 'should resolve early on abort');
  });

  it('resolves immediately if signal already aborted', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const start = Date.now();
    await sleep(5_000, ctrl.signal);
    assert.ok(Date.now() - start < 50, 'should be immediate');
  });
});

// ---------------------------------------------------------------------------
// stream()
// ---------------------------------------------------------------------------
describe('stream()', () => {
  it('returns a Response with status 200', () => {
    const res = stream(fakeCtx(), async () => {});
    assert.equal(res.status, 200);
  });

  it('streams string chunks', async () => {
    const res = stream(fakeCtx(), async (ctrl) => {
      await ctrl.write('hello');
      await ctrl.write(' world');
    });
    const body = await readAll(res);
    assert.equal(body, 'hello world');
  });

  it('streams Uint8Array chunks', async () => {
    const enc = new TextEncoder();
    const res = stream(fakeCtx(), async (ctrl) => {
      await ctrl.write(enc.encode('bin'));
    });
    const body = await readAll(res);
    assert.equal(body, 'bin');
  });

  it('signal is not aborted during the callback', async () => {
    let aborted = false;
    const res = stream(fakeCtx(), async (ctrl) => {
      aborted = ctrl.signal.aborted;
    });
    await readAll(res);
    assert.equal(aborted, false);
  });

  it('close() stops further writes', async () => {
    const res = stream(fakeCtx(), async (ctrl) => {
      await ctrl.write('first');
      ctrl.close();
      // This write should be silently ignored.
      await ctrl.write('second');
    });
    const body = await readAll(res);
    assert.equal(body, 'first');
  });

  it('handles empty callback gracefully', async () => {
    const res = stream(fakeCtx(), async () => {});
    const body = await readAll(res);
    assert.equal(body, '');
  });
});

// ---------------------------------------------------------------------------
// streamText()
// ---------------------------------------------------------------------------
describe('streamText()', () => {
  it('sets Content-Type to text/plain', () => {
    const res = streamText(fakeCtx(), async () => {});
    assert.ok(
      res.headers.get('content-type')?.startsWith('text/plain'),
      'content-type should be text/plain',
    );
  });

  it('streams text chunks', async () => {
    const res = streamText(fakeCtx(), async (ctrl) => {
      await ctrl.write('foo');
      await ctrl.write('bar');
    });
    const body = await readAll(res);
    assert.equal(body, 'foobar');
  });

  it('returns status 200', () => {
    const res = streamText(fakeCtx(), async () => {});
    assert.equal(res.status, 200);
  });
});

// ---------------------------------------------------------------------------
// streamSSE()
// ---------------------------------------------------------------------------
describe('streamSSE()', () => {
  it('sets Content-Type to text/event-stream', () => {
    const res = streamSSE(fakeCtx(), async () => {});
    assert.ok(
      res.headers.get('content-type')?.startsWith('text/event-stream'),
      'content-type should be text/event-stream',
    );
  });

  it('sets Cache-Control: no-cache', () => {
    const res = streamSSE(fakeCtx(), async () => {});
    assert.equal(res.headers.get('cache-control'), 'no-cache');
  });

  it('sets X-Accel-Buffering: no', () => {
    const res = streamSSE(fakeCtx(), async () => {});
    assert.equal(res.headers.get('x-accel-buffering'), 'no');
  });

  it('serializes a basic data event', async () => {
    const res = streamSSE(fakeCtx(), async (ctrl) => {
      await ctrl.writeSSE({ data: 'hello' });
    });
    const body = await readAll(res);
    assert.equal(body, 'data: hello\n\n');
  });

  it('serializes event, id, data, retry fields', async () => {
    const res = streamSSE(fakeCtx(), async (ctrl) => {
      await ctrl.writeSSE({ event: 'msg', id: '42', data: 'payload', retry: 3000 });
    });
    const body = await readAll(res);
    assert.ok(body.includes('event: msg\n'), 'should include event field');
    assert.ok(body.includes('id: 42\n'), 'should include id field');
    assert.ok(body.includes('data: payload\n'), 'should include data field');
    assert.ok(body.includes('retry: 3000\n'), 'should include retry field');
    assert.ok(body.endsWith('\n\n'), 'should end with double newline');
  });

  it('splits multi-line data into multiple data: lines', async () => {
    const res = streamSSE(fakeCtx(), async (ctrl) => {
      await ctrl.writeSSE({ data: 'line1\nline2\nline3' });
    });
    const body = await readAll(res);
    assert.ok(body.includes('data: line1\n'), 'first line');
    assert.ok(body.includes('data: line2\n'), 'second line');
    assert.ok(body.includes('data: line3\n'), 'third line');
  });

  it('streams multiple events in order', async () => {
    const res = streamSSE(fakeCtx(), async (ctrl) => {
      await ctrl.writeSSE({ event: 'a', data: '1' });
      await ctrl.writeSSE({ event: 'b', data: '2' });
    });
    const body = await readAll(res);
    const indexA = body.indexOf('event: a');
    const indexB = body.indexOf('event: b');
    assert.ok(indexA < indexB, 'event a should come before event b');
  });

  it('raw write() also works on SSE controller', async () => {
    const res = streamSSE(fakeCtx(), async (ctrl) => {
      await ctrl.write(': comment\n\n');
    });
    const body = await readAll(res);
    assert.equal(body, ': comment\n\n');
  });

  it('write after close() is ignored', async () => {
    const res = streamSSE(fakeCtx(), async (ctrl) => {
      await ctrl.writeSSE({ data: 'first' });
      ctrl.close();
      await ctrl.writeSSE({ data: 'second' });
    });
    const body = await readAll(res);
    assert.ok(body.includes('data: first'), 'first event present');
    assert.ok(!body.includes('data: second'), 'second event suppressed');
  });

  it('empty data field is serialized as empty string', async () => {
    const res = streamSSE(fakeCtx(), async (ctrl) => {
      await ctrl.writeSSE({ data: '' });
    });
    const body = await readAll(res);
    assert.equal(body, 'data: \n\n');
  });
});

import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureDateTicker,
  stopDateTicker,
  getCachedDateString,
  getCachedDateHeaderBuffer,
  buildHttpFrame
} from '../dist/index.js';

describe('Cached Date Ticker & HTTP Frame Assembly', () => {
  after(() => {
    stopDateTicker();
  });

  it('should format RFC 7231 / RFC 9110 compliant GMT date string', () => {
    ensureDateTicker();
    const dateStr = getCachedDateString();
    assert.ok(typeof dateStr === 'string');
    assert.match(dateStr, /^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4} \d{2}:\d{2}:\d{2} GMT$/);
  });

  it('should provide pre-encoded Buffer for date header', () => {
    const buf = getCachedDateHeaderBuffer();
    assert.ok(Buffer.isBuffer(buf));
    const str = buf.toString('utf-8');
    assert.ok(str.startsWith('date: '));
    assert.ok(str.endsWith('\r\n'));
  });

  it('should assemble atomic HTTP/1.1 response wire frame', () => {
    const payload = JSON.stringify({ status: 'ok', id: 42 });
    const frame = buildHttpFrame(200, 'application/json', payload, {
      'x-custom-tag': 'froot-fast'
    });

    assert.ok(Buffer.isBuffer(frame));
    const str = frame.toString('utf-8');

    assert.ok(str.startsWith('HTTP/1.1 200 OK\r\n'));
    assert.ok(str.includes('content-type: application/json\r\n'));
    assert.ok(str.includes('content-length: ' + Buffer.byteLength(payload) + '\r\n'));
    assert.ok(str.includes('connection: keep-alive\r\n'));
    assert.ok(str.includes('x-custom-tag: froot-fast\r\n'));
    assert.ok(str.endsWith('\r\n\r\n' + payload));
  });

  it('should handle different status codes (201, 204, 404, 500)', () => {
    const frame201 = buildHttpFrame(201, 'application/json', '{"created":true}');
    assert.ok(frame201.toString('utf-8').startsWith('HTTP/1.1 201 Created\r\n'));

    const frame404 = buildHttpFrame(404, 'text/plain', 'Not Found');
    assert.ok(frame404.toString('utf-8').startsWith('HTTP/1.1 404 Not Found\r\n'));

    const frame500 = buildHttpFrame(500, 'text/plain', 'Error');
    assert.ok(frame500.toString('utf-8').startsWith('HTTP/1.1 500 Internal Server Error\r\n'));
  });
});

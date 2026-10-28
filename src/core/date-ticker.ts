/**
 * High-performance 1Hz Cached Date Ticker for HTTP response formatting.
 * Eliminates redundant `new Date().toUTCString()` allocations across thousands of requests per second.
 */

let cachedDateStr = new Date().toUTCString();
let cachedDateHeaderBuffer = Buffer.from(`date: ${cachedDateStr}\r\n`);
let tickerInterval: NodeJS.Timeout | null = null;

function updateDate(): void {
  cachedDateStr = new Date().toUTCString();
  cachedDateHeaderBuffer = Buffer.from(`date: ${cachedDateStr}\r\n`);
}

/**
 * Starts the background 1Hz date ticker if not already running.
 */
export function ensureDateTicker(): void {
  if (!tickerInterval) {
    updateDate();
    tickerInterval = setInterval(updateDate, 1000);
    // Unref so the ticker doesn't prevent Node process termination
    tickerInterval.unref();
  }
}

/**
 * Stops the background date ticker (primarily for cleanup and tests).
 */
export function stopDateTicker(): void {
  if (tickerInterval) {
    clearInterval(tickerInterval);
    tickerInterval = null;
  }
}

/**
 * Returns the current cached UTC date string (RFC 7231 / RFC 9110 compliant).
 */
export function getCachedDateString(): string {
  if (!tickerInterval) ensureDateTicker();
  return cachedDateStr;
}

/**
 * Returns the pre-encoded Buffer slice `date: <UTC>\r\n`.
 */
export function getCachedDateHeaderBuffer(): Buffer {
  if (!tickerInterval) ensureDateTicker();
  return cachedDateHeaderBuffer;
}

// Common HTTP Status Line Buffers (pre-allocated)
const STATUS_200 = Buffer.from('HTTP/1.1 200 OK\r\n');
const STATUS_201 = Buffer.from('HTTP/1.1 201 Created\r\n');
const STATUS_204 = Buffer.from('HTTP/1.1 204 No Content\r\n');
const STATUS_400 = Buffer.from('HTTP/1.1 400 Bad Request\r\n');
const STATUS_404 = Buffer.from('HTTP/1.1 404 Not Found\r\n');
const STATUS_500 = Buffer.from('HTTP/1.1 500 Internal Server Error\r\n');

const CONN_KEEP_ALIVE = Buffer.from('connection: keep-alive\r\n');
const CRLF = Buffer.from('\r\n');

/**
 * Assembles an atomic, zero-copy HTTP/1.1 response wire frame.
 */
export function buildHttpFrame(
  statusCode: number,
  contentType: string,
  body: Buffer | Uint8Array | string,
  extraHeaders?: Record<string, string>
): Buffer {
  let statusBuf: Buffer;
  switch (statusCode) {
    case 200: statusBuf = STATUS_200; break;
    case 201: statusBuf = STATUS_201; break;
    case 204: statusBuf = STATUS_204; break;
    case 400: statusBuf = STATUS_400; break;
    case 404: statusBuf = STATUS_404; break;
    case 500: statusBuf = STATUS_500; break;
    default: statusBuf = Buffer.from(`HTTP/1.1 ${statusCode} Response\r\n`); break;
  }

  const bodyBuf = typeof body === 'string'
    ? Buffer.from(body)
    : (Buffer.isBuffer(body) ? body : Buffer.from(body));

  const dateBuf = getCachedDateHeaderBuffer();

  if (!extraHeaders || Object.keys(extraHeaders).length === 0) {
    // Ultra-fast single-allocation assembly without Buffer.concat
    const ctHeader = `content-type: ${contentType}\r\ncontent-length: ${bodyBuf.length}\r\n\r\n`;
    const ctHeaderLen = Buffer.byteLength(ctHeader);
    const prefixLen = statusBuf.length + dateBuf.length + CONN_KEEP_ALIVE.length;
    const totalLen = prefixLen + ctHeaderLen + bodyBuf.length;

    const frame = Buffer.allocUnsafe(totalLen);
    statusBuf.copy(frame, 0);
    dateBuf.copy(frame, statusBuf.length);
    CONN_KEEP_ALIVE.copy(frame, statusBuf.length + dateBuf.length);
    frame.write(ctHeader, prefixLen, 'ascii');
    bodyBuf.copy(frame, prefixLen + ctHeaderLen);
    return frame;
  }

  const ctBuf = Buffer.from(`content-type: ${contentType}\r\ncontent-length: ${bodyBuf.length}\r\n`);
  const keys = Object.keys(extraHeaders);
  let str = '';
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i]!;
    str += `${k.toLowerCase()}: ${extraHeaders[k]}\r\n`;
  }
  const extraBuf = Buffer.from(str);

  return Buffer.concat([
    statusBuf,
    dateBuf,
    CONN_KEEP_ALIVE,
    ctBuf,
    extraBuf,
    CRLF,
    bodyBuf
  ]);
}


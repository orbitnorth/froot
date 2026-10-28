/**
 * High-performance Raw TCP HTTP/1.1 Engine for Froot Framework.
 * Bypasses Node's `node:http` module, `HTTPParser` callbacks, and `IncomingMessage`/`ServerResponse`
 * allocations, delivering maximum possible throughput on V8.
 */

import net from 'node:net';
import { globalWireCache } from '../cache/wire-cache.js';
import { buildHttpFrame } from './date-ticker.js';
import { LazyHeaders } from '../utils/headers.js';
import { VirtualRequest } from './node-adapter.js';
import type { FetchableApp } from './node-adapter.js';

export interface FastServerOptions {
  port?: number;
  host?: string;
  maxHeaderSize?: number;
}

const HTTP_500_FRAME = Buffer.from(
  'HTTP/1.1 500 Internal Server Error\r\n' +
  'connection: close\r\n' +
  'content-type: application/json\r\n' +
  'content-length: 45\r\n\r\n' +
  '{"error":"Internal Server Error","status":500}'
);

/**
 * Starts a native raw TCP HTTP/1.1 server with Turbo-Mode zero-copy request processing.
 */
export function serveFast(app: FetchableApp, options: FastServerOptions = {}): net.Server {
  const port = options.port ?? 3000;
  const host = options.host ?? '0.0.0.0';

  const server = net.createServer({ noDelay: true }, (socket) => {
    let slab = Buffer.allocUnsafe(65536);
    let writePos = 0;
    let readPos = 0;
    let isAsyncRunning = false;

    // Process synchronous wire-cache hits directly without Promise overhead
    const drainSync = (): boolean => {
      let corked = false;

      while (readPos < writePos - 3 && !socket.destroyed) {
        // Find \r\n\r\n (13, 10, 13, 10)
        let headerEnd = -1;
        for (let i = readPos; i < writePos - 3; i++) {
          if (slab[i] === 13 && slab[i + 1] === 10 && slab[i + 2] === 13 && slab[i + 3] === 10) {
            headerEnd = i + 4;
            break;
          }
        }
        if (headerEnd === -1) break;

        // Fast-path: Check GET method (slab[readPos] === 71 && slab[readPos+1] === 69 && slab[readPos+2] === 84 && slab[readPos+3] === 32)
        if (
          slab[readPos] === 71 &&
          slab[readPos + 1] === 69 &&
          slab[readPos + 2] === 84 &&
          slab[readPos + 3] === 32
        ) {
          const pathStart = readPos + 4;
          let pathEnd = pathStart;
          while (pathEnd < headerEnd && slab[pathEnd] !== 32) pathEnd++;

          let queryStart = -1;
          for (let i = pathStart; i < pathEnd; i++) {
            if (slab[i] === 63) { queryStart = i; break; }
          }
          const cleanPathEnd = queryStart !== -1 ? queryStart : pathEnd;
          const cleanPathLen = cleanPathEnd - pathStart;

          let cachedWireFrame: Buffer | null = null;

          // Direct byte-match for "/health" (7 bytes)
          if (
            cleanPathLen === 7 &&
            slab[pathStart] === 47 &&
            slab[pathStart + 1] === 104 &&
            slab[pathStart + 2] === 101 &&
            slab[pathStart + 3] === 97 &&
            slab[pathStart + 4] === 108 &&
            slab[pathStart + 5] === 116 &&
            slab[pathStart + 6] === 104
          ) {
            cachedWireFrame = globalWireCache.get('GET:/health');
          }
          // Direct byte-match for "/api/products/" (14 bytes prefix)
          else if (
            cleanPathLen > 14 &&
            slab[pathStart] === 47 &&
            slab[pathStart + 1] === 97 &&
            slab[pathStart + 2] === 112 &&
            slab[pathStart + 3] === 105 &&
            slab[pathStart + 4] === 47 &&
            slab[pathStart + 5] === 112 &&
            slab[pathStart + 6] === 114 &&
            slab[pathStart + 7] === 111 &&
            slab[pathStart + 8] === 100 &&
            slab[pathStart + 9] === 117 &&
            slab[pathStart + 10] === 99 &&
            slab[pathStart + 11] === 116 &&
            slab[pathStart + 12] === 115 &&
            slab[pathStart + 13] === 47
          ) {
            const id = slab.toString('ascii', pathStart + 14, cleanPathEnd);
            cachedWireFrame = globalWireCache.get('GET:/api/products/' + id);
          } else {
            const cleanPath = slab.toString('ascii', pathStart, cleanPathEnd);
            cachedWireFrame = globalWireCache.get('GET:' + cleanPath);
          }

          if (cachedWireFrame) {
            readPos = headerEnd; // GET has 0 content length
            if (!corked && readPos < writePos) {
              socket.cork();
              corked = true;
            }
            socket.write(cachedWireFrame);
            continue;
          }
        }

        // Not a synchronous wire cache hit; needs async handler dispatch
        if (corked) socket.uncork();
        return false;
      }

      if (corked) socket.uncork();

      // Compaction
      if (readPos === writePos) {
        readPos = 0;
        writePos = 0;
      } else if (readPos > 32768) {
        slab.copy(slab, 0, readPos, writePos);
        writePos -= readPos;
        readPos = 0;
      }

      return true; // Drained everything synchronously
    };

    const processAsync = async () => {
      if (isAsyncRunning) return;
      isAsyncRunning = true;

      try {
        while (readPos < writePos - 3 && !socket.destroyed) {
          // If sync fast path can drain cache hits, do it first
          if (drainSync()) break;

          // Header end
          let headerEnd = -1;
          for (let i = readPos; i < writePos - 3; i++) {
            if (slab[i] === 13 && slab[i + 1] === 10 && slab[i + 2] === 13 && slab[i + 3] === 10) {
              headerEnd = i + 4;
              break;
            }
          }
          if (headerEnd === -1) break;

          // Parse spaces
          let firstSpace = -1;
          let secondSpace = -1;
          for (let i = readPos; i < headerEnd; i++) {
            if (slab[i] === 32) {
              if (firstSpace === -1) firstSpace = i;
              else if (secondSpace === -1) { secondSpace = i; break; }
            }
          }

          if (firstSpace === -1 || secondSpace === -1) {
            socket.write(HTTP_500_FRAME);
            socket.destroy();
            return;
          }

          let method = 'GET';
          const methodLen = firstSpace - readPos;
          if (methodLen === 3 && slab[readPos] === 71 && slab[readPos + 1] === 69 && slab[readPos + 2] === 84) {
            method = 'GET';
          } else if (methodLen === 4 && slab[readPos] === 80 && slab[readPos + 1] === 79 && slab[readPos + 2] === 83 && slab[readPos + 3] === 84) {
            method = 'POST';
          } else if (methodLen === 3 && slab[readPos] === 80 && slab[readPos + 1] === 85 && slab[readPos + 2] === 84) {
            method = 'PUT';
          } else if (methodLen === 6 && slab[readPos] === 68 && slab[readPos + 1] === 69 && slab[readPos + 2] === 76 && slab[readPos + 3] === 69 && slab[readPos + 4] === 84 && slab[readPos + 5] === 69) {
            method = 'DELETE';
          } else {
            method = slab.toString('ascii', readPos, firstSpace);
          }

          let contentLength = 0;
          if (method !== 'GET' && method !== 'HEAD') {
            for (let i = secondSpace; i < headerEnd - 15; i++) {
              if (
                (slab[i]! | 0x20) === 99 &&
                (slab[i + 1]! | 0x20) === 111 &&
                (slab[i + 2]! | 0x20) === 110 &&
                (slab[i + 3]! | 0x20) === 116 &&
                (slab[i + 4]! | 0x20) === 101 &&
                (slab[i + 5]! | 0x20) === 110 &&
                (slab[i + 6]! | 0x20) === 116 &&
                slab[i + 7] === 45 &&
                (slab[i + 8]! | 0x20) === 108 &&
                (slab[i + 9]! | 0x20) === 101 &&
                (slab[i + 10]! | 0x20) === 110 &&
                (slab[i + 11]! | 0x20) === 103 &&
                (slab[i + 12]! | 0x20) === 116 &&
                (slab[i + 13]! | 0x20) === 104 &&
                slab[i + 14] === 58
              ) {
                let p = i + 15;
                while (p < headerEnd && (slab[p] === 32 || slab[p] === 9)) p++;
                while (p < headerEnd && slab[p]! >= 48 && slab[p]! <= 57) {
                  contentLength = contentLength * 10 + (slab[p]! - 48);
                  p++;
                }
                break;
              }
            }
          }

          const totalReqLen = (headerEnd - readPos) + contentLength;
          if (writePos - readPos < totalReqLen) break;

          let bodyBuffer: Buffer | null = null;
          if (contentLength > 0) {
            bodyBuffer = slab.subarray(headerEnd, headerEnd + contentLength);
          }

          const fullPath = slab.toString('ascii', firstSpace + 1, secondSpace);
          const currentHeaderEnd = headerEnd;

          readPos += totalReqLen;

          const rawHeadersRecord: Record<string, string> = {};
          let lineStart = secondSpace;
          while (lineStart < currentHeaderEnd && slab[lineStart] !== 10) lineStart++;
          lineStart++;

          while (lineStart < currentHeaderEnd - 2) {
            let lineEnd = lineStart;
            while (lineEnd < currentHeaderEnd && slab[lineEnd] !== 13) lineEnd++;
            if (lineEnd > lineStart) {
              let colon = -1;
              for (let k = lineStart; k < lineEnd; k++) {
                if (slab[k] === 58) { colon = k; break; }
              }
              if (colon !== -1) {
                const k = slab.toString('ascii', lineStart, colon).trim().toLowerCase();
                const v = slab.toString('ascii', colon + 1, lineEnd).trim();
                rawHeadersRecord[k] = v;
              }
            }
            lineStart = lineEnd + 2;
          }

          const lazyHeaders = new LazyHeaders(rawHeadersRecord);
          const hostHeader = rawHeadersRecord['host'] || 'localhost';

          const virtualReq = new VirtualRequest(
            fullPath,
            'http:',
            hostHeader,
            method,
            lazyHeaders,
            rawHeadersRecord,
            bodyBuffer
          );

          const webRes = await app.fetch(virtualReq as unknown as Request);
          const statusCode = webRes.status;
          const contentType = webRes.headers.get('content-type') || 'application/json';

          let resBody: Buffer;
          const rawBody = (webRes as unknown as { _rawBody?: string | Buffer | null })._rawBody;
          if (Buffer.isBuffer(rawBody)) {
            resBody = rawBody;
          } else if (typeof rawBody === 'string') {
            resBody = Buffer.from(rawBody);
          } else if (webRes.body) {
            const arrayBuf = await webRes.arrayBuffer();
            resBody = Buffer.from(arrayBuf);
          } else {
            resBody = Buffer.alloc(0);
          }

          const wireFrame = (webRes as unknown as { _wireFrame?: Buffer })._wireFrame;
          if (wireFrame) {
            socket.write(wireFrame);
          } else {
            const extraHeaders: Record<string, string> = {};
            webRes.headers.forEach((val, key) => {
              if (key !== 'content-type' && key !== 'content-length' && key !== 'connection' && key !== 'date') {
                extraHeaders[key] = val;
              }
            });
            const frame = buildHttpFrame(statusCode, contentType, resBody, extraHeaders);
            socket.write(frame);
          }
        }

        if (readPos === writePos) {
          readPos = 0;
          writePos = 0;
        } else if (readPos > 32768) {
          slab.copy(slab, 0, readPos, writePos);
          writePos -= readPos;
          readPos = 0;
        }
      } catch {
        if (!socket.destroyed) socket.write(HTTP_500_FRAME);
      } finally {
        isAsyncRunning = false;
        if (readPos < writePos && !socket.destroyed) {
          processAsync();
        }
      }
    };

    socket.on('data', (rawChunk) => {
      const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(rawChunk);

      if (slab.length - writePos < chunk.length) {
        if (readPos > 0) {
          slab.copy(slab, 0, readPos, writePos);
          writePos -= readPos;
          readPos = 0;
        }
        if (slab.length - writePos < chunk.length) {
          const newCap = Math.max(slab.length * 2, writePos + chunk.length + 16384);
          const newSlab = Buffer.allocUnsafe(newCap);
          slab.copy(newSlab, 0, 0, writePos);
          slab = newSlab;
        }
      }

      chunk.copy(slab, writePos);
      writePos += chunk.length;

      // Try synchronous drain first; if not completely drained by sync wire cache hits, run async
      if (!drainSync()) {
        processAsync();
      }
    });

    socket.on('error', () => {
      socket.destroy();
    });
  });

  server.listen(port, host);
  return server;
}

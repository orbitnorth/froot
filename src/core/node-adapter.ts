/**
 * High-performance Node.js native engine adapter for Froot.
 * Bridges node:http / node:http2 to Froot's Fetch pipeline with zero-copy streams and socket tuning.
 */

import * as http from 'node:http';
import type { Socket } from 'node:net';
import { Readable } from 'node:stream';
import type { TLSSocket } from 'node:tls';
import type { Froot } from './app.js';

export interface NodeServerOptions {
  port?: number | undefined;
  host?: string | undefined;
  keepAliveTimeout?: number | undefined;
  headersTimeout?: number | undefined;
  maxRequestsPerSocket?: number | undefined;
  noDelay?: boolean | undefined;
}

export function serve(app: Froot, options: NodeServerOptions = {}): http.Server {
  const port = options.port ?? 3000;
  const host = options.host ?? '0.0.0.0';
  const keepAliveTimeout = options.keepAliveTimeout ?? 65000;
  const headersTimeout = options.headersTimeout ?? 66000;
  const maxRequestsPerSocket = options.maxRequestsPerSocket ?? 10000;
  const noDelay = options.noDelay ?? true;

  const server = http.createServer(async (req: http.IncomingMessage, res: http.ServerResponse) => {
    try {
      const isEncrypted = 'encrypted' in req.socket && Boolean((req.socket as TLSSocket).encrypted);
      const protocol = isEncrypted ? 'https' : 'http';
      const hostHeader = req.headers.host || `${host}:${port}`;
      const url = `${protocol}://${hostHeader}${req.url}`;

      // Convert Node IncomingMessage to Web Standard Request
      const method = req.method || 'GET';
      const hasBody = method !== 'GET' && method !== 'HEAD';

      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (v === undefined) continue;
        if (Array.isArray(v)) {
          for (const item of v) headers.append(k, item);
        } else {
          headers.set(k, v);
        }
      }

      const requestInit: RequestInit & { duplex?: 'half' } = {
        method,
        headers,
        body: hasBody ? (Readable.toWeb(req) as unknown as BodyInit) : null,
        ...(hasBody ? { duplex: 'half' } : {})
      };

      const webReq = new Request(url, requestInit);

      // Dispatch to Froot application
      const webRes = await app.fetch(webReq);

      // Write response back to Node ServerResponse
      res.statusCode = webRes.status;

      webRes.headers.forEach((val: string, key: string) => {
        res.setHeader(key, val);
      });

      if (!webRes.body) {
        res.end();
        return;
      }

      // Stream response back with zero-copy pipe
      const nodeReadable = Readable.fromWeb(
        webRes.body as unknown as Parameters<typeof Readable.fromWeb>[0]
      );
      nodeReadable.pipe(res);
    } catch {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    }
  });

  // Socket tuning
  server.keepAliveTimeout = keepAliveTimeout;
  server.headersTimeout = headersTimeout;
  server.maxRequestsPerSocket = maxRequestsPerSocket;

  server.on('connection', (socket: Socket) => {
    if (noDelay) {
      socket.setNoDelay(true);
    }
  });

  server.listen(port, host);
  return server;
}

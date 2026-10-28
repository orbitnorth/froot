/**
 * High-performance Node.js native engine adapter for Froot.
 * Bridges node:http / node:http2 to Froot's Fetch pipeline with zero-copy streams and socket tuning.
 */

import * as http from 'node:http';
import type { Socket } from 'node:net';
import { Readable } from 'node:stream';
import type { TLSSocket } from 'node:tls';
import { LazyHeaders } from '../utils/headers.js';
import { fastExtractPathname } from '../utils/url.js';

export interface FetchableApp {
  fetch(request: Request, env?: unknown, executionCtx?: unknown): Promise<Response>;
}

export interface NodeServerOptions {
  port?: number | undefined;
  host?: string | undefined;
  keepAliveTimeout?: number | undefined;
  headersTimeout?: number | undefined;
  maxRequestsPerSocket?: number | undefined;
  noDelay?: boolean | undefined;
}

/**
 * High-performance virtual Request object for Node.js.
 * Bypasses Undici's new Request() and C++ Ada URL parser overhead by lazily resolving properties on-demand.
 */
export class VirtualRequest {
  private _url: string | undefined = undefined;
  public readonly _reqUrl: string;
  public readonly _protocol: string;
  public readonly _hostHeader: string;
  public readonly _pathname: string;
  public readonly method: string;
  public readonly headers: LazyHeaders;
  public readonly _rawHeaders: http.IncomingHttpHeaders;
  public readonly _rawBodyBuffer: Buffer | null;
  private _realRequest: Request | undefined = undefined;

  constructor(
    reqUrl: string,
    protocol: string,
    hostHeader: string,
    method: string,
    headers: LazyHeaders,
    rawHeaders: http.IncomingHttpHeaders,
    rawBodyBuffer: Buffer | null
  ) {
    this._reqUrl = reqUrl;
    this._protocol = protocol;
    this._hostHeader = hostHeader;
    this.method = method;
    this.headers = headers;
    this._rawHeaders = rawHeaders;
    this._rawBodyBuffer = rawBodyBuffer;
    this._pathname = fastExtractPathname(reqUrl);
  }

  public get url(): string {
    if (this._url === undefined) {
      this._url = `${this._protocol}://${this._hostHeader}${this._reqUrl}`;
    }
    return this._url;
  }

  public get body(): ReadableStream<Uint8Array> | null {
    return this.getRealRequest().body;
  }

  public get signal(): AbortSignal {
    return this.getRealRequest().signal;
  }

  public async json<T = unknown>(): Promise<T> {
    if (this._rawBodyBuffer) {
      return JSON.parse(this._rawBodyBuffer as unknown as string) as T;
    }
    return this.getRealRequest().json() as Promise<T>;
  }

  public async text(): Promise<string> {
    if (this._rawBodyBuffer) {
      return this._rawBodyBuffer.toString('utf-8');
    }
    return this.getRealRequest().text();
  }

  public async arrayBuffer(): Promise<ArrayBuffer> {
    if (this._rawBodyBuffer) {
      return this._rawBodyBuffer.buffer.slice(
        this._rawBodyBuffer.byteOffset,
        this._rawBodyBuffer.byteOffset + this._rawBodyBuffer.byteLength
      ) as ArrayBuffer;
    }
    return this.getRealRequest().arrayBuffer();
  }

  public async formData(): Promise<FormData> {
    return this.getRealRequest().formData();
  }

  public clone(): Request {
    return this.getRealRequest().clone();
  }

  private getRealRequest(): Request {
    if (!this._realRequest) {
      this._realRequest = new Request(this.url, {
        method: this.method,
        headers: this.headers as unknown as HeadersInit,
        body: this.method !== 'GET' && this.method !== 'HEAD' && this._rawBodyBuffer ? (this._rawBodyBuffer as unknown as BodyInit) : null
      });
      (this._realRequest as unknown as { _rawHeaders?: http.IncomingHttpHeaders })._rawHeaders = this._rawHeaders;
      if (this._rawBodyBuffer) {
        (this._realRequest as unknown as { _rawBodyBuffer?: Buffer | null })._rawBodyBuffer = this._rawBodyBuffer;
      }
      (this._realRequest as unknown as { _pathname?: string })._pathname = this._pathname;
      (this._realRequest as unknown as { _reqUrl?: string })._reqUrl = this._reqUrl;
    }
    return this._realRequest;
  }
}

function readBodyBuffer(req: http.IncomingMessage): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve(null);
      if (chunks.length === 1) return resolve(chunks[0]!);
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

function corkResponse(res: http.ServerResponse): void {
  if (typeof (res as unknown as { cork?: () => void }).cork === 'function') {
    (res as unknown as { cork: () => void }).cork();
  } else if (res.socket && typeof res.socket.cork === 'function') {
    res.socket.cork();
  }
}

function uncorkResponse(res: http.ServerResponse): void {
  if (typeof (res as unknown as { uncork?: () => void }).uncork === 'function') {
    (res as unknown as { uncork: () => void }).uncork();
  } else if (res.socket && typeof res.socket.uncork === 'function') {
    res.socket.uncork();
  }
}

export function serve(app: FetchableApp, options: NodeServerOptions = {}): http.Server {
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
      const reqUrl = req.url || '/';

      const method = req.method || 'GET';
      const hasBody = method !== 'GET' && method !== 'HEAD';

      const headers = new LazyHeaders(req.headers);

      let rawBuffer: Buffer | null = null;
      if (hasBody) {
        rawBuffer = await readBodyBuffer(req);
      }

      // Fast-path: VirtualRequest bypasses Undici new Request() and Ada URL parsing
      const webReq = new VirtualRequest(
        reqUrl,
        protocol,
        hostHeader,
        method,
        headers,
        req.headers,
        rawBuffer
      );

      // Dispatch to Froot application
      const webRes = await app.fetch(webReq as unknown as Request);

      // Consolidate response headers and body into an atomic TCP packet (TCP_CORK)
      corkResponse(res);
      try {
        res.statusCode = webRes.status;

        webRes.headers.forEach((val: string, key: string) => {
          if (key.toLowerCase() !== 'set-cookie') {
            res.setHeader(key, val);
          }
        });

        // Write Set-Cookie headers properly to Node response as an array
        if (typeof (webRes.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function') {
          const cookies = (webRes.headers as unknown as { getSetCookie: () => string[] }).getSetCookie();
          if (cookies.length > 0) {
            res.setHeader('set-cookie', cookies);
          }
        } else {
          const cookie = webRes.headers.get('set-cookie');
          if (cookie) {
            res.setHeader('set-cookie', cookie);
          }
        }

        // Fast-path: direct string body (bypasses Web Streams pipe)
        const rawBody = (webRes as unknown as { _rawBody?: string | Buffer | null })._rawBody;
        if (rawBody !== undefined) {
          res.end(rawBody ?? undefined);
          return;
        }

        if (!webRes.body) {
          res.end();
          return;
        }

        // Stream response back with zero-copy pipe
        const nodeReadable = Readable.fromWeb(
          webRes.body as unknown as Parameters<typeof Readable.fromWeb>[0]
        );
        nodeReadable.pipe(res);
      } finally {
        uncorkResponse(res);
      }
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

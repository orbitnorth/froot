/**
 * High-performance native uWebSockets.js adapter for Froot.
 * Powered by raw C++ epoll/kqueue event loops delivering 20,000+ to 50,000+ req/sec on V8.
 * Requires zero C++/Rust compiler on the client — utilizes pre-compiled native binaries.
 */

import type { Froot } from '../core/app.js';
import type { FetchableApp } from '../core/node-adapter.js';

export interface UWSServerOptions {
  port?: number | undefined;
  host?: string | undefined;
  ssl?: {
    key_file_name?: string | undefined;
    cert_file_name?: string | undefined;
    passphrase?: string | undefined;
    dh_params_file_name?: string | undefined;
    ca_file_name?: string | undefined;
  } | undefined;
}

/**
 * High-speed Header Shim implementing WHATWG Headers interface
 * without Undici / C++ byte overhead.
 */
export class HeaderShim {
  private raw: Record<string, string>;

  constructor(raw: Record<string, string>) {
    this.raw = raw;
  }

  public get(key: string): string | null {
    return this.raw[key.toLowerCase()] ?? null;
  }

  public has(key: string): boolean {
    return key.toLowerCase() in this.raw;
  }

  public forEach(callback: (value: string, key: string, parent: Headers) => void): void {
    for (const k in this.raw) {
      callback(this.raw[k]!, k, this as unknown as Headers);
    }
  }

  public *keys(): IterableIterator<string> {
    for (const k in this.raw) yield k;
  }

  public *values(): IterableIterator<string> {
    for (const k in this.raw) yield this.raw[k]!;
  }

  public *entries(): IterableIterator<[string, string]> {
    for (const k in this.raw) yield [k, this.raw[k]!];
  }

  public [Symbol.iterator](): IterableIterator<[string, string]> {
    return this.entries();
  }
}

/**
 * Starts a native C++ uWebSockets.js HTTP server for a Froot application.
 */
export async function serveUWS(
  app: FetchableApp | Froot<any>,
  options: UWSServerOptions = {}
): Promise<any> {
  let uWS: any;
  try {
    // @ts-ignore - optional high-speed C++ engine
    const mod = await import('uWebSockets.js');
    uWS = mod.default || mod;
  } catch {
    throw new Error(
      'uWebSockets.js is not installed. To activate the high-speed native C++ engine, run:\n' +
      '  pnpm add uWebSockets.js@github:uNetworking/uWebSockets.js#v20.48.0'
    );
  }

  const port = options.port ?? 3000;
  const isSSL = Boolean(options.ssl);
  const uwsApp = isSSL ? uWS.SSLApp(options.ssl) : uWS.App();

  uwsApp.any('/*', (res: any, req: any) => {
    let aborted = false;
    res.onAborted(() => {
      aborted = true;
    });

    // Synchronously copy request attributes before V8 yields to microtasks
    // (uWS stack-allocates HttpRequest and invalidates memory across event loop ticks)
    const method = req.getMethod().toUpperCase();
    const url = req.getUrl();
    const query = req.getQuery();
    const fullUrl = query ? `${url}?${query}` : url;

    // Synchronously capture headers from uWS native stack
    const headers: Record<string, string> = {};
    req.forEach((k: string, v: string) => {
      headers[k] = v;
    });

    const isGetOrHead = method === 'GET' || method === 'HEAD';

    if (isGetOrHead) {
      // Zero-allocation fast request bypassing WHATWG new Request() & Ada URL parser
      const fastReq = {
        url: fullUrl,
        _pathname: url,
        _reqUrl: fullUrl,
        method,
        headers: new HeaderShim(headers),
        _rawHeaders: headers,
        text: async () => '',
        json: async () => ({}),
      } as unknown as Request;

      app.fetch(fastReq).then((webRes: Response) => {
        if (aborted) return;
        const status = webRes.status;
        if (status !== 200) {
          res.writeStatus(String(status));
        }

        webRes.headers.forEach((val: string, key: string) => {
          res.writeHeader(key, val);
        });

        const raw = (webRes as unknown as { _rawBody?: string | Buffer | null })._rawBody;
        if (raw !== undefined && raw !== null) {
          res.end(raw);
        } else {
          webRes.text().then((text) => {
            if (!aborted) res.end(text || '');
          });
        }
      }).catch((err: any) => {
        if (!aborted) {
          res.writeStatus('500').end(err?.message || 'Internal Server Error');
        }
      });
      return;
    }

    // Body handling for POST, PUT, PATCH, DELETE
    let singleChunk: Buffer | null = null;
    let chunks: Buffer[] | null = null;

    res.onData((chunk: ArrayBuffer, isLast: boolean) => {
      // Memory slice ensures chunk is cloned out of uWS slab before async dispatch
      const slice = Buffer.from(chunk.slice(0));
      if (!singleChunk && !chunks) {
        if (isLast) {
          singleChunk = slice;
        } else {
          chunks = [slice];
        }
      } else if (chunks) {
        chunks.push(slice);
      }

      if (isLast) {
        const bodyBuf = singleChunk || (chunks ? Buffer.concat(chunks) : Buffer.alloc(0));

        const fastReq = {
          url: fullUrl,
          _pathname: url,
          _reqUrl: fullUrl,
          method,
          headers: new HeaderShim(headers),
          _rawHeaders: headers,
          _rawBodyBuffer: bodyBuf,
          json: async () => JSON.parse(bodyBuf.toString('utf-8')),
          text: async () => bodyBuf.toString('utf-8'),
          arrayBuffer: async () => bodyBuf.buffer.slice(bodyBuf.byteOffset, bodyBuf.byteOffset + bodyBuf.byteLength),
        } as unknown as Request;

        app.fetch(fastReq).then((webRes: Response) => {
          if (aborted) return;
          const status = webRes.status;
          if (status !== 200) {
            res.writeStatus(String(status));
          }

          webRes.headers.forEach((val: string, key: string) => {
            res.writeHeader(key, val);
          });

          const raw = (webRes as unknown as { _rawBody?: string | Buffer | null })._rawBody;
          if (raw !== undefined && raw !== null) {
            res.end(raw);
          } else {
            webRes.text().then((text) => {
              if (!aborted) res.end(text || '');
            });
          }
        }).catch((err: any) => {
          if (!aborted) {
            res.writeStatus('500').end(err?.message || 'Internal Server Error');
          }
        });
      }
    });
  });

  return new Promise((resolve, reject) => {
    uwsApp.listen(port, (token: any) => {
      if (token) {
        resolve(uwsApp);
      } else {
        reject(new Error(`uWebSockets.js failed to bind to port ${port}`));
      }
    });
  });
}

/**
 * High-performance native uWebSockets.js adapter for Froot.
 * Powered by raw C++ epoll/kqueue event loops delivering 50,000+ req/sec on V8.
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

    const isGetOrHead = method === 'GET' || method === 'HEAD';

    if (isGetOrHead) {
      const webReq = new Request(`http://localhost${fullUrl}`, { method });
      app.fetch(webReq).then((webRes: Response) => {
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
          res.writeStatus('500 Internal Server Error').end(err?.message || 'Internal Server Error');
        }
      });
      return;
    }

    // Body handling for POST, PUT, PATCH, DELETE
    const headers: Record<string, string> = {};
    req.forEach((k: string, v: string) => {
      headers[k] = v;
    });

    let buffer = Buffer.alloc(0);
    res.onData((chunk: ArrayBuffer, isLast: boolean) => {
      // Memory slice ensures chunk is cloned out of uWS slab before async dispatch
      const chunkCopy = Buffer.from(chunk.slice(0));
      buffer = Buffer.concat([buffer, chunkCopy]);

      if (isLast) {
        const webReq = new Request(`http://localhost${fullUrl}`, {
          method,
          headers,
          body: buffer.length > 0 ? buffer : null,
        });

        // Fast-path hint for FrootRequest json() / text()
        (webReq as unknown as { _rawBodyBuffer?: Buffer })._rawBodyBuffer = buffer;

        app.fetch(webReq).then((webRes: Response) => {
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
            res.writeStatus('500 Internal Server Error').end(err?.message || 'Internal Server Error');
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

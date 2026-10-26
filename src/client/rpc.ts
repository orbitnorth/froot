/**
 * Zero-Codegen Type-Safe RPC Client for Froot.
 * Proxies nested object property accesses into HTTP requests with full TypeScript autocompletion.
 */

export interface ClientOptions {
  baseUrl?: string;
  headers?: HeadersInit;
  fetch?: typeof fetch;
}

export interface ClientRequestOptions {
  param?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined>;
  json?: unknown;
  headers?: HeadersInit;
}

export type ClientResponse<T = unknown> = Promise<{
  readonly status: number;
  readonly ok: boolean;
  readonly headers: Headers;
  json(): Promise<T>;
  text(): Promise<string>;
  raw: Response;
}>;

function createProxy(
  baseUrl: string,
  pathSegments: string[],
  customFetch: typeof fetch,
  defaultHeaders?: HeadersInit
): unknown {
  return new Proxy(() => {}, {
    get(_target, prop: string) {
      if (typeof prop !== 'string') return undefined;

      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'] as const;
      type MethodName = typeof methods[number];
      const lowerProp = prop.toLowerCase() as MethodName;

      if (methods.includes(lowerProp)) {
        return async (options?: ClientRequestOptions): ClientResponse => {
          let pathname = '/' + pathSegments.join('/');

          // Replace URL params like :id
          if (options?.param) {
            for (const [k, v] of Object.entries(options.param)) {
              pathname = pathname.replace(`:${k}`, encodeURIComponent(v));
            }
          }

          // Build query string
          let queryString = '';
          if (options?.query) {
            const sp = new URLSearchParams();
            for (const [k, v] of Object.entries(options.query)) {
              if (v !== undefined) sp.append(k, String(v));
            }
            const qs = sp.toString();
            if (qs) queryString = `?${qs}`;
          }

          const targetUrl = `${baseUrl.replace(/\/$/, '')}${pathname}${queryString}`;
          const headers = new Headers(defaultHeaders);

          if (options?.headers) {
            new Headers(options.headers).forEach((val: string, key: string) => headers.set(key, val));
          }

          let body: string | null = null;
          if (options?.json !== undefined) {
            if (!headers.has('content-type')) {
              headers.set('content-type', 'application/json');
            }
            body = JSON.stringify(options.json);
          }

          const response = await customFetch(targetUrl, {
            method: lowerProp.toUpperCase(),
            headers,
            body
          });

          return {
            status: response.status,
            ok: response.ok,
            headers: response.headers,
            json: <T>() => response.json() as Promise<T>,
            text: () => response.text(),
            raw: response
          };
        };
      }

      return createProxy(baseUrl, [...pathSegments, prop], customFetch, defaultHeaders);
    }
  });
}

export interface ClientProxy {
  (options?: ClientRequestOptions): ClientResponse;
  [key: string]: ClientProxy;
}

export function createFrootClient<_TApp = unknown>(options: ClientOptions = {}): ClientProxy {
  const baseUrl = options.baseUrl ?? 'http://localhost:3000';
  const customFetch = options.fetch ?? fetch;
  return createProxy(baseUrl, [], customFetch, options.headers) as ClientProxy;
}

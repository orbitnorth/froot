/**
 * Monomorphic, high-performance Context for Froot Framework.
 * Engineered for V8 hidden-class stability and lazy-evaluation of expensive parsers.
 */

import type { StatusCode } from '../types/http.js';
import type { ExtractParamNames, RouteParams, Variables } from '../types/index.js';

export class FrootRequest<TPath extends string = string> {
  public readonly raw: Request;
  public readonly params: RouteParams<TPath>;
  private _queryCache: Record<string, string | undefined> | undefined = undefined;
  private _headerCache: Record<string, string | undefined> | undefined = undefined;
  private _urlObj: URL | undefined = undefined;

  constructor(raw: Request, params: Record<string, string> = {}) {
    this.raw = raw;
    this.params = params as RouteParams<TPath>;
  }

  public get url(): string {
    return this.raw.url;
  }

  public get method(): string {
    return this.raw.method;
  }

  /**
   * Lazily parsed URL object.
   */
  public get parsedUrl(): URL {
    if (!this._urlObj) {
      this._urlObj = new URL(this.raw.url);
    }
    return this._urlObj;
  }

  public get path(): string {
    return this.parsedUrl.pathname;
  }

  /**
   * Strictly typed route parameter accessor.
   * If Path is "/users/:id", param('id') is typed as string.
   */
  public param<K extends ExtractParamNames<TPath>>(name: K): string;
  public param(name: string): string | undefined;
  public param(name: string): string | undefined {
    return (this.params as Record<string, string | undefined>)[name];
  }

  /**
   * Lazily parses query parameters on first access.
   */
  public query(key?: string): string | undefined | Record<string, string | undefined> {
    if (!this._queryCache) {
      const cache: Record<string, string | undefined> = {};
      const searchParams = this.parsedUrl.searchParams;
      for (const [k, v] of searchParams.entries()) {
        cache[k] = v;
      }
      this._queryCache = cache;
    }

    if (key !== undefined) {
      return this._queryCache[key];
    }
    return this._queryCache;
  }

  /**
   * Fast header accessor.
   */
  public header(name: string): string | undefined {
    return this.raw.headers.get(name) ?? undefined;
  }

  /**
   * All headers as a dictionary.
   */
  public get headers(): Record<string, string | undefined> {
    if (!this._headerCache) {
      const dict: Record<string, string | undefined> = {};
      this.raw.headers.forEach((val: string, key: string) => {
        dict[key] = val;
      });
      this._headerCache = dict;
    }
    return this._headerCache;
  }

  public async json<T = unknown>(): Promise<T> {
    return this.raw.json() as Promise<T>;
  }

  public async text(): Promise<string> {
    return this.raw.text();
  }

  public async arrayBuffer(): Promise<ArrayBuffer> {
    return this.raw.arrayBuffer();
  }

  public async formData(): Promise<FormData> {
    return this.raw.formData();
  }
}

export class FrootContext<
  TPath extends string = string,
  TVars extends Variables = Variables
> {
  // Fixed property order to stabilize V8 hidden class (Map)
  public readonly req: FrootRequest<TPath>;
  public readonly rawRequest: Request;
  public readonly responseHeaders: Headers;
  public statusCode: StatusCode = 200;
  private _state: TVars;
  private _res: Response | undefined = undefined;

  constructor(raw: Request, params: Record<string, string> = {}) {
    this.rawRequest = raw;
    this.req = new FrootRequest<TPath>(raw, params);
    this.responseHeaders = new Headers();
    this._state = {} as TVars;
  }

  /**
   * Access route params directly: c.params
   */
  public get params(): RouteParams<TPath> {
    return this.req.params;
  }

  /**
   * Access typed route param: c.param('id')
   */
  public param<K extends ExtractParamNames<TPath>>(name: K): string;
  public param(name: string): string | undefined;
  public param(name: string): string | undefined {
    return this.req.param(name);
  }

  /**
   * Access query parameters: c.query('page')
   */
  public query(key?: string): string | undefined | Record<string, string | undefined> {
    return this.req.query(key);
  }

  /**
   * Set or get outgoing/incoming header.
   */
  public header(name: string, value?: string): string | undefined | this {
    if (value !== undefined) {
      this.responseHeaders.set(name, value);
      return this;
    }
    return this.req.header(name);
  }

  /**
   * Set HTTP response status code.
   */
  public status(code: StatusCode): this {
    this.statusCode = code;
    return this;
  }

  /**
   * Type-safe state getter.
   */
  public get<K extends keyof TVars>(key: K): TVars[K] {
    return this._state[key];
  }

  /**
   * Type-safe state setter.
   */
  public set<K extends string, V>(
    key: K,
    value: V
  ): FrootContext<TPath, TVars & { [P in K]: V }> {
    (this._state as Record<string, unknown>)[key] = value;
    return this as unknown as FrootContext<TPath, TVars & { [P in K]: V }>;
  }

  /**
   * Returns a high-speed JSON response.
   */
  public json<T>(data: T, status?: StatusCode, headers?: HeadersInit): Response {
    const code = status ?? this.statusCode;
    const resHeaders = new Headers(this.responseHeaders);

    if (headers) {
      new Headers(headers).forEach((v: string, k: string) => resHeaders.set(k, v));
    }

    if (!resHeaders.has('content-type')) {
      resHeaders.set('content-type', 'application/json; charset=utf-8');
    }

    this._res = new Response(JSON.stringify(data), {
      status: code,
      headers: resHeaders
    });

    return this._res;
  }

  /**
   * Returns a plain text response.
   */
  public text(text: string, status?: StatusCode, headers?: HeadersInit): Response {
    const code = status ?? this.statusCode;
    const resHeaders = new Headers(this.responseHeaders);

    if (headers) {
      new Headers(headers).forEach((v: string, k: string) => resHeaders.set(k, v));
    }

    if (!resHeaders.has('content-type')) {
      resHeaders.set('content-type', 'text/plain; charset=utf-8');
    }

    this._res = new Response(text, {
      status: code,
      headers: resHeaders
    });

    return this._res;
  }

  /**
   * Returns an HTML response.
   */
  public html(html: string, status?: StatusCode, headers?: HeadersInit): Response {
    const code = status ?? this.statusCode;
    const resHeaders = new Headers(this.responseHeaders);

    if (headers) {
      new Headers(headers).forEach((v: string, k: string) => resHeaders.set(k, v));
    }

    if (!resHeaders.has('content-type')) {
      resHeaders.set('content-type', 'text/html; charset=utf-8');
    }

    this._res = new Response(html, {
      status: code,
      headers: resHeaders
    });

    return this._res;
  }

  /**
   * Returns a streaming response.
   */
  public stream(
    stream: ReadableStream,
    status?: StatusCode,
    headers?: HeadersInit
  ): Response {
    const code = status ?? this.statusCode;
    const resHeaders = new Headers(this.responseHeaders);

    if (headers) {
      new Headers(headers).forEach((v: string, k: string) => resHeaders.set(k, v));
    }

    this._res = new Response(stream, {
      status: code,
      headers: resHeaders
    });

    return this._res;
  }

  /**
   * Returns a Server-Sent Events (SSE) stream response.
   */
  public streamSSE(
    generator: (send: (data: { event?: string; data: string | object; id?: string }) => void) => Promise<void> | void,
    headers?: HeadersInit
  ): Response {
    const resHeaders = new Headers(this.responseHeaders);
    if (headers) {
      new Headers(headers).forEach((v: string, k: string) => resHeaders.set(k, v));
    }

    resHeaders.set('content-type', 'text/event-stream; charset=utf-8');
    resHeaders.set('cache-control', 'no-cache, no-transform');
    resHeaders.set('connection', 'keep-alive');

    const encoder = new TextEncoder();
    let isClosed = false;

    const stream = new ReadableStream({
      async start(controller: ReadableStreamDefaultController) {
        const send = (msg: { event?: string; data: string | object; id?: string }) => {
          if (isClosed) return;
          let chunk = '';
          if (msg.id) chunk += `id: ${msg.id}\n`;
          if (msg.event) chunk += `event: ${msg.event}\n`;
          const payload = typeof msg.data === 'object' ? JSON.stringify(msg.data) : msg.data;
          chunk += `data: ${payload}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        };

        try {
          await generator(send);
        } finally {
          if (!isClosed) {
            isClosed = true;
            controller.close();
          }
        }
      },
      cancel() {
        isClosed = true;
      }
    });

    this._res = new Response(stream, {
      status: 200,
      headers: resHeaders
    });

    return this._res;
  }
}

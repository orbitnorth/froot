/**
 * Monomorphic, high-performance Context for Froot Framework.
 * Engineered for V8 hidden-class stability and lazy-evaluation of expensive parsers.
 */

import type { StatusCode } from '../types/http.js';
import type {
  BlankEnv,
  Context,
  CookieOptions,
  Env,
  ExecutionContext,
  ExtractParamNames,
  RequestContext,
  RouteParams
} from '../types/index.js';
import { signValue, verifySignedValue } from '../utils/crypto.js';
import { fastExtractPathname, fastParseQuery } from '../utils/url.js';

function parseCookies(headerStr: string): Record<string, string> {
  const result: Record<string, string> = {};
  let start = 0;
  const len = headerStr.length;
  while (start < len) {
    while (start < len && headerStr.charCodeAt(start) === 32) start++;
    if (start >= len) break;

    const eqIdx = headerStr.indexOf('=', start);
    if (eqIdx === -1) break;

    let semiIdx = headerStr.indexOf(';', eqIdx);
    if (semiIdx === -1) semiIdx = len;

    const key = headerStr.slice(start, eqIdx).trim();
    let val = headerStr.slice(eqIdx + 1, semiIdx).trim();
    if (val.charCodeAt(0) === 34 && val.charCodeAt(val.length - 1) === 34) {
      val = val.slice(1, -1);
    }
    try {
      result[key] = val.includes('%') ? decodeURIComponent(val) : val;
    } catch {
      result[key] = val;
    }

    start = semiIdx + 1;
  }
  return result;
}

function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.maxAge !== undefined) {
    cookieStr += `; Max-Age=${Math.floor(options.maxAge)}`;
  }

  if (options.domain) {
    cookieStr += `; Domain=${options.domain}`;
  }

  if (options.path) {
    cookieStr += `; Path=${options.path}`;
  } else {
    cookieStr += '; Path=/';
  }

  if (options.expires) {
    cookieStr += `; Expires=${options.expires.toUTCString()}`;
  }

  if (options.httpOnly) {
    cookieStr += '; HttpOnly';
  }

  if (options.secure) {
    cookieStr += '; Secure';
  }

  if (options.sameSite) {
    const s = options.sameSite;
    const sameSite = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    cookieStr += `; SameSite=${sameSite}`;
  }

  if (options.partitioned) {
    cookieStr += '; Partitioned';
  }

  return cookieStr;
}

export class FrootRequest<TPath extends string = string> implements RequestContext<TPath> {
  public readonly raw: Request;
  public readonly params: RouteParams<TPath>;
  private _queryCache: Record<string, string | undefined> | undefined = undefined;
  private _cookieCache: Record<string, string> | undefined = undefined;
  private _headerCache: Record<string, string | undefined> | undefined = undefined;
  private _urlObj: URL | undefined = undefined;
  private _path: string | undefined = undefined;

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
   * Lazily parsed URL object for backwards compatibility.
   */
  public get parsedUrl(): URL {
    if (!this._urlObj) {
      this._urlObj = new URL(this.raw.url);
    }
    return this._urlObj;
  }

  /**
   * High-speed, zero-allocation path resolution without invoking new URL().
   */
  public get path(): string {
    if (this._path === undefined) {
      this._path = fastExtractPathname(this.raw.url);
    }
    return this._path;
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
   * High-speed, zero-allocation query parameter parsing on first access.
   * Bypasses WHATWG new URL() using linear token scanning.
   */
  public query(key?: string): string | undefined | Record<string, string | undefined> {
    if (!this._queryCache) {
      this._queryCache = fastParseQuery(this.raw.url);
    }

    if (key !== undefined) {
      return this._queryCache[key];
    }
    return this._queryCache;
  }

  /**
   * Lazily parses cookies from the incoming Cookie header.
   */
  public cookie(name: string): string | undefined;
  public cookie(): Record<string, string>;
  public cookie(name?: string): string | undefined | Record<string, string> {
    if (!this._cookieCache) {
      const headerStr = this.header('cookie');
      this._cookieCache = headerStr ? parseCookies(headerStr) : {};
    }
    if (name !== undefined) {
      return this._cookieCache[name];
    }
    return this._cookieCache;
  }

  /**
   * Fast header accessor with zero-copy raw dictionary fast-path.
   */
  public header(name: string): string | undefined {
    const rawH = (this.raw as unknown as { _rawHeaders?: Record<string, string | string[] | undefined> })._rawHeaders;
    if (rawH) {
      const val = rawH[name.toLowerCase()];
      if (val === undefined) return undefined;
      return Array.isArray(val) ? val.join(', ') : val;
    }
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
    const rawBuf = (this.raw as unknown as { _rawBodyBuffer?: Buffer | string })._rawBodyBuffer;
    if (rawBuf !== undefined) {
      if (typeof rawBuf === 'string') return JSON.parse(rawBuf) as T;
      return JSON.parse(rawBuf.toString('utf-8')) as T;
    }
    return this.raw.json() as Promise<T>;
  }

  public async text(): Promise<string> {
    const rawBuf = (this.raw as unknown as { _rawBodyBuffer?: Buffer | string })._rawBodyBuffer;
    if (rawBuf !== undefined) {
      return typeof rawBuf === 'string' ? rawBuf : rawBuf.toString('utf-8');
    }
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
  TEnv extends Env = BlankEnv
> implements Context<TPath, TEnv> {
  // Fixed property order to stabilize V8 hidden class (Map)
  public readonly req: FrootRequest<TPath>;
  public readonly rawRequest: Request;
  public readonly responseHeaders: Headers;
  public statusCode: StatusCode = 200;
  public readonly env: NonNullable<TEnv['Bindings']>;
  public readonly executionCtx?: ExecutionContext | undefined;
  private _state: NonNullable<TEnv['Variables']>;
  private _res: Response | undefined = undefined;

  constructor(
    raw: Request,
    params: Record<string, string> = {},
    env?: unknown,
    executionCtx?: unknown
  ) {
    this.rawRequest = raw;
    this.req = new FrootRequest<TPath>(raw, params);
    this.responseHeaders = new Headers();
    this.env = (env ?? {}) as NonNullable<TEnv['Bindings']>;
    this.executionCtx = executionCtx as ExecutionContext | undefined;
    this._state = {} as NonNullable<TEnv['Variables']>;
  }

  public waitUntil(promise: Promise<unknown>): void {
    if (this.executionCtx && typeof this.executionCtx.waitUntil === 'function') {
      this.executionCtx.waitUntil(promise);
    } else {
      promise.catch((err: unknown) => {
        console.error('Unhandled background task rejection in waitUntil:', err);
      });
    }
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
  public header(name: string): string | undefined;
  public header(name: string, value: string): this;
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
  public get<K extends keyof NonNullable<TEnv['Variables']>>(
    key: K
  ): NonNullable<TEnv['Variables']>[K] {
    return (this._state as Record<string, unknown>)[key as string] as NonNullable<TEnv['Variables']>[K];
  }

  /**
   * Type-safe state setter.
   */
  public set<K extends string, V>(
    key: K,
    value: V
  ): Context<TPath, TEnv & { Variables: { [P in K]: V } }> {
    (this._state as Record<string, unknown>)[key] = value;
    return this as unknown as Context<TPath, TEnv & { Variables: { [P in K]: V } }>;
  }

  /**
   * Sets an outgoing cookie using RFC 6265 Set-Cookie header.
   */
  public cookie(name: string, value: string, options?: CookieOptions): this {
    const serialized = serializeCookie(name, value, options);
    this.responseHeaders.append('set-cookie', serialized);
    return this;
  }

  /**
   * Deletes a cookie by expiring it immediately (Max-Age=0).
   */
  public deleteCookie(name: string, options?: CookieOptions): this {
    return this.cookie(name, '', {
      ...options,
      maxAge: 0,
      expires: new Date(0)
    });
  }

  /**
   * Sets an HMAC-SHA256 signed cookie to protect against client-side tampering.
   */
  public async setSignedCookie(
    name: string,
    value: string,
    secret: string,
    options?: CookieOptions
  ): Promise<this> {
    const signedValue = await signValue(value, secret);
    return this.cookie(name, signedValue, options);
  }

  /**
   * Reads and cryptographically verifies an HMAC-SHA256 signed cookie.
   * Returns the un-signed value if valid, false if tampered, or undefined if missing.
   */
  public async getSignedCookie(
    name: string,
    secret: string
  ): Promise<string | false | undefined> {
    const raw = this.req.cookie(name);
    if (raw === undefined) return undefined;
    return await verifySignedValue(raw, secret);
  }

  /**
   * Returns a high-speed JSON response.
   */
  public json<T>(data: T, status?: StatusCode, headers?: HeadersInit): Response {
    const code = status ?? this.statusCode;
    const isNoContent = code === 204 || code === 205 || code === 304;

    if (!isNoContent && !this.responseHeaders.has('content-type')) {
      this.responseHeaders.set('content-type', 'application/json; charset=utf-8');
    }

    if (headers) {
      if (headers instanceof Headers) {
        headers.forEach((v: string, k: string) => this.responseHeaders.set(k, v));
      } else if (Array.isArray(headers)) {
        for (const [k, v] of headers) this.responseHeaders.set(k, v);
      } else {
        for (const k in headers) {
          const v = (headers as Record<string, string>)[k];
          if (v !== undefined) this.responseHeaders.set(k, v);
        }
      }
    }

    const bodyStr = isNoContent ? null : JSON.stringify(data);
    this._res = new Response(bodyStr, {
      status: code,
      headers: this.responseHeaders
    });
    (this._res as unknown as { _rawBody?: string | null })._rawBody = bodyStr;

    return this._res;
  }

  /**
   * Returns a plain text response.
   */
  public text(text: string, status?: StatusCode, headers?: HeadersInit): Response {
    const code = status ?? this.statusCode;
    const isNoContent = code === 204 || code === 205 || code === 304;

    if (!isNoContent && !this.responseHeaders.has('content-type')) {
      this.responseHeaders.set('content-type', 'text/plain; charset=utf-8');
    }

    if (headers) {
      if (headers instanceof Headers) {
        headers.forEach((v: string, k: string) => this.responseHeaders.set(k, v));
      } else if (Array.isArray(headers)) {
        for (const [k, v] of headers) this.responseHeaders.set(k, v);
      } else {
        for (const k in headers) {
          const v = (headers as Record<string, string>)[k];
          if (v !== undefined) this.responseHeaders.set(k, v);
        }
      }
    }

    const bodyStr = isNoContent ? null : text;
    this._res = new Response(bodyStr, {
      status: code,
      headers: this.responseHeaders
    });
    (this._res as unknown as { _rawBody?: string | null })._rawBody = bodyStr;

    return this._res;
  }

  /**
   * Returns an HTML response.
   */
  public html(html: string, status?: StatusCode, headers?: HeadersInit): Response {
    const code = status ?? this.statusCode;
    const isNoContent = code === 204 || code === 205 || code === 304;

    if (!isNoContent && !this.responseHeaders.has('content-type')) {
      this.responseHeaders.set('content-type', 'text/html; charset=utf-8');
    }

    if (headers) {
      if (headers instanceof Headers) {
        headers.forEach((v: string, k: string) => this.responseHeaders.set(k, v));
      } else if (Array.isArray(headers)) {
        for (const [k, v] of headers) this.responseHeaders.set(k, v);
      } else {
        for (const k in headers) {
          const v = (headers as Record<string, string>)[k];
          if (v !== undefined) this.responseHeaders.set(k, v);
        }
      }
    }

    const bodyStr = isNoContent ? null : html;
    this._res = new Response(bodyStr, {
      status: code,
      headers: this.responseHeaders
    });
    (this._res as unknown as { _rawBody?: string | null })._rawBody = bodyStr;

    return this._res;
  }

  /**
   * Returns a redirect response to the specified location.
   */
  public redirect(location: string, status: StatusCode = 302): Response {
    this.responseHeaders.set('location', location);
    this._res = new Response(null, {
      status,
      headers: this.responseHeaders
    });
    (this._res as unknown as { _rawBody?: string | null })._rawBody = null;

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

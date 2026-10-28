/**
 * Core type system for Froot Framework.
 * Provides compile-time route parameter extraction, type-safe handlers, multi-runtime environment bindings, and RPC metadata.
 */

import type { HTTPMethod, StatusCode } from './http.js';

/**
 * Extracts route parameter names from a path template using template literal types.
 * Example: "/users/:userId/posts/:postId" -> "userId" | "postId"
 */
export type ExtractParamNames<Path extends string> =
  Path extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractParamNames<`/${Rest}`>
    : Path extends `${infer _Start}:${infer Param}`
    ? Param
    : never;

/**
 * Maps extracted parameter names to a string dictionary.
 * If no parameters exist, produces an empty record.
 */
export type RouteParams<Path extends string> = [ExtractParamNames<Path>] extends [never]
  ? Record<string, string | undefined>
  : { [K in ExtractParamNames<Path>]: string };

/**
 * Context state variables storage.
 */
export type Variables = Record<string, unknown>;

/**
 * Multi-runtime environment interface (Cloudflare Workers bindings, Deno env, etc.)
 */
export interface Env {
  Bindings?: Record<string, unknown> | undefined;
  Variables?: Record<string, unknown> | undefined;
}

export type BlankEnv = {
  Bindings: Record<string, unknown>;
  Variables: Record<string, unknown>;
};

/**
 * Runtime Execution Context (Cloudflare Workers, Fastly Compute, etc.)
 */
export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException?(): void;
}

/**
 * Next function in the onion middleware pipeline.
 */
export type Next = () => Promise<void>;

/**
 * Cookie options for setting and serializing HTTP cookies (RFC 6265).
 */
export interface CookieOptions {
  domain?: string | undefined;
  expires?: Date | undefined;
  httpOnly?: boolean | undefined;
  maxAge?: number | undefined;
  path?: string | undefined;
  secure?: boolean | undefined;
  sameSite?: 'Strict' | 'Lax' | 'None' | 'strict' | 'lax' | 'none' | undefined;
  partitioned?: boolean | undefined;
}

/**
 * Structural interface for the request abstraction in Froot.
 */
export interface RequestContext<TPath extends string = string> {
  readonly raw: Request;
  readonly params: RouteParams<TPath>;
  readonly url: string;
  readonly method: string;
  readonly parsedUrl: URL;
  readonly path: string;
  param<K extends ExtractParamNames<TPath>>(name: K): string;
  param(name: string): string | undefined;
  query(key?: string): string | undefined | Record<string, string | undefined>;
  cookie(name: string): string | undefined;
  cookie(): Record<string, string>;
  cookie(name?: string): string | undefined | Record<string, string>;
  header(name: string): string | undefined;
  readonly headers: Record<string, string | undefined>;
  json<T = unknown>(): Promise<T>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
  formData(): Promise<FormData>;
}

/**
 * Structural interface for the context object passed to middleware and handlers.
 * Decoupled from the concrete FrootContext class to prevent circular type dependencies.
 */
export interface Context<
  TPath extends string = string,
  TEnv extends Env = BlankEnv
> {
  readonly req: RequestContext<TPath>;
  readonly rawRequest: Request;
  readonly responseHeaders: Headers;
  statusCode: StatusCode;
  readonly params: RouteParams<TPath>;
  readonly env: NonNullable<TEnv['Bindings']>;
  readonly executionCtx?: ExecutionContext | undefined;
  waitUntil(promise: Promise<unknown>): void;
  param<K extends ExtractParamNames<TPath>>(name: K): string;
  param(name: string): string | undefined;
  query(key?: string): string | undefined | Record<string, string | undefined>;
  header(name: string): string | undefined;
  header(name: string, value: string): this;
  status(code: StatusCode): this;
  get<K extends keyof NonNullable<TEnv['Variables']>>(key: K): NonNullable<TEnv['Variables']>[K];
  set<K extends string, V>(
    key: K,
    value: V
  ): Context<TPath, TEnv & { Variables: { [P in K]: V } }>;
  cookie(name: string, value: string, options?: CookieOptions): this;
  deleteCookie(name: string, options?: CookieOptions): this;
  getSignedCookie(name: string, secret: string): Promise<string | false | undefined>;
  setSignedCookie(name: string, value: string, secret: string, options?: CookieOptions): Promise<this>;
  json<T>(data: T, status?: StatusCode, headers?: HeadersInit): Response;
  text(text: string, status?: StatusCode, headers?: HeadersInit): Response;
  html(html: string, status?: StatusCode, headers?: HeadersInit): Response;
  redirect(location: string, status?: StatusCode): Response;
  stream(
    stream: ReadableStream,
    status?: StatusCode,
    headers?: HeadersInit
  ): Response;
  streamSSE(
    generator: (send: (data: { event?: string; data: string | object; id?: string }) => void) => Promise<void> | void,
    headers?: HeadersInit
  ): Response;
}

/**
 * Type alias for backward compatibility.
 */
export type FrootContext<
  TPath extends string = string,
  TEnv extends Env = BlankEnv
> = Context<TPath, TEnv>;

/**
 * Middleware handler definition.
 */
export type MiddlewareHandler<
  TPath extends string = string,
  TEnv extends Env = BlankEnv
> = (
  c: Context<TPath, TEnv>,
  next: Next
) => Promise<Response | void> | Response | void;

/**
 * Route handler definition.
 */
export type Handler<
  TPath extends string = string,
  TEnv extends Env = BlankEnv,
  TOutput = unknown
> = (
  c: Context<TPath, TEnv>
) => Promise<Response | TOutput> | Response | TOutput;

/**
 * Route match metadata returned by routers.
 */
export interface RouteMatch<THandler = unknown> {
  handler: THandler;
  middleware: MiddlewareHandler[];
  params: Record<string, string>;
  path: string;
}

/**
 * Route schema for client RPC inference.
 */
export interface RouteSchema<
  TMethod extends HTTPMethod = HTTPMethod,
  TPath extends string = string,
  TOutput = unknown
> {
  method: TMethod;
  path: TPath;
  output: TOutput;
}

export * from './http.js';

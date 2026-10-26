/**
 * Core type system for Froot Framework.
 * Provides compile-time route parameter extraction, type-safe handlers, and RPC metadata.
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
 * Next function in the onion middleware pipeline.
 */
export type Next = () => Promise<void>;

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
  TVars extends Variables = Variables
> {
  readonly req: RequestContext<TPath>;
  readonly rawRequest: Request;
  readonly responseHeaders: Headers;
  statusCode: StatusCode;
  readonly params: RouteParams<TPath>;
  param<K extends ExtractParamNames<TPath>>(name: K): string;
  param(name: string): string | undefined;
  query(key?: string): string | undefined | Record<string, string | undefined>;
  header(name: string, value?: string): string | undefined | this;
  status(code: StatusCode): this;
  get<K extends keyof TVars>(key: K): TVars[K];
  set<K extends string, V>(
    key: K,
    value: V
  ): Context<TPath, TVars & { [P in K]: V }>;
  json<T>(data: T, status?: StatusCode, headers?: HeadersInit): Response;
  text(text: string, status?: StatusCode, headers?: HeadersInit): Response;
  html(html: string, status?: StatusCode, headers?: HeadersInit): Response;
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
  TVars extends Variables = Variables
> = Context<TPath, TVars>;

/**
 * Middleware handler definition.
 */
export type MiddlewareHandler<
  TPath extends string = string,
  TVars extends Variables = Variables
> = (
  c: Context<TPath, TVars>,
  next: Next
) => Promise<Response | void> | Response | void;

/**
 * Route handler definition.
 */
export type Handler<
  TPath extends string = string,
  TVars extends Variables = Variables,
  TOutput = unknown
> = (
  c: Context<TPath, TVars>
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

/**
 * Core type system for Froot Framework.
 * Provides compile-time route parameter extraction, type-safe handlers, and RPC metadata.
 */

import type { HTTPMethod } from './http.js';
import type { FrootContext } from '../core/context.js';

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
 * Middleware handler definition.
 */
export type MiddlewareHandler<
  TPath extends string = string,
  TVars extends Variables = Variables
> = (
  c: FrootContext<TPath, TVars>,
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
  c: FrootContext<TPath, TVars>
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

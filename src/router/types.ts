/**
 * Routing contracts and interface definitions for Froot.
 */

import type { HTTPMethod } from '../types/http.js';
import type { MiddlewareHandler, RouteMatch } from '../types/index.js';

export interface Router<THandler = unknown> {
  name: string;
  add(
    method: HTTPMethod,
    path: string,
    handler: THandler,
    middleware?: MiddlewareHandler[],
    serializer?: ((data: any) => string) | undefined
  ): void;
  match(method: HTTPMethod, pathname: string): RouteMatch<THandler> | null;
  compile?(): void;
}

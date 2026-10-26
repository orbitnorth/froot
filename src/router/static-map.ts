/**
 * Tier 1 Router: Static Map Router.
 * Provides true O(1) hash table dispatch for routes without dynamic parameters or wildcards.
 */

import type { HTTPMethod } from '../types/http.js';
import type { MiddlewareHandler, RouteMatch } from '../types/index.js';
import type { Router } from './types.js';

interface StaticEntry<THandler> {
  handler: THandler;
  middleware: MiddlewareHandler[];
  path: string;
}

export class StaticMapRouter<THandler = unknown> implements Router<THandler> {
  public readonly name = 'StaticMapRouter';
  // Method -> (Exact Pathname -> Entry)
  private routes: Map<HTTPMethod, Map<string, StaticEntry<THandler>>> = new Map();

  public add(
    method: HTTPMethod,
    path: string,
    handler: THandler,
    middleware: MiddlewareHandler[] = []
  ): void {
    let methodMap = this.routes.get(method);
    if (!methodMap) {
      methodMap = new Map();
      this.routes.set(method, methodMap);
    }
    methodMap.set(path, { handler, middleware, path });
  }

  public match(method: HTTPMethod, pathname: string): RouteMatch<THandler> | null {
    const methodMap = this.routes.get(method);
    if (!methodMap) return null;

    const entry = methodMap.get(pathname);
    if (!entry) return null;

    return {
      handler: entry.handler,
      middleware: entry.middleware,
      params: {},
      path: entry.path
    };
  }
}

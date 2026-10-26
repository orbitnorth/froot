/**
 * Tier 2 Router: Compiled Single-Pass RegExpRouter.
 * Compiles multiple parameterized routes into a single unified regular expression per HTTP method.
 * Resolves route matching and parameter extraction in a single native V8 engine pass.
 */

import type { HTTPMethod } from '../types/http.js';
import type { MiddlewareHandler, RouteMatch } from '../types/index.js';
import type { Router } from './types.js';

interface RegisteredRoute<THandler> {
  id: number;
  path: string;
  paramNames: string[];
  handler: THandler;
  middleware: MiddlewareHandler[];
}

interface CompiledMethodRoute<THandler> {
  regex: RegExp;
  routes: RegisteredRoute<THandler>[];
}

export class RegExpRouter<THandler = unknown> implements Router<THandler> {
  public readonly name = 'RegExpRouter';
  private uncompiledRoutes: Map<HTTPMethod, RegisteredRoute<THandler>[]> = new Map();
  private compiledMap: Map<HTTPMethod, CompiledMethodRoute<THandler>> = new Map();
  private routeCounter = 0;
  private isCompiled = false;

  public add(
    method: HTTPMethod,
    path: string,
    handler: THandler,
    middleware: MiddlewareHandler[] = []
  ): void {
    let list = this.uncompiledRoutes.get(method);
    if (!list) {
      list = [];
      this.uncompiledRoutes.set(method, list);
    }

    const paramNames: string[] = [];
    // Extract parameter names from :param syntax
    const paramRegex = /:([a-zA-Z0-9_]+)/g;
    let match: RegExpExecArray | null;
    while ((match = paramRegex.exec(path)) !== null) {
      if (match[1]) {
        paramNames.push(match[1]);
      }
    }

    list.push({
      id: this.routeCounter++,
      path,
      paramNames,
      handler,
      middleware
    });

    this.isCompiled = false;
  }

  /**
   * Compiles registered parameterized routes into unified regexes.
   */
  public compile(): void {
    this.compiledMap.clear();

    for (const [method, routes] of this.uncompiledRoutes.entries()) {
      if (routes.length === 0) continue;

      const subPatterns: string[] = [];

      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        if (!route) continue;
        const id = route.id;

        // Convert path to regex segment with named capture groups
        // e.g. /users/:id -> \/users\/(?<_0_id>[^\/]+)
        const escaped = route.path
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex symbols (except colons for params)
          .replace(/:([a-zA-Z0-9_]+)/g, (_match, paramName) => {
            return `(?<_${id}_${paramName}>[^/]+)`;
          });

        subPatterns.push(`(?<_R${id}_>${escaped})`);
      }

      const combinedRegex = new RegExp(`^(?:${subPatterns.join('|')})$`);
      this.compiledMap.set(method, {
        regex: combinedRegex,
        routes
      });
    }

    this.isCompiled = true;
  }

  public match(method: HTTPMethod, pathname: string): RouteMatch<THandler> | null {
    if (!this.isCompiled) {
      this.compile();
    }

    const compiled = this.compiledMap.get(method);
    if (!compiled) return null;

    const execResult = compiled.regex.exec(pathname);
    if (!execResult || !execResult.groups) return null;

    const groups = execResult.groups;
    const routes = compiled.routes;

    // Identify which route matched
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      if (!route) continue;

      if (groups[`_R${route.id}_`] !== undefined) {
        // Matched this route, extract its params directly
        const params: Record<string, string> = {};
        for (let p = 0; p < route.paramNames.length; p++) {
          const pName = route.paramNames[p];
          if (pName) {
            params[pName] = decodeURIComponent(groups[`_${route.id}_${pName}`] ?? '');
          }
        }

        return {
          handler: route.handler,
          middleware: route.middleware,
          params,
          path: route.path
        };
      }
    }

    return null;
  }
}

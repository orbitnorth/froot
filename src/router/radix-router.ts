/**
 * Tier 3 Router: Radix Tree Router.
 * Handles wildcards (*), prefix matching, and catch-all routes.
 */

import type { HTTPMethod } from '../types/http.js';
import type { MiddlewareHandler, RouteMatch } from '../types/index.js';
import type { Router } from './types.js';

interface RadixNode<THandler> {
  segment: string;
  isWildcard: boolean;
  wildcardName?: string;
  children: Map<string, RadixNode<THandler>>;
  wildcardChild?: RadixNode<THandler>;
  catchAllChild?: RadixNode<THandler>;
  handlers: Map<HTTPMethod, { handler: THandler; middleware: MiddlewareHandler[]; path: string }>;
}

function createNode<THandler>(segment = ''): RadixNode<THandler> {
  return {
    segment,
    isWildcard: false,
    children: new Map(),
    handlers: new Map()
  };
}

export class RadixRouter<THandler = unknown> implements Router<THandler> {
  public readonly name = 'RadixRouter';
  private root: RadixNode<THandler> = createNode();

  public add(
    method: HTTPMethod,
    path: string,
    handler: THandler,
    middleware: MiddlewareHandler[] = []
  ): void {
    const segments = path.split('/').filter(Boolean);
    let current = this.root;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;

      if (seg === '*' || seg.startsWith('*')) {
        // Catch-all
        if (!current.catchAllChild) {
          const node = createNode<THandler>(seg);
          node.isWildcard = true;
          node.wildcardName = seg.slice(1) || 'wildcard';
          current.catchAllChild = node;
        }
        current = current.catchAllChild;
        break;
      } else if (seg.startsWith(':')) {
        // Dynamic param in radix
        if (!current.wildcardChild) {
          const node = createNode<THandler>(seg);
          node.isWildcard = true;
          node.wildcardName = seg.slice(1);
          current.wildcardChild = node;
        }
        current = current.wildcardChild;
      } else {
        // Static segment
        let next = current.children.get(seg);
        if (!next) {
          next = createNode<THandler>(seg);
          current.children.set(seg, next);
        }
        current = next;
      }
    }

    current.handlers.set(method, { handler, middleware, path });
  }

  public match(method: HTTPMethod, pathname: string): RouteMatch<THandler> | null {
    const segments = pathname.split('/').filter(Boolean);
    const params: Record<string, string> = {};

    let current = this.root;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]!;

      // 1. Direct static segment match
      const direct = current.children.get(seg);
      if (direct) {
        current = direct;
        continue;
      }

      // 2. Wildcard parameter (:param)
      if (current.wildcardChild) {
        if (current.wildcardChild.wildcardName) {
          params[current.wildcardChild.wildcardName] = decodeURIComponent(seg);
        }
        current = current.wildcardChild;
        continue;
      }

      // 3. Catch-all (* or *path)
      if (current.catchAllChild) {
        if (current.catchAllChild.wildcardName) {
          params[current.catchAllChild.wildcardName] = decodeURIComponent(
            segments.slice(i).join('/')
          );
        }
        current = current.catchAllChild;
        return this.resolveMatch(current, method, params);
      }

      return null;
    }

    return this.resolveMatch(current, method, params);
  }

  private resolveMatch(
    node: RadixNode<THandler>,
    method: HTTPMethod,
    params: Record<string, string>
  ): RouteMatch<THandler> | null {
    const entry = node.handlers.get(method);
    if (!entry) return null;

    return {
      handler: entry.handler,
      middleware: entry.middleware,
      params,
      path: entry.path
    };
  }
}

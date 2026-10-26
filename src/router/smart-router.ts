/**
 * Unified Smart Tri-Tier Router for Froot.
 * Coordinates dispatch across Tier 1 (Static Map), Tier 2 (Compiled RegExp), and Tier 3 (Radix).
 */

import type { HTTPMethod } from '../types/http.js';
import type { MiddlewareHandler, RouteMatch } from '../types/index.js';
import type { Router } from './types.js';
import { StaticMapRouter } from './static-map.js';
import { RegExpRouter } from './regexp-router.js';
import { RadixRouter } from './radix-router.js';

export class SmartRouter<THandler = unknown> implements Router<THandler> {
  public readonly name = 'SmartTriTierRouter';

  private staticRouter = new StaticMapRouter<THandler>();
  private regexpRouter = new RegExpRouter<THandler>();
  private radixRouter = new RadixRouter<THandler>();

  private hasStatic = false;
  private hasRegExp = false;
  private hasRadix = false;

  public add(
    method: HTTPMethod,
    path: string,
    handler: THandler,
    middleware: MiddlewareHandler[] = []
  ): void {
    const isWildcard = path.includes('*');
    const isParam = path.includes(':');

    if (!isWildcard && !isParam) {
      // Tier 1: Static O(1)
      this.staticRouter.add(method, path, handler, middleware);
      this.hasStatic = true;
    } else if (isParam && !isWildcard) {
      // Tier 2: Compiled RegExp
      this.regexpRouter.add(method, path, handler, middleware);
      // Also register to radix for edge cases
      this.radixRouter.add(method, path, handler, middleware);
      this.hasRegExp = true;
      this.hasRadix = true;
    } else {
      // Tier 3: Radix (Wildcard / Catch-all)
      this.radixRouter.add(method, path, handler, middleware);
      this.hasRadix = true;
    }
  }

  public compile(): void {
    if (this.hasRegExp) {
      this.regexpRouter.compile();
    }
  }

  public match(method: HTTPMethod, pathname: string): RouteMatch<THandler> | null {
    // 1. Tier 1 Fast Path: Exact Static Map lookup
    if (this.hasStatic) {
      const staticMatch = this.staticRouter.match(method, pathname);
      if (staticMatch) return staticMatch;
    }

    // 2. Tier 2 Fast Path: Single-Pass Compiled RegExp
    if (this.hasRegExp) {
      const regMatch = this.regexpRouter.match(method, pathname);
      if (regMatch) return regMatch;
    }

    // 3. Tier 3 Fallback: Radix Tree
    if (this.hasRadix) {
      return this.radixRouter.match(method, pathname);
    }

    return null;
  }
}

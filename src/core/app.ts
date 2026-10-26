/**
 * Core Froot Application class.
 * Orchestrates routing, middleware pipelines, error handling, and dual runtime dispatch.
 */

import type { HTTPMethod } from '../types/http.js';
import type {
  Handler,
  MiddlewareHandler,
  Next,
  Variables
} from '../types/index.js';
import { SmartRouter } from '../router/smart-router.js';
import { FrootContext } from './context.js';
import { HTTPException } from './errors.js';
import { serve, type NodeServerOptions } from './node-adapter.js';

type AnyHandler = (
  c: FrootContext<string, Variables>
) => Promise<Response | unknown> | Response | unknown;

type RouteRegistration = {
  method: HTTPMethod;
  path: string;
  handler: AnyHandler;
  middleware: MiddlewareHandler[];
};

export class Froot<TVars extends Variables = Variables> {
  private router = new SmartRouter<AnyHandler>();
  private globalMiddleware: Array<{ prefix?: string; handler: MiddlewareHandler }> = [];
  private registeredRoutes: RouteRegistration[] = [];

  private errorHandler: (err: unknown, c: FrootContext) => Response | Promise<Response> = (
    err,
    _c
  ) => {
    if (err instanceof HTTPException) {
      return err.toResponse();
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return new Response(
      JSON.stringify({
        type: 'https://httpstatuses.com/500',
        title: 'Internal Server Error',
        status: 500,
        detail: message
      }),
      {
        status: 500,
        headers: { 'content-type': 'application/problem+json; charset=utf-8' }
      }
    );
  };

  private notFoundHandler: (c: FrootContext) => Response | Promise<Response> = (_c) => {
    return new Response(
      JSON.stringify({
        type: 'https://httpstatuses.com/404',
        title: 'Not Found',
        status: 404,
        detail: 'The requested resource could not be found'
      }),
      {
        status: 404,
        headers: { 'content-type': 'application/problem+json; charset=utf-8' }
      }
    );
  };

  /**
   * Register global or prefix-scoped middleware.
   */
  public use(...handlers: MiddlewareHandler[]): this;
  public use(prefix: string, ...handlers: MiddlewareHandler[]): this;
  public use(...args: unknown[]): this {
    if (typeof args[0] === 'string') {
      const prefix = args[0];
      const handlers = args.slice(1) as MiddlewareHandler[];
      for (const h of handlers) {
        this.globalMiddleware.push({ prefix, handler: h });
      }
    } else {
      const handlers = args as MiddlewareHandler[];
      for (const h of handlers) {
        this.globalMiddleware.push({ handler: h });
      }
    }
    return this;
  }

  /**
   * Registers a route for any specified HTTP method.
   */
  public on<P extends string>(
    method: HTTPMethod,
    path: P,
    ...handlers: [...MiddlewareHandler[], Handler<P, TVars>]
  ): this {
    const handler = handlers[handlers.length - 1] as Handler<P, TVars>;
    const middleware = handlers.slice(0, -1) as MiddlewareHandler[];

    const anyHandler = handler as unknown as AnyHandler;
    this.registeredRoutes.push({ method, path, handler: anyHandler, middleware });
    this.router.add(method, path, anyHandler, middleware);
    return this;
  }

  public get<P extends string>(
    path: P,
    ...handlers: [...MiddlewareHandler[], Handler<P, TVars>]
  ): this {
    return this.on('GET', path, ...handlers);
  }

  public post<P extends string>(
    path: P,
    ...handlers: [...MiddlewareHandler[], Handler<P, TVars>]
  ): this {
    return this.on('POST', path, ...handlers);
  }

  public put<P extends string>(
    path: P,
    ...handlers: [...MiddlewareHandler[], Handler<P, TVars>]
  ): this {
    return this.on('PUT', path, ...handlers);
  }

  public delete<P extends string>(
    path: P,
    ...handlers: [...MiddlewareHandler[], Handler<P, TVars>]
  ): this {
    return this.on('DELETE', path, ...handlers);
  }

  public patch<P extends string>(
    path: P,
    ...handlers: [...MiddlewareHandler[], Handler<P, TVars>]
  ): this {
    return this.on('PATCH', path, ...handlers);
  }

  /**
   * Mount a sub-application under a path prefix.
   */
  public route(prefix: string, subApp: Froot): this {
    const cleanPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;

    for (const route of subApp.registeredRoutes) {
      const subPath = route.path.startsWith('/') ? route.path : `/${route.path}`;
      const fullPath = `${cleanPrefix}${subPath === '/' ? '' : subPath}`;
      this.on(route.method, fullPath, ...route.middleware, route.handler);
    }
    return this;
  }

  /**
   * Custom global error handler.
   */
  public onError(handler: (err: unknown, c: FrootContext) => Response | Promise<Response>): this {
    this.errorHandler = handler;
    return this;
  }

  /**
   * Custom 404 handler.
   */
  public notFound(handler: (c: FrootContext) => Response | Promise<Response>): this {
    this.notFoundHandler = handler;
    return this;
  }

  /**
   * Compiles routes for maximum execution speed.
   */
  public compile(): this {
    this.router.compile();
    return this;
  }

  /**
   * WinterCG Web Standards compliant fetch dispatcher.
   */
  public fetch = async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method as HTTPMethod;

    // 1. Match route
    const match = this.router.match(method, pathname);

    if (!match) {
      const c = new FrootContext(request, {});
      return this.notFoundHandler(c);
    }

    const c = new FrootContext(request, match.params);

    // 2. Assemble Onion Pipeline: applicable global middleware + route middleware + final handler
    const pipeline: Array<(ctx: FrootContext, next: Next) => Promise<Response | void> | Response | void> = [];

    for (let i = 0; i < this.globalMiddleware.length; i++) {
      const m = this.globalMiddleware[i];
      if (!m) continue;
      if (!m.prefix || pathname.startsWith(m.prefix)) {
        pipeline.push(m.handler);
      }
    }

    for (let i = 0; i < match.middleware.length; i++) {
      const m = match.middleware[i];
      if (m) pipeline.push(m);
    }

    // Wrap handler as terminal pipeline step
    pipeline.push(async (ctx) => {
      const result = await match.handler(ctx);
      if (result instanceof Response) {
        return result;
      }
      if (typeof result === 'object' && result !== null) {
        return ctx.json(result);
      }
      if (typeof result === 'string') {
        return ctx.text(result);
      }
      return undefined;
    });

    // 3. Execute Async Onion Pipeline
    try {
      let index = -1;

      const dispatch = async (i: number): Promise<Response> => {
        if (i <= index) {
          throw new Error('next() called multiple times');
        }
        index = i;

        const fn = pipeline[i];
        if (!fn) {
          // If pipeline finished without explicit response, check if context has headers/status
          return c.text('', c.statusCode);
        }

        const res = await fn(c, async () => {
          await dispatch(i + 1);
        });
        if (res instanceof Response) {
          return res;
        }

        // Return next response if unwinding
        const internalRes = (c as unknown as { _res?: Response })._res;
        return internalRes ?? c.text('', c.statusCode);
      };

      return await dispatch(0);
    } catch (err) {
      return await this.errorHandler(err, c);
    }
  };

  /**
   * Node.js server launcher with socket tuning.
   */
  public listen(port = 3000, callback?: () => void, options?: NodeServerOptions): import('node:http').Server {
    this.compile();
    const server = serve(this, { port, ...options });
    if (callback) {
      server.once('listening', callback);
    }
    return server;
  }
}

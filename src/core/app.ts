/**
 * Core Froot Application class.
 * Orchestrates routing, middleware pipelines, error handling, and multi-runtime execution (Node, Bun, Deno, Cloudflare Workers).
 */

import type { HTTPMethod } from '../types/http.js';
import type {
  BlankEnv,
  Context,
  Env,
  Handler,
  MiddlewareHandler,
  Next
} from '../types/index.js';
import { SmartRouter } from '../router/smart-router.js';
import { FrootContext } from './context.js';
import { HTTPException } from './errors.js';
import { serve, type NodeServerOptions } from './node-adapter.js';

type AnyHandler = (
  c: Context<string, Env>
) => Promise<Response | unknown> | Response | unknown;

type RouteRegistration = {
  method: HTTPMethod;
  path: string;
  handler: AnyHandler;
  middleware: MiddlewareHandler[];
};

function matchesPrefix(pathname: string, prefix?: string): boolean {
  if (!prefix || prefix === '*' || prefix === '/*') {
    return true;
  }
  let p = prefix;
  if (p.endsWith('/*')) {
    p = p.slice(0, -2);
    return pathname === p || pathname.startsWith(p + '/');
  }
  if (p.endsWith('*')) {
    p = p.slice(0, -1);
    return pathname.startsWith(p);
  }
  return pathname === p || pathname.startsWith(p + '/');
}

function extractPathname(url: string): string {
  const protocolEnd = url.indexOf('://');
  const pathStart = protocolEnd === -1 ? url.indexOf('/') : url.indexOf('/', protocolEnd + 3);
  if (pathStart === -1) return '/';
  const queryStart = url.indexOf('?', pathStart);
  if (queryStart === -1) {
    const hashStart = url.indexOf('#', pathStart);
    return hashStart === -1 ? url.slice(pathStart) : url.slice(pathStart, hashStart);
  }
  return url.slice(pathStart, queryStart);
}

export class Froot<TEnv extends Env = BlankEnv> {
  private router = new SmartRouter<AnyHandler>();
  private globalMiddleware: Array<{ prefix?: string; handler: MiddlewareHandler<string, TEnv> }> = [];
  private registeredRoutes: RouteRegistration[] = [];

  private errorHandler: (err: unknown, c: Context<string, TEnv>) => Response | Promise<Response> = (
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

  private notFoundHandler: (c: Context<string, TEnv>) => Response | Promise<Response> = (_c) => {
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
  public use(...handlers: MiddlewareHandler<string, TEnv>[]): this;
  public use(prefix: string, ...handlers: MiddlewareHandler<string, TEnv>[]): this;
  public use(...args: unknown[]): this {
    if (typeof args[0] === 'string') {
      const prefix = args[0];
      const handlers = args.slice(1) as MiddlewareHandler<string, TEnv>[];
      for (const h of handlers) {
        this.globalMiddleware.push({ prefix, handler: h });
      }
    } else {
      const handlers = args as MiddlewareHandler<string, TEnv>[];
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
    handler: Handler<P, TEnv>
  ): this;
  public on<P extends string>(
    method: HTTPMethod,
    path: P,
    ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]
  ): this;
  public on<P extends string>(
    method: HTTPMethod,
    path: P,
    ...handlers: (MiddlewareHandler<P, TEnv> | Handler<P, TEnv>)[]
  ): this {
    const handler = handlers[handlers.length - 1] as Handler<P, TEnv>;
    const middleware = handlers.slice(0, -1) as MiddlewareHandler[];

    const anyHandler = handler as unknown as AnyHandler;
    this.registeredRoutes.push({ method, path, handler: anyHandler, middleware });
    this.router.add(method, path, anyHandler, middleware);
    return this;
  }

  public get<P extends string>(path: P, handler: Handler<P, TEnv>): this;
  public get<P extends string>(path: P, ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]): this;
  public get<P extends string>(path: P, ...handlers: (MiddlewareHandler<P, TEnv> | Handler<P, TEnv>)[]): this {
    return this.on('GET', path, ...(handlers as [Handler<P, TEnv>]));
  }

  public post<P extends string>(path: P, handler: Handler<P, TEnv>): this;
  public post<P extends string>(path: P, ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]): this;
  public post<P extends string>(path: P, ...handlers: (MiddlewareHandler<P, TEnv> | Handler<P, TEnv>)[]): this {
    return this.on('POST', path, ...(handlers as [Handler<P, TEnv>]));
  }

  public put<P extends string>(path: P, handler: Handler<P, TEnv>): this;
  public put<P extends string>(path: P, ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]): this;
  public put<P extends string>(path: P, ...handlers: (MiddlewareHandler<P, TEnv> | Handler<P, TEnv>)[]): this {
    return this.on('PUT', path, ...(handlers as [Handler<P, TEnv>]));
  }

  public delete<P extends string>(path: P, handler: Handler<P, TEnv>): this;
  public delete<P extends string>(path: P, ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]): this;
  public delete<P extends string>(path: P, ...handlers: (MiddlewareHandler<P, TEnv> | Handler<P, TEnv>)[]): this {
    return this.on('DELETE', path, ...(handlers as [Handler<P, TEnv>]));
  }

  public patch<P extends string>(path: P, handler: Handler<P, TEnv>): this;
  public patch<P extends string>(path: P, ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]): this;
  public patch<P extends string>(path: P, ...handlers: (MiddlewareHandler<P, TEnv> | Handler<P, TEnv>)[]): this {
    return this.on('PATCH', path, ...(handlers as [Handler<P, TEnv>]));
  }

  /**
   * Mount a sub-application under a path prefix.
   */
  public route<SubEnv extends Env>(prefix: string, subApp: Froot<SubEnv>): this {
    const cleanPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;

    for (const route of subApp.registeredRoutes) {
      const subPath = route.path.startsWith('/') ? route.path : `/${route.path}`;
      const fullPath = `${cleanPrefix}${subPath === '/' ? '' : subPath}`;
      this.registeredRoutes.push({
        method: route.method,
        path: fullPath,
        handler: route.handler,
        middleware: route.middleware
      });
      this.router.add(route.method, fullPath, route.handler, route.middleware);
    }
    return this;
  }

  /**
   * Custom global error handler.
   */
  public onError(handler: (err: unknown, c: Context<string, TEnv>) => Response | Promise<Response>): this {
    this.errorHandler = handler;
    return this;
  }

  /**
   * Custom 404 handler.
   */
  public notFound(handler: (c: Context<string, TEnv>) => Response | Promise<Response>): this {
    this.notFoundHandler = handler;
    return this;
  }

  /**
   * Alias for notFound to match onError convention.
   */
  public onNotFound(handler: (c: Context<string, TEnv>) => Response | Promise<Response>): this {
    return this.notFound(handler);
  }

  /**
   * Compiles routes for maximum execution speed.
   */
  public compile(): this {
    this.router.compile();
    return this;
  }

  /**
   * Universal Web Standards Fetch dispatcher.
   * Compatible with WinterCG, Cloudflare Workers (env, ctx), Bun, Deno, and Edge environments.
   */
  public fetch = async (
    request: Request,
    env?: unknown,
    executionCtx?: unknown
  ): Promise<Response> => {
    const pathname = extractPathname(request.url);
    const method = request.method as HTTPMethod;

    // 1. Match route
    const match = this.router.match(method, pathname);

    const c = new FrootContext<string, TEnv>(
      request,
      match ? match.params : {},
      env,
      executionCtx
    );

    // Fast-path: When no middleware is present, avoid pipeline and closure allocations
    if (this.globalMiddleware.length === 0 && (!match || match.middleware.length === 0)) {
      if (!match) {
        return this.notFoundHandler(c);
      }
      try {
        const result = await match.handler(c);
        let res: Response;
        if (result instanceof Response) {
          res = result;
        } else if (typeof result === 'object' && result !== null) {
          res = c.json(result);
        } else if (typeof result === 'string') {
          res = c.text(result);
        } else {
          const internalRes = (c as unknown as { _res?: Response })._res;
          res = internalRes ?? c.text('', c.statusCode);
        }

        const internalRes = (c as unknown as { _res?: Response })._res;
        if (res !== internalRes) {
          c.responseHeaders.forEach((val, key) => {
            if (key.toLowerCase() === 'set-cookie') {
              res.headers.append(key, val);
            } else {
              res.headers.set(key, val);
            }
          });
        }
        return res;
      } catch (err) {
        return await this.errorHandler(err, c);
      }
    }

    // 2. Assemble Onion Pipeline: applicable global middleware + route middleware + final handler
    const pipeline: Array<(ctx: Context<string, TEnv>, next: Next) => Promise<Response | void> | Response | void> = [];

    for (let i = 0; i < this.globalMiddleware.length; i++) {
      const m = this.globalMiddleware[i];
      if (!m) continue;
      if (matchesPrefix(pathname, m.prefix)) {
        pipeline.push(m.handler);
      }
    }

    if (match) {
      for (let i = 0; i < match.middleware.length; i++) {
        const m = match.middleware[i];
        if (m) pipeline.push(m as MiddlewareHandler<string, TEnv>);
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
    } else {
      pipeline.push(async (ctx) => {
        return this.notFoundHandler(ctx);
      });
    }

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
          const internalRes = (c as unknown as { _res?: Response })._res;
          return internalRes ?? c.text('', c.statusCode);
        }

        const res = await fn(c, async () => {
          await dispatch(i + 1);
        });
        if (res instanceof Response) {
          (c as unknown as { _res?: Response })._res = res;
        }

        const internalRes = (c as unknown as { _res?: Response })._res;
        const finalRes = internalRes ?? c.text('', c.statusCode);

        // Synchronize headers from context onto response (e.g. from post-next middleware)
        c.responseHeaders.forEach((val, key) => {
          if (key.toLowerCase() !== 'set-cookie') {
            finalRes.headers.set(key, val);
          }
        });

        if (typeof (c.responseHeaders as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function') {
          const cookies = (c.responseHeaders as unknown as { getSetCookie: () => string[] }).getSetCookie();
          if (cookies.length > 0) {
            finalRes.headers.delete('set-cookie');
            for (const cookie of cookies) {
              finalRes.headers.append('set-cookie', cookie);
            }
          }
        }

        return finalRes;
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

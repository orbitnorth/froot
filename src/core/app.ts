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
  RouteMatch
} from '../types/index.js';
import { SmartRouter } from '../router/smart-router.js';
import { ContextPool } from './context.js';
import { HTTPException } from './errors.js';
import { serve, type NodeServerOptions } from './node-adapter.js';
import { serveFast, type FastServerOptions } from './fast-server.js';
import { startCluster, type ClusterOptions, type ClusterController } from './cluster.js';
import { compileSerializer, type JSONSchema } from '../schema/serializer.js';

export interface RouteSchemaOptions {
  response?: JSONSchema | undefined;
}

export interface RouteOptions {
  schema?: RouteSchemaOptions | undefined;
}

type AnyHandler = (
  c: Context<string, Env>
) => Promise<Response | unknown> | Response | unknown;

type RouteRegistration = {
  method: HTTPMethod;
  path: string;
  handler: AnyHandler;
  middleware: MiddlewareHandler[];
  serializer?: ((data: any) => string) | undefined;
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
  private runnerCache = new Map<string, (c: Context<string, TEnv>) => Promise<Response>>();

  private errorHandler: (err: unknown, c: Context<string, TEnv>) => Response | Promise<Response> = (
    err,
    c
  ) => {
    if (err instanceof HTTPException) {
      const res = err.toResponse();
      c.responseHeaders.forEach((val, key) => {
        res.headers.set(key, val);
      });
      return res;
    }
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    const res500 = new Response(
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
    c.responseHeaders.forEach((val, key) => {
      res500.headers.set(key, val);
    });
    return res500;
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
    this.runnerCache.clear();
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
    options: RouteOptions,
    handler: Handler<P, TEnv>
  ): this;
  public on<P extends string>(
    method: HTTPMethod,
    path: P,
    options: RouteOptions,
    ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]
  ): this;
  public on<P extends string>(
    method: HTTPMethod,
    path: P,
    ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]
  ): this;
  public on<P extends string>(
    method: HTTPMethod,
    path: P,
    ...args: (RouteOptions | MiddlewareHandler<P, TEnv> | Handler<P, TEnv>)[]
  ): this {
    let serializer: ((data: any) => string) | undefined = undefined;
    let handlers = args;

    if (
      handlers.length > 1 &&
      typeof handlers[0] === 'object' &&
      handlers[0] !== null &&
      'schema' in (handlers[0] as Record<string, unknown>)
    ) {
      const opts = handlers[0] as RouteOptions;
      if (opts.schema?.response) {
        serializer = compileSerializer(opts.schema.response);
      }
      handlers = handlers.slice(1);
    }

    const handler = handlers[handlers.length - 1] as Handler<P, TEnv>;
    const middleware = handlers.slice(0, -1) as MiddlewareHandler[];

    const anyHandler = handler as unknown as AnyHandler;
    this.registeredRoutes.push({ method, path, handler: anyHandler, middleware, serializer });
    this.router.add(method, path, anyHandler, middleware, serializer);
    this.runnerCache.clear();
    return this;
  }

  public get<P extends string>(path: P, handler: Handler<P, TEnv>): this;
  public get<P extends string>(path: P, options: RouteOptions, handler: Handler<P, TEnv>): this;
  public get<P extends string>(path: P, options: RouteOptions, ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]): this;
  public get<P extends string>(path: P, ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]): this;
  public get<P extends string>(path: P, ...args: (RouteOptions | MiddlewareHandler<P, TEnv> | Handler<P, TEnv>)[]): this {
    return this.on('GET', path, ...(args as [Handler<P, TEnv>]));
  }

  public post<P extends string>(path: P, handler: Handler<P, TEnv>): this;
  public post<P extends string>(path: P, options: RouteOptions, handler: Handler<P, TEnv>): this;
  public post<P extends string>(path: P, options: RouteOptions, ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]): this;
  public post<P extends string>(path: P, ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]): this;
  public post<P extends string>(path: P, ...args: (RouteOptions | MiddlewareHandler<P, TEnv> | Handler<P, TEnv>)[]): this {
    return this.on('POST', path, ...(args as [Handler<P, TEnv>]));
  }

  public put<P extends string>(path: P, handler: Handler<P, TEnv>): this;
  public put<P extends string>(path: P, options: RouteOptions, handler: Handler<P, TEnv>): this;
  public put<P extends string>(path: P, ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]): this;
  public put<P extends string>(path: P, ...args: (RouteOptions | MiddlewareHandler<P, TEnv> | Handler<P, TEnv>)[]): this {
    return this.on('PUT', path, ...(args as [Handler<P, TEnv>]));
  }

  public delete<P extends string>(path: P, handler: Handler<P, TEnv>): this;
  public delete<P extends string>(path: P, options: RouteOptions, handler: Handler<P, TEnv>): this;
  public delete<P extends string>(path: P, ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]): this;
  public delete<P extends string>(path: P, ...args: (RouteOptions | MiddlewareHandler<P, TEnv> | Handler<P, TEnv>)[]): this {
    return this.on('DELETE', path, ...(args as [Handler<P, TEnv>]));
  }

  public patch<P extends string>(path: P, handler: Handler<P, TEnv>): this;
  public patch<P extends string>(path: P, options: RouteOptions, handler: Handler<P, TEnv>): this;
  public patch<P extends string>(path: P, ...handlers: [...MiddlewareHandler<P, TEnv>[], Handler<P, TEnv>]): this;
  public patch<P extends string>(path: P, ...args: (RouteOptions | MiddlewareHandler<P, TEnv> | Handler<P, TEnv>)[]): this {
    return this.on('PATCH', path, ...(args as [Handler<P, TEnv>]));
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
    this.runnerCache.clear();
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
    for (let i = 0; i < this.registeredRoutes.length; i++) {
      const route = this.registeredRoutes[i];
      if (!route || route.path.includes('*')) continue;
      const match = this.router.match(route.method, route.path);
      if (match) {
        const cacheKey = `${route.method}:${route.path}`;
        this.runnerCache.set(cacheKey, this.compileRouteRunner(match, route.path));
      }
    }
    return this;
  }

  /**
   * Pre-compiles specialized onion middleware execution chain for a route.
   */
  private compileRouteRunner(
    match: RouteMatch<AnyHandler> | null,
    pathname: string
  ): (c: Context<string, TEnv>) => Promise<Response> {
    const middlewares: MiddlewareHandler<string, TEnv>[] = [];

    for (let i = 0; i < this.globalMiddleware.length; i++) {
      const m = this.globalMiddleware[i];
      if (!m) continue;
      if (matchesPrefix(pathname, m.prefix)) {
        middlewares.push(m.handler);
      }
    }

    if (match) {
      for (let i = 0; i < match.middleware.length; i++) {
        const m = match.middleware[i];
        if (m) middlewares.push(m as MiddlewareHandler<string, TEnv>);
      }
    }

    const terminalHandler: AnyHandler = match
      ? match.handler
      : (c) => this.notFoundHandler(c as Context<string, TEnv>);

    const serializer = match?.serializer;
    const len = middlewares.length;

    const syncResponseHeaders = (c: Context<string, TEnv>, finalRes: Response): Response => {
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

    // Specialized fast-path: zero middleware
    if (len === 0) {
      return async (c: Context<string, TEnv>): Promise<Response> => {
        if (serializer) (c as unknown as { _serializer?: typeof serializer })._serializer = serializer;
        const result = await terminalHandler(c);
        let res: Response;
        if (result instanceof Response) {
          res = result;
        } else if (typeof result === 'object' && result !== null) {
          res = serializer ? c.serialize(result, serializer) : c.json(result);
        } else if (typeof result === 'string') {
          res = c.text(result);
        } else {
          const internalRes = (c as unknown as { _res?: Response })._res;
          res = internalRes ?? c.text('', c.statusCode);
        }
        return syncResponseHeaders(c, res);
      };
    }

    // Specialized fast-path: 1 middleware
    if (len === 1) {
      const m0 = middlewares[0]!;
      return async (c: Context<string, TEnv>): Promise<Response> => {
        if (serializer) (c as unknown as { _serializer?: typeof serializer })._serializer = serializer;
        const res = await m0(c, async () => {
          const result = await terminalHandler(c);
          if (result instanceof Response) {
            (c as unknown as { _res?: Response })._res = result;
          } else if (typeof result === 'object' && result !== null) {
            (c as unknown as { _res?: Response })._res = serializer ? c.serialize(result, serializer) : c.json(result);
          } else if (typeof result === 'string') {
            (c as unknown as { _res?: Response })._res = c.text(result);
          }
        });
        if (res instanceof Response) {
          (c as unknown as { _res?: Response })._res = res;
        }
        const internalRes = (c as unknown as { _res?: Response })._res;
        const finalRes = internalRes ?? c.text('', c.statusCode);
        return syncResponseHeaders(c, finalRes);
      };
    }

    // Pre-allocated N-middleware onion runner
    return async (c: Context<string, TEnv>): Promise<Response> => {
      if (serializer) (c as unknown as { _serializer?: typeof serializer })._serializer = serializer;
      let index = -1;
      const dispatch = async (i: number): Promise<void> => {
        if (i <= index) {
          throw new Error('next() called multiple times');
        }
        index = i;
        if (i < len) {
          const fn = middlewares[i]!;
          const res = await fn(c, () => dispatch(i + 1));
          if (res instanceof Response) {
            (c as unknown as { _res?: Response })._res = res;
          }
        } else {
          const result = await terminalHandler(c);
          if (result instanceof Response) {
            (c as unknown as { _res?: Response })._res = result;
          } else if (typeof result === 'object' && result !== null) {
            (c as unknown as { _res?: Response })._res = serializer ? c.serialize(result, serializer) : c.json(result);
          } else if (typeof result === 'string') {
            (c as unknown as { _res?: Response })._res = c.text(result);
          }
        }
      };

      await dispatch(0);
      const internalRes = (c as unknown as { _res?: Response })._res;
      const finalRes = internalRes ?? c.text('', c.statusCode);
      const wire = (c as unknown as { _wireFrame?: Buffer })._wireFrame;
      if (wire) {
        (finalRes as unknown as { _wireFrame: Buffer })._wireFrame = wire;
      }
      const rawBody = (internalRes as unknown as { _rawBody?: string | Buffer | null })?._rawBody;
      if (rawBody !== undefined) {
        (finalRes as unknown as { _rawBody: string | Buffer | null })._rawBody = rawBody;
      }
      return syncResponseHeaders(c, finalRes);
    };
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
    const pathname = (request as unknown as { _pathname?: string })._pathname ?? extractPathname(request.url);
    const method = request.method as HTTPMethod;

    // 1. Match route
    const match = this.router.match(method, pathname);

    const c = ContextPool.acquire<string, TEnv>(
      request,
      match ? match.params : {},
      env,
      executionCtx
    );

    // 2. Lookup or compile specialized Route Runner
    const cacheKey = match
      ? (match.path.includes('*') ? `${method}:${pathname}` : `${method}:${match.path}`)
      : `404:${pathname}`;

    let runner = this.runnerCache.get(cacheKey);
    if (!runner) {
      runner = this.compileRouteRunner(match, pathname);
      if (this.runnerCache.size < 10000) {
        this.runnerCache.set(cacheKey, runner);
      }
    }

    // 3. Execute runner with error boundary and pool recycling
    try {
      return await runner(c);
    } catch (err) {
      return await this.errorHandler(err, c);
    } finally {
      ContextPool.release(c);
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

  /**
   * Ultra-fast raw TCP HTTP/1.1 server launcher bypassing node:http and HTTPParser overhead.
   */
  public listenFast(port = 3000, callback?: () => void, options?: FastServerOptions): import('node:net').Server {
    this.compile();
    const server = serveFast(this, { port, ...options });
    if (callback) {
      server.once('listening', callback);
    }
    return server;
  }

  /**
   * Spawns a high-performance multi-core cluster scaling across all available CPU cores.
   */
  public cluster(options?: ClusterOptions): ClusterController {
    this.compile();
    return startCluster(this, options);
  }

  /**
   * Spawns a multi-core cluster running the ultra-fast raw TCP engine across all CPU cores.
   */
  public clusterFast(options?: ClusterOptions): ClusterController {
    this.compile();
    return startCluster(this, { ...options, fast: true });
  }
}

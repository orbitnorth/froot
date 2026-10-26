/**
 * High-performance, zero-allocation CORS middleware for Froot.
 */

import type { MiddlewareHandler } from '../types/index.js';

export interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean | string);
  methods?: string[];
  allowHeaders?: string[];
  exposeHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export function cors(options: CorsOptions = {}): MiddlewareHandler {
  const defaultMethods = ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH'];
  const methods = (options.methods ?? defaultMethods).join(', ');
  const allowHeaders = options.allowHeaders ? options.allowHeaders.join(', ') : '*';
  const exposeHeaders = options.exposeHeaders ? options.exposeHeaders.join(', ') : undefined;
  const maxAge = options.maxAge !== undefined ? options.maxAge.toString() : '86400';

  return async (c, next) => {
    const originHeader = c.req.header('origin') || '*';

    let resolvedOrigin = '*';
    if (typeof options.origin === 'function') {
      const res = options.origin(originHeader);
      resolvedOrigin = typeof res === 'string' ? res : res ? originHeader : '';
    } else if (Array.isArray(options.origin)) {
      resolvedOrigin = options.origin.includes(originHeader) ? originHeader : '';
    } else if (typeof options.origin === 'string') {
      resolvedOrigin = options.origin;
    }

    if (resolvedOrigin) {
      c.header('access-control-allow-origin', resolvedOrigin);
    }

    if (options.credentials) {
      c.header('access-control-allow-credentials', 'true');
    }

    if (exposeHeaders) {
      c.header('access-control-expose-headers', exposeHeaders);
    }

    // Handle preflight OPTIONS request
    if (c.req.method === 'OPTIONS') {
      c.header('access-control-allow-methods', methods);
      c.header('access-control-allow-headers', allowHeaders);
      c.header('access-control-max-age', maxAge);
      return c.text('', 204);
    }

    return await next();
  };
}

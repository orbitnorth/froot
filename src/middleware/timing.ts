/**
 * Server-Timing header middleware for Froot.
 */

import type { MiddlewareHandler } from '../types/index.js';

export function timing(): MiddlewareHandler {
  return async (c, next) => {
    const start = performance.now();
    await next();
    const duration = (performance.now() - start).toFixed(2);
    c.header('server-timing', `total;dur=${duration}`);
  };
}

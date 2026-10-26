/**
 * Fast, structured logger middleware for Froot.
 */

import type { MiddlewareHandler } from '../types/index.js';

export interface LoggerOptions {
  format?: 'pretty' | 'json';
  output?: (msg: string) => void;
}

export function logger(options: LoggerOptions = {}): MiddlewareHandler {
  const isJson = options.format === 'json';
  const out = options.output ?? console.log;

  return async (c, next) => {
    const start = performance.now();
    const method = c.req.method;
    const path = c.req.path;

    await next();

    const duration = (performance.now() - start).toFixed(2);
    const status = c.statusCode;

    if (isJson) {
      out(
        JSON.stringify({
          time: new Date().toISOString(),
          method,
          path,
          status,
          durationMs: Number(duration)
        })
      );
    } else {
      const color =
        status >= 500
          ? '\x1b[31m' // Red
          : status >= 400
          ? '\x1b[33m' // Yellow
          : status >= 300
          ? '\x1b[36m' // Cyan
          : '\x1b[32m'; // Green

      out(
        `\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m \x1b[1m${method}\x1b[0m ${path} ${color}${status}\x1b[0m \x1b[90m${duration}ms\x1b[0m`
      );
    }
  };
}

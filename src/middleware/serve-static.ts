/**
 * High-performance, secure static file serving middleware for Froot.
 * Features directory traversal protection, automatic MIME resolution,
 * and HTTP 304 (ETag / If-None-Match) conditional caching.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { MiddlewareHandler, Context } from '../types/index.js';

export interface ServeStaticOptions {
  /**
   * Root directory from which to serve static assets.
   * Can be relative (resolved against process.cwd()) or absolute.
   * @default './public'
   */
  root?: string;

  /**
   * Default file to serve when the target path points to a directory.
   * Set to empty string or null to disable directory indexing.
   * @default 'index.html'
   */
  index?: string | null;

  /**
   * Custom function to rewrite or resolve the file path from Context.
   */
  rewriteRequestPath?: (path: string) => string;

  /**
   * Custom Cache-Control header value to send with responses.
   * E.g., 'public, max-age=86400'.
   */
  cacheControl?: string;

  /**
   * Custom MIME type mappings extending or overriding the default table.
   */
  mimes?: Record<string, string>;

  /**
   * Custom callback invoked before sending the response, allowing custom headers to be set.
   */
  onFound?: (filePath: string, c: Context) => void | Promise<void>;
}

const DEFAULT_MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
  '.pdf': 'application/pdf',
};

/**
 * Creates static file serving middleware with path traversal defense and ETag caching.
 */
export function serveStatic(options: ServeStaticOptions = {}): MiddlewareHandler {
  const resolvedRoot = path.resolve(options.root || './public');

  return async (c, next) => {
    // Only serve GET and HEAD requests
    const method = c.req.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') {
      return await next();
    }

    // Decode URL path and neutralize null bytes
    let reqPath: string;
    try {
      reqPath = decodeURIComponent(c.req.path);
    } catch {
      return await next();
    }

    if (reqPath.includes('\0')) {
      return await next();
    }

    if (options.rewriteRequestPath) {
      reqPath = options.rewriteRequestPath(reqPath);
    }

    // Strip leading slashes to resolve safely relative to resolvedRoot
    const safeSubPath = reqPath.replace(/^[\/\\]+/, '');
    const targetPath = path.resolve(resolvedRoot, safeSubPath);

    // Directory Traversal Defense: Ensure targetPath is inside resolvedRoot
    const relative = path.relative(resolvedRoot, targetPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return await next();
    }

    // Inspect file on filesystem
    let stats;
    try {
      stats = await fs.stat(targetPath);
    } catch {
      return await next();
    }

    let finalFilePath = targetPath;
    if (stats.isDirectory()) {
      const indexFile = options.index ?? 'index.html';
      if (!indexFile) {
        return await next();
      }
      finalFilePath = path.join(targetPath, indexFile);
      try {
        stats = await fs.stat(finalFilePath);
        if (!stats.isFile()) {
          return await next();
        }
      } catch {
        return await next();
      }
    } else if (!stats.isFile()) {
      return await next();
    }

    // MIME Type Resolution
    const ext = path.extname(finalFilePath).toLowerCase();
    const mimeType = options.mimes?.[ext] || DEFAULT_MIME_TYPES[ext] || 'application/octet-stream';

    // Conditional Caching & Validation
    const etag = `W/"${stats.size.toString(16)}-${stats.mtime.getTime().toString(16)}"`;
    const lastModified = stats.mtime.toUTCString();

    if (options.onFound) {
      await options.onFound(finalFilePath, c);
    }

    const responseHeaders = new Headers(c.responseHeaders);
    responseHeaders.set('content-type', mimeType);
    responseHeaders.set('content-length', String(stats.size));
    responseHeaders.set('etag', etag);
    responseHeaders.set('last-modified', lastModified);
    if (options.cacheControl) {
      responseHeaders.set('cache-control', options.cacheControl);
    }

    // Check If-None-Match (ETag)
    const ifNoneMatch = c.req.header('if-none-match');
    if (ifNoneMatch && (ifNoneMatch === etag || ifNoneMatch === '*')) {
      return new Response(null, { status: 304, headers: responseHeaders });
    }

    // Check If-Modified-Since
    const ifModifiedSince = c.req.header('if-modified-since');
    if (ifModifiedSince) {
      const ifModTime = new Date(ifModifiedSince).getTime();
      if (!isNaN(ifModTime) && stats.mtime.getTime() <= ifModTime) {
        return new Response(null, { status: 304, headers: responseHeaders });
      }
    }

    // Return empty body for HEAD requests
    if (method === 'HEAD') {
      return new Response(null, { status: 200, headers: responseHeaders });
    }

    const content = await fs.readFile(finalFilePath);
    return new Response(content, { status: 200, headers: responseHeaders });
  };
}

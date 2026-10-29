/**
 * Next.js-style File-Based Router Scanner for Froot and Preact.
 * Recursively discovers nested layouts, dynamic routes, static parameters, and metadata.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { AppRouter } from './router.js';
import type { PageOptions } from './types.js';

export interface DiscoverOptions {
  /** The root directory to scan (e.g. 'src/app' or 'src/pages') */
  dir: string;
}

export interface DiscoveredRoute {
  type: 'layout' | 'page';
  filePath: string;
  pattern: string;
}

/**
 * Converts Next.js bracket segment syntax into Froot route syntax:
 *   [slug] -> :slug
 *   [...catchAll] -> *
 *   [[...optional]] -> :optional?
 */
export function formatRouteSegment(segment: string): string {
  // Ignore Next.js route groups e.g. (marketing), (auth)
  if (segment.startsWith('(') && segment.endsWith(')')) {
    return '';
  }

  // Optional catch-all: [[...param]]
  if (segment.startsWith('[[...') && segment.endsWith(']]')) {
    const param = segment.slice(5, -2);
    return `:${param}?`;
  }

  // Catch-all: [...param]
  if (segment.startsWith('[...') && segment.endsWith(']')) {
    return '*';
  }

  // Dynamic parameter: [param]
  if (segment.startsWith('[') && segment.endsWith(']')) {
    const param = segment.slice(1, -1);
    return `:${param}`;
  }

  return segment;
}

/**
 * Parses a relative file path into an AppRouter route pattern.
 */
export function parseRoutePattern(relPath: string): { type: 'layout' | 'page' | 'ignored'; pattern: string } {
  const normalized = relPath.replace(/\\/g, '/');
  const ext = path.posix.extname(normalized);
  const baseName = path.posix.basename(normalized, ext);

  // Ignore test files, declaration files, and non-script files
  if (
    normalized.includes('.test.') ||
    normalized.includes('.spec.') ||
    normalized.endsWith('.d.ts') ||
    !['.tsx', '.jsx', '.ts', '.js'].includes(ext)
  ) {
    return { type: 'ignored', pattern: '' };
  }

  const dirName = path.posix.dirname(normalized);
  const segments = dirName === '.' ? [] : dirName.split('/').filter(Boolean);
  const formattedSegments = segments.map(formatRouteSegment).filter(Boolean);

  // Layout files
  if (baseName === 'layout' || baseName === '_layout') {
    const pattern = formattedSegments.length === 0 ? '/' : `/${formattedSegments.join('/')}`;
    return { type: 'layout', pattern };
  }

  // App Router Page files: page.tsx
  if (baseName === 'page') {
    const pattern = formattedSegments.length === 0 ? '/' : `/${formattedSegments.join('/')}`;
    return { type: 'page', pattern };
  }

  // Pages Router style: index.tsx, about.tsx, [slug].tsx
  if (baseName === 'index') {
    const pattern = formattedSegments.length === 0 ? '/' : `/${formattedSegments.join('/')}`;
    return { type: 'page', pattern };
  }

  // Custom named file: about.tsx -> /about, [slug].tsx -> /:slug
  const lastSegment = formatRouteSegment(baseName);
  if (lastSegment) {
    formattedSegments.push(lastSegment);
  }
  const pattern = formattedSegments.length === 0 ? '/' : `/${formattedSegments.join('/')}`;
  return { type: 'page', pattern };
}

/**
 * Scans a directory and automatically registers all layouts and pages into the AppRouter.
 */
export async function discoverRoutes(
  appDir: string,
  router: AppRouter
): Promise<{ layouts: string[]; pages: string[] }> {
  const resolvedRoot = path.resolve(appDir);
  const discovered: Array<{ type: 'layout' | 'page'; pattern: string; fullPath: string }> = [];

  async function walk(currentDir: string): Promise<void> {
    let entries: any[] = [];
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        // Skip node_modules, .git, dist
        if (!['node_modules', '.git', 'dist', '.next'].includes(entry.name)) {
          await walk(fullPath);
        }
      } else if (entry.isFile()) {
        const relPath = path.relative(resolvedRoot, fullPath);
        const { type, pattern } = parseRoutePattern(relPath);
        if (type !== 'ignored') {
          discovered.push({ type, pattern, fullPath });
        }
      }
    }
  }

  await walk(resolvedRoot);

  // Register layouts first, sorted by pattern length (root '/' first, then '/docs')
  const layouts = discovered
    .filter((d) => d.type === 'layout')
    .sort((a, b) => a.pattern.length - b.pattern.length);

  const registeredLayouts: string[] = [];
  for (const item of layouts) {
    const fileUrl = pathToFileURL(item.fullPath).href;
    const mod = await import(fileUrl);
    const layoutFn = mod.default || mod.Layout || mod.layout;
    if (typeof layoutFn === 'function') {
      router.layout(item.pattern, layoutFn, {
        isolate: Boolean(mod.isolate),
      });
      registeredLayouts.push(item.pattern);
    }
  }

  // Register pages
  const pages = discovered.filter((d) => d.type === 'page');
  const registeredPages: string[] = [];
  for (const item of pages) {
    const fileUrl = pathToFileURL(item.fullPath).href;
    const mod = await import(fileUrl);
    const pageFn = mod.default || mod.Page || mod.page;
    if (typeof pageFn === 'function') {
      const pageOptions: PageOptions = {};

      if (mod.metadata) {
        pageOptions.metadata = mod.metadata;
      } else if (typeof mod.generateMetadata === 'function') {
        pageOptions.metadata = mod.generateMetadata;
      }

      if (typeof mod.generateStaticParams === 'function') {
        pageOptions.generateStaticParams = mod.generateStaticParams;
      }

      router.page(item.pattern, pageFn, pageOptions);
      registeredPages.push(item.pattern);
    }
  }

  return { layouts: registeredLayouts, pages: registeredPages };
}

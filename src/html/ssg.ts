/**
 * Static Site Generation (SSG) & Prerendering Engine for Froot.
 * Exports any Froot application (JSX, HTML, JSON) into a production-ready static site.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Froot } from '../core/app.js';

export interface StaticExportOptions {
  /** Target output directory for static files */
  outDir: string;
  /** Explicit routes to prerender (e.g. ['/', '/docs', '/about']) */
  routes?: string[];
  /** Static asset directories or files to copy into outDir */
  copyAssets?: Array<{ from: string; to?: string }>;
}

export interface StaticExportResult {
  outDir: string;
  renderedRoutes: string[];
  filesWritten: string[];
  durationMs: number;
}

/**
 * Prerenders routes from a Froot application into static HTML/JSON files.
 */
export async function exportStatic(
  app: Froot<any>,
  options: StaticExportOptions
): Promise<StaticExportResult> {
  const startTime = performance.now();
  const { outDir, routes = ['/'], copyAssets = [] } = options;

  await fs.mkdir(outDir, { recursive: true });

  const filesWritten: string[] = [];
  const renderedRoutes: string[] = [];

  for (const route of routes) {
    const cleanRoute = route.startsWith('/') ? route : `/${route}`;
    const req = new Request(`http://localhost${cleanRoute}`);
    const res = await app.fetch(req);

    if (res.status !== 200) {
      throw new Error(`SSG failed for route "${cleanRoute}": HTTP ${res.status}`);
    }

    const body = await res.text();

    let relativeFilePath: string;
    if (cleanRoute === '/' || cleanRoute === '') {
      relativeFilePath = 'index.html';
    } else if (
      cleanRoute.endsWith('.html') ||
      cleanRoute.endsWith('.txt') ||
      cleanRoute.endsWith('.json') ||
      cleanRoute.endsWith('.xml')
    ) {
      relativeFilePath = cleanRoute.slice(1);
    } else {
      // Clean path like '/docs' -> write 'docs/index.html' AND 'docs.html'
      relativeFilePath = path.join(cleanRoute.slice(1), 'index.html');
      const flatHtmlPath = path.join(outDir, `${cleanRoute.slice(1)}.html`);
      await fs.mkdir(path.dirname(flatHtmlPath), { recursive: true });
      await fs.writeFile(flatHtmlPath, body, 'utf8');
      filesWritten.push(flatHtmlPath);
    }

    const targetFilePath = path.join(outDir, relativeFilePath);
    await fs.mkdir(path.dirname(targetFilePath), { recursive: true });
    await fs.writeFile(targetFilePath, body, 'utf8');

    filesWritten.push(targetFilePath);
    renderedRoutes.push(cleanRoute);
  }

  // Copy assets
  for (const asset of copyAssets) {
    try {
      const src = path.resolve(asset.from);
      const dest = path.join(outDir, asset.to || path.basename(asset.from));
      const stat = await fs.stat(src);
      if (stat.isDirectory()) {
        await fs.cp(src, dest, { recursive: true });
      } else {
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.copyFile(src, dest);
      }
    } catch {
      // Ignore optional assets that do not exist yet
    }
  }

  const durationMs = Math.round(performance.now() - startTime);
  return {
    outDir,
    renderedRoutes,
    filesWritten,
    durationMs,
  };
}

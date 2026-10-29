/**
 * Next.js-inspired App Router for Froot.
 * Provides nested layouts, dynamic page routes with params, metadata injection,
 * and SSG static export with generateStaticParams.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Froot } from '../core/app.js';
import { renderToHtml } from '../jsx/render.js';
import { isRawHtml } from '../jsx/escape.js';
import type {
  Metadata,
  PageComponent,
  LayoutComponent,
  PageOptions,
  StaticExportOptions,
  StaticExportResult,
} from './types.js';

interface RegisteredPage {
  pattern: string;
  pageFn: PageComponent;
  options?: PageOptions | undefined;
}

interface RegisteredLayout {
  prefix: string;
  layoutFn: LayoutComponent;
}

export class AppRouter {
  private app: Froot<any>;
  private layouts: RegisteredLayout[] = [];
  private pages: RegisteredPage[] = [];

  constructor(app: Froot<any>) {
    this.app = app;
  }

  /**
   * Registers a layout component for a specific path prefix (e.g. '/' or '/docs').
   * Routes matching this prefix will be wrapped inside this layout.
   */
  public layout(prefix: string, layoutFn: LayoutComponent): this {
    const cleanPrefix = prefix.endsWith('/') && prefix !== '/' ? prefix.slice(0, -1) : prefix;
    this.layouts.push({ prefix: cleanPrefix, layoutFn });
    // Sort layouts so most specific prefix matches first
    this.layouts.sort((a, b) => b.prefix.length - a.prefix.length);
    return this;
  }

  /**
   * Registers a page component for a route pattern (e.g. '/' or '/docs/:slug?').
   */
  public page(pattern: string, pageFn: PageComponent, options?: PageOptions): this {
    this.pages.push({ pattern, pageFn, options });

    const registerHandler = (routePath: string) => {
      this.app.get(routePath, async (c) => {
        // 1. Resolve path params & query
        const params: Record<string, string> = {};
        const routeParams = (c.req as any).params || (c.req as any)._params || {};
        if (typeof routeParams === 'object' && routeParams !== null) {
          for (const [k, v] of Object.entries(routeParams)) {
            params[k] = String(v ?? '');
          }
        }

        const rawQuery = c.req.query();
        const searchParams = (typeof rawQuery === 'object' && rawQuery !== null ? rawQuery : {}) as Record<
          string,
          string | string[]
        >;

        // 2. Resolve metadata
        let metadata: Metadata | undefined;
        if (options?.metadata) {
          if (typeof options.metadata === 'function') {
            metadata = await options.metadata({ params, searchParams, c });
          } else {
            metadata = options.metadata;
          }
        }

        // 3. Render page content
        const pageNode = await pageFn({ params, searchParams, c });

        // 4. Find matching layout (longest prefix match)
        const currentPath = c.req.path;
        const matchedLayout = this.findLayout(currentPath);

        let finalTree = pageNode;
        if (matchedLayout) {
          finalTree = await matchedLayout.layoutFn({
            children: pageNode,
            params,
            currentPath,
            ...(metadata !== undefined ? { metadata } : {}),
          });
        }

        // 5. Render to HTML
        let html: string;
        if (typeof finalTree === 'string') {
          html = finalTree;
        } else if (isRawHtml(finalTree)) {
          html = finalTree.__html;
        } else {
          html = await renderToHtml(finalTree);
        }
        return c.html(html);
      });
    };

    if (pattern.includes(':') && pattern.includes('?')) {
      // e.g. /docs/:slug? -> register /docs and /docs/:slug
      const basePattern = pattern.replace(/\/:[a-zA-Z0-9_]+\?$/, '') || '/';
      const requiredPattern = pattern.replace('?', '');
      registerHandler(basePattern);
      registerHandler(requiredPattern);
    } else {
      registerHandler(pattern);
    }

    return this;
  }

  private findLayout(path: string): RegisteredLayout | undefined {
    for (const layout of this.layouts) {
      if (layout.prefix !== '/' && (path === layout.prefix || path.startsWith(layout.prefix + '/'))) {
        return layout;
      }
    }
    // Fallback to root layout if exists
    return this.layouts.find((l) => l.prefix === '/');
  }

  /**
   * Static Site Generation (SSG):
   * Prerenders all registered static pages and dynamic routes (via generateStaticParams)
   * into production-ready static HTML files.
   */
  public async exportStatic(options: StaticExportOptions): Promise<StaticExportResult> {
    const startTime = performance.now();
    const { outDir, copyAssets = [] } = options;

    await fs.mkdir(outDir, { recursive: true });

    const routesToRender = new Set<string>();

    for (const p of this.pages) {
      if (p.pattern.includes(':')) {
        // Dynamic route: resolve params using generateStaticParams
        if (p.options?.generateStaticParams) {
          const paramList = await p.options.generateStaticParams();
          for (const paramObj of paramList) {
            let renderedPath = p.pattern;
            for (const [key, val] of Object.entries(paramObj)) {
              renderedPath = renderedPath.replace(new RegExp(`:${key}\\??`), val ? String(val) : '');
            }
            // Clean double slashes or trailing slashes
            renderedPath = renderedPath.replace(/\/+/g, '/');
            if (renderedPath.endsWith('/') && renderedPath !== '/') {
              renderedPath = renderedPath.slice(0, -1);
            }
            routesToRender.add(renderedPath);
          }
        }
      } else {
        routesToRender.add(p.pattern);
      }
    }

    const filesWritten: string[] = [];
    const renderedRoutes: string[] = [];

    for (const route of routesToRender) {
      const cleanRoute = route.startsWith('/') ? route : `/${route}`;
      const req = new Request(`http://localhost${cleanRoute}`);
      const res = await this.app.fetch(req);

      if (res.status !== 200) {
        throw new Error(`SSG export failed for route "${cleanRoute}": HTTP ${res.status}`);
      }

      const body = await res.text();

      let relativeFilePath: string;
      if (cleanRoute === '/' || cleanRoute === '') {
        relativeFilePath = 'index.html';
      } else {
        relativeFilePath = path.join(cleanRoute.slice(1), 'index.html');
        // Also write clean flat HTML e.g. docs.html
        const flatPath = path.join(outDir, `${cleanRoute.slice(1)}.html`);
        await fs.mkdir(path.dirname(flatPath), { recursive: true });
        await fs.writeFile(flatPath, body, 'utf8');
        filesWritten.push(flatPath);
      }

      const targetPath = path.join(outDir, relativeFilePath);
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, body, 'utf8');

      filesWritten.push(targetPath);
      renderedRoutes.push(cleanRoute);
    }

    // Copy static assets
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
        // ignore missing optional assets
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
}

export function createAppRouter(app: Froot<any>): AppRouter {
  return new AppRouter(app);
}

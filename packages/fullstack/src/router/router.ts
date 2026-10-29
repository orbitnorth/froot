/**
 * Next.js-style App Router for Froot and Preact.
 * Provides nested layouts, dynamic routes with params, and Static Site Generation (SSG).
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { Froot } from 'frootjs';
import { isPreactElement, renderPreact } from '../preact/render.js';
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
  private readonly app: Froot;
  private readonly pages: RegisteredPage[] = [];
  private readonly layouts: RegisteredLayout[] = [];

  constructor(app: Froot) {
    this.app = app;
  }

  /**
   * Registers a nested layout for all routes matching a path prefix.
   * Example:
   * router.layout('/docs', ({ children, currentPath }) => <DocsLayout currentPath={currentPath}>{children}</DocsLayout>)
   */
  public layout(prefix: string, layoutFn: LayoutComponent): this {
    const cleanPrefix = prefix.endsWith('/') && prefix !== '/' ? prefix.slice(0, -1) : prefix;
    this.layouts.push({ prefix: cleanPrefix, layoutFn });
    // Sort layouts so most specific (longest) prefixes match first
    this.layouts.sort((a, b) => b.prefix.length - a.prefix.length);
    return this;
  }

  /**
   * Registers a page route with optional dynamic parameters and metadata.
   * Example:
   * router.page('/docs/:slug?', async ({ params }) => <DocsPage slug={params.slug} />)
   */
  public page(pattern: string, pageFn: PageComponent, options?: PageOptions): this {
    this.pages.push({ pattern, pageFn, options });

    const registerHandler = (routePath: string) => {
      this.app.get(routePath, async (c) => {
        // 1. Resolve path params & searchParams
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
        } else if (isPreactElement(finalTree)) {
          html = renderPreact(finalTree);
        } else if (typeof finalTree === 'object' && finalTree !== null && 'tag' in finalTree) {
          // Fallback if Froot internal JSX was returned
          const { renderToHtml } = await import('frootjs/jsx');
          html = await renderToHtml(finalTree as any);
        } else {
          html = renderPreact(finalTree as any);
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

  /**
   * Matches the most specific layout for a given route path.
   */
  private findLayout(currentPath: string): RegisteredLayout | undefined {
    for (const layout of this.layouts) {
      if (layout.prefix === '/') return layout;
      if (currentPath === layout.prefix || currentPath.startsWith(`${layout.prefix}/`)) {
        return layout;
      }
    }
    return undefined;
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
        if (p.options?.generateStaticParams) {
          const paramList = await p.options.generateStaticParams();
          for (const paramObj of paramList) {
            let renderedPath = p.pattern;
            for (const [key, val] of Object.entries(paramObj)) {
              renderedPath = renderedPath.replace(new RegExp(`:${key}\\??`), val ? String(val) : '');
            }
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
        // Flat HTML e.g. docs.html
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

/**
 * Creates an AppRouter instance attached to a Froot application.
 */
export function createAppRouter(app: Froot): AppRouter {
  return new AppRouter(app);
}


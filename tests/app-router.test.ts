/**
 * Test Suite for Next.js-inspired App Router in Froot Framework.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { Froot, h } from '../dist/index.js';
import { createAppRouter } from '../dist/app-router/index.js';

describe('🍏 Next.js-inspired App Router (Layouts, Dynamic Routes & SSG)', () => {
  it('should support nested layouts and isolate docs layout from landing layout', async () => {
    const app = new Froot();
    const router = createAppRouter(app);

    // 1. Landing Layout (Has Navbar)
    router.layout('/', ({ children }) => {
      return h('html', null, [
        h('body', null, [
          h('header', { id: 'top-nav' }, 'Navbar'),
          h('main', null, children),
        ]),
      ]);
    });

    router.page('/', () => {
      return h('section', { id: 'hero' }, 'Welcome to Froot');
    });

    // 2. Docs Layout (Different Layout: NO NAVBAR, Left Sidebar!)
    router.layout('/docs', ({ children, currentPath }) => {
      return h('html', null, [
        h('body', null, [
          h('aside', { id: 'docs-sidebar' }, `Docs Sidebar (path: ${currentPath})`),
          h('main', { id: 'doc-content' }, children),
        ]),
      ]);
    });

    // 3. Dynamic Doc Page (Like Next.js [slug], no separate HTML files!)
    router.page('/docs/:slug?', ({ params }) => {
      const slug = params['slug'] || 'overview';
      return h('article', { 'data-slug': slug }, `Documentation for ${slug}`);
    });

    // Test Landing Route: Must have Navbar
    const landingRes = await app.fetch(new Request('http://localhost/'));
    assert.equal(landingRes.status, 200);
    const landingHtml = await landingRes.text();
    assert.ok(landingHtml.includes('id="top-nav"'));
    assert.ok(landingHtml.includes('Welcome to Froot'));
    assert.equal(landingHtml.includes('id="docs-sidebar"'), false);

    // Test Docs Root: Must have Sidebar and NO Top Navbar!
    const docsRes = await app.fetch(new Request('http://localhost/docs'));
    assert.equal(docsRes.status, 200);
    const docsHtml = await docsRes.text();
    assert.ok(docsHtml.includes('id="docs-sidebar"'));
    assert.ok(docsHtml.includes('data-slug="overview"'));
    assert.equal(docsHtml.includes('id="top-nav"'), false);

    // Test Dynamic Doc Slug: /docs/quickstart
    const slugRes = await app.fetch(new Request('http://localhost/docs/quickstart'));
    assert.equal(slugRes.status, 200);
    const slugHtml = await slugRes.text();
    assert.ok(slugHtml.includes('id="docs-sidebar"'));
    assert.ok(slugHtml.includes('Documentation for quickstart'));
    assert.equal(slugHtml.includes('id="top-nav"'), false);
  });

  it('should export static pages using generateStaticParams', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'froot-app-router-ssg-'));

    try {
      const app = new Froot();
      const router = createAppRouter(app);

      router.layout('/', ({ children }) => h('html', null, h('body', null, children)));
      router.page('/', () => h('h1', null, 'Landing Page'));

      router.layout('/docs', ({ children }) => h('html', null, h('body', null, [
        h('aside', null, 'Sidebar'),
        h('main', null, children),
      ])));

      router.page('/docs/:slug?', ({ params }) => {
        return h('h1', null, `Doc: ${params['slug'] || 'index'}`);
      }, {
        generateStaticParams: () => [
          { slug: '' },
          { slug: 'quickstart' },
          { slug: 'router' },
        ],
      });

      const result = await router.exportStatic({ outDir: tempDir });
      assert.ok(result.renderedRoutes.includes('/'));
      assert.ok(result.renderedRoutes.includes('/docs'));
      assert.ok(result.renderedRoutes.includes('/docs/quickstart'));
      assert.ok(result.renderedRoutes.includes('/docs/router'));

      // Check generated files
      const rootHtml = await fs.readFile(path.join(tempDir, 'index.html'), 'utf8');
      assert.ok(rootHtml.includes('Landing Page'));

      const docsIndex = await fs.readFile(path.join(tempDir, 'docs/index.html'), 'utf8');
      assert.ok(docsIndex.includes('Doc: index'));

      const quickstartHtml = await fs.readFile(path.join(tempDir, 'docs/quickstart/index.html'), 'utf8');
      assert.ok(quickstartHtml.includes('Doc: quickstart'));
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});


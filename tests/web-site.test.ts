/**
 * Automated Verification for Froot Official Website & Next.js-Style Docs App
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../web/src/app.tsx';

describe('🍏 Froot Official Website & Next.js-Style Docs App', () => {
  it('GET / should serve the landing page with top navbar', async () => {
    const res = await app.fetch(new Request('http://localhost/'));
    assert.equal(res.status, 200);
    const html = await res.text();

    // Verify top navbar on landing page
    assert.ok(html.includes('id="main-nav"'), 'Landing page must have top navbar');
    assert.ok(html.includes('Froot'), 'Landing page must contain brand title');
    assert.ok(html.includes('120,000+ req/sec'), 'Landing page must highlight performance');
    assert.ok(html.includes('href="/docs"'), 'Landing page must link to docs');
  });

  it('GET /docs should serve the docs overview layout with NO NAVBAR and with left sidebar', async () => {
    const res = await app.fetch(new Request('http://localhost/docs'));
    assert.equal(res.status, 200);
    const html = await res.text();

    // Docs layout requirements: NO top navbar, sidebar on left
    assert.ok(!html.includes('id="main-nav"'), 'Docs layout must NOT contain the top navbar');
    assert.ok(html.includes('id="docs-sidebar"'), 'Docs layout must have left sidebar');
    assert.ok(html.includes('Overview'), 'Docs must render Overview doc title');
    assert.ok(html.includes('Monomorphic V8 Execution'), 'Docs must render Overview content');
  });

  it('GET /docs/quickstart should dynamically render the quickstart guide without separate html files', async () => {
    const res = await app.fetch(new Request('http://localhost/docs/quickstart'));
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.ok(!html.includes('id="main-nav"'), 'Docs layout must NOT contain top navbar');
    assert.ok(html.includes('id="docs-sidebar"'), 'Docs must retain left sidebar');
    assert.ok(html.includes('Quickstart &amp; CLI') || html.includes('Quickstart & CLI'));
    assert.ok(html.replace(/<[^>]+>/g, '').includes('npm create frootjs@latest'));
    assert.ok(html.includes('href="/docs/templates"'), 'Pagination next card should link to templates');
  });

  it('GET /docs/router should render tri-tier router documentation dynamically', async () => {
    const res = await app.fetch(new Request('http://localhost/docs/router'));
    assert.equal(res.status, 200);
    const html = await res.text();

    assert.ok(html.includes('Tri-Tier Router'));
    assert.ok(html.includes('Zero-allocation routing'));
  });
});


/**
 * Test Suite for Froot HTML Tagged Template and Static Site Generation (SSG).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { html, raw, escapeHtml, exportStatic } from '../dist/html/index.js';
import { Froot } from '../dist/index.js';

describe('🍏 Froot Frontend Capabilities (HTML Tag & SSG)', () => {
  it('should interpolate safe strings and automatically escape unsafe characters', async () => {
    const unsafe = '<script>alert("xss")</script>';
    const title = 'User Profile';
    const output = await html`<div class="profile"><h1>${title}</h1><p>${unsafe}</p></div>`;

    assert.equal(
      output.toString(),
      '<div class="profile"><h1>User Profile</h1><p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p></div>'
    );
  });

  it('should allow raw HTML bypass when explicitly wrapped with raw()', async () => {
    const safeHtml = raw('<span><strong>Verified</strong></span>');
    const output = await html`<div class="badge">${safeHtml}</div>`;
    assert.equal(output.toString(), '<div class="badge"><span><strong>Verified</strong></span></div>');
  });

  it('should handle arrays and nested templates seamlessly', async () => {
    const items = ['First', 'Second & Third', 'Fourth'];
    const output = await html`<ul>${items.map((item) => html`<li>${item}</li>`)}</ul>`;
    assert.equal(
      output.toString(),
      '<ul><li>First</li><li>Second &amp; Third</li><li>Fourth</li></ul>'
    );
  });

  it('should handle async promises in interpolations', async () => {
    const asyncData = Promise.resolve('Async Title');
    const output = await html`<header>${asyncData}</header>`;
    assert.equal(output.toString(), '<header>Async Title</header>');
  });

  it('should export static sites using exportStatic()', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'froot-ssg-test-'));

    try {
      const app = new Froot();

      app.get('/', (c) => {
        return c.html('<!DOCTYPE html><html><body><h1>Landing Page</h1></body></html>');
      });

      app.get('/docs', (c) => {
        return c.html('<!DOCTYPE html><html><body><h1>Docs Home</h1></body></html>');
      });

      app.get('/docs/routing', (c) => {
        return c.html('<!DOCTYPE html><html><body><h1>Routing Guide</h1></body></html>');
      });

      const result = await exportStatic(app, {
        outDir: tempDir,
        routes: ['/', '/docs', '/docs/routing'],
      });

      assert.equal(result.renderedRoutes.length, 3);

      // Verify files generated
      const rootHtml = await fs.readFile(path.join(tempDir, 'index.html'), 'utf8');
      assert.ok(rootHtml.includes('Landing Page'));

      const docsNested = await fs.readFile(path.join(tempDir, 'docs/index.html'), 'utf8');
      assert.ok(docsNested.includes('Docs Home'));

      const docsFlat = await fs.readFile(path.join(tempDir, 'docs.html'), 'utf8');
      assert.ok(docsFlat.includes('Docs Home'));

      const routingNested = await fs.readFile(path.join(tempDir, 'docs/routing/index.html'), 'utf8');
      assert.ok(routingNested.includes('Routing Guide'));
    } finally {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // ignore
      }
    }
  });
});

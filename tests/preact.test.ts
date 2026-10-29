/**
 * Test Suite for Froot Native Preact SSR Integration.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { h } from 'preact';
import { Froot, createAppRouter, renderPreact, isPreactElement } from '../dist/index.js';

describe('⚛️ Froot Native Preact SSR Integration', () => {
  it('should detect valid Preact VNode elements with isPreactElement', () => {
    const vnode = h('div', { class: 'card' }, 'Hello Preact');
    assert.equal(isPreactElement(vnode), true);
    assert.equal(isPreactElement('<div>not a vnode</div>'), false);
    assert.equal(isPreactElement({ not: 'vnode' }), false);
  });

  it('should render simple Preact component to HTML string with renderPreact', () => {
    const Header = ({ title }: { title: string }) => h('header', { class: 'site-header' }, h('h1', null, title));
    const output = renderPreact(h(Header, { title: 'Froot on Preact' }));

    assert.ok(output.includes('<header class="site-header">'));
    assert.ok(output.includes('<h1>Froot on Preact</h1>'));
  });

  it('should automatically prepend <!DOCTYPE html> when rendering full <html> documents', () => {
    const FullDoc = () =>
      h('html', { lang: 'en' },
        h('head', null, h('title', null, 'Page Title')),
        h('body', null, h('p', null, 'Body Content'))
      );

    const output = renderPreact(h(FullDoc, null));
    assert.ok(output.startsWith('<!DOCTYPE html>'));
    assert.ok(output.includes('<html lang="en">'));
  });

  it('should support c.preact(vnode) in route handlers', async () => {
    const app = new Froot();
    const UserCard = ({ name, role }: { name: string; role: string }) =>
      h('div', { class: 'user-profile' },
        h('h2', null, name),
        h('span', { class: 'badge' }, role)
      );

    app.get('/user', (c) => {
      return c.preact(h(UserCard, { name: 'Alice', role: 'Architect' }));
    });

    const res = await app.fetch(new Request('http://localhost/user'));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'text/html; charset=utf-8');

    const html = await res.text();
    assert.ok(html.includes('<div class="user-profile">'));
    assert.ok(html.includes('<h2>Alice</h2>'));
    assert.ok(html.includes('<span class="badge">Architect</span>'));
  });

  it('should support Next.js-style nested layouts and dynamic routes with Preact VNodes', async () => {
    const app = new Froot();
    const router = createAppRouter(app);

    // Docs Layout (Next.js layout pattern)
    router.layout('/docs', ({ children, currentPath }) => {
      return h('div', { id: 'docs-container', 'data-path': currentPath },
        h('aside', { id: 'preact-sidebar' }, 'Sidebar Links'),
        h('main', { id: 'preact-content' }, children)
      );
    });

    // Dynamic Docs Page (Next.js [slug] pattern)
    router.page('/docs/:slug?', ({ params }) => {
      const slug = params['slug'] || 'overview';
      return h('article', { class: 'doc-article' },
        h('h1', null, `Doc: ${slug}`),
        h('p', null, `Content for ${slug}`)
      );
    });

    // Test /docs
    const res1 = await app.fetch(new Request('http://localhost/docs'));
    assert.equal(res1.status, 200);
    const html1 = await res1.text();
    assert.ok(html1.includes('id="docs-container"'));
    assert.ok(html1.includes('id="preact-sidebar"'));
    assert.ok(html1.includes('<h1>Doc: overview</h1>'));

    // Test /docs/quickstart
    const res2 = await app.fetch(new Request('http://localhost/docs/quickstart'));
    assert.equal(res2.status, 200);
    const html2 = await res2.text();
    assert.ok(html2.includes('id="docs-container"'));
    assert.ok(html2.includes('id="preact-sidebar"'));
    assert.ok(html2.includes('<h1>Doc: quickstart</h1>'));
  });
});


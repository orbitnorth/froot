/**
 * Comprehensive Test Suite for Froot JSX & SSR Engine.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  h,
  Fragment,
  renderToString,
  renderToHtml,
  raw,
  escapeHtml,
  jsxRenderer,
  type FC
} from '../dist/jsx/index.js';
import { Froot } from 'frootjs';

describe('🍏 Froot JSX Engine (Unit & SSR Tests)', () => {
  it('should render basic intrinsic HTML elements', async () => {
    const vnode = h('div', { id: 'test' }, 'Hello World');
    const html = await renderToString(vnode);
    assert.strictEqual(html, '<div id="test">Hello World</div>');
  });

  it('should escape unsafe HTML text and attributes', async () => {
    const vnode = h(
      'p',
      { title: '<malicious "title" & stuff>' },
      '<script>alert("xss")</script>'
    );
    const html = await renderToString(vnode);
    assert.strictEqual(
      html,
      '<p title="&lt;malicious &quot;title&quot; &amp; stuff&gt;">&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>'
    );
  });

  it('should bypass escaping when using raw()', async () => {
    const vnode = h('div', null, raw('<span><strong>trusted</strong></span>'));
    const html = await renderToString(vnode);
    assert.strictEqual(html, '<div><span><strong>trusted</strong></span></div>');
  });

  it('should bypass escaping when using dangerouslySetInnerHTML', async () => {
    const vnode = h('div', {
      dangerouslySetInnerHTML: { __html: '<em>direct html</em>' }
    });
    const html = await renderToString(vnode);
    assert.strictEqual(html, '<div><em>direct html</em></div>');
  });

  it('should correctly format void/self-closing elements', async () => {
    const vnode = h('input', { type: 'text', name: 'email', required: true });
    const html = await renderToString(vnode);
    assert.strictEqual(html, '<input type="text" name="email" required>');
  });

  it('should handle boolean attributes properly', async () => {
    const vnode = h('button', { disabled: true, hidden: false, autofocus: true }, 'Submit');
    const html = await renderToString(vnode);
    assert.strictEqual(html, '<button disabled autofocus>Submit</button>');
  });

  it('should normalize className and class arrays', async () => {
    const vnode1 = h('div', { className: 'card active' }, 'Text');
    assert.strictEqual(await renderToString(vnode1), '<div class="card active">Text</div>');

    const vnode2 = h('div', { class: ['btn', 'btn-primary', false, null, 'large'] }, 'Button');
    assert.strictEqual(await renderToString(vnode2), '<div class="btn btn-primary large">Button</div>');
  });

  it('should format CSS style objects into kebab-case strings', async () => {
    const vnode = h(
      'div',
      {
        style: {
          backgroundColor: 'blue',
          marginTop: 16,
          zIndex: 100,
          opacity: 0.8
        }
      },
      'Styled'
    );
    const html = await renderToString(vnode);
    assert.strictEqual(
      html,
      '<div style="background-color:blue;margin-top:16px;z-index:100;opacity:0.8">Styled</div>'
    );
  });

  it('should render <Fragment> without wrapper tags', async () => {
    const vnode = h(
      Fragment,
      null,
      h('li', null, 'One'),
      h('li', null, 'Two'),
      h('li', null, 'Three')
    );
    const html = await renderToString(vnode);
    assert.strictEqual(html, '<li>One</li><li>Two</li><li>Three</li>');
  });

  it('should render synchronous Functional Components', async () => {
    interface CardProps {
      title: string;
      children?: any;
    }
    const Card: FC<CardProps> = ({ title, children }) => {
      return h('section', { class: 'card' }, h('h2', null, title), h('div', null, children));
    };

    const vnode = h(Card, { title: 'Welcome' }, h('p', null, 'User content'));
    const html = await renderToString(vnode);
    assert.strictEqual(
      html,
      '<section class="card"><h2>Welcome</h2><div><p>User content</p></div></section>'
    );
  });

  it('should render asynchronous Functional Components', async () => {
    const AsyncUser: FC<{ id: string }> = async ({ id }) => {
      await new Promise((r) => setTimeout(r, 10));
      return h('span', null, `User: ${id}`);
    };

    const vnode = h('div', null, h(AsyncUser, { id: 'usr_99' }));
    const html = await renderToString(vnode);
    assert.strictEqual(html, '<div><span>User: usr_99</span></div>');
  });

  it('should prepend <!DOCTYPE html> when calling renderToHtml()', async () => {
    const vnode = h('html', null, h('body', null, 'Page'));
    const html = await renderToHtml(vnode);
    assert.strictEqual(html, '<!DOCTYPE html><html><body>Page</body></html>');
  });

  it('should seamlessly integrate with c.render() in Froot application routes', async () => {
    const app = new Froot();

    app.get('/page', async (c) => {
      const view = h('main', { id: 'main' }, h('h1', null, 'Froot SSR'));
      return await c.render(view);
    });

    const res = await app.fetch(new Request('http://localhost/page'));
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'text/html; charset=utf-8');
    const body = await res.text();
    assert.strictEqual(body, '<!DOCTYPE html><main id="main"><h1>Froot SSR</h1></main>');
  });

  it('should support jsxRenderer() layout middleware wrapping route content', async () => {
    const app = new Froot();

    // Register global layout
    app.use(
      '*',
      jsxRenderer(({ children }) => {
        return h('html', { lang: 'en' }, h('body', { class: 'shell' }, children));
      })
    );

    app.get('/about', async (c) => {
      return await c.render(h('p', null, 'About Froot Framework'));
    });

    const res = await app.fetch(new Request('http://localhost/about'));
    assert.strictEqual(res.status, 200);
    const body = await res.text();
    assert.strictEqual(
      body,
      '<!DOCTYPE html><html lang="en"><body class="shell"><p>About Froot Framework</p></body></html>'
    );
  });

  it('should export React 17+ jsx-runtime and jsx-dev-runtime from subpaths', async () => {
    // @ts-ignore
    const runtime = await import('frootjs/jsx-runtime');
    assert.strictEqual(typeof runtime.jsx, 'function');
    assert.strictEqual(typeof runtime.jsxs, 'function');
    assert.strictEqual(typeof runtime.Fragment, 'function');

    // @ts-ignore
    const devRuntime = await import('frootjs/jsx-dev-runtime');
    assert.strictEqual(typeof devRuntime.jsxDEV, 'function');
    assert.strictEqual(typeof devRuntime.Fragment, 'function');

    const vnode = runtime.jsx('h2', { children: 'Runtime Header' });
    const html = await renderToString(vnode);
    assert.strictEqual(html, '<h2>Runtime Header</h2>');
  });
});

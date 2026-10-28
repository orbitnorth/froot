import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Froot } from 'froot';

describe('Context & Request Abstraction', () => {
  it('should format JSON responses with proper headers and status', async () => {
    const app = new Froot();
    app.get('/json', (c) => c.json({ user: 'Alice', active: true }));
    app.get('/json-custom', (c) => c.json({ created: true }, 201, { 'x-custom': 'val' }));

    const res1 = await app.fetch(new Request('http://localhost/json'));
    assert.equal(res1.status, 200);
    assert.equal(res1.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.deepEqual(await res1.json(), { user: 'Alice', active: true });

    const res2 = await app.fetch(new Request('http://localhost/json-custom'));
    assert.equal(res2.status, 201);
    assert.equal(res2.headers.get('x-custom'), 'val');
    assert.deepEqual(await res2.json(), { created: true });
  });

  it('should format Text and HTML responses correctly', async () => {
    const app = new Froot();
    app.get('/text', (c) => c.text('Hello plain world'));
    app.get('/html', (c) => c.html('<h1>Hello HTML</h1>'));

    const resText = await app.fetch(new Request('http://localhost/text'));
    assert.equal(resText.status, 200);
    assert.equal(resText.headers.get('content-type'), 'text/plain; charset=utf-8');
    assert.equal(await resText.text(), 'Hello plain world');

    const resHtml = await app.fetch(new Request('http://localhost/html'));
    assert.equal(resHtml.status, 200);
    assert.equal(resHtml.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.equal(await resHtml.text(), '<h1>Hello HTML</h1>');
  });

  it('should parse query parameters lazily and accurately', async () => {
    const app = new Froot();
    app.get('/search', (c) => {
      const q = c.req.query('q');
      const page = c.req.query('page');
      const all = c.req.query();
      return c.json({ q, page, all });
    });

    const res = await app.fetch(
      new Request('http://localhost/search?q=typescript&page=2&sort=asc')
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.q, 'typescript');
    assert.equal(body.page, '2');
    assert.deepEqual(body.all, {
      q: 'typescript',
      page: '2',
      sort: 'asc'
    });
  });

  it('should get and set headers correctly', async () => {
    const app = new Froot();
    app.get('/headers', (c) => {
      const incomingAuth = c.header('authorization');
      c.header('x-response-time', '12ms');
      c.header('x-powered-by', 'Froot');
      return c.json({ auth: incomingAuth });
    });

    const res = await app.fetch(
      new Request('http://localhost/headers', {
        headers: { authorization: 'Bearer token123' }
      })
    );
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('x-response-time'), '12ms');
    assert.equal(res.headers.get('x-powered-by'), 'Froot');
    const body = await res.json();
    assert.equal(body.auth, 'Bearer token123');
  });

  it('should store and retrieve type-safe request state via set/get', async () => {
    const app = new Froot<{
      Variables: {
        userId: string;
        roles: string[];
      };
    }>();

    app.use('*', async (c, next) => {
      c.set('userId', 'user_777');
      c.set('roles', ['admin', 'developer']);
      await next();
    });

    app.get('/me', (c) => {
      const userId = c.get('userId');
      const roles = c.get('roles');
      return c.json({ userId, roles });
    });

    const res = await app.fetch(new Request('http://localhost/me'));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, {
      userId: 'user_777',
      roles: ['admin', 'developer']
    });
  });

  it('should parse JSON request bodies accurately', async () => {
    const app = new Froot();
    app.post('/api/echo', async (c) => {
      const payload = await c.req.json<{ name: string; count: number }>();
      return c.json({ received: payload });
    });

    const res = await app.fetch(
      new Request('http://localhost/api/echo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Froot', count: 42 })
      })
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, {
      received: { name: 'Froot', count: 42 }
    });
  });

  it('should support status method chaining', async () => {
    const app = new Froot();
    app.get('/no-content', (c) => {
      c.status(204);
      return c.text('');
    });

    const res = await app.fetch(new Request('http://localhost/no-content'));
    assert.equal(res.status, 204);
  });

  it('should support redirect with default 302 and custom status code', async () => {
    const app = new Froot();
    app.get('/old-path', (c) => c.redirect('/new-path'));
    app.get('/permanent', (c) => c.redirect('https://example.com/dest', 301));
    app.get('/see-other', (c) => c.redirect('/other', 303));

    const res1 = await app.fetch(new Request('http://localhost/old-path'));
    assert.equal(res1.status, 302);
    assert.equal(res1.headers.get('location'), '/new-path');

    const res2 = await app.fetch(new Request('http://localhost/permanent'));
    assert.equal(res2.status, 301);
    assert.equal(res2.headers.get('location'), 'https://example.com/dest');

    const res3 = await app.fetch(new Request('http://localhost/see-other'));
    assert.equal(res3.status, 303);
    assert.equal(res3.headers.get('location'), '/other');
  });

  it('should parse incoming request cookies lazily and accurately', async () => {
    const app = new Froot();
    app.get('/cookies', (c) => {
      const session = c.req.cookie('session');
      const theme = c.req.cookie('theme');
      const missing = c.req.cookie('missing');
      const all = c.req.cookie();
      return c.json({ session, theme, missing, all });
    });

    // 1. With multiple cookies including encoded and quoted values
    const reqWithCookies = new Request('http://localhost/cookies', {
      headers: {
        cookie: 'session=xyz789; theme=dark; encoded=%7B%22ok%22%3Atrue%7D; quoted="spaced value"'
      }
    });

    const res1 = await app.fetch(reqWithCookies);
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.session, 'xyz789');
    assert.equal(body1.theme, 'dark');
    assert.equal(body1.missing, undefined);
    assert.deepEqual(body1.all, {
      session: 'xyz789',
      theme: 'dark',
      encoded: '{"ok":true}',
      quoted: 'spaced value'
    });

    // 2. Without cookie header
    const reqNoCookies = new Request('http://localhost/cookies');
    const res2 = await app.fetch(reqNoCookies);
    const body2 = await res2.json();
    assert.equal(body2.session, undefined);
    assert.deepEqual(body2.all, {});
  });

  it('should set and delete response cookies with RFC 6265 attributes', async () => {
    const app = new Froot();

    app.get('/set-cookies', (c) => {
      c.cookie('session', 'secret_token_123', {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        maxAge: 3600,
        path: '/api'
      });
      c.cookie('theme', 'dim', {
        sameSite: 'Lax',
        domain: 'example.com'
      });
      return c.json({ ok: true });
    });

    app.get('/delete-cookie', (c) => {
      c.deleteCookie('session', { path: '/api' });
      return c.text('deleted');
    });

    // Test 1: Set multiple cookies
    const res1 = await app.fetch(new Request('http://localhost/set-cookies'));
    assert.equal(res1.status, 200);

    // Verify Set-Cookie headers using getSetCookie if available, or get
    const setCookieHeaders = typeof (res1.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function'
      ? (res1.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : [res1.headers.get('set-cookie') || ''];

    const setCookieJoined = setCookieHeaders.join('; ');
    assert.match(setCookieJoined, /session=secret_token_123/);
    assert.match(setCookieJoined, /HttpOnly/);
    assert.match(setCookieJoined, /Secure/);
    assert.match(setCookieJoined, /SameSite=Strict/);
    assert.match(setCookieJoined, /Max-Age=3600/);
    assert.match(setCookieJoined, /Path=\/api/);

    assert.match(setCookieJoined, /theme=dim/);
    assert.match(setCookieJoined, /Domain=example.com/);
    assert.match(setCookieJoined, /SameSite=Lax/);

    // Test 2: Delete cookie
    const res2 = await app.fetch(new Request('http://localhost/delete-cookie'));
    assert.equal(res2.status, 200);
    const delCookieHeader = res2.headers.get('set-cookie') || '';
    assert.match(delCookieHeader, /session=/);
    assert.match(delCookieHeader, /Max-Age=0/);
    assert.match(delCookieHeader, /Expires=Thu, 01 Jan 1970/);
  });

  it('should sign and verify HMAC-SHA256 signed cookies and detect tampering', async () => {
    const SECRET = 'froot-cryptographic-master-key-2026';
    const app = new Froot();

    app.get('/login', async (c) => {
      await c.setSignedCookie('auth_user', 'admin_user_99', SECRET, {
        httpOnly: true,
        secure: true
      });
      return c.json({ loggedIn: true });
    });

    app.get('/verify', async (c) => {
      const verified = await c.getSignedCookie('auth_user', SECRET);
      const wrongSecret = await c.getSignedCookie('auth_user', 'wrong-secret');
      return c.json({ verified, wrongSecret });
    });

    // 1. Issue signed cookie
    const loginRes = await app.fetch(new Request('http://localhost/login'));
    assert.equal(loginRes.status, 200);

    const setCookie = loginRes.headers.get('set-cookie') || '';
    assert.match(setCookie, /auth_user=admin_user_99\./);

    // Extract raw signed value: "admin_user_99.<base64Sig>"
    const cookieValMatch = setCookie.match(/auth_user=([^;]+)/);
    assert.ok(cookieValMatch && cookieValMatch[1]);
    const validCookieStr = cookieValMatch[1];

    // 2. Verify legitimate signed cookie
    const validReq = new Request('http://localhost/verify', {
      headers: { cookie: `auth_user=${validCookieStr}` }
    });
    const verifyRes1 = await app.fetch(validReq);
    const body1 = await verifyRes1.json();
    assert.equal(body1.verified, 'admin_user_99');
    assert.equal(body1.wrongSecret, false); // Wrong secret fails verification

    // 3. Verify tampered value (attacker alters 'admin_user_99' to 'admin_user_01')
    const lastDot = validCookieStr.lastIndexOf('.');
    const signatureOnly = validCookieStr.slice(lastDot + 1);
    const tamperedPayload = `admin_user_01.${signatureOnly}`;

    const tamperedReq = new Request('http://localhost/verify', {
      headers: { cookie: `auth_user=${tamperedPayload}` }
    });
    const verifyRes2 = await app.fetch(tamperedReq);
    const body2 = await verifyRes2.json();
    assert.equal(body2.verified, false); // Tampered cookie rejected!

    // 4. Missing signed cookie
    const missingReq = new Request('http://localhost/verify');
    const verifyRes3 = await app.fetch(missingReq);
    const body3 = await verifyRes3.json();
    assert.equal(body3.verified, undefined);
  });
});

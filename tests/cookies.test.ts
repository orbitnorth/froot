import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Froot } from 'frootjs';

describe('Cookies & Context Ergonomics Integration Suite', () => {
  const SECRET_KEY = 'super-secret-production-encryption-key';

  it('should handle complex cookie lifecycles and multiple cookies simultaneously', async () => {
    const app = new Froot();

    app.get('/session/init', (c) => {
      c.cookie('theme', 'nord', { path: '/', sameSite: 'Lax' });
      c.cookie('analytics_id', 'a_998877', { path: '/', maxAge: 86400 * 30 });
      c.cookie('temp_token', 'temp_val', { path: '/temp', httpOnly: true });
      return c.json({ status: 'initialized' });
    });

    app.get('/session/read', (c) => {
      const theme = c.req.cookie('theme');
      const analyticsId = c.req.cookie('analytics_id');
      const tempToken = c.req.cookie('temp_token');
      const all = c.req.cookie();
      return c.json({ theme, analyticsId, tempToken, all });
    });

    // 1. Initialize cookies
    const initRes = await app.fetch(new Request('http://localhost/session/init'));
    assert.equal(initRes.status, 200);

    const cookies = typeof (initRes.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function'
      ? (initRes.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
      : [initRes.headers.get('set-cookie') || ''];

    const joined = cookies.join('; ');
    assert.match(joined, /theme=nord/);
    assert.match(joined, /analytics_id=a_998877/);
    assert.match(joined, /temp_token=temp_val/);

    // 2. Transmit all cookies back to server
    const readReq = new Request('http://localhost/session/read', {
      headers: {
        cookie: 'theme=nord; analytics_id=a_998877; temp_token=temp_val'
      }
    });
    const readRes = await app.fetch(readReq);
    const readBody = await readRes.json();
    assert.equal(readBody.theme, 'nord');
    assert.equal(readBody.analyticsId, 'a_998877');
    assert.equal(readBody.tempToken, 'temp_val');
    assert.equal(Object.keys(readBody.all).length, 3);
  });

  it('should support signed cookies in realistic authentication workflow', async () => {
    const app = new Froot();

    // Login endpoint sets signed auth session
    app.post('/auth/login', async (c) => {
      await c.setSignedCookie('user_session', 'usr_8492019', SECRET_KEY, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        path: '/'
      });
      return c.json({ success: true });
    });

    // Protected endpoint verifies signed auth session
    app.get('/auth/me', async (c) => {
      const user = await c.getSignedCookie('user_session', SECRET_KEY);
      if (!user) {
        return c.json({ error: 'Unauthorized or tampered session' }, 401);
      }
      return c.json({ user, role: 'authenticated' });
    });

    // Logout endpoint deletes session cookie
    app.post('/auth/logout', (c) => {
      c.deleteCookie('user_session', { path: '/' });
      return c.json({ success: true });
    });

    // 1. Perform login
    const loginRes = await app.fetch(new Request('http://localhost/auth/login', { method: 'POST' }));
    assert.equal(loginRes.status, 200);
    const setCookie = loginRes.headers.get('set-cookie') || '';
    assert.match(setCookie, /user_session=usr_8492019\./);

    const match = setCookie.match(/user_session=([^;]+)/);
    assert.ok(match && match[1]);
    const signedCookieValue = match[1];

    // 2. Access protected route with valid cookie
    const authReq = new Request('http://localhost/auth/me', {
      headers: { cookie: `user_session=${signedCookieValue}` }
    });
    const authRes = await app.fetch(authReq);
    assert.equal(authRes.status, 200);
    const authBody = await authRes.json();
    assert.equal(authBody.user, 'usr_8492019');

    // 3. Attempt access with tampered user ID
    const lastDot = signedCookieValue.lastIndexOf('.');
    const sig = signedCookieValue.slice(lastDot + 1);
    const forgedCookie = `usr_9999999.${sig}`;

    const forgedReq = new Request('http://localhost/auth/me', {
      headers: { cookie: `user_session=${forgedCookie}` }
    });
    const forgedRes = await app.fetch(forgedReq);
    assert.equal(forgedRes.status, 401);

    // 4. Logout
    const logoutRes = await app.fetch(new Request('http://localhost/auth/logout', { method: 'POST' }));
    assert.equal(logoutRes.status, 200);
    const logoutCookie = logoutRes.headers.get('set-cookie') || '';
    assert.match(logoutCookie, /user_session=/);
    assert.match(logoutCookie, /Max-Age=0/);
  });

  it('should deliver Set-Cookie headers accurately over real Node.js HTTP TCP socket', async () => {
    const app = new Froot();

    app.get('/tcp-test', (c) => {
      c.cookie('tcp_a', 'val_a', { path: '/' });
      c.cookie('tcp_b', 'val_b', { httpOnly: true });
      return c.text('OK');
    });

    const server = await new Promise<import('node:http').Server>((resolve) => {
      const s = app.listen(0, () => resolve(s));
    });
    const address = server.address() as { port: number };
    const port = address.port;

    try {
      const res = await fetch(`http://127.0.0.1:${port}/tcp-test`);
      assert.equal(res.status, 200);
      assert.equal(await res.text(), 'OK');

      const setCookies = typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === 'function'
        ? (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
        : [res.headers.get('set-cookie') || ''];

      const joined = setCookies.join('; ');
      assert.match(joined, /tcp_a=val_a/);
      assert.match(joined, /tcp_b=val_b/);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});

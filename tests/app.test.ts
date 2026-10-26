import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Froot, HTTPException } from 'froot';

describe('Application Core & Onion Middleware', () => {
  it('should execute middleware in strict onion order', async () => {
    const app = new Froot();
    const order: string[] = [];

    app.use('*', async (_c, next) => {
      order.push('m1-enter');
      await next();
      order.push('m1-exit');
    });

    app.use('*', async (_c, next) => {
      order.push('m2-enter');
      await next();
      order.push('m2-exit');
    });

    app.get('/test', (c) => {
      order.push('handler');
      return c.text('done');
    });

    const res = await app.fetch(new Request('http://localhost/test'));
    assert.equal(res.status, 200);
    assert.equal(await res.text(), 'done');
    assert.deepEqual(order, [
      'm1-enter',
      'm2-enter',
      'handler',
      'm2-exit',
      'm1-exit'
    ]);
  });

  it('should short-circuit pipeline when middleware returns without calling next()', async () => {
    const app = new Froot();
    let handlerReached = false;

    app.use('/protected/*', async (c, _next) => {
      // Reject request without calling next()
      return c.json({ error: 'Unauthorized' }, 401);
    });

    app.get('/protected/secret', (c) => {
      handlerReached = true;
      return c.text('secret-data');
    });

    const res = await app.fetch(new Request('http://localhost/protected/secret'));
    assert.equal(res.status, 401);
    assert.equal(handlerReached, false);
    const body = await res.json();
    assert.deepEqual(body, { error: 'Unauthorized' });
  });

  it('should support sub-application mounting via app.route()', async () => {
    const mainApp = new Froot();
    const apiApp = new Froot();
    const usersApp = new Froot();

    usersApp.get('/:id', (c) => {
      return c.json({ userId: c.req.param('id') });
    });

    apiApp.route('/users', usersApp);
    mainApp.route('/api/v1', apiApp);

    const res = await mainApp.fetch(new Request('http://localhost/api/v1/users/user_999'));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { userId: 'user_999' });
  });

  it('should handle HTTPException with proper status code and RFC 9457 body', async () => {
    const app = new Froot();

    app.get('/forbidden', () => {
      throw new HTTPException(403, 'Access denied to this resource');
    });

    const res = await app.fetch(new Request('http://localhost/forbidden'));
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.status, 403);
    assert.equal(body.detail, 'Access denied to this resource');
  });

  it('should support custom onError handler', async () => {
    const app = new Froot();

    app.onError((err, c) => {
      return c.json({
        handled: true,
        message: err.message,
        customCode: 'ERR_CUSTOM'
      }, 500);
    });

    app.get('/crash', () => {
      throw new Error('Database connection failed');
    });

    const res = await app.fetch(new Request('http://localhost/crash'));
    assert.equal(res.status, 500);
    const body = await res.json();
    assert.deepEqual(body, {
      handled: true,
      message: 'Database connection failed',
      customCode: 'ERR_CUSTOM'
    });
  });

  it('should support custom onNotFound handler', async () => {
    const app = new Froot();

    app.onNotFound((c) => {
      return c.json({
        customNotFound: true,
        path: c.req.path
      }, 404);
    });

    const res = await app.fetch(new Request('http://localhost/unknown-route'));
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.deepEqual(body, {
      customNotFound: true,
      path: '/unknown-route'
    });
  });
});

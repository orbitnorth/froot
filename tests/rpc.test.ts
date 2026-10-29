import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Froot } from 'frootjs';
import { createFrootClient } from 'frootjs/client';

describe('Type-Safe RPC Client', () => {
  it('should perform in-memory RPC calls directly through app.fetch', async () => {
    const app = new Froot();
    app.get('/api/users/:id', (c) => {
      const id = c.req.param('id');
      const sort = c.req.query('sort') || 'asc';
      return c.json({ id, name: 'Alice', sort });
    });

    app.post('/api/users', async (c) => {
      const body = await c.req.json<{ name: string; role: string }>();
      return c.json({ created: true, user: body }, 201);
    });

    // In-memory RPC client backed by app.fetch
    const client = createFrootClient<typeof app>({
      baseUrl: 'http://localhost',
      fetch: (input: string | URL | Request, init?: RequestInit) => {
        const req = input instanceof Request ? input : new Request(input, init);
        return app.fetch(req);
      }
    });

    // 1. GET with param and query
    const resGet = await client.api.users[':id'].get({
      param: { id: 'usr_888' },
      query: { sort: 'desc' }
    });

    assert.equal(resGet.status, 200);
    const user = await resGet.json<{ id: string; name: string; sort: string }>();
    assert.deepEqual(user, {
      id: 'usr_888',
      name: 'Alice',
      sort: 'desc'
    });

    // 2. POST with JSON body
    const resPost = await client.api.users.post({
      json: { name: 'Bob', role: 'admin' }
    });

    assert.equal(resPost.status, 201);
    const created = await resPost.json<{ created: boolean; user: { name: string; role: string } }>();
    assert.deepEqual(created, {
      created: true,
      user: { name: 'Bob', role: 'admin' }
    });
  });

  it('should forward custom headers and authentication tokens', async () => {
    const app = new Froot();
    app.get('/protected', (c) => {
      const auth = c.header('authorization');
      return c.json({ authorized: auth === 'Bearer secret_token' });
    });

    const client = createFrootClient<typeof app>({
      baseUrl: 'http://localhost',
      headers: {
        authorization: 'Bearer secret_token'
      },
      fetch: (input: string | URL | Request, init?: RequestInit) => {
        const req = input instanceof Request ? input : new Request(input, init);
        return app.fetch(req);
      }
    });

    const res = await client.protected.get();
    assert.equal(res.status, 200);
    const body = await res.json<{ authorized: boolean }>();
    assert.deepEqual(body, { authorized: true });
  });
});

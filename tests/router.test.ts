import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Froot } from 'frootjs';

describe('Smart Router & Route Matching', () => {
  it('should match Tier 1 static routes with exact O(1) speed', async () => {
    const app = new Froot();
    app.get('/health', (c) => c.json({ status: 'ok' }));
    app.get('/api/v1/ping', (c) => c.text('pong'));

    const res1 = await app.fetch(new Request('http://localhost/health'));
    assert.equal(res1.status, 200);
    const json1 = await res1.json();
    assert.deepEqual(json1, { status: 'ok' });

    const res2 = await app.fetch(new Request('http://localhost/api/v1/ping'));
    assert.equal(res2.status, 200);
    assert.equal(await res2.text(), 'pong');
  });

  it('should match Tier 2 dynamic single parameter routes', async () => {
    const app = new Froot();
    app.get('/users/:id', (c) => {
      return c.json({ userId: c.req.param('id') });
    });

    const res = await app.fetch(new Request('http://localhost/users/usr_12345'));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { userId: 'usr_12345' });
  });

  it('should match Tier 2 dynamic multi-parameter routes', async () => {
    const app = new Froot();
    app.get('/orgs/:orgId/projects/:projectId/teams/:teamId', (c) => {
      return c.json({
        org: c.req.param('orgId'),
        project: c.req.param('projectId'),
        team: c.req.param('teamId')
      });
    });

    const res = await app.fetch(
      new Request('http://localhost/orgs/meta/projects/froot/teams/core')
    );
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, {
      org: 'meta',
      project: 'froot',
      team: 'core'
    });
  });

  it('should discriminate HTTP methods correctly', async () => {
    const app = new Froot();
    app.get('/resource', (c) => c.text('GET'));
    app.post('/resource', (c) => c.text('POST'));
    app.put('/resource', (c) => c.text('PUT'));
    app.delete('/resource', (c) => c.text('DELETE'));
    app.patch('/resource', (c) => c.text('PATCH'));

    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;
    for (const method of methods) {
      const res = await app.fetch(new Request('http://localhost/resource', { method }));
      assert.equal(res.status, 200);
      assert.equal(await res.text(), method);
    }
  });

  it('should match Tier 3 wildcard routes', async () => {
    const app = new Froot();
    app.get('/files/*', (c) => {
      return c.json({ matched: true, path: c.req.path });
    });

    const res = await app.fetch(new Request('http://localhost/files/docs/2026/report.pdf'));
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { matched: true, path: '/files/docs/2026/report.pdf' });
  });

  it('should respect route precedence (static > parameterized > wildcard)', async () => {
    const app = new Froot();
    app.get('/items/special', (c) => c.text('static-tier1'));
    app.get('/items/:id', (c) => c.text(`param-${c.req.param('id')}`));
    app.get('/items/*', (c) => c.text('wildcard-tier3'));

    // Exact static should match static route
    const resStatic = await app.fetch(new Request('http://localhost/items/special'));
    assert.equal(await resStatic.text(), 'static-tier1');

    // Dynamic param should match param route
    const resParam = await app.fetch(new Request('http://localhost/items/42'));
    assert.equal(await resParam.text(), 'param-42');
  });

  it('should return 404 for unhandled routes', async () => {
    const app = new Froot();
    app.get('/exists', (c) => c.text('found'));

    const res = await app.fetch(new Request('http://localhost/does-not-exist'));
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.title, 'Not Found');
  });
});

/**
 * Type-safe RPC Client demonstration with Froot.
 */

import { Froot, createFrootClient } from '../dist/index.js';

// Define Server Application
const app = new Froot();

app.get('/api/users/:userId', (c) => {
  const userId = c.param('userId');
  return c.json({
    id: userId,
    name: 'Alice Developer',
    role: 'Staff Engineer',
    verified: true
  });
});

app.post('/api/users', async (c) => {
  const body = await c.req.json<{ name: string; email: string }>();
  return c.json(
    {
      success: true,
      user: { id: 'usr_new_123', ...body }
    },
    201
  );
});

// Mock client using in-memory app.fetch
export type App = typeof app;

const client = createFrootClient<App>({
  baseUrl: 'http://localhost:3000',
  fetch: (input: string | URL | Request, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(input, init);
    return app.fetch(req);
  }
});

async function run() {
  console.log('--- Testing Froot Type-Safe RPC Client ---');

  // 1. GET /api/users/:userId with param object
  const userRes = await client.api.users[':userId'].get({
    param: { userId: 'usr_42' }
  });
  console.log('RPC GET User Status:', userRes.status);
  console.log('RPC GET User Data:', await userRes.json());

  // 2. POST /api/users with JSON body
  const createRes = await client.api.users.post({
    json: { name: 'Bob Smith', email: 'bob@example.com' }
  });
  console.log('RPC POST User Status:', createRes.status);
  console.log('RPC POST User Data:', await createRes.json());
}

run().catch(console.error);

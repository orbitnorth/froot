/**
 * Basic routing, lazy query, and parameters example with Froot.
 */

import { Froot } from '../dist/index.js';

const app = new Froot();

// Global Logger and CORS
app.use(async (c, next) => {
  const start = performance.now();
  await next();
  const dur = (performance.now() - start).toFixed(2);
  console.log(`[${c.req.method}] ${c.req.path} -> ${c.statusCode} (${dur}ms)`);
});

// Exact Static Route (Tier 1: O(1) Map Fast Path)
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// Dynamic Route with Strictly Typed Params (Tier 2: Compiled Single-Pass RegExp)
app.get('/api/users/:userId/posts/:postId', (c) => {
  // c.param('userId') is inferred from route template!
  const userId = c.param('userId');
  const postId = c.param('postId');
  const sort = c.query('sort') || 'asc';

  return c.json({
    userId,
    postId,
    sort,
    message: `Fetched post ${postId} for user ${userId}`
  });
});

// Sub-app prefix mounting
const adminApp = new Froot();
adminApp.get('/dashboard', (c) => {
  return c.json({ section: 'admin-dashboard', authorized: true });
});
app.route('/admin', adminApp);

// Test via Web Standards fetch API directly
async function run() {
  console.log('--- Testing Froot In-Memory Fetch Pipeline ---');

  // 1. Test Static Route
  const res1 = await app.fetch(new Request('http://localhost:3000/api/health'));
  console.log('1. Health check response:', await res1.json());

  // 2. Test Parameterized Route
  const res2 = await app.fetch(
    new Request('http://localhost:3000/api/users/user_99/posts/post_456?sort=desc')
  );
  console.log('2. User post response:', await res2.json());

  // 3. Test Sub-router
  const res3 = await app.fetch(new Request('http://localhost:3000/admin/dashboard'));
  console.log('3. Admin sub-app response:', await res3.json());

  // 4. Test 404
  const res4 = await app.fetch(new Request('http://localhost:3000/non-existent'));
  console.log('4. 404 response:', res4.status, await res4.json());
}

run().catch(console.error);

/**
 * Bun runtime example with Froot.
 * Bun natively supports Web standard Fetch API via `Bun.serve(app)` or `export default app`.
 */

import { Froot } from '../src/index.js';
import { getRuntime } from '../src/utils/runtime.js';

const app = new Froot();

app.get('/', (c) => {
  return c.json({
    framework: 'Froot',
    runtime: getRuntime(),
    message: 'Ultra-fast execution on Bun runtime'
  });
});

app.get('/api/users/:id', (c) => {
  const userId = c.req.param('id');
  return c.json({
    userId,
    status: 'active',
    query: c.req.query()
  });
});

// To run directly with Bun CLI:
// `bun run examples/bun-server.ts`
// Bun natively recognizes `export default app` or `export default { fetch: app.fetch }`
export default app;

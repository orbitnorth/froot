/**
 * Cloudflare Workers example using Froot.
 * Demonstrates typed environment bindings (KV, Secrets, D1),
 * background task processing with c.waitUntil(), and native worker export.
 */

import { Froot } from '../src/index.js';

// Define Cloudflare Workers environment bindings and request context variables
interface CloudflareEnv {
  Bindings: {
    API_KEY: string;
    ENVIRONMENT: 'production' | 'staging' | 'development';
    USERS_KV?: {
      get(key: string): Promise<string | null>;
      put(key: string, value: string): Promise<void>;
    };
  };
  Variables: {
    requestId: string;
  };
}

const app = new Froot<CloudflareEnv>();

// Middleware setting contextual request ID
app.use('*', async (c, next) => {
  const reqId = c.header('cf-ray') || crypto.randomUUID();
  c.set('requestId', reqId);
  c.header('x-request-id', reqId);
  await next();
});

// Accessing Cloudflare typed bindings and environment
app.get('/env-info', (c) => {
  return c.json({
    status: 'online',
    runtime: 'Cloudflare Workers (workerd)',
    environment: c.env.ENVIRONMENT,
    requestId: c.get('requestId')
  });
});

// Non-blocking background telemetry with c.waitUntil()
app.post('/analytics', async (c) => {
  const body = await c.req.json<{ event: string }>();

  // Schedule background processing without delaying the HTTP response
  c.waitUntil(
    (async () => {
      // Simulated asynchronous analytics write to KV / external service
      if (c.env.USERS_KV) {
        await c.env.USERS_KV.put(`event:${Date.now()}`, JSON.stringify(body));
      }
    })()
  );

  return c.json({ accepted: true, event: body.event }, 202);
});

// Direct export for Cloudflare Workers runtime
// Cloudflare invokes `export default { fetch: app.fetch }` or simply `export default app`
export default app;

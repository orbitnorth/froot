# Lesson 6.2: Cloudflare Workers

Cloudflare Workers (powered by the `workerd` runtime) execute JavaScript directly at the edge across 300+ global data centers.

Because Froot is built natively on the Web Fetch standard, running Froot on Cloudflare Workers requires **zero build adapters or plugins**.

---

## 1. Defining Typed Cloudflare Bindings

Cloudflare Workers pass environment bindings (KV Namespaces, D1 Databases, R2 Buckets, Secrets) and an `ExecutionContext` into every request.

Froot allows you to define these bindings strongly through the `Env` generic:

```typescript
import { Froot } from 'froot';

// 1. Declare your Cloudflare bindings and request variables
interface CloudflareEnv {
  Bindings: {
    API_KEY: string;
    ENVIRONMENT: 'production' | 'staging';
    USERS_KV: KVNamespace;
    DATABASE: D1Database;
  };
  Variables: {
    requestId: string;
  };
}

// 2. Instantiate Froot with the environment type
const app = new Froot<CloudflareEnv>();
```

---

## 2. Accessing Bindings via `c.env`

Inside your route handlers, access your bindings via `c.env`:

```typescript
app.get('/user-profile/:id', async (c) => {
  const userId = c.param('id');

  // c.env.USERS_KV is strongly typed!
  const userJson = await c.env.USERS_KV.get(`user:${userId}`);

  if (!userJson) {
    return c.json({ error: 'User not found' }, 404);
  }

  return c.json({
    environment: c.env.ENVIRONMENT,
    user: JSON.parse(userJson)
  });
});
```

---

## 3. Background Processing with `c.waitUntil()`

In serverless edge runtimes, the execution isolate freezes as soon as the response is returned to the client. If you want to fire asynchronous tasks (e.g. logging analytics, flushing telemetry, updating caches) without delaying the HTTP response, use `c.waitUntil()`:

```typescript
app.post('/events', async (c) => {
  const payload = await c.req.json<{ event: string }>();

  // 1. Schedule background execution
  c.waitUntil(
    (async () => {
      // Writes to database or external logging service in the background
      await c.env.DATABASE.prepare(
        'INSERT INTO analytics (event, timestamp) VALUES (?, ?)'
      ).bind(payload.event, Date.now()).run();
    })()
  );

  // 2. Return HTTP response immediately to user
  return c.json({ accepted: true }, 202);
});
```

---

## 4. Exporting the Worker Entrypoint

Cloudflare Workers expects an object exporting a `fetch` handler or an app instance:

```typescript
// wrangler.toml points to this file
export default app;
```

---

## Next Steps
In the next lesson, we will see how Froot runs with near-zero latency on Bun and Deno.
- Proceed to [Lesson 6.3: Bun & Deno](./03-bun-and-deno.md)

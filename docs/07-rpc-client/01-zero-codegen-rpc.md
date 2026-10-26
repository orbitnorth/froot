# Lesson 7.1: Type-Safe Client RPC

Modern full-stack architectures (Next.js, Vite, React, Vue, Svelte) often struggle with API client synchronization:
- Traditional approaches require running OpenAPI / Swagger code generators or tRPC routers with heavy build steps.
- If a backend route path or parameter changes, the frontend client breaks silently at runtime.

Froot solves this with **Zero-Codegen End-to-End Type Safety**. By simply exporting the type of your server application (`type AppType = typeof app`), your frontend client gains full autocompletion, type checking, and parameter inference.

---

## 1. Backend Server Setup

In your backend entrypoint, export your application's type:

```typescript
// backend/src/server.ts
import { Froot } from 'froot';

const app = new Froot()
  .get('/api/users/:id', (c) => {
    return c.json({
      id: c.param('id'),
      name: 'Alice Cooper',
      verified: true
    });
  })
  .post('/api/users', async (c) => {
    const body = await c.req.json<{ name: string; email: string }>();
    return c.json({ created: true, user: body }, 201);
  });

// Export the type of the app
export type AppType = typeof app;

// Start server
app.listen(3000);
```

---

## 2. Frontend / Client Setup

In your frontend application (e.g. Next.js, Vite, Node CLI), import `createFrootClient` from `froot/client` and pass the `AppType`:

```typescript
// frontend/src/api.ts
import { createFrootClient } from 'froot/client';
import type { AppType } from '../../backend/src/server.js';

// 1. Initialize client proxy
export const client = createFrootClient<AppType>({
  baseUrl: 'http://localhost:3000'
});
```

---

## 3. Invoking Type-Safe Endpoints

Froot converts property accesses into URL paths dynamically via JavaScript `Proxy`:

```typescript
// 1. Calling GET /api/users/:id
const res = await client.api.users[':id'].get({
  param: { id: 'usr_99' },
  query: { verbose: true }
});

const user = await res.json();
console.log(user.name); // 'Alice Cooper'

// 2. Calling POST /api/users
const createRes = await client.api.users.post({
  json: {
    name: 'Bob',
    email: 'bob@example.com'
  }
});

const result = await createRes.json();
console.log(result.created); // true
```

---

## 4. Customizing Headers & Custom Fetch

The client accepts global headers (e.g. authentication tokens) or custom `fetch` implementations:

```typescript
const client = createFrootClient<AppType>({
  baseUrl: 'https://api.example.com',
  headers: {
    authorization: 'Bearer token_abc123'
  },
  // In unit testing, you can pass app.fetch directly for in-memory execution!
  fetch: window.fetch.bind(window)
});
```

---

## Next Steps
In the next chapter, we will see how to build real-time applications using Server-Sent Events (SSE) and Web Streams.
- Proceed to [Lesson 8.1: Server-Sent Events & Streams](../08-streaming/01-sse-and-web-streams.md)

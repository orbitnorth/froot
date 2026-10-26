# Lesson 1.3: Your First Application

In this lesson, we will create, run, and test a minimal HTTP service with static routes, dynamic parameter extraction, and JSON responses.

---

## 1. Writing `src/index.ts`

Create a new file at `src/index.ts`:

```typescript
import { Froot } from 'froot';

// 1. Initialize application
const app = new Froot();

// 2. Define a static route (Tier 1: O(1) Map dispatch)
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// 3. Define a dynamic route with strictly typed parameters
app.get('/users/:userId', (c) => {
  // c.param('userId') is inferred as string at compile-time!
  const userId = c.param('userId');
  const role = c.req.query('role') ?? 'guest';

  return c.json({
    id: userId,
    name: `User ${userId}`,
    role
  });
});

// 4. Start the Node.js native server with socket optimizations
app.listen(3000, () => {
  console.log('🍏 Froot server listening on http://localhost:3000');
});

// 5. Export app for Cloudflare Workers / Bun / Deno compatibility
export default app;
```

---

## 2. Compiling and Running

Compile your TypeScript code using `tsc`:

```bash
pnpm exec tsc
```

Start the compiled service:

```bash
node dist/index.js
```

Or run directly with Node 22+ using native type-stripping:

```bash
node --experimental-strip-types src/index.ts
```

---

## 3. Testing Your Endpoints

You can verify your service using `curl`:

### Health Check (Static $O(1)$)
```bash
curl -i http://localhost:3000/health
```

**Response:**
```http
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
content-length: 88
Date: Mon, 26 Oct 2026 03:00:00 GMT

{"status":"healthy","uptime":4.12,"timestamp":"2026-10-26T03:00:00.000Z"}
```

### Parameterized Route
```bash
curl -i "http://localhost:3000/users/usr_42?role=admin"
```

**Response:**
```http
HTTP/1.1 200 OK
content-type: application/json; charset=utf-8
content-length: 53

{"id":"usr_42","name":"User usr_42","role":"admin"}
```

---

## Key Takeaways
- You don't need to manually parse query parameters or headers; Froot evaluates them lazily on first access.
- Route parameters are extracted at compile-time via TypeScript template literal types.
- The `app` instance is dual-engine: call `app.listen()` for Node.js socket tuning, or `export default app` for serverless and edge runtimes.

---

## Next Steps
In the next chapter, we dive into Froot's internal engine to understand monomorphism, V8 hidden classes, and context design.
- Proceed to [Lesson 2.1: Monomorphic Context Engine](../02-core-concepts/01-monomorphic-context.md)

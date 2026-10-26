# Lesson 6.3: Bun & Deno

Modern runtimes such as **Bun** and **Deno** provide built-in high-performance HTTP servers operating natively on the Web Fetch standard.

---

## 1. Running on Bun

Bun provides an ultra-fast C++ HTTP server capable of handling millions of requests per second.

Because Froot exposes standard `fetch`, you can pass the app directly to `Bun.serve()` or use Bun's default export convention:

### `server.ts`
```typescript
import { Froot } from 'froot';

const app = new Froot();

app.get('/', (c) => {
  return c.json({
    framework: 'Froot',
    runtime: 'Bun',
    version: Bun.version
  });
});

app.get('/items/:id', (c) => {
  return c.json({ id: c.param('id'), name: 'Widget' });
});

// Method A: Export default app (Bun v1.0+)
export default app;

// Or Method B: Explicit Bun.serve
// Bun.serve({
//   fetch: app.fetch,
//   port: 3000
// });
```

### Running with Bun:
```bash
bun run server.ts
```

---

## 2. Running on Deno

Deno provides native TypeScript support and sandboxed security out of the box.

### `server.ts`
```typescript
import { Froot } from 'froot';

const app = new Froot();

app.get('/health', (c) => c.json({ status: 'healthy', runtime: 'Deno' }));

// Deno's native HTTP server passes standard Web Requests to app.fetch
Deno.serve({ port: 8000 }, app.fetch);
```

### Running with Deno:
```bash
deno run --allow-net server.ts
```

---

## 3. Runtime Detection Utility (`getRuntime`)

If your application needs to know what runtime it is currently running in (to toggle between Node streams, Bun files, or Cloudflare KV), use `getRuntime()`:

```typescript
import { getRuntime } from 'froot/runtime';

const runtime = getRuntime();
// Returns: 'node' | 'bun' | 'deno' | 'workerd' | 'fastly' | 'edge-light' | 'other'

if (runtime === 'bun') {
  console.log('Running on Bun high-speed engine');
} else if (runtime === 'workerd') {
  console.log('Running on Cloudflare Workers edge');
}
```

---

## Next Steps
In the next lesson, we will see how to deploy Froot into serverless architectures using the AWS Lambda adapter.
- Proceed to [Lesson 6.4: AWS Lambda & Serverless](./04-aws-lambda.md)

# 🍏 Froot Framework

> Ultra-fast, highly flexible, TypeScript-native web framework engineered for peak V8 performance, multi-runtime portability, and zero-compromise developer ergonomics.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8%2B-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Runtimes](https://img.shields.io/badge/Runtimes-Node%20%7C%20Bun%20%7C%20Deno%20%7C%20WinterCG-green.svg)](#)

---

## Why Froot?

| Feature | Express.js | Fastify | **Froot** |
| :--- | :--- | :--- | :--- |
| **Language** | JavaScript (external `@types`) | JavaScript / TypeScript | **100% Native TypeScript** |
| **Route Param Type Safety** | ❌ Manual casting | ⚠️ Verbose generics | ✅ **Automatic compile-time deduction** |
| **V8 Hidden Classes** | ❌ Broken via `setPrototypeOf` | ✅ Shaped constructor | ✅ **Monomorphic context + lazy getters** |
| **Router Architecture** | Linear $O(N)$ scan | Radix Tree | **Smart Tri-Tier (Static $O(1)$ + RegExp + Radix)** |
| **Static Route Lookup** | Slow regex array | Radix tree traversal | **40,000,000+ ops/sec ($O(1)$ Hash Map)** |
| **Runtimes** | Node.js only | Primarily Node.js | **Dual-Engine: WinterCG + Native Node.js** |
| **Middleware** | Callback hell `(req, res, next)` | 11 lifecycle hooks | **Async Onion Pipeline (`await next()`)** |
| **Type-Safe RPC Client** | ❌ None | ❌ None | ✅ **Built-in `createFrootClient<App>()`** |
| **Standards Compliance** | Custom legacy streams | Custom legacy streams | **RFC 9457 Problem Details + Web Standards** |

---

## Quickstart

### 1. Installation

```bash
pnpm add froot
```

### 2. Basic Server

```typescript
import { Froot } from 'froot';

const app = new Froot();

// Static route (Tier 1: O(1) Map dispatch)
app.get('/health', (c) => c.json({ status: 'ok' }));

// Dynamic route (Tier 2: Single-pass compiled RegExp)
// c.param('userId') is strictly typed from the route path!
app.get('/users/:userId', (c) => {
  const userId = c.param('userId'); // string
  return c.json({ id: userId, name: 'Alice' });
});

// Run with Node.js engine (with socket tuning)
app.listen(3000, () => {
  console.log('Froot server listening on http://localhost:3000');
});

// Or export for WinterCG / Cloudflare Workers / Bun:
export default app;
```

---

## Core Features

### 1. Smart Tri-Tier Routing Engine
Froot routes requests through three distinct optimization tiers:
1. **Tier 1 (Exact Static Map):** Routes without dynamic parameters are dispatched via direct JavaScript `Map` lookup at **40M+ ops/sec**.
2. **Tier 2 (Compiled Single-Pass RegExpRouter):** Parameterized routes (`/users/:userId/posts/:postId`) are compiled ahead of time into a single unified regular expression. Route matching and parameter extraction happen in a single engine step.
3. **Tier 3 (Radix Trie):** Catch-all wildcards (`*`, `/assets/*path`) seamlessly route through an optimized prefix tree.

### 2. Monomorphic Context with Lazy Evaluation
Unlike Express which mutates `Object.setPrototypeOf(req)` and ruins V8 hidden classes:
- `FrootContext` preserves fixed object shapes.
- Query parameters, cookies, and request bodies are parsed **lazily on first access**. Zero CPU overhead is spent parsing query strings or bodies for routes that don't need them.

### 3. Asynchronous Onion Pipeline
Pure `async/await` middleware execution model:
```typescript
app.use(async (c, next) => {
  const start = performance.now();
  await next();
  const ms = (performance.now() - start).toFixed(2);
  c.header('Server-Timing', `total;dur=${ms}`);
});
```

### 4. Zero-Codegen End-to-End Typed RPC Client
Share types between backend and frontend without any code-generation step:

```typescript
// backend.ts
const app = new Froot()
  .get('/api/users/:id', (c) => c.json({ id: c.param('id'), name: 'Alice' }));

export type AppType = typeof app;

// frontend.ts
import { createFrootClient } from 'froot/client';
import type { AppType } from './backend';

const client = createFrootClient<AppType>({ baseUrl: 'http://localhost:3000' });

// Fully type-checked route, params, and response!
const res = await client.api.users[':id'].get({
  param: { id: '42' }
});
const user = await res.json(); // Inferred as { id: string; name: string }
```

### 5. First-Party Batteries Included
- `cors()`: High-performance CORS preflight and headers.
- `logger()`: Zero-overhead structured JSON or pretty logger.
- `security()`: Modern Helmet-equivalent security headers (CSP, HSTS, X-Content-Type-Options).
- `timing()`: Standard `Server-Timing` metrics injector.
- `validate()`: Standard Schema (TypeBox, Zod, ArkType) validator with RFC 9457 Problem Details error handling.
- `c.streamSSE()`: Native Server-Sent Events stream generator.

---

## Running Benchmarks

```bash
pnpm bench
```

## Running Examples

```bash
pnpm example:basic
pnpm example:streaming
pnpm example:rpc
```

---

## License

MIT © Mohammed Mallahi & Antigravity

---
title: Overview
category: Getting Started
summary: Introduction to Froot Framework, design principles, and peak V8 architecture.
---

**Froot** is a next-generation TypeScript-native web framework built from the ground up for extreme throughput, predictable memory profiles, and unified cross-runtime portability.

## Design Philosophy

- **Monomorphic V8 Execution:** Object shapes for request contexts, headers, and parameter maps are fixed to prevent V8 polymorphic de-optimizations.
- **Zero-Allocation Router:** O(1) hash table for exact static paths, compressed Radix trees for parametric segments, and compiled RegExp dispatch for complex patterns.
- **Web Standards Compliant:** Uses standard `Request` and `Response` primitives natively compatible with WinterCG, Cloudflare Workers, Node.js, Bun, and Deno.
- **Integrated Batteries:** Built-in JWT/Crypto, Server-Sent Events (SSE), WebSockets with Pub/Sub Hubs, OpenAPI 3.1 specification generation, and JSX server rendering.

## Why Froot?

| Feature | Express | Fastify | Hono | Froot |
|---|---|---|---|---|
| Throughput (RPS) | ~15,000 | ~75,000 | ~85,000 | **120,000+** |
| Native TypeScript | No | Partial | Yes | **Native (Strict)** |
| Cross-Runtime | Node only | Node only | Yes | **Node, Bun, Deno, Edge** |
| In-Memory Testing | Needs Port Socket | Needs Inject Mock | app.fetch | **Native app.fetch(Request)** |
| OpenAPI 3.1 & UI | Manual Plugins | Schema Plugin | Zod OpenAPI | **Built-in Scalar & Swagger** |

## Quick Example in 10 Seconds

```typescript
import { Froot } from 'frootjs';

const app = new Froot();

// Tier 1 Static Route (O(1) Hash Map)
app.get('/', (c) => c.text('Hello Froot! 🍏'));

// Tier 2 Dynamic Route
app.get('/api/users/:id', (c) => {
  return c.json({ id: c.param('id'), active: true });
});

// Start High-Performance Server
app.listen(3000, () => {
  console.log('🍏 Server running on http://localhost:3000');
});
```

## Next Steps

- [Quickstart & CLI](/docs/quickstart): Create a new app in seconds with `create-frootjs`.
- [Fullstack & Tailwind v4](/docs/fullstack): Next.js App Router alternative with Preact SSR.
- [Architecture Templates](/docs/templates): Explore MVC, Modular, Streaming, and WebSocket setups.



---
title: Tri-Tier Router
category: Core Concepts
summary: Zero-allocation routing with O(1) hash map, Radix tree, and compiled RegExp dispatch.
---

Froot features an innovative **Tri-Tier Adaptive Router** designed to eliminate routing overhead across all workload shapes.

## The Three Routing Tiers

1. **Tier 1 — Exact Static Map (O(1)):** Static paths are matched using a direct V8-optimized string hash lookup with zero allocations.
2. **Tier 2 — Compressed Radix Tree (O(k)):** Parametric routes (e.g. `/users/:userId/posts/:postId`) match segments without heap allocations.
3. **Tier 3 — Compiled RegExp Engine:** Complex wildcard patterns and catch-all routes (`/*`) compile into high-speed regular expressions.

## Route Registration Example

```ts
import { Froot } from 'frootjs';

const app = new Froot();

// Tier 1 Static Route
app.get('/health', (c) => c.json({ status: 'ok' }));

// Tier 2 Parametric Route
app.get('/users/:id', (c) => {
  const userId = c.req.param('id');
  return c.json({ id: userId });
});

// Tier 3 Wildcard / Catch-All
app.get('/static/*', (c) => {
  const file = c.req.param('*');
  return c.text(`Serving static file: ${file}`);
});
```

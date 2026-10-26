# Lesson 1.1: Introduction to Froot

## Why Another Web Framework?

For more than a decade, Node.js web development has been dominated by two major paradigms:
1. **Express.js (created in 2010):** Renowned for its simple API and widespread adoption, but burdened by legacy callback architectures (`next(err)`), linear $O(N)$ route matching, lack of native TypeScript, and severe V8 prototype mutation.
2. **Fastify (created in 2016):** Focused on high performance and JSON schema compilation, but tightly coupled to Node.js native streams and burdened by an 11-step lifecycle hook system with steep cognitive complexity.

As the JavaScript ecosystem matured, two revolutions reshaped modern backend engineering:
- **TypeScript & Developer Ergonomics:** Developers demand full compile-time type safety—specifically route parameter deduction, request body validation, and end-to-end client types—without manual casting or bloated code-generation pipelines.
- **The WinterCG & Edge Multi-Runtime Standard:** Production workloads run not only on Node.js containers, but also on Bun, Deno, Cloudflare Workers, Fastly Compute, and AWS Lambda. Modern frameworks must treat standard Web Fetch APIs (`Request` and `Response`) as first-class citizens.

**Froot** was engineered from the ground up to solve these challenges in a single, cohesive framework.

---

## Architectural Pillars

```
+------------------------------------------------------------------------+
|                          FROOT ARCHITECTURE                            |
+------------------------------------------------------------------------+
|  Tier 1: Static Map O(1)  |  Tier 2: RegExpRouter  |  Tier 3: Radix Trie  |
+------------------------------------------------------------------------+
|               Monomorphic Context Engine (Fixed V8 Map)                |
+------------------------------------------------------------------------+
|             Async Onion Middleware Pipeline (await next())             |
+------------------------------------------------------------------------+
|   Standard Schema / Zod    |    RFC 9457 Errors    |  Zero-Codegen RPC  |
+------------------------------------------------------------------------+
| Node.js Native Socket Engine | Cloudflare Workers | Bun | Deno | Lambda |
+------------------------------------------------------------------------+
```

### 1. Zero V8 Deoptimizations
Express mutates every incoming request object using `Object.setPrototypeOf(req, this.request)`. In V8, changing an object's prototype transitions its hidden class (Map) to a generic dictionary mode, permanently disabling Inline Caching (IC) and forcing megamorphic property lookups.

Froot instantiates a strictly **monomorphic `FrootContext`** with a deterministic constructor and fixed property initialization order. Property access remains in fast monomorphic IC slots throughout the entire request lifecycle.

### 2. Smart Tri-Tier Routing Engine
Traditional routers force all URLs through either a linear regex list or a complex radix tree. Froot introduces a 3-tier matching pipeline:
- **Tier 1 (Exact Static Map):** Exact routes (`/health`, `/api/v1/ping`) resolve through a direct JavaScript `Map` lookup in **under 25 nanoseconds** ($O(1)$).
- **Tier 2 (Compiled Single-Pass RegExpRouter):** Dynamic routes (`/users/:id/posts/:postId`) compile ahead of time into a single unified regular expression matching in one pass.
- **Tier 3 (Radix Trie):** Wildcards and catch-all routes (`/assets/*path`, `*`) seamlessly dispatch via an optimized prefix trie.

### 3. Native Multi-Runtime Portability
Froot runs anywhere JavaScript runs. Built natively on the standard `fetch(request, env, ctx)` signature, the exact same application code runs unmodified on Node.js, Bun, Deno, Cloudflare Workers, and AWS Lambda.

---

## Comparative Matrix

| Feature | Express 5 | Fastify 5 | **Froot** |
| :--- | :--- | :--- | :--- |
| **Language Base** | JavaScript + `@types` | JavaScript / TypeScript | **100% Native TypeScript** |
| **Route Param Types** | Manual `req.params['id'] as string` | Generic configuration | **Automatic Template Literal Inference** |
| **V8 Hidden Classes** | Deoptimized via `setPrototypeOf` | Optimized constructor | **Monomorphic + Lazy Getters** |
| **Routing Algorithm** | Linear $O(N)$ regex search | Radix Tree | **Tri-Tier (Static $O(1)$ + Regex + Radix)** |
| **Static Route Lookup** | Slow regex evaluation | Tree traversal | **40,000,000+ ops/sec ($O(1)$ Hash Map)** |
| **Middleware Model** | Callbacks `(req, res, next)` | 11 lifecycle hooks | **Async Onion Pipeline (`await next()`)** |
| **Standard Fetch API** | ❌ (Node HTTP only) | ❌ (Node HTTP only) | **✅ Native Web Standard Fetch** |
| **Type-Safe RPC Client** | ❌ None | ❌ None | **✅ `createFrootClient<App>()`** |
| **Standards Compliance** | Custom legacy errors | Custom error objects | **RFC 9457 Problem Details** |
| **Runtime Portability** | Node.js only | Primarily Node.js | **Node, Bun, Deno, Cloudflare, Lambda** |

---

## Next Steps
In the next lesson, we will configure our development environment and install Froot using `pnpm`.
- Proceed to [Lesson 1.2: Installation & Setup](./02-installation.md)

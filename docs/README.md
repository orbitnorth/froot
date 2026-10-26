# 🍏 Froot Framework Documentation

Welcome to the comprehensive official guide for **Froot**, the ultra-fast, monomorphic, multi-runtime TypeScript web framework.

---

## 📚 Table of Contents & Curriculum

### [Chapter 1: Getting Started](./01-getting-started/01-introduction.md)
1. [01. Introduction to Froot](./01-getting-started/01-introduction.md) — Motivation, architectural philosophy, and comparison with Express & Fastify.
2. [02. Installation & Setup](./01-getting-started/02-installation.md) — Package managers (`pnpm`), TypeScript configuration, and runtime requirements.
3. [03. Your First Application](./01-getting-started/03-first-app.md) — Building, running, and testing your very first Froot web service.

### [Chapter 2: Core Concepts](./02-core-concepts/01-monomorphic-context.md)
1. [01. Monomorphic Context Engine](./02-core-concepts/01-monomorphic-context.md) — What makes `FrootContext` V8-monomorphic, and how lazy evaluation eliminates CPU overhead.
2. [02. V8 Hidden Classes & Inline Caches](./02-core-concepts/02-v8-hidden-classes.md) — Why Express prototype mutation degrades V8 performance and how Froot prevents deoptimization.
3. [03. Request & Response Helpers](./02-core-concepts/03-request-and-response.md) — JSON, text, HTML, headers, status codes, query strings, and standard Web streams.

### [Chapter 3: Smart Tri-Tier Routing](./03-routing/01-tri-tier-architecture.md)
1. [01. Tri-Tier Router Architecture](./03-routing/01-tri-tier-architecture.md) — How Tier 1 Static Map ($O(1)$), Tier 2 RegExpRouter, and Tier 3 Radix Trie operate in harmony.
2. [02. Parameter Extraction & Types](./03-routing/02-parameters-and-types.md) — Zero-cost compile-time template literal type inference for route parameters (`c.param('id')`).
3. [03. Sub-Applications & Route Groups](./03-routing/03-sub-apps-and-mounting.md) — Modular application architecture with `app.route('/prefix', subApp)`.

### [Chapter 4: Middleware & Onion Pipeline](./04-middleware/01-onion-pipeline.md)
1. [01. The Onion Middleware Model](./04-middleware/01-onion-pipeline.md) — Modern `async/await` execution flow, replacing callback hell and complex lifecycle hooks.
2. [02. Built-in Batteries](./04-middleware/02-built-in-batteries.md) — First-party `cors()`, `security()`, `timing()`, and `logger()` middleware.
3. [03. Writing Custom Middleware](./04-middleware/03-custom-middleware.md) — Creating reusable middlewares, state injection with `c.set()` / `c.get()`, and short-circuiting.

### [Chapter 5: Type Safety & Validation](./05-validation/01-standard-schema.md)
1. [01. Standard Schema Validation](./05-validation/01-standard-schema.md) — Universal runtime validation with TypeBox, Zod, ArkType, and custom validator functions.
2. [02. RFC 9457 Problem Details](./05-validation/02-rfc-9457-errors.md) — Machine-readable standardized error responses and `HTTPException`.

### [Chapter 6: Multi-Runtime Portability](./06-multi-runtime/01-node-native-engine.md)
1. [01. Node.js Native Engine](./06-multi-runtime/01-node-native-engine.md) — Native socket tuning (`setNoDelay`, `keepAliveTimeout`), low-overhead streams, and zero-copy dispatch.
2. [02. Cloudflare Workers](./06-multi-runtime/02-cloudflare-workers.md) — Typed KV/D1 environment bindings with `c.env` and background jobs with `c.waitUntil()`.
3. [03. Bun & Deno](./06-multi-runtime/03-bun-and-deno.md) — Native Web standard serving via `Bun.serve(app)` and `Deno.serve(app.fetch)`.
4. [04. AWS Lambda & Serverless](./06-multi-runtime/04-aws-lambda.md) — Deploying to API Gateway v2 and Lambda Function URLs with `handle(app)`.

### [Chapter 7: Zero-Codegen RPC Client](./07-rpc-client/01-zero-codegen-rpc.md)
1. [01. Type-Safe Client RPC](./07-rpc-client/01-zero-codegen-rpc.md) — Full end-to-end type safety between backend and frontend without build-time code generation.

### [Chapter 8: Streaming & Real-Time](./08-streaming/01-sse-and-web-streams.md)
1. [01. Server-Sent Events & Streams](./08-streaming/01-sse-and-web-streams.md) — Streaming text, JSON chunks, and live SSE event feeds using `c.streamSSE()`.

### [Chapter 9: Benchmarks & Performance](./09-benchmarks/01-benchmarks-and-tuning.md)
1. [01. Performance Tuning & Benchmarks](./09-benchmarks/01-benchmarks-and-tuning.md) — Benchmarking against Express and Fastify, memory profiling, and high-load socket tuning.

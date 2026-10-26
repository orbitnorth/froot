# Architectural Master Plan: Froot Framework

> **Codename:** Froot  
> **Status:** Production Specification & Architectural Blueprint  
> **Target Runtimes:** Node.js (20+ / 22+ / 26+), Bun, Deno, WinterCG (Cloudflare Workers, Fastly Compute)  
> **Language:** TypeScript 5.8+ (Native, Strict, Zero-External-Type Bolting)

---

## 1. Executive Summary & Problem Statement

For over a decade, **Express.js** has been the default HTTP framework for the Node.js ecosystem. While its minimalist API popularized web development in JavaScript, Express was conceived in 2010—prior to ECMAScript 2015, `async/await`, modern V8 optimization pipelines (TurboFan, Sparkplug, Maglev), the WinterCG Fetch API standards (`Request`, `Response`, `ReadableStream`), and TypeScript.

In 2016, **Fastify** revolutionized Node.js server performance by introducing schema-based compilation (`ajv`, `fast-json-stringify`), Radix-tree routing (`find-my-way`), and V8 hidden-class stabilization. However, Fastify remains tethered to legacy Node.js stream abstractions (`node:http` `IncomingMessage` / `ServerResponse`), relies on an opaque plugin encapsulation hierarchy (avodio) that creates complex scoping friction, and requires cumbersome external typings.

### The Opportunity: Froot
**Froot** is designed from the ground up to synthesize the developer ergonomics of Express, the raw throughput of Fastify, and the modern multi-runtime, type-first standards pioneered by Hono and Elysia.

```
+-------------------------------------------------------------------------+
|                              Froot Framework                            |
+-------------------------------------------------------------------------+
| Developer Experience | End-to-End Type Inference | Zero Build Step      |
| Runtime Engines      | Dual-Core: Native Node (node:http) + WinterCG    |
| Routing Architecture | Smart Tri-Tier (Static Map -> RegExp -> Radix)   |
| Memory Model         | Monomorphic Shapes + Lazy Property Evaluation    |
| Middleware Model     | Asynchronous Onion Pipeline (await next())       |
| Schema & RPC         | Standard Schema Adapters + Zero-Codegen RPC      |
+-------------------------------------------------------------------------+
```

---

## 2. In-Depth Dissection: Express vs. Fastify vs. Froot

### 2.1 The Request Object & V8 Hidden Classes (Maps)

#### Express (`express/lib/application.js` & `lib/request.js`)
Express mutates the prototype of incoming requests on *every single request*:
```javascript
// express/lib/application.js (Lines 168-170)
Object.setPrototypeOf(req, this.request);
Object.setPrototypeOf(res, this.response);
```
Furthermore, in `express/lib/request.js`:
```javascript
// express/lib/request.js (Lines 521-527)
function defineGetter(obj, name, getter) {
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable: true,
    get: getter
  });
}
```
* **Performance Impact:**
  1. `Object.setPrototypeOf()` is one of the slowest operations in the V8 engine. It forces V8 to invalidate all inline caches (ICs) associated with the prototype chain, causing monomorphic call sites to degrade into megamorphic dictionary lookups.
  2. Heavy use of closure-based getters (`defineGetter`) creates allocation churn and prevents JIT inlining.

#### Fastify (`fastify/lib/request.js`)
Fastify fixed prototype mutation by instantiating a dedicated `Request` constructor:
```javascript
// fastify/lib/request.js (Lines 33-41)
function Request (id, params, req, query, log, context) {
  this.id = id
  this[kRouteContext] = context
  this.params = params
  this.raw = req
  this.query = query
  this.log = log
  this.body = undefined
}
```
* **Analysis:** Fastify pre-allocates properties in the constructor to establish a stable V8 hidden class (`Map`). However, Fastify still wraps the Node.js `IncomingMessage`, allocates multiple symbols (`kRouteContext`, `kDiagnosticsStore`), and clones request prototypes for decorators via `buildRegularRequest(R)` on plugin boundaries.

#### Froot Innovation: Monomorphic Lazy Context (`FrootContext`)
Froot introduces a single, lightweight `Context` class whose properties are allocated in a deterministic, strict sequence:
1. **Zero Prototype Rewriting:** Never calls `Object.setPrototypeOf()`.
2. **Deterministic V8 Shape:** All instances share the exact same hidden class (`Map`).
3. **Lazy Parsing:** Query strings, headers, cookies, and bodies are *only* parsed when accessed by the route handler. If a handler only returns `{ status: 'ok' }` or reads `c.params.id`, zero CPU cycles are spent decoding headers or parsing queries.

---

### 2.2 Routing Engine Architecture

| Metric | Express Router | Fastify Router (`find-my-way`) | Froot Smart Tri-Tier Router |
| :--- | :--- | :--- | :--- |
| **Data Structure** | Linear Array (`Layer[]`) | Radix Tree (Compressed Prefix Tree) | Multi-Tier: Exact Map + Compiled RegExp + Radix Fallback |
| **Lookup Time (Static Routes)** | $O(N)$ (Iterates through all routes) | $O(K)$ ($K$ = segment count) | $O(1)$ (Direct hash map dispatch) |
| **Lookup Time (Dynamic Routes)** | $O(N)$ (Executes `path-to-regexp` per layer) | $O(K)$ (Tree descent) | $O(1)$ single-pass compiled RegExp matching |
| **Wildcards / Complex Patterns** | Linear scan | Supported | Radix Trie Fallback |
| **Type Inference for Params** | None (Manual casts) | Manual generics | Automatic via Template Literal Types |

#### How Froot's Smart Tri-Tier Router Works:
1. **Tier 1 (Exact Static Map):** Routes without dynamic parameters (e.g. `/api/v1/health`, `/users/export`) are indexed in a native JavaScript `Map<string, HandlerChain>`. Lookup is $O(1)$ pointer retrieval with 0 string splits and 0 regex tests.
2. **Tier 2 (Compiled Single-Pass RegExpRouter):** Routes with parameters (e.g. `/users/:userId/posts/:postId`) are compiled at server startup into **one single unified regular expression** with indexed capture groups. A single `regex.exec(pathname)` resolves the route AND extracts parameters simultaneously in a single engine call.
3. **Tier 3 (Radix Trie Fallback):** Intricate catch-all (`*`), wildcard, or multi-nested regex patterns seamlessly fall back to an optimized Radix tree.

---

### 2.3 Type Safety & Developer Ergonomics

#### Express:
- Types are external (`@types/express`), which are disconnected from the application code.
- Parameter types (`req.params`) default to `Record<string, string>`. There is no compile-time check if `:id` actually exists in the URL path.
- Modifying `req` (e.g. `req.user = user`) requires global declaration merging (`namespace Express { interface Request { user: User } }`), which leaks across files and risks naming collisions.

#### Fastify:
- Supports TypeScript via generic parameters:
  ```typescript
  fastify.get<{ Params: { id: string }, Reply: UserResponse }>('/users/:id', async (req, reply) => { ... });
  ```
- Downside: The developer must manually duplicate route parameter names in both the URL string and the TypeScript generic interface. If the URL is updated to `/users/:userId`, the TypeScript compiler will not warn about the mismatch.

#### Froot:
- **Compile-Time Route Parameter Extraction:**
  ```typescript
  // c.param('id') is automatically typed as string!
  // c.param('invalid') produces a TypeScript compile-time error!
  app.get('/users/:id/books/:bookSlug', (c) => {
    const id = c.param('id');          // string (Strictly typed!)
    const slug = c.param('bookSlug');  // string (Strictly typed!)
    // @ts-expect-error
    const nope = c.param('unknown');   // COMPILE ERROR
  });
  ```
- **Type-Safe Scoped State:**
  ```typescript
  app.use(async (c, next) => {
    c.set('user', { id: '123', role: 'admin' });
    await next();
  });
  // Inside downstream handler:
  const user = c.get('user'); // Inferred as { id: string, role: string }
  ```
- **Zero-Codegen End-to-End RPC Client:**
  Export the app type `type AppType = typeof app`, and the frontend client (`createFrootClient<AppType>()`) provides full autocompletion, typed parameters, query validation, and return-type inference.

---

### 2.4 Middleware Execution Model: Callbacks vs. Async Onion

#### Express:
```javascript
function middleware(req, res, next) {
  doAsyncWork((err, data) => {
    if (err) return next(err);
    next();
  });
}
```
Swallowing unhandled promise rejections has plagued Express 4 for years. In Express 5, promises are awaited inside `router/layer.js`, but it still operates through the callback-driven `next(err)` pipeline.

#### Fastify:
Uses an 11-step lifecycle hook pipeline (`onRequest`, `preParsing`, `preValidation`, `preHandler`, `preSerialization`, `onSend`, `onResponse`, `onError`). While thorough, it introduces cognitive overhead and rigid hook ordering restrictions.

#### Froot:
Implements a pure **Async Onion Pipeline**:
```typescript
app.use(async (c, next) => {
  const start = performance.now();
  await next(); // Executes downstream handlers
  const duration = performance.now() - start;
  c.header('Server-Timing', `total;dur=${duration.toFixed(2)}`);
});
```
- Fully async/await native.
- Guaranteed single execution path.
- Errors thrown anywhere in the onion bubble up cleanly to the global error handler (`c.onError`), formatted conforming to RFC 9457 Problem Details.

---

## 3. Architecture of Froot

```
+-------------------------------------------------------------------------------+
|                                  FROOT CORE                                   |
+-------------------------------------------------------------------------------+
|  +---------------------------+       +-------------------------------------+  |
|  |     WinterCG Engine       |       |       Node.js Native Engine         |  |
|  | (Fetch API Request/Resp)  |       |  (node:http / node:http2 / socket)  |  |
|  +-------------+-------------+       +------------------+------------------+  |
|                |                                        |                     |
|                +--------------------+-------------------+                     |
|                                     |                                         |
|                                     v                                         |
|                       +---------------------------+                           |
|                       |  FrootContext (Ctx)       |                           |
|                       |  - Monomorphic Shape      |                           |
|                       |  - Lazy Query / Header    |                           |
|                       |  - Lazy Body Parsing      |                           |
|                       |  - Scoped Typed State     |                           |
|                       +-------------+-------------+                           |
|                                     |                                         |
|                                     v                                         |
|                       +---------------------------+                           |
|                       |   Smart Tri-Tier Router   |                           |
|                       |  Tier 1: Static Map O(1)  |                           |
|                       |  Tier 2: Compiled RegExp  |                           |
|                       |  Tier 3: Radix Fallback   |                           |
|                       +-------------+-------------+                           |
|                                     |                                         |
|                                     v                                         |
|                       +---------------------------+                           |
|                       |   Async Onion Pipeline    |                           |
|                       |   [Cors] -> [Logger] ->   |                           |
|                       |   [Validation] -> Handler |                           |
|                       +---------------------------+                           |
+-------------------------------------------------------------------------------+
```

### 3.1 Project Structure

```
froot-framework/
├── PLAN.md                     # Architectural Master Plan (this document)
├── package.json                # Modern ESM, Node 20+, zero external production dependencies
├── tsconfig.json               # Strict TypeScript 5.8+ settings
├── src/
│   ├── index.ts                # Public exports
│   ├── types/
│   │   ├── index.ts            # Type definitions, route inference, template literals
│   │   ├── http.ts             # HTTP methods, status codes, header types
│   │   └── schema.ts           # Standard Schema / TypeBox / Zod adapter types
│   ├── router/
│   │   ├── types.ts            # Router interfaces & match results
│   │   ├── static-map.ts       # Tier 1: O(1) exact static route hash map
│   │   ├── regexp-router.ts    # Tier 2: Compiled single-pass regular expression router
│   │   ├── radix-router.ts     # Tier 3: Compressed radix tree for wildcards & catch-alls
│   │   └── smart-router.ts     # Unified routing engine orchestrator
│   ├── core/
│   │   ├── app.ts              # Main Froot application class
│   │   ├── context.ts          # Monomorphic V8-optimized Context
│   │   ├── response.ts         # Fast JSON, Text, Binary, SSE & Stream helpers
│   │   ├── node-adapter.ts     # Native node:http / node:http2 server bridge
│   │   └── errors.ts           # RFC 9457 Problem Details error classes
│   ├── middleware/
│   │   ├── cors.ts             # Zero-allocation CORS middleware
│   │   ├── logger.ts           # Ultra-fast JSON & pretty logger
│   │   ├── security.ts         # Secure HTTP headers (CSP, HSTS, etc.)
│   │   └── timing.ts           # Server-Timing metrics injector
│   ├── schema/
│   │   └── validator.ts        # Fast schema validation adapter with standard schema support
│   └── client/
│       └── rpc.ts              # End-to-end typed RPC client
└── examples/
    ├── basic.ts                # Hello World, route params, lazy queries
    ├── middleware.ts           # CORS, security, timing, logger demo
    ├── streaming.ts            # Server-Sent Events (SSE) and Web Streams
    ├── validation.ts           # Type-safe validation with typed returns
    ├── rpc-client.ts           # End-to-end type safety demo
    └── benchmark.ts            # Synthetic performance comparison suite
```

---

## 4. Key Performance Strategies

### 4.1 Memory & Garbage Collection Optimization
- **Monomorphic Class Instances:** Every `FrootContext` object has the exact same properties declared in the exact same order in its constructor. V8 retains a single hidden class (`Map`), allowing property accesses to remain monomorphic.
- **Lazy Allocation & Zero-Parsing on Demand:**
  - `c.query` is `undefined` until `c.query` or `c.req.query(key)` is accessed.
  - Headers are read directly from the native header object rather than pre-cloning into a dictionary.
  - Body buffers/streams are only consumed when `c.req.json()`, `c.req.text()`, or `c.req.formData()` is invoked.
- **Zero Prototype Pollution:** No calls to `Object.setPrototypeOf()` or `__proto__` alterations anywhere in the codebase.

### 4.2 Low-Level Socket & Protocol Tuning (Node.js Engine)
- `socket.setNoDelay(true)`: Disables Nagle's algorithm to eliminate latency on small JSON packets.
- `keepAliveTimeout = 65000`: Tuned to prevent premature TCP disconnection behind cloud load balancers (e.g. AWS ALB 60s timeout).
- `headersTimeout = 66000`: Complies with Node.js security requirements (`headersTimeout > keepAliveTimeout`).
- `maxRequestsPerSocket = 10000`: Protects against socket memory drift.

### 4.3 High-Speed JSON Serialization
- Fast direct serialization for primitive dictionaries.
- Support for compiled schema serializers when schemas are provided.

---

## 5. End-to-End TypeScript Type Safety Architecture

### 5.1 Route Parameter Deduction
```typescript
type ExtractParamNames<T extends string> =
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractParamNames<`/${Rest}`>
    : T extends `${infer _Start}:${infer Param}`
    ? Param
    : never;

type RouteParams<T extends string> = {
  [K in ExtractParamNames<T>]: string;
};
```
For a route like `/api/orgs/:orgId/teams/:teamId/members/:memberId`:
- `c.req.param('orgId')` -> `string`
- `c.req.param('teamId')` -> `string`
- `c.req.param('memberId')` -> `string`
- `c.req.param('typo')` -> **TypeScript Compile Error: Argument of type '"typo"' is not assignable to parameter of type '"orgId" | "teamId" | "memberId"'.**

### 5.2 Zero-Codegen RPC Client
```typescript
// Backend:
const app = new Froot()
  .get('/api/users/:id', (c) => {
    return c.json({ id: c.req.param('id'), name: 'Alice' });
  });

export type AppType = typeof app;

// Frontend / Consumer:
const client = createFrootClient<AppType>({ baseUrl: 'http://localhost:3000' });
const res = await client.api.users[':id'].$get({
  param: { id: '42' }
});
const data = await res.json(); // Inferred as { id: string; name: string }!
```

---

## 6. Implementation Roadmap

1. **Phase 1: Architecture & Planning (Complete)**: Master specification documentation.
2. **Phase 2: Core Routing & Context Engine**: Build `StaticMap`, `RegExpRouter`, `RadixRouter`, and `FrootContext`.
3. **Phase 3: Application Core & Onion Middleware**: Implement `Froot` class, async pipeline, and error handling.
4. **Phase 4: Dual Runtime Engines**: Implement WinterCG `fetch` handler and high-performance `NodeAdapter`.
5. **Phase 5: First-Party Batteries**: Build `cors`, `logger`, `security`, `timing`, and `validator`.
6. **Phase 6: End-to-End RPC Client**: Implement `createFrootClient`.
7. **Phase 7: Verification, Examples & Benchmarks**: Test all routes, types, and verify zero build/runtime errors under Node 26.

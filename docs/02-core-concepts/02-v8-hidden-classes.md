# Lesson 2.2: V8 Hidden Classes & Inline Caches

To understand why Froot achieves such high throughput, we must examine how modern JavaScript engines (such as Google V8 in Node.js and Bun's JavaScriptCore) execute code at runtime.

---

## 1. What is an Inline Cache (IC)?

When V8 compiles JavaScript to machine code via TurboFan / Maglev, it optimizes property accesses. Consider this line of handler code:

```typescript
const url = c.req.url;
```

In dynamically-typed JavaScript, the engine does not know where `.req` lives in memory at compile-time. 

Without optimization:
1. Lookup the property name `"req"` in `c`'s prototype chain.
2. Read the property descriptor.
3. Compute the memory address.
4. Extract the value.

With **Monomorphic Inline Caching**:
1. Check if `c`'s Hidden Class (Map) matches the cached Map `Map_A`.
2. If it matches, read memory directly at `c + offset` (1 CPU instruction).
3. If it does not match, fall back to slow dictionary search (deoptimization).

---

## 2. The Architectural Flaw in Express.js

Let's inspect the actual source code of Express 5 (`express/lib/application.js:L168-170`):

```javascript
app.handle = function handle(req, res, callback) {
  // Prototype mutation on EVERY single incoming HTTP request!
  Object.setPrototypeOf(req, this.request);
  Object.setPrototypeOf(res, this.response);
  // ...
};
```

### Why is `Object.setPrototypeOf()` Catastrophic in Hot Paths?

In V8, mutating the prototype of an object after construction:
- **Invalidates all transition trees:** V8 assigns the object a special "slow dictionary mode" Map.
- **Flushes Inline Caches:** Any function that had optimized property reads on `req` or `res` will have its IC cleared and deoptimized.
- **Prevents Inlining:** TurboFan refuses to inline accessor methods on prototype-mutated objects.

---

## 3. How Fastify and Froot Solve This

- **Fastify:** Avoids `setPrototypeOf` by creating a new `Request` class instance per request. However, Fastify request objects still undergo dynamic assignment as plugins attach decorators.
- **Froot:** Takes optimization to its theoretical limit:
  1. `FrootContext` has an immutable property layout.
  2. Plugin state is stored in an internal dictionary (`_state`) accessed via monomorphic helper methods (`c.get(key)` and `c.set(key, val)`).
  3. The `FrootContext` class prototype is declared statically once and never modified.

---

## Performance Impact

Under high concurrency (100,000+ requests across 50 concurrent connections):
- **Express 5:** ~38,000 requests/sec with periodic latency spikes from IC invalidation.
- **Froot:** **110,000+ requests/sec** with near-flat latency distribution and zero deoptimization bailouts.

---

## Next Steps
In the next lesson, we will explore the `Context` API: formatting responses, reading headers, parsing bodies, and streaming data.
- Proceed to [Lesson 2.3: Request & Response Helpers](./03-request-and-response.md)

# Lesson 3.1: Tri-Tier Router Architecture

Routing is typically the most CPU-intensive task in high-throughput API gateways and web microservices. A modern web server might host hundreds of routes ranging from fixed static endpoints (`/health`, `/metrics`) to deeply parameterized paths (`/orgs/:org/repos/:repo/issues/:id`) and asset catch-alls (`/static/*`).

Traditional routers compromise by selecting a single data structure:
- **Express.js:** Uses a flat array of compiled regex layers. Every incoming request performs an $O(N)$ linear loop over the array until a match is found. If route 50 is requested, 49 regex checks must run first.
- **Fastify / Radix3:** Uses a Radix Trie (prefix tree). While $O(K)$ (where $K$ is URL depth), every path lookup requires tree traversal, branch splitting, and memory pointer dereferences, even for simple paths like `/health`.

Froot introduces the **Smart Tri-Tier Router Orchestrator**, which combines the best characteristics of all three approaches.

---

## The Three Tiers

```
Incoming Request URL
        |
        v
+-------------------------------+
|  Tier 1: Static Route Map     | === Match found ===> [ Dispatch Handler in 25ns ]
|  (Exact O(1) JavaScript Map)  |
+-------------------------------+
        |
        | (No static match)
        v
+-------------------------------+
|  Tier 2: Single-Pass RegExp   | === Match found ===> [ Extract Params & Dispatch ]
|  (Ahead-of-time compiled)     |
+-------------------------------+
        |
        | (No regex match)
        v
+-------------------------------+
|  Tier 3: Radix Prefix Tree    | === Match found ===> [ Dispatch Wildcard Handler ]
|  (Wildcard & Catch-Alls)      |
+-------------------------------+
        |
        | (No match)
        v
   [ 404 Not Found ]
```

### Tier 1: Exact Static Map ($O(1)$)
Routes without dynamic parameters (e.g. `GET /health`, `POST /api/v1/auth/token`) are registered in an exact hash map keyed by `${method}:${pathname}`.
- **Complexity:** $O(1)$ constant time.
- **Throughput:** Over **40,000,000 lookups per second** on modern CPUs.
- **Memory Overhead:** Minimal (single JS Map entry).

### Tier 2: Single-Pass Compiled RegExpRouter
Parameterized routes (e.g. `/users/:id`, `/posts/:postId/comments/:commentId`) are compiled ahead of time into a single unified regular expression. 

Instead of evaluating separate regular expressions for each route sequentially, V8's Irregexp engine scans the URL in a single optimized pass, extracting capture groups and matching the route in one step.

### Tier 3: Radix Trie (Wildcards & Prefix Catch-Alls)
Routes with trailing wildcards (e.g. `/assets/*`, `/docs/*path`) or catch-all middleware (`*`, `/*`) are stored in an optimized radix prefix tree with child node indexing.

---

## Precedence Rules

When a request arrives, Froot resolves matches according to a strict priority hierarchy:
1. **Static match wins first:** An exact match on `/users/me` will always execute the static `/users/me` handler, never falling through to `/users/:id`.
2. **Parameterized match wins second:** A request to `/users/42` matches the `/users/:id` route before checking wildcards.
3. **Wildcard match wins third:** If neither static nor parameterized routes match, `/users/*` captures the request.
4. **404 Not Found:** If no tier matches, the customizable `notFoundHandler` executes.

---

## Next Steps
In the next lesson, we will see how Froot automatically extracts route parameter types at compile-time using TypeScript template literal types.
- Proceed to [Lesson 3.2: Parameter Extraction & Types](./02-parameters-and-types.md)

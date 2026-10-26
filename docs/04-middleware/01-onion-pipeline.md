# Lesson 4.1: The Onion Middleware Model

Middleware in web frameworks handles cross-cutting concerns: authentication, telemetry, logging, rate limiting, and header manipulation.

---

## 1. Comparing Middleware Models

### Express: The Callback Chain
```javascript
function middleware(req, res, next) {
  authService.verify(req.headers.token, (err, user) => {
    if (err) return next(err);
    req.user = user;
    next();
  });
}
```
**Weaknesses:** 
- Inability to perform post-handler actions cleanly (e.g. measuring execution time or mutating headers after the response is rendered).
- Swallowed promise rejections.
- Fragile error handling requiring `next(err)`.

### Fastify: 11-Step Lifecycle Hooks
Fastify offers fine-grained lifecycle hooks (`onRequest`, `preParsing`, `preValidation`, `preHandler`, etc.). While structured, it introduces high cognitive overhead and rigid hook ordering rules.

### Froot: The Pure Async Onion Model
Froot implements the classic, elegant **Onion Model** popularized by Koa and modern Web standards:

```
[ Incoming HTTP Request ]
           |
           v
   +-------------------------------+
   | Middleware 1 (Entry)          |
   |   +-----------------------+   |
   |   | Middleware 2 (Entry)  |   |
   |   |   +---------------+   |   |
   |   |   | Route Handler |   |   |
   |   |   +---------------+   |   |
   |   | Middleware 2 (Exit)   |   |
   |   +-----------------------+   |
   | Middleware 1 (Exit)           |
   +-------------------------------+
           |
           v
[ Outgoing HTTP Response ]
```

Every middleware is an async function:
- Code **before** `await next()` executes on the way in.
- `await next()` invokes the downstream middleware and route handler.
- Code **after** `await next()` executes on the way out during response unwinding.

---

## 2. Example: Server-Timing Middleware

Measuring execution duration is trivial with the onion model:

```typescript
app.use('*', async (c, next) => {
  const start = performance.now();

  // 1. Execute downstream handlers
  await next();

  // 2. Execute on response unwinding
  const duration = (performance.now() - start).toFixed(2);
  c.header('Server-Timing', `total;dur=${duration}`);
});
```

---

## 3. Short-Circuiting the Pipeline

If a middleware returns a `Response` without calling `next()`, downstream handlers are never reached:

```typescript
app.use('/admin/*', async (c, next) => {
  const apiKey = c.header('x-api-key');
  if (apiKey !== 'secret_admin_key') {
    // Short-circuit pipeline immediately
    return c.json({ error: 'Forbidden' }, 403);
  }
  await next();
});
```

---

## Next Steps
In the next lesson, we will explore Froot's first-party middleware: CORS, Helmet security headers, timing, and structured logger.
- Proceed to [Lesson 4.2: Built-in Batteries](./02-built-in-batteries.md)

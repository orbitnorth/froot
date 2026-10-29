---
title: Middleware Pipeline
category: Core Concepts
summary: Onion execution, CORS, Logger, Timing, Security headers, and Rate limiting.
---

Froot utilizes an async onion-pipeline model for middleware execution. Middleware can intercept requests, inspect headers, and perform post-processing on responses.

## Writing Custom Middleware

```ts
import type { MiddlewareHandler } from 'frootjs';

export const responseTimer: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  await next();
  const elapsed = (performance.now() - start).toFixed(2);
  c.header('X-Response-Time', `${elapsed}ms`);
};

app.use(responseTimer);
```

## Built-In Middlewares

- `cors(options)`: Cross-Origin Resource Sharing headers and preflight handling.
- `logger()`: Fast request logging with status code colors.
- `secureHeaders()`: CSP, HSTS, X-Frame-Options, and nosniff protection.

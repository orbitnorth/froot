# Lesson 5.2: RFC 9457 Problem Details & Errors

When an API encounters an error, returning inconsistent payloads (e.g. `{ error: "msg" }` on one route and `{ message: "failed", code: 400 }` on another) creates integration friction for frontend clients.

Froot strictly standardizes on **RFC 9457: Problem Details for HTTP APIs** (the successor to RFC 7807), using the official media type:
```http
content-type: application/problem+json; charset=utf-8
```

---

## 1. Automatic Validation Error Response

When `validate()` encounters schema violations, it automatically responds with an RFC 9457 payload without crashing the server:

```json
{
  "type": "https://httpstatuses.com/400",
  "title": "Schema Validation Failed",
  "status": 400,
  "detail": "Validation failed for json",
  "invalidParams": [
    {
      "name": "email",
      "reason": "Invalid email address format"
    },
    {
      "name": "age",
      "reason": "Expected number, received string"
    }
  ]
}
```

---

## 2. Throwing `HTTPException`

You can throw `HTTPException` anywhere in your middleware or handlers:

```typescript
import { Froot, HTTPException } from 'froot';

const app = new Froot();

app.get('/accounts/:id', (c) => {
  const account = findAccount(c.param('id'));

  if (!account) {
    throw new HTTPException(404, 'Account not found', {
      detail: `No account exists with identifier ${c.param('id')}`
    });
  }

  if (account.suspended) {
    throw new HTTPException(403, 'Account suspended', {
      detail: 'Contact compliance@example.com for restoration'
    });
  }

  return c.json(account);
});
```

---

## 3. Global Error Handling (`app.onError`)

To catch unhandled runtime exceptions (database disconnects, third-party timeouts) and translate them into custom error formats or log them to error tracking services (Sentry, Datadog):

```typescript
app.onError((err, c) => {
  console.error('Unhandled Server Error:', err);

  const message = err instanceof Error ? err.message : 'Internal Server Error';

  return c.json(
    {
      type: 'https://example.com/errors/internal',
      title: 'Internal Server Error',
      status: 500,
      detail: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : message
    },
    500
  );
});
```

---

## 4. Custom 404 Handler (`app.onNotFound`)

Override the default 404 response:

```typescript
app.onNotFound((c) => {
  return c.json(
    {
      title: 'Resource Not Found',
      status: 404,
      path: c.req.path
    },
    404
  );
});
```

---

## Next Steps
In the next chapter, we explore Froot's multi-runtime architecture: deploying to Node.js, Cloudflare Workers, Bun, Deno, and AWS Lambda.
- Proceed to [Lesson 6.1: Node.js Native Engine](../06-multi-runtime/01-node-native-engine.md)

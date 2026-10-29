---
title: Context & Request
category: Core Concepts
summary: Object pooling, param/query extraction, JSON parsing, and response constructors.
---

Every route handler in Froot receives a unified `Context` object, conventionally named `c`.

## Request Accessors

```ts
app.post('/api/items/:id', async (c) => {
  // Path Parameters
  const id = c.req.param('id');

  // Query Parameters
  const notify = c.req.query('notify');

  // JSON Body (async)
  const body = await c.req.json<{ title: string; price: number }>();

  // Headers
  const auth = c.req.header('authorization');

  // Cookies
  const session = c.req.cookie('session_id');

  // Raw Web Request
  const nativeReq = c.req.raw;
});
```

## Response Constructors

| Method | Content-Type | Example |
|---|---|---|
| `c.json(data, status?)` | `application/json` | `return c.json({ ok: true }, 201);` |
| `c.text(string, status?)` | `text/plain` | `return c.text('Hello World');` |
| `c.html(markup, status?)` | `text/html` | `return c.html('<h1>Hi</h1>');` |
| `c.redirect(url, status?)` | Location Header | `return c.redirect('/login', 302);` |


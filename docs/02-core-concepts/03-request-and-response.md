# Lesson 2.3: Request & Response Helpers

Froot provides ergonomic, high-speed helper methods on `c` (Context) and `c.req` (RequestContext).

---

## The Request Object (`c.req`)

The request wrapper provides direct access to the incoming HTTP message while preserving Web Standards compatibility:

```typescript
// 1. Raw Web standard Request
const rawRequest: Request = c.req.raw;

// 2. URL and Path
const pathname: string = c.req.path; // e.g. "/api/users"
const fullUrl: string = c.req.url;   // e.g. "http://localhost:3000/api/users?sort=asc"
const method: string = c.req.method; // e.g. "GET"

// 3. Lazy Query String Access
const sort = c.req.query('sort'); // single parameter (string | undefined)
const allQueryParams = c.req.query(); // dictionary of all parameters

// 4. Headers
const authHeader = c.req.header('authorization');
const allHeaders = c.req.headers; // dictionary of all headers

// 5. Body Parsers (Standard Web Fetch Promises)
const jsonBody = await c.req.json<UserPayload>();
const textBody = await c.req.text();
const arrayBuffer = await c.req.arrayBuffer();
const formData = await c.req.formData();
```

---

## Response Helpers (`c.json`, `c.text`, `c.html`)

Instead of cumbersome Node `res.writeHead()` and `res.end()` calls, Froot provides high-performance response constructors that automatically configure HTTP status codes and content-type headers:

### 1. `c.json(data, status?, headers?)`
Serializes data to JSON with `content-type: application/json; charset=utf-8`:

```typescript
app.get('/api/profile', (c) => {
  return c.json({ username: 'mallahi', verified: true });
});

// Custom status code and additional headers
app.post('/api/items', (c) => {
  return c.json({ id: 'item_1' }, 201, {
    'x-rate-limit-remaining': '99'
  });
});
```

### 2. `c.text(string, status?, headers?)`
Returns a plain-text response with `content-type: text/plain; charset=utf-8`:

```typescript
app.get('/robots.txt', (c) => {
  return c.text('User-agent: *\nDisallow: /admin');
});
```

### 3. `c.html(htmlString, status?, headers?)`
Returns HTML markup with `content-type: text/html; charset=utf-8`:

```typescript
app.get('/', (c) => {
  return c.html('<!DOCTYPE html><html><body><h1>Hello Froot</h1></body></html>');
});
```

---

## Managing Status and Headers

Froot allows setting status and response headers via fluent chaining:

```typescript
app.get('/download', (c) => {
  c.status(200);
  c.header('content-disposition', 'attachment; filename="data.csv"');
  c.header('cache-control', 'public, max-age=3600');
  return c.text('id,name\n1,Alpha\n2,Beta');
});
```

### Automatic 204 No Content Handling
When responding with status `204`, `205`, or `304`, the HTTP specification forbids a response body. Froot automatically suppresses the body and body-related headers, ensuring strict compliance across all runtimes without crashing the Fetch response constructor.

---

## Next Steps
Now that we understand the context and response engine, let's explore Froot's Tri-Tier Routing Architecture.
- Proceed to [Lesson 3.1: Tri-Tier Router Architecture](../03-routing/01-tri-tier-architecture.md)

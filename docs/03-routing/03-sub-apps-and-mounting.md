# Lesson 3.3: Sub-Applications & Route Groups

As applications scale to hundreds of endpoints, organizing routes into domain-driven modules (e.g. `users`, `billing`, `analytics`) is essential.

In Froot, any `Froot` instance can be mounted into another `Froot` application under a path prefix using `app.route(prefix, subApp)`.

---

## 1. Creating Sub-Applications

Sub-applications are independent, self-contained Froot apps. They can have their own routes, validation logic, and local middleware:

### `src/routes/users.ts`
```typescript
import { Froot } from 'froot';

export const usersApp = new Froot();

usersApp.get('/', (c) => {
  return c.json([
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' }
  ]);
});

usersApp.get('/:id', (c) => {
  const userId = c.param('id');
  return c.json({ id: userId, name: `User ${userId}` });
});

usersApp.post('/', async (c) => {
  const body = await c.req.json<{ name: string }>();
  return c.json({ created: true, name: body.name }, 201);
});
```

### `src/routes/billing.ts`
```typescript
import { Froot } from 'froot';

export const billingApp = new Froot();

billingApp.get('/invoices', (c) => {
  return c.json({ invoices: [] });
});
```

---

## 2. Mounting into the Main App

Mount the sub-applications onto the root application using `app.route()`:

### `src/app.ts`
```typescript
import { Froot } from 'froot';
import { usersApp } from './routes/users.js';
import { billingApp } from './routes/billing.js';

const app = new Froot();

// Global health route
app.get('/health', (c) => c.json({ status: 'ok' }));

// Mount sub-apps
app.route('/api/v1/users', usersApp);
app.route('/api/v1/billing', billingApp);

export default app;
```

---

## 3. Deep Nesting & Prefix Resolution

Mounting supports arbitrary nesting depths. When routes are mounted:
- Prefixes are normalized automatically (handling leading and trailing slashes).
- Route parameters defined in sub-apps remain strictly typed.
- The router recompiles all route paths into the top-level Tri-Tier routing engine, ensuring sub-app routes benefit from **Tier 1 Static Map ($O(1)$)** or **Tier 2 Single-Pass Regex** optimization with zero indirection overhead.

For example:
- `usersApp.get('/:id')` mounted at `/api/v1/users` is compiled as `/api/v1/users/:id`.
- `billingApp.get('/invoices')` mounted at `/api/v1/billing` is compiled as `/api/v1/billing/invoices` and dispatched via Tier 1 Static Map $O(1)$!

---

## Next Steps
In the next chapter, we explore Froot's onion middleware pipeline, error handling, and first-party batteries.
- Proceed to [Lesson 4.1: The Onion Middleware Model](../04-middleware/01-onion-pipeline.md)

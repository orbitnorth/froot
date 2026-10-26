# Lesson 4.3: Writing Custom Middleware

Creating custom middleware in Froot is clean and strongly typed.

---

## 1. Middleware Function Signature

A middleware handler has the type:
```typescript
type MiddlewareHandler<TPath extends string = string, TEnv extends Env = BlankEnv> = (
  c: Context<TPath, TEnv>,
  next: Next
) => Promise<Response | void> | Response | void;
```

---

## 2. Passing Request-Scoped State (`c.set` & `c.get`)

Instead of attaching properties dynamically to `req` (which deoptimizes V8 hidden classes), Froot provides a typed state store via `c.set()` and `c.get()`.

### Step 1: Declare App Environment Variables
```typescript
import { Froot } from 'froot';

// Define the shape of contextual variables stored in the request
interface AppEnv {
  Variables: {
    user: { id: string; role: 'admin' | 'member' };
    requestId: string;
  };
}

const app = new Froot<AppEnv>();
```

### Step 2: Implement Middleware Setting Context
```typescript
app.use('*', async (c, next) => {
  // 1. Generate or extract Request ID
  const reqId = c.header('x-request-id') || crypto.randomUUID();
  c.set('requestId', reqId);
  c.header('x-request-id', reqId);

  // 2. Authenticate token
  const auth = c.header('authorization');
  if (auth?.startsWith('Bearer admin-secret')) {
    c.set('user', { id: 'usr_admin', role: 'admin' });
  } else {
    c.set('user', { id: 'usr_anon', role: 'member' });
  }

  await next();
});
```

### Step 3: Accessing Typed Variables Downstream
```typescript
app.get('/dashboard', (c) => {
  // c.get() is strictly typed according to AppEnv!
  const user = c.get('user');         // { id: string; role: 'admin' | 'member' }
  const reqId = c.get('requestId');   // string

  return c.json({
    requestId: reqId,
    welcome: `Hello ${user.id}`,
    role: user.role
  });
});
```

---

## 3. Reusable Middleware Factories

To distribute middlewares as packages or modules, write higher-order factory functions:

```typescript
import type { MiddlewareHandler } from 'froot';

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export function rateLimiter(options: RateLimitOptions): MiddlewareHandler {
  const ipHits = new Map<string, { count: number; resetAt: number }>();

  return async (c, next) => {
    const ip = c.header('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const entry = ipHits.get(ip);

    if (entry && entry.resetAt > now) {
      if (entry.count >= options.maxRequests) {
        c.header('retry-after', Math.ceil((entry.resetAt - now) / 1000).toString());
        return c.json({ error: 'Too Many Requests' }, 429);
      }
      entry.count++;
    } else {
      ipHits.set(ip, { count: 1, resetAt: now + options.windowMs });
    }

    await next();
  };
}
```

---

## Next Steps
In the next chapter, we look at type-safe validation using the Standard Schema specification and RFC 9457 error handling.
- Proceed to [Lesson 5.1: Standard Schema Validation](../05-validation/01-standard-schema.md)

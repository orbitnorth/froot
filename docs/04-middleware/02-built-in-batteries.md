# Lesson 4.2: Built-in Batteries

Froot includes modern, production-grade middleware out of the box under the `froot/middleware` export.

---

## 1. CORS (`cors`)

High-performance Cross-Origin Resource Sharing with preflight `OPTIONS` short-circuiting:

```typescript
import { Froot } from 'froot';
import { cors } from 'froot/middleware';

const app = new Froot();

// Permissive CORS for public APIs
app.use('*', cors());

// Strict CORS configuration
app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      // Allow specific domain or localhost
      return origin.endsWith('.myapp.com') || origin.startsWith('http://localhost:');
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowHeaders: ['content-type', 'authorization', 'x-request-id'],
    exposeHeaders: ['server-timing'],
    credentials: true,
    maxAge: 86400 // Cache preflight for 24 hours
  })
);
```

---

## 2. Security Headers (`security`)

Modern equivalent of Helmet, setting standard defensive HTTP response headers:

```typescript
import { security } from 'froot/middleware';

// Default configuration:
// - Content-Security-Policy: default-src 'self'
// - X-Frame-Options: SAMEORIGIN
// - X-Content-Type-Options: nosniff
// - Strict-Transport-Security: max-age=15552000; includeSubDomains
// - Referrer-Policy: no-referrer
// - Cross-Origin-Opener-Policy: same-origin
app.use('*', security());

// Custom security overrides
app.use(
  '*',
  security({
    xFrameOptions: 'DENY',
    contentSecurityPolicy: "default-src 'self'; script-src 'self' https://cdn.example.com",
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload'
  })
);
```

---

## 3. Server-Timing (`timing`)

Injects the standard W3C `Server-Timing` header to expose total server processing time directly in browser DevTools:

```typescript
import { timing } from 'froot/middleware';

app.use('*', timing());
```

**Browser Header Output:**
```http
server-timing: total;dur=1.42
```

---

## 4. Structured Logger (`logger`)

Zero-overhead logger supporting terminal pretty-printing and structured JSON output:

```typescript
import { logger } from 'froot/middleware';

// Pretty colored console output for local development
app.use('*', logger({ format: 'pretty' }));

// Structured JSON output for cloud log aggregators (Datadog, CloudWatch, GCP Cloud Logging)
app.use(
  '*',
  logger({
    format: 'json',
    output: (jsonLine) => process.stdout.write(jsonLine + '\n')
  })
);
```

**JSON Log Format:**
```json
{
  "time": "2026-10-26T03:15:00.000Z",
  "method": "POST",
  "path": "/api/users",
  "status": 201,
  "durationMs": 3.84
}
```

---

## Next Steps
In the next lesson, we will see how to write custom middlewares and pass type-safe state between handlers.
- Proceed to [Lesson 4.3: Writing Custom Middleware](./03-custom-middleware.md)

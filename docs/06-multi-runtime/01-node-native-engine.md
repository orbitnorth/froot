# Lesson 6.1: Node.js Native Engine

While Froot is built on the universal Web Fetch API, deploying to bare-metal Node.js or Docker containers requires low-level socket tuning to handle extreme traffic volumes without latency degradation.

Froot provides a dedicated native Node.js adapter in `froot/adapters/node` that bridges Node's `node:http` server to Froot's `fetch` pipeline.

---

## 1. Starting the Node.js Server

The simplest way to start the native engine is using `app.listen()`:

```typescript
import { Froot } from 'froot';

const app = new Froot();

app.get('/api/ping', (c) => c.text('pong'));

// Automatically tunes TCP sockets and starts HTTP server
const server = app.listen(3000, () => {
  console.log('Froot native Node.js engine listening on http://localhost:3000');
});
```

---

## 2. Advanced Socket Tuning

Under high concurrency (e.g. 50,000+ persistent keep-alive connections), default Node.js socket settings introduce artificial bottlenecks:
- **Nagle's Algorithm (TCP Delay):** By default, TCP sockets buffer small packets before transmitting them. Froot disables this via `socket.setNoDelay(true)` to deliver instant response packet transmission.
- **Keep-Alive Timeouts:** Node's default keep-alive timeout (5000ms) causes frequent connection renegotiation behind reverse proxies (NGINX, Cloudflare, AWS ALB). Froot tunes `keepAliveTimeout` to `65000ms` (65 seconds) to ensure upstream reverse proxies never encounter closed socket race conditions.
- **Headers Timeout:** Tuned to `66000ms` to protect against Slowloris DDoS attacks while allowing persistent pipelining.

You can customize these parameters directly:

```typescript
app.listen(3000, () => {
  console.log('Listening on port 3000');
}, {
  noDelay: true,                 // Disable Nagle's algorithm (default: true)
  keepAliveTimeout: 65000,       // 65 seconds
  headersTimeout: 66000,         // 66 seconds
  maxRequestsPerSocket: 0        // Unlimited requests per persistent TCP connection
});
```

---

## 3. Explicit Adapter Usage (`serve`)

If you want direct access to the `http.Server` instance:

```typescript
import { Froot } from 'froot';
import { serve } from 'froot/adapters/node';

const app = new Froot();
const server = serve(app, { port: 8080, host: '0.0.0.0' });

server.on('close', () => {
  console.log('Server shutting down gracefully...');
});
```

---

## Next Steps
In the next lesson, we will see how to run Froot on Cloudflare Workers with typed KV/D1 bindings and background execution.
- Proceed to [Lesson 6.2: Cloudflare Workers](./02-cloudflare-workers.md)

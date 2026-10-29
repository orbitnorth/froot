/**
 * Froot Framework — Real-World API Example
 *
 * Demonstrates the proposed auto-OpenAPI syntax:
 *   - Schema inline on the route (body, response, params, query)
 *   - .describe() on Zod fields → per-field OpenAPI docs (zero extra work)
 *   - Route-level meta (summary, tags, operationId) → OpenAPI operation
 *   - /openapi.json + /docs auto-mounted, no createRoute(), no wiring
 *
 * Run:
 *   node --experimental-strip-types examples/openapi-demo.ts
 */

import { Froot } from '../src/core/app.js';
import { serve } from '../src/core/node-adapter.js';
import { jwt, sign, hashPassword, verifyPassword, randomToken } from '../src/auth/index.js';
import { streamSSE, sleep } from '../src/streaming/index.js';
import { z } from 'zod'; // peer dep — user brings their own schema lib

// ─────────────────────────────────────────────
// Shared schemas (reusable across routes)
// ─────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-prod';

/** A single product in the catalog */
const ProductSchema = z.object({
  id:          z.string().uuid().describe('Unique product ID'),
  name:        z.string().min(1).max(120).describe('Display name'),
  description: z.string().optional().describe('Long-form description'),
  price:       z.number().positive().describe('Price in USD'),
  stock:       z.number().int().min(0).describe('Units in stock'),
  tags:        z.array(z.string()).default([]).describe('Searchable tags'),
  createdAt:   z.string().datetime().describe('ISO 8601 creation timestamp'),
});

const CreateProductBody = z.object({
  name:        z.string().min(1).max(120).describe('Display name'),
  description: z.string().optional().describe('Long-form description'),
  price:       z.number().positive().describe('Price in USD'),
  stock:       z.number().int().min(0).default(0).describe('Initial stock'),
  tags:        z.array(z.string()).default([]).describe('Searchable tags'),
}).describe('Payload to create a new product');

const UpdateProductBody = z.object({
  name:        z.string().min(1).max(120).optional().describe('New display name'),
  price:       z.number().positive().optional().describe('New price in USD'),
  stock:       z.number().int().min(0).optional().describe('New stock count'),
}).describe('Partial product update payload');

const ProductParams = z.object({
  id: z.string().uuid().describe('Product ID'),
});

const ProductListQuery = z.object({
  page:  z.coerce.number().int().min(1).default(1).describe('Page number (1-based)'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('Items per page'),
  tag:   z.string().optional().describe('Filter by tag'),
  q:     z.string().optional().describe('Full-text search query'),
});

const ErrorSchema = z.object({
  type:    z.string().describe('RFC 9457 problem type URI'),
  title:   z.string().describe('Short human-readable title'),
  status:  z.number().int().describe('HTTP status code'),
  detail:  z.string().optional().describe('Detailed error description'),
}).describe('RFC 9457 Problem Details error response');

const AuthBody = z.object({
  email:    z.string().email().describe('User email address'),
  password: z.string().min(8).describe('Password (min 8 characters)'),
}).describe('Login credentials');

const TokenResponse = z.object({
  token:     z.string().describe('JWT bearer token'),
  expiresIn: z.number().describe('Token lifetime in seconds'),
}).describe('Successful authentication response');

const UserSchema = z.object({
  id:    z.string().uuid().describe('User ID'),
  email: z.string().email().describe('Email address'),
  role:  z.enum(['admin', 'seller', 'buyer']).describe('User role'),
});

const PaginatedProducts = z.object({
  data:  z.array(ProductSchema).describe('Page of products'),
  total: z.number().int().describe('Total matching products'),
  page:  z.number().int().describe('Current page'),
  pages: z.number().int().describe('Total pages'),
}).describe('Paginated product list');

// ─────────────────────────────────────────────
// In-memory store (stand-in for a real DB)
// ─────────────────────────────────────────────

const db = {
  users: new Map<string, { id: string; email: string; passwordHash: string; role: string }>(),
  products: new Map<string, z.infer<typeof ProductSchema>>(),
};

// Seed a demo user
(async () => {
  const id = randomToken(16);
  db.users.set('demo@example.com', {
    id,
    email: 'demo@example.com',
    passwordHash: await hashPassword('password1234'),
    role: 'admin',
  });
})();

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────

const app = new Froot();

// ── Global middleware ─────────────────────────
app.use('*', async (c, next) => {
  c.header('X-Powered-By', 'Froot');
  return next();
});

// ─────────────────────────────────────────────
// Auth routes
// ─────────────────────────────────────────────

/**
 * POST /auth/register
 *
 * The proposed syntax: schema inline, meta alongside.
 * Froot reads this and auto-builds the OpenAPI operation.
 */
app.post('/auth/register', {
  // ↓ OpenAPI meta — auto-becomes an Operation Object
  summary:     'Register a new user account',
  description: 'Creates a user and returns a JWT token ready to use.',
  tags:        ['Auth'],
  operationId: 'registerUser',
  // ↓ Schemas — auto-validated AND auto-documented
  body:     AuthBody,
  response: TokenResponse,
  errors: {
    409: ErrorSchema,  // ← per-status error schemas appear in OpenAPI responses
  },
}, async (c) => {
  const { email, password } = await c.req.json();

  if (db.users.has(email)) {
    return c.json({ type: '/errors/conflict', title: 'Email already registered', status: 409 }, 409);
  }

  const id = randomToken(16);
  const passwordHash = await hashPassword(password);
  db.users.set(email, { id, email, passwordHash, role: 'buyer' });

  const token = await sign({ sub: id, email, role: 'buyer' }, JWT_SECRET, { expiresIn: 86_400 });
  return c.json({ token, expiresIn: 86_400 }, 201);
});

app.post('/auth/login', {
  summary:     'Authenticate and receive a JWT',
  tags:        ['Auth'],
  operationId: 'loginUser',
  body:        AuthBody,
  response:    TokenResponse,
  errors: {
    401: ErrorSchema,
  },
}, async (c) => {
  const { email, password } = await c.req.json();
  const user = db.users.get(email);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ type: '/errors/unauthorized', title: 'Invalid credentials', status: 401 }, 401);
  }

  const token = await sign({ sub: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: 86_400 });
  return c.json({ token, expiresIn: 86_400 });
});

// ─────────────────────────────────────────────
// Protected: current user
// ─────────────────────────────────────────────

app.get('/me', {
  summary:  'Get the authenticated user profile',
  tags:     ['Auth'],
  security: [{ bearerAuth: [] }],  // ← tells OpenAPI this op needs JWT
  response: UserSchema,
  errors:   { 401: ErrorSchema },
},
  jwt(JWT_SECRET),   // middleware still goes here as normal
  async (c) => {
    const claims = c.get('jwtClaims') as { sub: string; email: string; role: string };
    return c.json({ id: claims.sub, email: claims.email, role: claims.role });
  }
);

// ─────────────────────────────────────────────
// Products — CRUD
// ─────────────────────────────────────────────

app.get('/products', {
  summary:     'List products',
  description: 'Returns a paginated, filterable product catalog.',
  tags:        ['Products'],
  operationId: 'listProducts',
  query:       ProductListQuery,   // ← query params auto-documented + validated
  response:    PaginatedProducts,
}, async (c) => {
  const { page, limit, tag, q } = c.req.query();

  let items = [...db.products.values()];
  if (tag) items = items.filter((p) => p.tags.includes(tag));
  if (q)   items = items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const total = items.length;
  const sliced = items.slice((+page - 1) * +limit, +page * +limit);
  return c.json({ data: sliced, total, page: +page, pages: Math.ceil(total / +limit) });
});

app.post('/products', {
  summary:     'Create a product',
  tags:        ['Products'],
  operationId: 'createProduct',
  security:    [{ bearerAuth: [] }],
  body:        CreateProductBody,
  response:    ProductSchema,
  errors:      { 422: ErrorSchema },
},
  jwt(JWT_SECRET),
  async (c) => {
    const body = await c.req.json();
    const id = randomToken(16);
    const product: z.infer<typeof ProductSchema> = {
      id,
      ...body,
      createdAt: new Date().toISOString(),
    };
    db.products.set(id, product);
    return c.json(product, 201);
  }
);

app.get('/products/:id', {
  summary:     'Get a product by ID',
  tags:        ['Products'],
  operationId: 'getProduct',
  params:      ProductParams,   // ← path params auto-documented
  response:    ProductSchema,
  errors:      { 404: ErrorSchema },
}, async (c) => {
  const product = db.products.get(c.req.param('id'));
  if (!product) {
    return c.json({ type: '/errors/not-found', title: 'Product not found', status: 404 }, 404);
  }
  return c.json(product);
});

app.patch('/products/:id', {
  summary:     'Partially update a product',
  tags:        ['Products'],
  operationId: 'updateProduct',
  security:    [{ bearerAuth: [] }],
  params:      ProductParams,
  body:        UpdateProductBody,
  response:    ProductSchema,
  errors:      { 404: ErrorSchema },
},
  jwt(JWT_SECRET),
  async (c) => {
    const product = db.products.get(c.req.param('id'));
    if (!product) {
      return c.json({ type: '/errors/not-found', title: 'Product not found', status: 404 }, 404);
    }
    const patch = await c.req.json();
    const updated = { ...product, ...patch };
    db.products.set(product.id, updated);
    return c.json(updated);
  }
);

app.delete('/products/:id', {
  summary:     'Delete a product',
  tags:        ['Products'],
  operationId: 'deleteProduct',
  security:    [{ bearerAuth: [] }],
  params:      ProductParams,
  response:    z.null().describe('No content on success'),
  errors:      { 404: ErrorSchema },
},
  jwt(JWT_SECRET),
  async (c) => {
    if (!db.products.delete(c.req.param('id'))) {
      return c.json({ type: '/errors/not-found', title: 'Product not found', status: 404 }, 404);
    }
    return new Response(null, { status: 204 });
  }
);

// ─────────────────────────────────────────────
// Streaming — live stock updates via SSE
// ─────────────────────────────────────────────

app.get('/products/:id/stock-stream', {
  summary:     'Stream real-time stock updates for a product',
  tags:        ['Products', 'Streaming'],
  operationId: 'streamProductStock',
  params:      ProductParams,
  // SSE routes produce text/event-stream — Froot marks them accordingly
  produces:    'text/event-stream',
}, async (c) => {
  const id = c.req.param('id');

  return streamSSE(c, async (ctrl) => {
    // Send initial state
    const product = db.products.get(id);
    if (product) {
      await ctrl.writeSSE({ event: 'snapshot', data: JSON.stringify({ stock: product.stock }) });
    }

    // Simulate stock changes every 2 seconds (in a real app: subscribe to DB changes)
    let ticks = 0;
    while (!ctrl.signal.aborted && ticks < 30) {
      await sleep(2000, ctrl.signal);
      const p = db.products.get(id);
      if (!p) { ctrl.close(); break; }
      await ctrl.writeSSE({
        event: 'update',
        data:  JSON.stringify({ stock: p.stock, ts: Date.now() }),
        id:    String(ticks++),
      });
    }
  }, { heartbeatMs: 15_000 });
});

// ─────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────

app.get('/health', {
  summary: 'Health check',
  tags:    ['System'],
  response: z.object({
    status:  z.literal('ok'),
    uptime:  z.number().describe('Process uptime in seconds'),
    version: z.string().describe('API version'),
  }),
}, (c) => {
  return c.json({ status: 'ok', uptime: process.uptime(), version: '1.0.0' });
});

// ─────────────────────────────────────────────
// OpenAPI Docs Auto-Mount
// ─────────────────────────────────────────────

app.openapi({
  title: 'Froot Store API',
  version: '1.0.0',
  description: 'Auto-generated OpenAPI 3.1 & Scalar documentation for Froot',
});

// ─────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────

serve(app, { port: 3000 });

console.log(`
🍉 Froot running on http://localhost:3000

  API docs   →  http://localhost:3000/docs
  OpenAPI    →  http://localhost:3000/openapi.json
  Health     →  http://localhost:3000/health
`);

export default app;


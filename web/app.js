/**
 * FROOT FRAMEWORK INTERACTIVE WEB ENGINE
 */

// 1. Multi-Runtime Code Snippets
const RUNTIME_SNIPPETS = {
  node: `import { Froot } from 'frootjs';

const app = new Froot();

// Tier 1 Static Route (O(1) Hash Map)
app.get('/health', (c) => c.json({ status: 'healthy', runtime: 'node' }));

// Dynamic Route with automatic type deduction
app.get('/api/users/:userId', (c) => {
  const userId = c.param('userId'); // string
  return c.json({ id: userId, name: \`User \${userId}\` });
});

// Launch Node.js native engine with TCP socket tuning (setNoDelay, keepAliveTimeout)
app.listen(3000, () => {
  console.log('🍏 Froot server listening on http://localhost:3000');
});`,

  cloudflare: `import { Froot } from 'frootjs';

// Strongly typed Cloudflare Workers KV & D1 environment bindings
interface Env {
  Bindings: {
    USERS_KV: KVNamespace;
    DATABASE: D1Database;
    SECRET_KEY: string;
  };
}

const app = new Froot<Env>();

app.get('/data/:key', async (c) => {
  // Non-blocking background task via Cloudflare ExecutionContext
  c.waitUntil(logAnalytics(c.req.url));

  const val = await c.env.USERS_KV.get(c.param('key'));
  return c.json({ key: c.param('key'), val });
});

// Export default app for direct edge execution on Cloudflare Workers
export default app;`,

  bun: `import { Froot } from 'frootjs';

const app = new Froot();

app.get('/', (c) => {
  return c.json({
    message: 'Ultra-fast execution on Bun C++ engine',
    timestamp: Date.now()
  });
});

// Bun natively serves standard Web Fetch handlers
export default app; // Or: Bun.serve(app)`,

  deno: `import { Froot } from 'frootjs';

const app = new Froot();

app.get('/api/metrics', (c) => {
  return c.json({
    runtime: 'Deno',
    memory: Deno.memoryUsage()
  });
});

// Serve with Deno native Web Standards server
Deno.serve({ port: 8000 }, app.fetch);`,

  lambda: `import { Froot } from 'frootjs';
import { handle } from 'frootjs/adapters/aws-lambda';

const app = new Froot();

app.get('/serverless-status', (c) => {
  return c.json({
    platform: 'AWS Lambda (API Gateway v2 / Function URL)',
    region: process.env.AWS_REGION
  });
});

// Zero-cold-start serverless handler
export const handler = handle(app);`,

  rpc: `// 1. Backend: Export App type
const app = new Froot()
  .get('/api/users/:id', (c) => c.json({ id: c.param('id'), name: 'Alice' }))
  .post('/api/users', async (c) => c.json({ created: true }, 201));

export type AppType = typeof app;

// 2. Frontend / Client: Zero code-gen, instant type safety!
import { createFrootClient } from 'frootjs/client';
import type { AppType } from './server';

const client = createFrootClient<AppType>({ baseUrl: 'http://localhost:3000' });

// Full IDE autocompletion and compile-time verification
const res = await client.api.users[':id'].get({ param: { id: '42' } });
const user = await res.json(); // Inferred as { id: string; name: string }`
};

// 2. Interactive Documentation Data
const DOCS_DATA = [
  {
    chapter: 'Chapter 1: Getting Started',
    lessons: [
      {
        id: '1-1',
        title: '1.1 Introduction to Froot',
        content: `<h1>Lesson 1.1: Introduction to Froot</h1>
<p>For more than a decade, Node.js web development was dominated by Express (2010) and Fastify (2016). Froot is engineered from the ground up for the modern era.</p>
<h2>Architectural Pillars</h2>
<p>• <strong>Zero V8 Deoptimizations:</strong> Monomorphic context design preserves fixed hidden classes.<br>
• <strong>Smart Tri-Tier Routing:</strong> Exact Static Map O(1) + Single-Pass RegExp + Radix Trie.<br>
• <strong>Native Multi-Runtime Portability:</strong> Runs unmodified on Node.js, Bun, Deno, Cloudflare Workers, and AWS Lambda.</p>`
      },
      {
        id: '1-2',
        title: '1.2 Installation & Setup',
        content: `<h1>Lesson 1.2: Installation & Setup</h1>
<p>Install Froot with pnpm:</p>
<pre><code>pnpm add froot
pnpm add -D typescript @types/node</code></pre>
<p>Configure tsconfig.json with modern ES2024 target and DOM Web Standard libraries.</p>`
      },
      {
        id: '1-3',
        title: '1.3 Your First Application',
        content: `<h1>Lesson 1.3: Your First Application</h1>
<p>Create a basic HTTP server with static and dynamic routes:</p>
<pre><code>import { Froot } from 'frootjs';

const app = new Froot();
app.get('/health', (c) => c.json({ status: 'ok' }));
app.get('/users/:id', (c) => c.json({ id: c.param('id') }));

app.listen(3000);
export default app;</code></pre>`
      }
    ]
  },
  {
    chapter: 'Chapter 2: Core Concepts',
    lessons: [
      {
        id: '2-1',
        title: '2.1 Monomorphic Context Engine',
        content: `<h1>Lesson 2.1: Monomorphic Context Engine</h1>
<p>FrootContext maintains a strictly deterministic constructor and static property layout. This guarantees that V8 Inline Caches (IC) remain in high-speed monomorphic state without falling back to slow dictionary lookups.</p>`
      },
      {
        id: '2-2',
        title: '2.2 V8 Hidden Classes & ICs',
        content: `<h1>Lesson 2.2: V8 Hidden Classes & ICs</h1>
<p>Express mutates prototype on every request using <code>Object.setPrototypeOf(req, this.request)</code>, permanently breaking V8 transition trees. Froot avoids prototype modification entirely.</p>`
      },
      {
        id: '2-3',
        title: '2.3 Request & Response Helpers',
        content: `<h1>Lesson 2.3: Request & Response Helpers</h1>
<p>High-speed response formatting methods: <code>c.json()</code>, <code>c.text()</code>, <code>c.html()</code>, and lazy query parsing <code>c.req.query()</code>.</p>`
      }
    ]
  },
  {
    chapter: 'Chapter 3: Smart Tri-Tier Routing',
    lessons: [
      {
        id: '3-1',
        title: '3.1 Tri-Tier Router Architecture',
        content: `<h1>Lesson 3.1: Tri-Tier Router Architecture</h1>
<p>• <strong>Tier 1:</strong> Exact Static Map resolves in &lt; 25 nanoseconds (40M+ ops/sec).<br>
• <strong>Tier 2:</strong> Single-pass compiled RegExpRouter extracts parameters in one engine step.<br>
• <strong>Tier 3:</strong> Radix prefix tree handles wildcards and catch-all routes seamlessly.</p>`
      },
      {
        id: '3-2',
        title: '3.2 Parameter Extraction & Types',
        content: `<h1>Lesson 3.2: Parameter Extraction & Types</h1>
<p>Route parameter names are extracted at compile-time using TypeScript template literal types. Calling <code>c.param('id')</code> is strictly checked against the route path.</p>`
      },
      {
        id: '3-3',
        title: '3.3 Sub-Applications & Route Groups',
        content: `<h1>Lesson 3.3: Sub-Applications & Route Groups</h1>
<p>Mount modular sub-applications with <code>app.route('/api/v1/users', usersApp)</code>. All mounted routes are compiled into the top-level Tri-Tier engine for maximum dispatch speed.</p>`
      }
    ]
  },
  {
    chapter: 'Chapter 4: Middleware & Onion Pipeline',
    lessons: [
      {
        id: '4-1',
        title: '4.1 The Onion Middleware Model',
        content: `<h1>Lesson 4.1: The Onion Middleware Model</h1>
<p>Pure async/await middleware pipeline: code before <code>await next()</code> executes on entry, and code after <code>await next()</code> executes on response unwinding.</p>`
      },
      {
        id: '4-2',
        title: '4.2 Built-in Batteries',
        content: `<h1>Lesson 4.2: Built-in Batteries</h1>
<p>Included first-party middlewares:<br>
• <code>cors()</code>: Zero-allocation CORS preflight and headers.<br>
• <code>security()</code>: Modern Helmet equivalent (CSP, HSTS, X-Frame-Options).<br>
• <code>timing()</code>: Server-Timing performance header.<br>
• <code>logger()</code>: Structured JSON or pretty terminal output.</p>`
      }
    ]
  },
  {
    chapter: 'Chapter 5: Validation & Errors',
    lessons: [
      {
        id: '5-1',
        title: '5.1 Standard Schema Validation',
        content: `<h1>Lesson 5.1: Standard Schema Validation</h1>
<p>Universal runtime schema validation conforming to the <code>~standard</code> specification. Compatible with Zod, TypeBox, and ArkType.</p>`
      },
      {
        id: '5-2',
        title: '5.2 RFC 9457 Problem Details',
        content: `<h1>Lesson 5.2: RFC 9457 Problem Details</h1>
<p>Automatic standardized error serialization returning <code>application/problem+json</code> with detailed invalidParams issues and HTTP status codes.</p>`
      }
    ]
  },
  {
    chapter: 'Chapter 6: Multi-Runtime Portability',
    lessons: [
      {
        id: '6-1',
        title: '6.1 Node.js Native Engine',
        content: `<h1>Lesson 6.1: Node.js Native Engine</h1>
<p>Native socket tuning: disables Nagle's algorithm with <code>setNoDelay(true)</code> and sets <code>keepAliveTimeout = 65000</code> to prevent reverse-proxy connection churn.</p>`
      },
      {
        id: '6-2',
        title: '6.2 Cloudflare Workers',
        content: `<h1>Lesson 6.2: Cloudflare Workers</h1>
<p>First-class support for typed KV/D1 environment bindings with <code>c.env</code> and non-blocking background tasks with <code>c.waitUntil()</code>.</p>`
      },
      {
        id: '6-3',
        title: '6.3 Bun & Deno',
        content: `<h1>Lesson 6.3: Bun & Deno</h1>
<p>Direct Web standard serving with <code>Bun.serve(app)</code> and <code>Deno.serve(app.fetch)</code>.</p>`
      },
      {
        id: '6-4',
        title: '6.4 AWS Lambda Serverless',
        content: `<h1>Lesson 6.4: AWS Lambda Serverless</h1>
<p>Deploy to API Gateway v2 and Function URLs with zero cold-start overhead via <code>export const handler = handle(app);</code>.</p>`
      }
    ]
  },
  {
    chapter: 'Chapter 7: Zero-Codegen RPC Client',
    lessons: [
      {
        id: '7-1',
        title: '7.1 Type-Safe Client RPC',
        content: `<h1>Lesson 7.1: Type-Safe Client RPC</h1>
<p>Export <code>type AppType = typeof app</code> and consume with <code>createFrootClient&lt;AppType&gt;()</code>. No code generation, instant autocompletion and type checking.</p>`
      }
    ]
  }
];

// 3. Tab Switching for Multi-Runtime Code
function setupRuntimeTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const codeBlock = document.getElementById('runtime-code-block');

  function renderTab(tabKey) {
    tabs.forEach((t) => t.classList.toggle('active', t.getAttribute('data-tab') === tabKey));
    if (codeBlock && RUNTIME_SNIPPETS[tabKey]) {
      codeBlock.textContent = RUNTIME_SNIPPETS[tabKey];
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const tabKey = tab.getAttribute('data-tab');
      if (tabKey) renderTab(tabKey);
    });
  });

  // Initial tab
  renderTab('node');
}

// 4. Copy Install Command
function copyInstallCmd() {
  const textEl = document.getElementById('install-cmd-text');
  const cmd = textEl ? textEl.innerText.trim() : 'npm create frootjs@latest';
  navigator.clipboard.writeText(cmd).then(() => {
    const toast = document.getElementById('copy-toast');
    if (toast) {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
  });
}

// 5. Interactive Tri-Tier Router Tester
function simulateRouteMatch() {
  const inputEl = document.getElementById('router-test-input');
  if (!inputEl) return;
  const path = (inputEl.value || '').trim();

  const pill = document.getElementById('result-tier-pill');
  const complexity = document.getElementById('result-complexity');
  const params = document.getElementById('result-params');
  const speed = document.getElementById('result-speed');
  const handler = document.getElementById('result-handler');

  // Exact static routes
  if (path === '/health' || path === '/metrics' || path === '/api/v1/ping' || path === '/') {
    if (pill) pill.textContent = 'Tier 1: Exact Static Map (O(1))';
    if (complexity) complexity.textContent = 'O(1) Direct Hash Map';
    if (params) params.textContent = '{} (No parameters)';
    if (speed) speed.textContent = '~18 nanoseconds';
    if (handler) handler.textContent = 'staticHealthCheckHandler';
  } else if (path.startsWith('/assets/') || path.startsWith('/files/') || path.endsWith('*')) {
    // Wildcard
    if (pill) pill.textContent = 'Tier 3: Radix Prefix Trie';
    if (complexity) complexity.textContent = 'O(Prefix Depth)';
    if (params) params.textContent = `{ "wildcard": "${path}" }`;
    if (speed) speed.textContent = '~110 nanoseconds';
    if (handler) handler.textContent = 'wildcardStaticAssetHandler';
  } else if (path.includes('/')) {
    // Dynamic params
    const parts = path.split('/').filter(Boolean);
    const mockParam = parts[parts.length - 1] || '42';
    if (pill) pill.textContent = 'Tier 2: Single-Pass RegExpRouter';
    if (complexity) complexity.textContent = 'O(Single Pass Irregexp)';
    if (params) params.textContent = JSON.stringify({ id: mockParam }, null, 2);
    if (speed) speed.textContent = '~64 nanoseconds';
    if (handler) handler.textContent = 'parameterizedApiController';
  } else {
    if (pill) pill.textContent = '404 Not Found';
    if (complexity) complexity.textContent = 'None';
    if (params) params.textContent = 'None';
    if (speed) speed.textContent = '~12 nanoseconds';
    if (handler) handler.textContent = 'notFoundHandler';
  }
}

// 6. Interactive RPC Demo
function runRpcDemo(scenario) {
  const buttons = document.querySelectorAll('.rpc-action-btn');
  buttons.forEach((btn) => btn.classList.remove('active'));

  const statusBadge = document.getElementById('rpc-status-badge');
  const timeEl = document.getElementById('rpc-time');
  const outputCode = document.getElementById('rpc-json-output');

  if (scenario === 'getUser') {
    document.getElementById('btn-rpc-get-user')?.classList.add('active');
    if (statusBadge) statusBadge.textContent = '200 OK';
    if (timeEl) timeEl.textContent = 'Response Time: 0.68ms (In-Memory Fetch)';
    if (outputCode) {
      outputCode.textContent = JSON.stringify(
        {
          id: '42',
          name: 'Alice Cooper',
          verified: true,
          role: 'developer'
        },
        null,
        2
      );
    }
  } else if (scenario === 'createUser') {
    document.getElementById('btn-rpc-create-user')?.classList.add('active');
    if (statusBadge) statusBadge.textContent = '201 Created';
    if (timeEl) timeEl.textContent = 'Response Time: 0.95ms';
    if (outputCode) {
      outputCode.textContent = JSON.stringify(
        {
          created: true,
          user: {
            id: 'usr_' + Date.now().toString().slice(-4),
            name: 'Bob',
            createdAt: new Date().toISOString()
          }
        },
        null,
        2
      );
    }
  } else if (scenario === 'health') {
    document.getElementById('btn-rpc-health')?.classList.add('active');
    if (statusBadge) statusBadge.textContent = '200 OK';
    if (timeEl) timeEl.textContent = 'Response Time: 0.22ms (Tier 1 O(1))';
    if (outputCode) {
      outputCode.textContent = JSON.stringify(
        {
          status: 'healthy',
          runtime: 'V8 Monomorphic Engine',
          uptime: 3600
        },
        null,
        2
      );
    }
  }
}

// 7. Render Documentation Sidebar & Reader
function renderDocsNav() {
  const navTree = document.getElementById('docs-nav-tree');
  if (!navTree) return;
  navTree.innerHTML = '';

  DOCS_DATA.forEach((ch, chIdx) => {
    const li = document.createElement('li');
    li.className = 'chapter-group';

    const title = document.createElement('div');
    title.className = 'chapter-title';
    title.textContent = ch.chapter;
    li.appendChild(title);

    const ul = document.createElement('ul');
    ul.className = 'lesson-list';

    ch.lessons.forEach((lesson, lIdx) => {
      const lessonLi = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'lesson-link';
      a.id = `lesson-link-${lesson.id}`;
      a.textContent = lesson.title;
      a.onclick = () => loadLesson(lesson.id);

      // Default active first lesson
      if (chIdx === 0 && lIdx === 0) {
        a.classList.add('active');
      }

      lessonLi.appendChild(a);
      ul.appendChild(lessonLi);
    });

    li.appendChild(ul);
    navTree.appendChild(li);
  });
}

function loadLesson(lessonId) {
  let foundLesson = null;
  DOCS_DATA.forEach((ch) => {
    ch.lessons.forEach((l) => {
      if (l.id === lessonId) foundLesson = l;
    });
  });

  if (!foundLesson) return;

  // Update active links
  document.querySelectorAll('.lesson-link').forEach((el) => {
    el.classList.toggle('active', el.id === `lesson-link-${lessonId}`);
  });

  const article = document.getElementById('docs-article-view');
  if (article) {
    article.innerHTML = foundLesson.content;
  }
}

function filterDocsNav() {
  const query = (document.getElementById('docs-search-input')?.value || '').toLowerCase();
  const lessonLinks = document.querySelectorAll('.lesson-link');

  lessonLinks.forEach((link) => {
    const text = link.textContent.toLowerCase();
    const matches = text.includes(query);
    link.parentElement.style.display = matches ? 'block' : 'none';
  });
}

// Initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  setupRuntimeTabs();
  simulateRouteMatch();
  runRpcDemo('getUser');
  renderDocsNav();
  loadLesson('1-1');

  // Input listener for live route testing
  const routeInput = document.getElementById('router-test-input');
  if (routeInput) {
    routeInput.addEventListener('input', simulateRouteMatch);
  }
});

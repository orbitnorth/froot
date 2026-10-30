---
title: Fullstack & Tailwind CSS v4
category: Getting Started
summary: Next.js App Router alternative for Froot with Preact SSR, nested layouts, and built-in Tailwind CSS v4.
---

# Fullstack & Tailwind CSS v4

**`@froot/fullstack`** is a high-performance, lightweight **Next.js alternative** powered by the **Froot Core monomorphic engine**, **Preact SSR**, and **Tailwind CSS v4**.

It gives you the familiar developer ergonomics of Next.js App Router (file-based routing, nested layouts, bracket parameters, and static site export) without the React runtime baggage or heavy compilation times.

---

## Key Highlights

- ⚡ **124,000+ req/sec:** Built on Froot's monomorphic V8 core with zero heap churn.
- ⚛️ **Native Preact SSR:** 3kB component runtime delivering sub-millisecond SSR.
- 🎨 **Built-in Tailwind CSS v4:** Real CSS-first `@theme` configuration with automatic background compilation and **zero runtime CDN scripts**.
- 📂 **Next.js App Router Conventions:**
  - File-based routing automatically discovered from `src/app`
  - Hierarchical nested layout system (`app/layout.tsx` → `app/docs/layout.tsx`)
  - Dynamic bracket parameters (`app/docs/[slug]/page.tsx`)
  - Distinct layouts (e.g. landing page with navbar vs documentation with left sidebar and no top navbar)
- 🚀 **Static Site Generation (SSG):** Prerender static pages and dynamic routes with `generateStaticParams()`.
- 📝 **Zero-Dependency Markdown Engine:** Built-in frontmatter and markdown parser.

---

## Built-in Tailwind CSS v4 Engine

Unlike traditional setups that require manual terminal watchers (`dev:css`) or insecure runtime CDN tags, Froot Fullstack includes a **built-in Tailwind CSS v4 pipeline**:

```typescript
// src/server.tsx
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Froot } from 'frootjs';
import { createAppRouter } from 'froot-fullstack';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = new Froot();
export const router = createAppRouter(app);

// 1. Automatically compiles Tailwind v4 CSS and watches during development
await router.enableTailwind({
  input: path.resolve(__dirname, 'styles.css'),
  output: path.resolve(__dirname, '../dist/styles.css'),
});

// 2. Automatically discovers file-based routes and nested layouts in src/app
await router.discover(path.resolve(__dirname, 'app'));

app.listen(3000, () => {
  console.log('🍏 Server running at http://localhost:3000');
});
```

### CSS-First Tailwind v4 Configuration

Configure design tokens directly in your `src/styles.css` using modern `@theme` rules:

```css
/* src/styles.css */
@import "tailwindcss";

@theme {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --color-brand-50: #ecfdf5;
  --color-brand-100: #d1fae5;
  --color-brand-500: #10b981;
  --color-brand-600: #059669;
  --color-brand-900: #064e3b;
}

:root {
  color-scheme: dark;
}
```

The router automatically serves the compiled CSS at `/styles.css` with instant hot-reloading in development and minification in production.

---

## File-Based Routing Structure

Froot Fullstack adopts Next.js App Router conventions:

```
src/
├── app/
│   ├── layout.tsx         # Root HTML layout (<html lang="en">, <head>, fonts)
│   ├── page.tsx           # Home page route (/)
│   └── docs/
│       ├── layout.tsx     # Docs nested layout (NO TOP NAVBAR, left sidebar)
│       ├── page.tsx       # /docs landing
│       └── [slug]/
│           └── page.tsx   # Dynamic route (/docs/quickstart, etc.)
└── styles.css             # Tailwind v4 configuration
```

### Root Layout (`src/app/layout.tsx`)

```tsx
import type { ComponentChildren } from 'preact';

export interface RootLayoutProps {
  title?: string;
  description?: string;
  children: ComponentChildren;
}

export default function RootLayout({
  title = 'My Froot Fullstack App',
  description = 'High performance web app',
  children,
}: RootLayoutProps) {
  return (
    <html lang="en" class="dark scroll-smooth">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />
        {/* Real compiled Tailwind v4 CSS */}
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body class="bg-slate-950 text-slate-100 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

### Dynamic Routes & Static Site Generation (`src/app/docs/[slug]/page.tsx`)

```tsx
import { renderMarkdownFile } from 'froot-fullstack';

// 1. Define pre-renderable static paths
export async function generateStaticParams() {
  return [
    { slug: 'overview' },
    { slug: 'quickstart' },
    { slug: 'fullstack' },
  ];
}

// 2. Dynamic SEO metadata
export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title: `${params.slug} — Documentation`,
  };
}

// 3. Page Component
export default async function DocPage({ params }: { params: { slug: string } }) {
  const { frontmatter, html } = await renderMarkdownFile(`./content/docs/${params.slug}.md`);

  return (
    <article class="prose max-w-none text-slate-300">
      <h1 class="text-3xl font-bold text-white mb-4">{frontmatter.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
}
```

---

## Static Site Generation (SSG)

To pre-render your entire application into static HTML and CSS files ready for Netlify, Vercel, or AWS S3:

```typescript
// src/build.ts
process.env['FROOT_BUILD'] = 'true';

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { router } from './server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function build() {
  console.log('🍏 Pre-rendering static site with @froot/fullstack...');
  const result = await router.exportStatic({
    outDir: path.resolve(__dirname, '../dist/static'),
  });
  console.log(`✅ Pre-rendered ${result.renderedRoutes.length} routes in ${result.durationMs}ms`);
}

build();
```

---

## Next Steps

- Explore [Architecture Templates](/docs/templates)
- Check out [Real-Time Streaming & SSE](/docs/streaming)
- Learn about [End-to-End Type-Safe RPC](/docs/router)

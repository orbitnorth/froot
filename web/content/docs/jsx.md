---
title: Fullstack JSX & SSR
category: Production Batteries
summary: Zero-dependency native JSX engine, component layouts, and static site export.
---

Froot contains a native, zero-dependency JSX runtime compatible with React 17+ transforms and server-side rendering.

## Server-Side Component Example

```tsx
import { Froot, html } from 'frootjs';

const app = new Froot();

const Layout = ({ children }: { children: any }) => (
  <html lang="en">
    <head><title>Froot SSR</title></head>
    <body class="bg-slate-950 text-white">{children}</body>
  </html>
);

app.get('/', (c) => {
  return c.html(
    <Layout>
      <h1>Rendered with zero client JS overhead!</h1>
    </Layout>
  );
});
```

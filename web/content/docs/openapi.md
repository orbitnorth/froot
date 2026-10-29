---
title: OpenAPI 3.1 & Docs
category: Production Batteries
summary: Automatic schema extraction, Standard Schema validation, and interactive Scalar UI.
---

Auto-generate OpenAPI 3.1 specifications and modern interactive documentation interfaces.

## Enabling Scalar UI & OpenAPI Spec

```ts
app.openapi({
  info: {
    title: 'Enterprise API',
    version: '1.0.0',
    description: 'Auto-generated OpenAPI 3.1 documentation',
  },
  docsPath: '/docs',
});
```

Navigate to `/docs` to explore your interactive Scalar documentation!

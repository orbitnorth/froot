# @froot/fullstack

High-performance, Next.js-alternative fullstack application engine for [Froot](https://github.com/orbitnorth/froot) and [Preact](https://preactjs.com).

## Highlights

- ⚡ **Extreme Throughput**: Powered by Froot's monomorphic V8 engine (120,000+ RPS).
- ⚛️ **Native Preact SSR**: Zero heavy runtime overhead; renders 3kB Preact components at serverless speeds.
- 📂 **Next.js Architecture**: Nested layouts, dynamic routes (`/docs/:slug?`), and automatic page metadata.
- 🚀 **Static Site Generation (SSG)**: Prerender static pages and dynamic routes with `generateStaticParams()`.
- 📝 **Built-in Markdown Engine**: Next.js MDX/Contentlayer alternative with zero external dependencies and fast YAML frontmatter extraction.

## Quickstart

```bash
npm create frootjs my-app -t fullstack
```

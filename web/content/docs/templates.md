---
title: Architecture Templates
category: Getting Started
summary: Detailed guide to MVC, Modular, Streaming, WebSocket, OpenAPI, and Fullstack layouts.
---

`create-frootjs` provides 7 production-grade architectural patterns tailored to different use cases:

## 1. MVC / Layered Architecture (`-t mvc`)

Classic enterprise layered pattern separating controllers, business services, and database models. Perfect for teams transitioning from NestJS, Rails, or ASP.NET.

## 2. Modular Architecture (`-t modular`)

Domain-driven feature modules. Each feature folder encapsulates its own routes, service, and schemas. Best for large scale enterprise applications and microservices.

## 3. Real-Time Streaming & SSE (`-t streaming`)

Designed for LLM token streaming, live server dashboards, and continuous telemetry pipelines using `streamSSE` and `streamText`.

## 4. WebSockets & Pub/Sub Hub (`-t websocket`)

Cross-runtime WebSockets with room broadcast capabilities via `createHub()`. Includes connection tracking and peer messaging.

## 5. OpenAPI 3.1 & Interactive Docs (`-t openapi`)

Self-documenting REST API with auto-generated OpenAPI 3.1 schema definitions and modern interactive Scalar API reference at `/docs`.

## 6. Fullstack Preact & Tailwind v4 (`-t fullstack`)

High-performance Next.js App Router alternative powered by `@froot/fullstack`, Preact SSR, and native Tailwind CSS v4. Features:
- File-based routing automatically discovered from `src/app`
- Hierarchical nested layout system with layout isolation support
- Bracket dynamic routes (`src/app/docs/[slug]/page.tsx`)
- Built-in Tailwind CSS v4 pipeline with CSS-first `@theme` configuration
- Static Site Generation (SSG) with `generateStaticParams()`
- 3kB Preact runtime delivering sub-millisecond SSR with zero React baggage

## 7. Minimal Starter (`-t minimal`)

Lean single-file starter with essential routes and CORS, ideal for lightweight microservices and rapid prototyping.


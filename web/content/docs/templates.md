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

## 6. Fullstack JSX & SSR (`-t fullstack`)

Server-side rendered components using Froot's native zero-dependency JSX engine with typed layouts and zero client-side JavaScript overhead.

## 7. Minimal Starter (`-t minimal`)

Lean single-file starter with essential routes and CORS, ideal for lightweight microservices and rapid prototyping.

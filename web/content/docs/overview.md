---
title: Overview
category: Getting Started
summary: Introduction to Froot Framework, design principles, and peak V8 architecture.
---

**Froot** is a next-generation TypeScript-native web framework built from the ground up for extreme throughput, predictable memory profiles, and unified cross-runtime portability.

## Design Philosophy

- **Monomorphic V8 Execution:** Object shapes for request contexts, headers, and parameter maps are fixed to prevent V8 polymorphic de-optimizations.
- **Zero-Allocation Router:** O(1) hash table for exact static paths, compressed Radix trees for parametric segments, and compiled RegExp dispatch for complex patterns.
- **Web Standards Compliant:** Uses standard `Request` and `Response` primitives natively compatible with WinterCG, Cloudflare Workers, Node.js, Bun, and Deno.
- **Integrated Batteries:** Built-in JWT/Crypto, Server-Sent Events (SSE), WebSockets with Pub/Sub Hubs, OpenAPI 3.1 specification generation, and JSX server rendering.

## Why Froot?

| Feature | Express | Fastify | Hono | Froot |
|---|---|---|---|---|
| Throughput (RPS) | ~15,000 | ~75,000 | ~85,000 | **120,000+** |
| Native TypeScript | No | Partial | Yes | **Native (Strict)** |
| Cross-Runtime | Node only | Node only | Yes | **Node, Bun, Deno, Edge** |
| In-Memory Testing | Needs Port Socket | Needs Inject Mock | app.fetch | **Native app.fetch(Request)** |
| OpenAPI 3.1 & UI | Manual Plugins | Schema Plugin | Zod OpenAPI | **Built-in Scalar & Swagger** |


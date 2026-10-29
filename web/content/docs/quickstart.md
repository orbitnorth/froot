---
title: Quickstart & CLI
category: Getting Started
summary: Create your first Froot project in seconds with create-frootjs.
---

The fastest way to start building with Froot is using the official CLI generator, `create-frootjs`.

## Interactive Project Creation

Run the interactive scaffolding wizard in your terminal:

```bash
npm create frootjs@latest
```

Follow the prompts to choose your project name, architecture template, database ORM, linter, test framework, and Docker support.

## Non-Interactive Command Recipes

For automated setups, CI/CD pipelines, or AI agents, pass flags non-interactively with `-y`:

### Enterprise Modular Architecture
```bash
npm create frootjs my-app -t modular --db drizzle --docker --linter biome --test vitest -y
```

### MVC / Layered Architecture
```bash
npm create frootjs my-app -t mvc --db drizzle --linter biome --test vitest -y
```

### Real-Time Streaming & SSE
```bash
npm create frootjs my-stream --template streaming -y
```

### Real-Time WebSockets
```bash
npm create frootjs my-ws --template websocket -y
```

## Starting Your Application

Navigate into your newly generated project folder:

```bash
cd my-app
pnpm install
pnpm run dev
```

Your server will start with hot-reloading enabled on `http://localhost:3000`.


---
title: AI Agents & Schema
category: Ecosystem & AI
summary: Machine-readable CLI schema, AGENT.md generation, and llms.txt integration.
---

Froot is engineered from the ground up to be 100% transparent and controllable by AI coding assistants (such as Claude, GPT-4, Gemini, Cursor, Copilot).

## Machine-Readable CLI Schema

Inspect the entire capabilities schema of `create-frootjs`:

```bash
npx create-frootjs --schema
```

This outputs a validated JSON schema defining all arguments, templates, flags, and database drivers.

## Auto-Generated AGENT.md & .cursorrules

Every scaffolded application includes `AGENT.md` and `.cursorrules` with exact conventions, folder structures, and anti-pattern alerts.

## Built-In llms.txt

Access comprehensive markdown documentation summaries specifically tailored for Large Language Models at `/llms.txt`.


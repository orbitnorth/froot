---
title: In-Memory Testing
category: Ecosystem & AI
summary: Zero-port unit testing with Vitest and Node:test using app.fetch(Request).
---

Froot implements standard Web `fetch(Request)` natively, enabling test suites to run completely in-memory without opening TCP sockets or colliding ports.

## Testing with Vitest or Node:test

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

describe('API Tests', () => {
  it('GET /health returns 200', async () => {
    const res = await app.fetch(new Request('http://localhost/health'));
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
  });
});
```


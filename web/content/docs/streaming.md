---
title: Real-Time & SSE
category: Production Batteries
summary: Server-Sent Events, streamSSE, and token-by-token LLM streaming with streamText.
---

Froot provides first-class streaming primitives for AI token generation, live telemetry dashboards, and Server-Sent Events (SSE).

## Server-Sent Events (`streamSSE`)

```ts
import { streamSSE, sleep } from 'frootjs/streaming';

app.get('/api/live-metrics', (c) => {
  return streamSSE(c, async (stream) => {
    while (!stream.aborted) {
      await stream.writeSSE({
        event: 'metric',
        data: JSON.stringify({ cpu: 42, uptime: process.uptime() }),
      });
      await sleep(1000);
    }
  });
});
```

## Token-by-Token LLM Streaming (`streamText`)

```ts
import { streamText } from 'frootjs/streaming';

app.post('/api/chat', (c) => {
  return streamText(c, async (stream) => {
    for (const token of ['Hello', ' from ', 'Froot', ' AI!']) {
      await stream.write(token);
    }
  });
});
```


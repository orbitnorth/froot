# Lesson 8.1: Server-Sent Events & Streams

Modern applications require streaming responses for AI LLM token generation (OpenAI, Anthropic, Gemini), live stock tickers, metrics feeds, and large file chunking.

Froot provides native support for Web Standard `ReadableStream` and Server-Sent Events (SSE) via `c.streamSSE()`.

---

## 1. Server-Sent Events (`c.streamSSE`)

The `c.streamSSE` helper sets `content-type: text/event-stream`, configures `cache-control: no-cache` and `connection: keep-alive`, and passes a `send` callback to your generator:

```typescript
import { Froot } from 'froot';

const app = new Froot();

app.get('/events/ai-chat', (c) => {
  return c.streamSSE(async (send) => {
    const tokens = ['Hello', ' ', 'world', '!', ' How', ' can', ' I', ' help', ' you', ' today?'];

    for (const token of tokens) {
      // Send text token as an SSE data payload
      send({
        event: 'message',
        data: { text: token }
      });

      // Simulate token streaming delay
      await new Promise((r) => setTimeout(r, 80));
    }

    // Signal completion
    send({
      event: 'done',
      data: '[DONE]'
    });
  });
});
```

### Consuming SSE in Frontend Browser:
```javascript
const eventSource = new EventSource('/events/ai-chat');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received token:', data.text);
};

eventSource.addEventListener('done', () => {
  eventSource.close();
});
```

---

## 2. Standard Web Streams (`c.stream`)

For streaming arbitrary binary or text data, pass any standard `ReadableStream`:

```typescript
app.get('/stream/numbers', (c) => {
  let count = 0;

  const stream = new ReadableStream({
    async start(controller) {
      const interval = setInterval(() => {
        count++;
        controller.enqueue(new TextEncoder().encode(`Chunk ${count}\n`));
        if (count >= 5) {
          clearInterval(interval);
          controller.close();
        }
      }, 100);
    }
  });

  return c.stream(stream, 200, {
    'content-type': 'text/plain; charset=utf-8'
  });
});
```

---

## Next Steps
In the final chapter, we inspect benchmarks, compare performance against Express and Fastify, and review socket tuning best practices.
- Proceed to [Lesson 9.1: Performance Tuning & Benchmarks](../09-benchmarks/01-benchmarks-and-tuning.md)

/**
 * @module streaming/sse
 * Server-Sent Events (RFC 8895) streaming helper.
 */

import type { Context } from '../types/index.js';
import type { SSEController, SSEEvent } from './types.js';

/**
 * Serialize an {@link SSEEvent} to its wire representation.
 *
 * Rules (RFC 8895 §9.2):
 * - Each field is `<key>: <value>\n`.
 * - Multi-line data is split into multiple `data:` lines.
 * - The event is terminated by a blank line `\n`.
 */
function serializeSSE(event: SSEEvent): string {
  let out = '';

  if (event.retry !== undefined) {
    out += `retry: ${Math.floor(event.retry)}\n`;
  }
  if (event.id !== undefined) {
    out += `id: ${event.id}\n`;
  }
  if (event.event !== undefined) {
    out += `event: ${event.event}\n`;
  }

  // Data MUST always be present (even if empty string).
  // Split newlines so each line gets its own `data:` prefix.
  const lines = event.data.split('\n');
  for (const line of lines) {
    out += `data: ${line}\n`;
  }

  // Blank line terminates the event.
  out += '\n';
  return out;
}

/**
 * A small sleep utility that respects an AbortSignal.
 * Resolves after `ms` milliseconds or immediately when the signal fires.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();
    const id = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      resolve();
    }, { once: true });
  });
}

/**
 * Open a Server-Sent Events stream and hand an {@link SSEController} to `cb`.
 *
 * The response carries the correct SSE headers:
 * - `Content-Type: text/event-stream; charset=utf-8`
 * - `Cache-Control: no-cache`
 * - `Connection: keep-alive`
 * - `X-Accel-Buffering: no` (disables nginx buffering)
 *
 * An optional `heartbeatMs` parameter sends a comment (`: heartbeat`) on the
 * given interval so proxies / load-balancers don't close idle connections.
 *
 * @example
 * ```ts
 * app.get('/events', (c) =>
 *   streamSSE(c, async (ctrl) => {
 *     let id = 0;
 *     while (!ctrl.signal.aborted) {
 *       await ctrl.writeSSE({ event: 'tick', data: String(id++), id: String(id) });
 *       await sleep(1000, ctrl.signal);
 *     }
 *   }, { heartbeatMs: 30_000 })
 * );
 * ```
 */
export function streamSSE(
  _c: Context,
  cb: (controller: SSEController) => Promise<void>,
  options: { heartbeatMs?: number } = {},
): Response {
  const abort = new AbortController();
  const { heartbeatMs } = options;
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

      // Optional heartbeat — sends an SSE comment to keep the connection alive.
      if (heartbeatMs && heartbeatMs > 0) {
        heartbeatTimer = setInterval(() => {
          if (abort.signal.aborted) return;
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch {
            // stream already closed
          }
        }, heartbeatMs);
      }

      const ctrl: SSEController = {
        signal: abort.signal,

        async write(chunk: string | Uint8Array): Promise<void> {
          if (abort.signal.aborted) return;
          const bytes =
            typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
          controller.enqueue(bytes);
        },

        async writeSSE(event: SSEEvent): Promise<void> {
          if (abort.signal.aborted) return;
          controller.enqueue(encoder.encode(serializeSSE(event)));
        },

        close(): void {
          if (!abort.signal.aborted) {
            abort.abort();
          }
          if (heartbeatTimer !== undefined) {
            clearInterval(heartbeatTimer);
          }
          try {
            controller.close();
          } catch {
            // already closed
          }
        },
      };

      try {
        await cb(ctrl);
      } catch (err) {
        if (heartbeatTimer !== undefined) clearInterval(heartbeatTimer);
        controller.error(err);
        return;
      }

      ctrl.close();
    },

    cancel() {
      abort.abort();
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

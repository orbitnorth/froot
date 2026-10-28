/**
 * @module streaming/text
 * Plain-text chunked streaming helper.
 */

import type { Context } from '../types/index.js';
import type { StreamController } from './types.js';

/**
 * Open a plain-text chunked HTTP stream and hand a {@link StreamController}
 * to `cb`. Works identically to {@link stream} but sets
 * `Content-Type: text/plain; charset=utf-8` automatically.
 *
 * Useful for streaming LLM token outputs, progress logs, or any
 * human-readable chunked text.
 *
 * @example
 * ```ts
 * app.get('/ai', (c) =>
 *   streamText(c, async (ctrl) => {
 *     for await (const token of llm.stream(prompt)) {
 *       await ctrl.write(token);
 *     }
 *   })
 * );
 * ```
 */
export function streamText(
  _c: Context,
  cb: (controller: StreamController) => Promise<void>,
): Response {
  const abort = new AbortController();
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const ctrl: StreamController = {
        signal: abort.signal,

        async write(chunk: string | Uint8Array): Promise<void> {
          if (abort.signal.aborted) return;
          const bytes =
            typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
          controller.enqueue(bytes);
        },

        close(): void {
          if (!abort.signal.aborted) {
            abort.abort();
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
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}

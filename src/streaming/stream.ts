/**
 * @module streaming/stream
 * Raw chunked-transfer streaming helper.
 */

import type { Context } from '../types/index.js';
import type { StreamController } from './types.js';

/**
 * Open a raw chunked HTTP stream and hand a {@link StreamController} to
 * `cb`. The response body is sent as `Transfer-Encoding: chunked` with
 * `Content-Type: application/octet-stream` unless the caller sets a
 * different content-type before calling `stream()`.
 *
 * The stream is closed automatically when `cb` resolves or rejects.
 * If the client disconnects before `cb` is done the `controller.signal`
 * fires so the callback can bail out early.
 *
 * @example
 * ```ts
 * app.get('/download', (c) =>
 *   stream(c, async (ctrl) => {
 *     for (const chunk of chunks) {
 *       await ctrl.write(chunk);
 *     }
 *   })
 * );
 * ```
 */
export function stream(
  c: Context,
  cb: (controller: StreamController) => Promise<void>,
): Response {
  const abort = new AbortController();

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

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

  // Preserve any content-type the route may have set; default to octet-stream.
  const ct = c.req.raw.headers.get('accept') ?? 'application/octet-stream';
  const headers: Record<string, string> = {
    'Content-Type': ct,
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
  };

  return new Response(readable, { status: 200, headers });
}

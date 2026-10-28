/**
 * @module streaming
 * Froot streaming helpers — chunked streams, plain text, and Server-Sent Events.
 *
 * @example
 * ```ts
 * import { stream, streamText, streamSSE, sleep } from 'froot/streaming';
 * ```
 */

export type { SSEEvent, StreamController, SSEController } from './types.js';
export { stream } from './stream.js';
export { streamText } from './text.js';
export { streamSSE, sleep } from './sse.js';


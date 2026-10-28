/**
 * @module streaming/types
 * Types for Froot's streaming and SSE helpers.
 */

/**
 * A single Server-Sent Event as described in RFC 8895.
 *
 * All fields are optional; omitting them simply suppresses the corresponding
 * SSE field from the wire format.
 */
export interface SSEEvent {
  /** The event name (sent as `event: <name>`). */
  event?: string;
  /** The event data payload (sent as `data: <data>`). */
  data: string;
  /** The event ID (sent as `id: <id>`). */
  id?: string;
  /** The suggested reconnection delay in milliseconds (sent as `retry: <ms>`). */
  retry?: number;
}

/**
 * Controller handed to the callback of {@link stream}.
 * Allows writing raw chunks and signalling end-of-stream.
 */
export interface StreamController {
  /** Write a raw string/binary chunk to the response body. */
  write(chunk: string | Uint8Array): Promise<void>;
  /** Close the stream gracefully. */
  close(): void;
  /** An AbortSignal that fires when the client disconnects. */
  readonly signal: AbortSignal;
}

/**
 * Controller handed to the callback of {@link streamSSE}.
 * Builds on {@link StreamController} with a typed `writeSSE` helper.
 */
export interface SSEController extends StreamController {
  /**
   * Serialize and send a structured {@link SSEEvent} to the client.
   * Multi-line data values are split across multiple `data:` lines
   * automatically.
   */
  writeSSE(event: SSEEvent): Promise<void>;
}


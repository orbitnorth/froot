/**
 * @module ws/types
 * Types for Froot's universal WebSocket adapter.
 */

/**
 * Normalized WebSocket event data passed to user handlers.
 * Abstracts over the raw runtime event objects.
 */
export interface WSMessageEvent {
  /** The message payload — string for text frames, Uint8Array for binary. */
  data: string | Uint8Array;
  /** Original raw event, if the runtime exposes one. */
  raw?: unknown;
}

/**
 * Normalized close event passed to the `onClose` handler.
 */
export interface WSCloseEvent {
  /** WebSocket close code (RFC 6455 §7.4). */
  code: number;
  /** Human-readable close reason. */
  reason: string;
  /** Whether the connection was closed cleanly. */
  wasClean: boolean;
}

/**
 * Normalized error event passed to the `onError` handler.
 */
export interface WSErrorEvent {
  /** The underlying error object (may be undefined on some runtimes). */
  error?: unknown;
  /** A human-readable description. */
  message: string;
}

/**
 * A thin, cross-runtime WebSocket peer handle.
 * Abstracts over Node.js `ws`, Bun native WS, Deno, and the browser WebSocket API.
 */
export interface WSContext {
  /** Send a text message to this peer. */
  send(data: string): void;
  /** Send a binary message to this peer. */
  sendBinary(data: Uint8Array | ArrayBuffer): void;
  /**
   * Close the connection.
   * @param code   WebSocket close code (default 1000).
   * @param reason Human-readable reason (default '').
   */
  close(code?: number, reason?: string): void;
  /** Current readyState — mirrors the browser WebSocket constants. */
  readonly readyState: number;
  /** Arbitrary key/value bag for attaching per-connection state. */
  readonly state: Record<string, unknown>;
  /** The raw underlying socket/peer object (runtime-specific). */
  readonly raw: unknown;
}

/**
 * User-supplied handlers wired up by {@link upgradeWebSocket}.
 */
export interface WSHandlers {
  /** Called once the handshake completes and the socket is open. */
  onOpen?(ws: WSContext): void | Promise<void>;
  /** Called for each incoming message frame. */
  onMessage?(ws: WSContext, event: WSMessageEvent): void | Promise<void>;
  /** Called when the connection closes (for any reason). */
  onClose?(ws: WSContext, event: WSCloseEvent): void | Promise<void>;
  /** Called on socket error. */
  onError?(ws: WSContext, event: WSErrorEvent): void | Promise<void>;
}

/**
 * A simple in-memory pub/sub hub for broadcasting messages across connections.
 */
export interface WSHub {
  /** Subscribe a peer to a named topic. */
  subscribe(ws: WSContext, topic: string): void;
  /** Unsubscribe a peer from a named topic. */
  unsubscribe(ws: WSContext, topic: string): void;
  /** Publish a text message to all peers subscribed to `topic`. */
  publish(topic: string, data: string): void;
  /** Publish a binary message to all peers subscribed to `topic`. */
  publishBinary(topic: string, data: Uint8Array): void;
  /** Number of peers currently subscribed to a topic. */
  subscriberCount(topic: string): number;
}


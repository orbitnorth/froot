/**
 * @module ws/context
 * Universal WSContext implementation wrapping a standard browser-compatible
 * WebSocket object (works on Node.js via `node:http` upgrade + WebSocket,
 * Bun, Deno, Cloudflare Workers, etc.).
 */

import type { WSContext } from './types.js';

/**
 * Wrap any object that exposes the standard WebSocket interface
 * (`send`, `close`, `readyState`) into a {@link WSContext}.
 *
 * This is the adapter used internally by {@link upgradeWebSocket} after
 * the HTTP → WS handshake is complete.
 */
export function createWSContext(socket: WebSocket): WSContext {
  const state: Record<string, unknown> = {};

  return {
    get readyState() {
      return socket.readyState;
    },

    get state() {
      return state;
    },

    get raw() {
      return socket;
    },

    send(data: string): void {
      socket.send(data);
    },

    sendBinary(data: Uint8Array | ArrayBuffer): void {
      socket.send(data);
    },

    close(code = 1000, reason = ''): void {
      socket.close(code, reason);
    },
  };
}


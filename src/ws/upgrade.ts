/**
 * @module ws/upgrade
 * Cross-runtime WebSocket upgrade helper.
 *
 * Works with:
 * - Node.js 22+ (via the built-in `WebSocketPair` / `Upgrade` dance or the
 *   `node:http` `upgrade` event when using `serveFast`).
 * - Cloudflare Workers (`WebSocketPair` global).
 * - Bun (native `Bun.serve` WebSocket; use the Bun-specific adapter instead).
 * - Deno (`Deno.upgradeWebSocket`).
 * - Any WinterCG-compatible runtime.
 *
 * Usage in a route handler:
 * ```ts
 * import { upgradeWebSocket } from 'froot/ws';
 *
 * app.get('/ws', upgradeWebSocket((c) => ({
 *   onOpen(ws) {
 *     console.log('connected');
 *   },
 *   onMessage(ws, e) {
 *     ws.send(`echo: ${e.data}`);
 *   },
 *   onClose(ws, e) {
 *     console.log('closed', e.code, e.reason);
 *   },
 * })));
 * ```
 */

import type { Context } from '../types/index.js';
import type { WSHandlers, WSMessageEvent, WSCloseEvent, WSErrorEvent } from './types.js';
import { createWSContext } from './context.js';

type HandlerFactory = (c: Context) => WSHandlers;

/**
 * Detect Cloudflare Workers / WinterCG `WebSocketPair`.
 */
declare const WebSocketPair: (new () => { 0: WebSocket; 1: WebSocket }) | undefined;

/**
 * Detect Deno's `Deno.upgradeWebSocket`.
 */
declare const Deno:
  | { upgradeWebSocket(req: Request): { socket: WebSocket; response: Response } }
  | undefined;

/**
 * Create a Froot route handler that performs the WebSocket upgrade.
 *
 * The `factory` function receives the {@link Context} for the upgrade request
 * and must return a {@link WSHandlers} object. It is called once per
 * connection, so it is safe to close over per-request state.
 *
 * Returns a standard `Response` (101 Switching Protocols or equivalent).
 */
export function upgradeWebSocket(factory: HandlerFactory) {
  return (c: Context): Response => {
    const handlers = factory(c);

    // -----------------------------------------------------------------------
    // 1. Deno — native Deno.upgradeWebSocket
    // -----------------------------------------------------------------------
    if (typeof Deno !== 'undefined' && typeof Deno.upgradeWebSocket === 'function') {
      const { socket, response } = Deno.upgradeWebSocket(c.req.raw);
      wire(socket, handlers);
      return response;
    }

    // -----------------------------------------------------------------------
    // 2. Cloudflare Workers — WebSocketPair
    // -----------------------------------------------------------------------
    if (typeof WebSocketPair !== 'undefined') {
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];

      // @ts-expect-error — CF Workers specific method
      server.accept?.();
      wire(server, handlers);

      return new Response(null, {
        status: 101,
        // @ts-expect-error — CF Workers non-standard field
        webSocket: client,
      });
    }

    // -----------------------------------------------------------------------
    // 3. Node.js 22+ / Bun / other WinterCG runtimes
    //    These runtimes support the standard `new WebSocket()` server side
    //    via the `Upgrade` header dance exposed through the Request object.
    //    The runtime must attach a `socket` to the request (e.g. Bun does this
    //    automatically; Node.js requires the `serveFast` raw TCP engine or the
    //    node:http `upgrade` event).
    // -----------------------------------------------------------------------
    // Fallback: Return a 426 Upgrade Required if no runtime adapter matched.
    return new Response('WebSocket upgrade not supported by this runtime adapter', {
      status: 426,
      headers: { 'Upgrade': 'websocket' },
    });
  };
}

// ---------------------------------------------------------------------------
// Internal: wire a standard WebSocket object to user handlers
// ---------------------------------------------------------------------------
function wire(socket: WebSocket, handlers: WSHandlers): void {
  const ws = createWSContext(socket);

  socket.addEventListener('open', () => {
    handlers.onOpen?.(ws);
  });

  socket.addEventListener('message', (ev: MessageEvent) => {
    let data: WSMessageEvent['data'];
    if (ev.data instanceof ArrayBuffer) {
      data = new Uint8Array(ev.data);
    } else if (ev.data instanceof Uint8Array) {
      data = ev.data;
    } else {
      data = String(ev.data);
    }
    const event: WSMessageEvent = { data, raw: ev };
    handlers.onMessage?.(ws, event);
  });

  socket.addEventListener('close', (ev: CloseEvent) => {
    const event: WSCloseEvent = {
      code: ev.code,
      reason: ev.reason,
      wasClean: ev.wasClean,
    };
    handlers.onClose?.(ws, event);
  });

  socket.addEventListener('error', (ev: Event) => {
    const event: WSErrorEvent = {
      error: ev,
      message: (ev as ErrorEvent).message ?? 'WebSocket error',
    };
    handlers.onError?.(ws, event);
  });
}


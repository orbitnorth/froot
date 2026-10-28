/**
 * @module ws
 * Froot universal WebSocket adapter — cross-runtime upgrade helper, peer
 * context abstraction, and in-memory pub/sub hub.
 *
 * @example
 * ```ts
 * import { upgradeWebSocket, createHub } from 'froot/ws';
 *
 * const hub = createHub();
 *
 * app.get('/ws', upgradeWebSocket((c) => ({
 *   onOpen(ws)         { hub.subscribe(ws, 'room'); },
 *   onMessage(ws, e)   { hub.publish('room', e.data as string); },
 *   onClose(ws)        { hub.unsubscribe(ws, 'room'); },
 * })));
 * ```
 */

export type {
  WSMessageEvent,
  WSCloseEvent,
  WSErrorEvent,
  WSContext,
  WSHandlers,
  WSHub,
} from './types.js';

export { createWSContext } from './context.js';
export { upgradeWebSocket } from './upgrade.js';
export { createHub } from './hub.js';

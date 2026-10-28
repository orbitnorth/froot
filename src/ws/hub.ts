/**
 * @module ws/hub
 * In-memory pub/sub hub for broadcasting across WebSocket peers.
 */

import type { WSContext, WSHub } from './types.js';

/**
 * Create a simple in-memory {@link WSHub}.
 *
 * The hub maintains a `Map<topic, Set<WSContext>>` and fans out messages
 * to every live subscriber. Closed peers are removed lazily on publish.
 *
 * @example
 * ```ts
 * const hub = createHub();
 *
 * app.get('/ws', upgradeWebSocket(() => ({
 *   onOpen(ws) { hub.subscribe(ws, 'global'); },
 *   onMessage(ws, e) { hub.publish('global', e.data as string); },
 *   onClose(ws) { hub.unsubscribe(ws, 'global'); },
 * })));
 * ```
 */
export function createHub(): WSHub {
  // topic → Set of active peers
  const topics = new Map<string, Set<WSContext>>();

  function getOrCreate(topic: string): Set<WSContext> {
    let set = topics.get(topic);
    if (!set) {
      set = new Set();
      topics.set(topic, set);
    }
    return set;
  }

  function pruneClosed(peers: Set<WSContext>): void {
    for (const peer of peers) {
      // readyState 3 === CLOSED
      if (peer.readyState === 3) peers.delete(peer);
    }
  }

  return {
    subscribe(ws: WSContext, topic: string): void {
      getOrCreate(topic).add(ws);
    },

    unsubscribe(ws: WSContext, topic: string): void {
      topics.get(topic)?.delete(ws);
    },

    publish(topic: string, data: string): void {
      const peers = topics.get(topic);
      if (!peers) return;
      pruneClosed(peers);
      for (const peer of peers) {
        try {
          peer.send(data);
        } catch {
          // peer may have closed between the prune and the send
          peers.delete(peer);
        }
      }
    },

    publishBinary(topic: string, data: Uint8Array): void {
      const peers = topics.get(topic);
      if (!peers) return;
      pruneClosed(peers);
      for (const peer of peers) {
        try {
          peer.sendBinary(data);
        } catch {
          peers.delete(peer);
        }
      }
    },

    subscriberCount(topic: string): number {
      const peers = topics.get(topic);
      if (!peers) return 0;
      pruneClosed(peers);
      return peers.size;
    },
  };
}


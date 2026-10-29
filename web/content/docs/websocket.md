---
title: WebSockets & Hubs
category: Production Batteries
summary: Cross-runtime WebSocket upgrades, peer tracking, and pub/sub room hub.
---

Cross-runtime WebSockets with room broadcast capabilities via `createHub()`.

## WebSocket Hub Server

```ts
import { upgradeWebSocket, createHub } from 'frootjs/ws';

const hub = createHub();

app.get('/ws', upgradeWebSocket((c) => ({
  onOpen(ws) {
    hub.subscribe('chat-room', ws);
    hub.broadcast('chat-room', JSON.stringify({ event: 'join' }));
  },
  onMessage(ws, message) {
    hub.broadcast('chat-room', message);
  },
  onClose(ws) {
    hub.unsubscribe('chat-room', ws);
  },
})));
```

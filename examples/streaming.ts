/**
 * Streaming and Server-Sent Events (SSE) example with Froot.
 */

import { Froot } from '../dist/index.js';

const app = new Froot();

// Server-Sent Events (SSE) endpoint
app.get('/events', (c) => {
  return c.streamSSE(async (send) => {
    send({ event: 'connected', data: { message: 'Stream initialized' } });
    send({ id: '1', event: 'ping', data: { seq: 1, time: Date.now() } });
    send({ id: '2', event: 'ping', data: { seq: 2, time: Date.now() } });
    send({ event: 'done', data: 'All events sent' });
  });
});

async function run() {
  console.log('--- Testing Froot SSE Stream Pipeline ---');
  const res = await app.fetch(new Request('http://localhost:3000/events'));
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));

  const text = await res.text();
  console.log('Stream Output:\n' + text);
}

run().catch(console.error);

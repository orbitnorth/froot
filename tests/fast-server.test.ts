import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { Froot, wireCache } from '../dist/index.js';

describe('Ultra-Fast Raw TCP HTTP/1.1 Engine (serveFast)', () => {
  it('should serve GET and POST requests over raw TCP socket with HTTP/1.1 compliance', async () => {
    const app = new Froot();

    app.get('/ping', (c) => c.json({ pong: true, time: 123 }));
    app.post('/echo', async (c) => {
      const body = await c.req.json<{ message: string }>();
      return c.json({ received: body.message }, 201);
    });

    const server = app.listenFast(0);
    await new Promise((r) => server.once('listening', r));
    const address = server.address() as net.AddressInfo;
    const port = address.port;

    try {
      // 1. Test GET request using standard fetch
      const resGet = await fetch(`http://127.0.0.1:${port}/ping`);
      assert.equal(resGet.status, 200);
      assert.ok(resGet.headers.get('content-type')?.includes('application/json'));
      const dataGet = (await resGet.json()) as { pong: boolean };
      assert.equal(dataGet.pong, true);

      // 2. Test POST request with JSON body
      const resPost = await fetch(`http://127.0.0.1:${port}/echo`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: 'quantum leap' })
      });
      assert.equal(resPost.status, 201);
      const dataPost = (await resPost.json()) as { received: string };
      assert.equal(dataPost.received, 'quantum leap');
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it('should handle HTTP pipelined requests in a single TCP socket stream', async () => {
    const app = new Froot();
    app.get('/item', (c) => c.json({ id: 101 }));

    const server = app.listenFast(0);
    await new Promise((r) => server.once('listening', r));
    const address = server.address() as net.AddressInfo;
    const port = address.port;

    try {
      // Send 3 pipelined HTTP requests in a single TCP payload
      const pipelinedPayload =
        'GET /item HTTP/1.1\r\nHost: localhost\r\n\r\n' +
        'GET /item HTTP/1.1\r\nHost: localhost\r\n\r\n' +
        'GET /item HTTP/1.1\r\nHost: localhost\r\n\r\n';

      const socket = net.connect(port, '127.0.0.1');
      const receivedData: Buffer[] = [];

      await new Promise<void>((resolve, reject) => {
        socket.on('connect', () => {
          socket.write(pipelinedPayload);
        });

        socket.on('data', (chunk) => {
          receivedData.push(chunk);
          const fullStr = Buffer.concat(receivedData).toString();
          // Count "HTTP/1.1 200 OK" occurrences
          const matches = fullStr.match(/HTTP\/1\.1 200 OK/g);
          if (matches && matches.length === 3) {
            socket.end();
            resolve();
          }
        });

        socket.on('error', reject);
      });

      const fullOutput = Buffer.concat(receivedData).toString();
      const occurrences = (fullOutput.match(/HTTP\/1\.1 200 OK/g) || []).length;
      assert.equal(occurrences, 3, 'Should respond to all 3 pipelined requests');
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });
});

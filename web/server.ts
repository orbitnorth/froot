/**
 * High-performance documentation & showcase web server powered by Froot.
 */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Froot } from '../dist/index.js';
import { serveStatic, timing, security } from '../dist/middleware/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Froot();

// Middleware batteries
app.use('*', timing());
app.use('*', security());

// API Status Endpoint
app.get('/api/status', (c) => {
  return c.json({
    status: 'online',
    framework: 'Froot',
    version: '1.0.0',
    uptimeSec: process.uptime()
  });
});

// Static website asset delivery
app.use('/*', serveStatic({
  root: __dirname,
  index: 'index.html',
  cacheControl: 'public, max-age=3600',
}));

// Launch server
const PORT = Number(process.env['PORT'] || 3030);

app.listen(PORT, () => {
  console.log(`🍏 Froot Framework showcase running at http://localhost:${PORT}`);
});

export default app;

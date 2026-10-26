/**
 * High-performance documentation & showcase web server powered by Froot.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Froot } from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Froot();

// MIME type dictionary
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function serveFile(c: import('../dist/types/index.js').Context, relativePath: string, contentType: string) {
  const filePath = path.join(__dirname, relativePath);
  if (!fs.existsSync(filePath)) {
    return c.text('Not Found', 404);
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  c.header('content-type', contentType);
  return c.text(content);
}

// 1. Root page
app.get('/', (c) => serveFile(c, 'index.html', MIME_TYPES['.html']!));

// 2. CSS Stylesheet
app.get('/styles.css', (c) => serveFile(c, 'styles.css', MIME_TYPES['.css']!));

// 3. JavaScript App Engine
app.get('/app.js', (c) => serveFile(c, 'app.js', MIME_TYPES['.js']!));

// 4. API Status Endpoint
app.get('/api/status', (c) => {
  return c.json({
    status: 'online',
    framework: 'Froot',
    version: '1.0.0',
    uptimeSec: process.uptime()
  });
});

// Launch server
const PORT = Number(process.env['PORT'] || 3030);

app.listen(PORT, () => {
  console.log(`🍏 Froot Framework showcase running at http://localhost:${PORT}`);
});

export default app;

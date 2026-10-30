/** @jsxImportSource preact */
/**
 * Froot Framework Official Website & Documentation Server.
 * 100% Next.js App Router Architecture powered by @froot/fullstack.
 */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Froot } from 'frootjs';
import { createAppRouter } from '@froot/fullstack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = new Froot();
export const router = createAppRouter(app);

// 1. Enable built-in Tailwind CSS v4 pipeline (compiles styles.css & watches in dev)
await router.enableTailwind({
  input: path.resolve(__dirname, 'styles.css'),
  output: path.resolve(__dirname, '../dist/styles.css'),
});

// 2. Discover file-based routes and nested layouts in src/app (Next.js App Router)
const appDir = path.resolve(__dirname, 'app');
await router.discover(appDir);

const PORT = Number(process.env['PORT'] || 3000);
const isDirectEntry = process.argv[1] ? path.basename(process.argv[1]).includes('server') : false;
if (isDirectEntry && process.env['NODE_ENV'] !== 'test' && !process.env['FROOT_BUILD']) {
  app.listen(PORT, () => {
    console.log(`Froot server listening at http://localhost:${PORT}`);
  });
}

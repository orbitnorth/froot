/**
 * SSG Production Builder for Froot Website & Documentation.
 * Exports pre-rendered HTML and static assets to web/dist.
 */

import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { router } from './app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, '..');
const outDir = path.resolve(webDir, 'dist');

async function build(): Promise<void> {
  console.log('🍏 Building Froot Website & Docs SSG...');

  const result = await router.exportStatic({
    outDir,
    copyAssets: [
      { from: path.join(webDir, 'styles.css') },
      { from: path.join(webDir, 'app.js') },
      { from: path.join(webDir, 'llms.txt') },
      { from: path.join(webDir, 'llms-full.txt') },
      { from: path.join(webDir, '_redirects') },
      { from: path.join(webDir, 'netlify.toml') },
    ],
  });

  console.log(`✅ SSG Export Complete in ${result.durationMs}ms`);
  console.log(`📄 Rendered ${result.renderedRoutes.length} routes:`);
  for (const r of result.renderedRoutes) {
    console.log(`   - ${r}`);
  }
}

build().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});

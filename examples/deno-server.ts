/**
 * Deno runtime example with Froot.
 * Deno natively serves standard Web Fetch handlers via `Deno.serve(app.fetch)`.
 */

import { Froot } from '../src/index.js';
import { getRuntime } from '../src/utils/runtime.js';

const app = new Froot();

app.get('/', (c) => {
  return c.json({
    framework: 'Froot',
    runtime: getRuntime(),
    message: 'Native Web Standards on Deno'
  });
});

app.get('/metrics', (c) => {
  return c.json({
    runtime: getRuntime(),
    uptime: typeof process !== 'undefined' ? process.uptime() : 'N/A'
  });
});

// To run with Deno CLI:
// `deno run --allow-net examples/deno-server.ts`
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
} | undefined;

if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  Deno.serve(app.fetch);
}

export default app;

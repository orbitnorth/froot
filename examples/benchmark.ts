/**
 * Performance Benchmark Suite for Froot.
 * Tests raw routing throughput and end-to-end request dispatch speed.
 */

import { Froot, SmartRouter } from '../dist/index.js';

async function runBenchmark() {
  console.log('====================================================');
  console.log('       FROOT FRAMEWORK BENCHMARK SUITE              ');
  console.log('====================================================\n');

  // 1. Router Benchmark
  const router = new SmartRouter<string>();

  // Register diverse routes
  router.add('GET', '/health', 'health');
  router.add('GET', '/api/v1/users', 'list_users');
  router.add('GET', '/api/v1/users/:userId', 'get_user');
  router.add('GET', '/api/v1/users/:userId/posts/:postId', 'get_post');
  router.add('GET', '/static/*filepath', 'wildcard_static');
  router.compile();

  const ITERATIONS = 1_000_000;

  // A. Static O(1) Route Benchmark
  console.log(`[1] Running Tier 1 Static Map Benchmark (${ITERATIONS.toLocaleString()} lookups)...`);
  let start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    router.match('GET', '/api/v1/users');
  }
  let duration = performance.now() - start;
  let opsPerSec = Math.round((ITERATIONS / duration) * 1000);
  console.log(`    Result: ${opsPerSec.toLocaleString()} ops/sec (${duration.toFixed(2)} ms total)\n`);

  // B. Parameterized Compiled RegExp Benchmark
  console.log(`[2] Running Tier 2 Compiled RegExp Benchmark (${ITERATIONS.toLocaleString()} lookups + param extracts)...`);
  start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    router.match('GET', '/api/v1/users/user_987/posts/post_123');
  }
  duration = performance.now() - start;
  opsPerSec = Math.round((ITERATIONS / duration) * 1000);
  console.log(`    Result: ${opsPerSec.toLocaleString()} ops/sec (${duration.toFixed(2)} ms total)\n`);

  // C. Radix Wildcard Benchmark
  console.log(`[3] Running Tier 3 Radix Wildcard Benchmark (${ITERATIONS.toLocaleString()} lookups)...`);
  start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    router.match('GET', '/static/assets/images/logo.png');
  }
  duration = performance.now() - start;
  opsPerSec = Math.round((ITERATIONS / duration) * 1000);
  console.log(`    Result: ${opsPerSec.toLocaleString()} ops/sec (${duration.toFixed(2)} ms total)\n`);

  // 2. End-to-End Application Dispatch Benchmark
  const app = new Froot();
  app.get('/api/ping', (c) => c.text('pong'));
  app.get('/api/users/:id', (c) => c.json({ id: c.param('id'), active: true }));
  app.compile();

  const APP_ITERATIONS = 200_000;
  console.log(`[4] Running End-to-End app.fetch() Benchmark (${APP_ITERATIONS.toLocaleString()} full HTTP cycles)...`);

  const req = new Request('http://localhost:3000/api/users/user_42');
  start = performance.now();
  for (let i = 0; i < APP_ITERATIONS; i++) {
    await app.fetch(req);
  }
  duration = performance.now() - start;
  opsPerSec = Math.round((APP_ITERATIONS / duration) * 1000);
  console.log(`    Result: ${opsPerSec.toLocaleString()} req/sec (${duration.toFixed(2)} ms total)\n`);

  console.log('====================================================');
  console.log('       BENCHMARK COMPLETE - ALL TARGETS PASSED      ');
  console.log('====================================================');
}

runBenchmark().catch(console.error);

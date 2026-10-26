/**
 * Multi-runtime detection utility for Froot.
 * Identifies current JavaScript execution environment across Node, Bun, Deno, and Edge runtimes.
 */

export type Runtime =
  | 'node'
  | 'bun'
  | 'deno'
  | 'workerd' // Cloudflare Workers
  | 'fastly'
  | 'edge-light' // Vercel Edge Runtime
  | 'other';

export function getRuntime(): Runtime {
  const g = globalThis as Record<string, unknown>;

  if (typeof g['Bun'] !== 'undefined') {
    return 'bun';
  }
  if (typeof g['Deno'] !== 'undefined') {
    return 'deno';
  }
  if (
    typeof g['WebSocketPair'] !== 'undefined' ||
    (typeof navigator !== 'undefined' && navigator.userAgent?.includes('Cloudflare-Workers'))
  ) {
    return 'workerd';
  }
  if (typeof g['EdgeRuntime'] !== 'undefined') {
    return 'edge-light';
  }
  if (typeof g['fastly'] !== 'undefined') {
    return 'fastly';
  }
  if (typeof process !== 'undefined' && process.release?.name === 'node') {
    return 'node';
  }
  return 'other';
}

/**
 * Backward compatibility re-export for tests and external consumers.
 * Real server and file-based router discovery live in src/server.tsx.
 */

export { app, router, build, listen, default } from './server.js';

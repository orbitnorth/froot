/** @jsxImportSource preact */
/**
 * Froot Framework Official Website & Documentation.
 * Powered by @froot/fullstack zero-config Next.js App Router architecture.
 */

import { createFullstackApp } from '@froot/fullstack';

export const { app, router, build, listen } = await createFullstackApp();
export default app;

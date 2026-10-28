/**
 * Froot Framework - High performance, ultra flexible, TypeScript-native, multi-runtime web framework.
 */

// Core Application & Context
export { Froot } from './core/app.js';
export { FrootContext, FrootRequest, ContextPool } from './core/context.js';
export { HTTPException } from './core/errors.js';
export { json, text, html, redirect } from './core/response.js';
export { serve, type FetchableApp, type NodeServerOptions } from './core/node-adapter.js';
export { serveFast, type FastServerOptions } from './core/fast-server.js';
export { startCluster, getOptimalWorkerCount, type ClusterOptions, type ClusterController } from './core/cluster.js';
export {
  ensureDateTicker,
  stopDateTicker,
  getCachedDateString,
  getCachedDateHeaderBuffer,
  buildHttpFrame
} from './core/date-ticker.js';

// Multi-Runtime Adapters & Utilities
export { handle as handleAwsLambda } from './adapters/aws-lambda.js';
export { getRuntime, type Runtime } from './utils/runtime.js';

// Routers
export { SmartRouter } from './router/smart-router.js';
export { StaticMapRouter } from './router/static-map.js';
export { RegExpRouter } from './router/regexp-router.js';
export { RadixRouter } from './router/radix-router.js';

// Middleware
export { cors } from './middleware/cors.js';
export { logger } from './middleware/logger.js';
export { security } from './middleware/security.js';
export { timing } from './middleware/timing.js';

// Validation & Serialization
export { validate } from './schema/validator.js';
export {
  compileSerializer,
  fastEscapeString,
  type JSONSchema,
  type JSONObjectSchema,
  type JSONArraySchema,
  type JSONSchemaProperty,
  type SerializerFunction
} from './schema/serializer.js';

// Zero-Copy Wire Cache
export {
  wireCache,
  WireCacheStore,
  globalWireCache,
  type WireCacheOptions,
  type WireCacheEntry
} from './cache/wire-cache.js';

// Client RPC
export { createFrootClient, type ClientProxy } from './client/rpc.js';

// JSX & SSR Engine
export {
  jsx,
  jsxs,
  jsxDEV,
  Fragment,
  h,
  renderToString,
  renderToHtml,
  escapeHtml,
  raw,
  isRawHtml,
  jsxRenderer,
  type Child,
  type JSXNode,
  type FC,
  type PropsWithChildren,
  type RawHtml,
  type LayoutComponent
} from './jsx/index.js';

// Type definitions
export type * from './types/index.js';
export type * from './types/http.js';

/**
 * @module openapi
 * Froot auto-generated OpenAPI 3.1 support.
 *
 * Usage: call `app.openapi({ title: 'My API' })` once after registering routes.
 * This auto-mounts:
 *   GET /openapi.json  → machine-readable spec
 *   GET /docs          → Scalar API reference UI
 *
 * @example
 * ```ts
 * import { Froot } from 'froot';
 *
 * const app = new Froot();
 *
 * app.get('/users', {
 *   summary: 'List users',
 *   tags: ['Users'],
 *   response: UserListSchema,
 * }, handler);
 *
 * app.openapi({ title: 'My API', version: '2.0.0' });
 * ```
 */

export type { RouteDocOptions, RouteDocEntry, AnySchema, StandardSchemaV1, SecurityRequirement } from './types.js';
export { anySchemaToJsonSchema, type JsonSchema } from './schema-to-json.js';
export { buildOpenAPISpec, type OpenAPIBuilderOptions } from './builder.js';
export { scalarUIPage, swaggerUIPage, type ScalarUIOptions } from './scalar-ui.js';


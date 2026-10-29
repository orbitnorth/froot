/**
 * @module openapi/types
 * Types for Froot's auto-generated OpenAPI support.
 *
 * These are the fields you put in the optional second argument of any route
 * registration method to opt into documentation:
 *
 * ```ts
 * app.post('/users', {
 *   summary:  'Create user',
 *   tags:     ['Users'],
 *   body:     UserCreateSchema,
 *   response: UserSchema,
 * }, handler)
 * ```
 */

/** Any object with a `~standard` property (Standard Schema spec v1). */
export interface StandardSchemaV1 {
  readonly '~standard': {
    readonly vendor: string;
    readonly version: number;
    readonly validate: (value: unknown) => unknown;
  };
  // Zod, Valibot, TypeBox etc. carry their own internal _def / schema props
  [key: string]: unknown;
}

/** A schema value accepted by Froot's OpenAPI layer. */
export type AnySchema = StandardSchemaV1 | Record<string, unknown>;

/** OpenAPI Security Requirement Object. */
export type SecurityRequirement = Record<string, string[]>;

/**
 * Route-level OpenAPI documentation options.
 * All fields are optional — only what you provide appears in the spec.
 */
export interface RouteDocOptions {
  // ── OpenAPI Operation fields ────────────────────────────────────────────
  /** Short one-line description (becomes `summary`). */
  summary?: string;
  /** Longer Markdown description (becomes `description`). */
  description?: string;
  /** Logical groupings shown in the sidebar (becomes `tags`). */
  tags?: string[];
  /** Unique identifier for this operation (becomes `operationId`). */
  operationId?: string;
  /** Whether to hide this route from the generated spec. */
  hidden?: boolean;
  /** Security requirements (e.g. `[{ bearerAuth: [] }]`). */
  security?: SecurityRequirement[];
  /**
   * Override the response content-type (default `application/json`).
   * Use `'text/event-stream'` for SSE routes.
   */
  produces?: string;

  // ── Schema fields (validated at runtime + auto-documented) ─────────────
  /** Path parameter schema (`:id`, `:slug`, …). */
  params?: AnySchema;
  /** Query string schema (`?page=1&limit=20`). */
  query?: AnySchema;
  /** Request body schema. */
  body?: AnySchema;
  /** Successful response schema (HTTP 200/201). */
  response?: AnySchema;
  /**
   * Error response schemas keyed by HTTP status code.
   * ```ts
   * errors: { 404: NotFoundSchema, 422: ValidationErrorSchema }
   * ```
   */
  errors?: Record<number, AnySchema>;
}

/** Internal — what gets stored on each RouteRegistration entry. */
export interface RouteDocEntry extends RouteDocOptions {
  method: string;
  path: string;
}


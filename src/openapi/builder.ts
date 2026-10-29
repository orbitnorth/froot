/**
 * @module openapi/builder
 * Builds an OpenAPI 3.1 specification from Froot's route registry.
 */

import type { RouteDocEntry } from './types.js';
import { anySchemaToJsonSchema, type JsonSchema } from './schema-to-json.js';

// ---------------------------------------------------------------------------
// OpenAPI 3.1 type stubs (minimal — only what we generate)
// ---------------------------------------------------------------------------

interface OAInfo {
  title: string;
  version: string;
  description?: string | undefined;
}

interface OAServer {
  url: string;
  description?: string | undefined;
}

interface OASecurityScheme {
  type: string;
  scheme?: string | undefined;
  bearerFormat?: string | undefined;
  in?: string | undefined;
  name?: string | undefined;
  description?: string | undefined;
}

interface OAComponents {
  schemas?: Record<string, JsonSchema> | undefined;
  securitySchemes?: Record<string, OASecurityScheme> | undefined;
}

interface OASpec {
  openapi: '3.1.0';
  info: OAInfo;
  servers?: OAServer[] | undefined;
  paths: Record<string, Record<string, OAOperation>>;
  components?: OAComponents | undefined;
  tags?: Array<{ name: string; description?: string | undefined }> | undefined;
}

interface OAParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean | undefined;
  description?: string | undefined;
  schema: JsonSchema;
}

interface OAMediaType {
  schema?: JsonSchema | undefined;
}

interface OARequestBody {
  required?: boolean | undefined;
  content: Record<string, OAMediaType>;
}

interface OAResponse {
  description: string;
  content?: Record<string, OAMediaType> | undefined;
}

interface OAOperation {
  summary?: string | undefined;
  description?: string | undefined;
  operationId?: string | undefined;
  tags?: string[] | undefined;
  security?: Record<string, string[]>[] | undefined;
  parameters?: OAParameter[] | undefined;
  requestBody?: OARequestBody | undefined;
  responses: Record<string, OAResponse>;
  deprecated?: boolean | undefined;
}

export interface OpenAPIBuilderOptions {
  /** API title shown in docs. */
  title?: string | undefined;
  /** API version string. Default `'1.0.0'`. */
  version?: string | undefined;
  /** Description shown at the top of the docs. */
  description?: string | undefined;
  /** Server URLs. Default `[{ url: '/' }]`. */
  servers?: OAServer[] | undefined;
  /**
   * Pre-defined security schemes added to `components.securitySchemes`.
   * The `bearerAuth` JWT scheme is included by default.
   */
  securitySchemes?: Record<string, OASecurityScheme> | undefined;
}

// ---------------------------------------------------------------------------
// Path param extractor: '/users/:id/posts/:pid' → ['id', 'pid']
// ---------------------------------------------------------------------------

function extractPathParams(path: string): string[] {
  const params: string[] = [];
  const regex = /:([^/]+)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(path)) !== null) {
    if (m[1]) params.push(m[1]);
  }
  return params;
}

/** Convert Froot path syntax `/users/:id` → OpenAPI path `/users/{id}` */
function frootPathToOpenAPI(path: string): string {
  return path.replace(/:([^/]+)/g, '{$1}');
}

/** HTTP status → default description */
const STATUS_DESCRIPTIONS: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
};

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Build a complete OpenAPI 3.1 specification from a list of {@link RouteDocEntry} objects.
 */
export function buildOpenAPISpec(
  routes: RouteDocEntry[],
  options: OpenAPIBuilderOptions = {},
): OASpec {
  const {
    title       = 'Froot API',
    version     = '1.0.0',
    description,
    servers     = [{ url: '/' }],
    securitySchemes = {},
  } = options;

  const paths: OASpec['paths'] = {};
  const tagSet = new Set<string>();

  // Default security scheme: bearerAuth
  const mergedSecuritySchemes: Record<string, OASecurityScheme> = {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
    ...securitySchemes,
  };

  for (const route of routes) {
    if (route.hidden) continue;

    const oaPath = frootPathToOpenAPI(route.path);
    const method = route.method.toLowerCase();

    if (!paths[oaPath]) paths[oaPath] = {};

    // ── Parameters ─────────────────────────────────────────────────────────
    const parameters: OAParameter[] = [];

    // Path params — always present for parameterized routes
    const pathParamNames = extractPathParams(route.path);
    const paramsJsonSchema = route.params ? anySchemaToJsonSchema(route.params) : null;

    for (const name of pathParamNames) {
      const propSchema = paramsJsonSchema?.properties?.[name] ?? { type: 'string' };
      parameters.push({
        name,
        in: 'path',
        required: true,
        description: propSchema.description,
        schema: { type: propSchema.type ?? 'string', format: propSchema.format },
      });
    }

    // Query params
    if (route.query) {
      const querySchema = anySchemaToJsonSchema(route.query);
      if (querySchema.properties) {
        const required = querySchema.required ?? [];
        for (const [name, propSchema] of Object.entries(querySchema.properties)) {
          parameters.push({
            name,
            in: 'query',
            required: required.includes(name),
            description: propSchema.description,
            schema: propSchema,
          });
        }
      }
    }

    // ── Request body ───────────────────────────────────────────────────────
    let requestBody: OARequestBody | undefined;
    if (route.body) {
      const bodySchema = anySchemaToJsonSchema(route.body);
      requestBody = {
        required: true,
        content: { 'application/json': { schema: bodySchema } },
      };
    }

    // ── Responses ──────────────────────────────────────────────────────────
    const responses: Record<string, OAResponse> = {};

    // Success response
    const successStatus = method === 'post' ? '201' : method === 'delete' ? '204' : '200';
    if (route.response) {
      const responseSchema = anySchemaToJsonSchema(route.response);
      const contentType = route.produces ?? 'application/json';
      responses[successStatus] = {
        description: STATUS_DESCRIPTIONS[parseInt(successStatus, 10)] ?? 'Success',
        content: { [contentType]: { schema: responseSchema } },
      };
    } else {
      responses[successStatus] = {
        description: STATUS_DESCRIPTIONS[parseInt(successStatus, 10)] ?? 'Success',
      };
    }

    // Error responses
    if (route.errors) {
      for (const [statusStr, errorSchema] of Object.entries(route.errors)) {
        const status = parseInt(statusStr, 10);
        const jsonSchema = anySchemaToJsonSchema(errorSchema);
        responses[statusStr] = {
          description: STATUS_DESCRIPTIONS[status] ?? `HTTP ${status}`,
          content: { 'application/json': { schema: jsonSchema } },
        };
      }
    }

    // ── Tags ───────────────────────────────────────────────────────────────
    if (route.tags) {
      for (const t of route.tags) tagSet.add(t);
    }

    // ── Build operation ────────────────────────────────────────────────────
    const operation: OAOperation = {
      responses,
    };
    if (route.summary)     operation.summary     = route.summary;
    if (route.description) operation.description = route.description;
    if (route.operationId) operation.operationId = route.operationId;
    if (route.tags?.length)operation.tags        = route.tags;
    if (route.security)    operation.security    = route.security;
    if (parameters.length) operation.parameters  = parameters;
    if (requestBody)       operation.requestBody = requestBody;

    paths[oaPath]![method] = operation;
  }

  const spec: OASpec = {
    openapi: '3.1.0',
    info: { title, version, description },
    servers,
    paths,
    components: {
      securitySchemes: mergedSecuritySchemes,
    },
    tags: [...tagSet].map((name) => ({ name })),
  };

  return spec;
}


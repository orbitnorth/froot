/**
 * @module openapi/schema-to-json
 * Converts various schema library types to JSON Schema (Draft 7 / OpenAPI 3.1 compatible).
 *
 * Supports:
 * - Zod v3 / v4 (reads `_def` internals)
 * - Standard Schema v1 (`~standard` property) — generic fallback
 * - Plain JSON Schema objects (passed through as-is)
 */

import type { AnySchema } from './types.js';

/** A JSON Schema object (subset used by OpenAPI 3.1). */
export interface JsonSchema {
  type?: string | string[] | undefined;
  title?: string | undefined;
  description?: string | undefined;
  properties?: Record<string, JsonSchema> | undefined;
  required?: string[] | undefined;
  items?: JsonSchema | undefined;
  enum?: unknown[] | undefined;
  const?: unknown | undefined;
  anyOf?: JsonSchema[] | undefined;
  oneOf?: JsonSchema[] | undefined;
  allOf?: JsonSchema[] | undefined;
  not?: JsonSchema | undefined;
  minimum?: number | undefined;
  maximum?: number | undefined;
  minLength?: number | undefined;
  maxLength?: number | undefined;
  minItems?: number | undefined;
  maxItems?: number | undefined;
  pattern?: string | undefined;
  format?: string | undefined;
  default?: unknown | undefined;
  nullable?: boolean | undefined;
  additionalProperties?: boolean | JsonSchema | undefined;
  $ref?: string | undefined;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Zod internals detector
// ---------------------------------------------------------------------------

function isZodSchema(s: unknown): boolean {
  return (
    s !== null &&
    typeof s === 'object' &&
    '_def' in (s as object) &&
    typeof (s as Record<string, unknown>)._def === 'object'
  );
}

type ZodDef = Record<string, unknown>;

function zodDefTypeName(def: ZodDef): string {
  return (def.typeName as string) ?? '';
}

/**
 * Convert a Zod schema's `_def` to a JSON Schema object.
 * Handles the most common Zod types used in API definitions.
 */
function zodToJsonSchema(schema: Record<string, unknown>): JsonSchema {
  const def = schema._def as ZodDef;
  const typeName = zodDefTypeName(def);
  const out: JsonSchema = {};

  // Description from .describe()
  if (typeof def.description === 'string') out.description = def.description;

  switch (typeName) {
    case 'ZodString': {
      out.type = 'string';
      const checks = (def.checks as Array<{ kind: string; value?: unknown; regex?: { source: string } }>) ?? [];
      for (const c of checks) {
        if (c.kind === 'min') out.minLength = c.value as number;
        if (c.kind === 'max') out.maxLength = c.value as number;
        if (c.kind === 'email') out.format = 'email';
        if (c.kind === 'url') out.format = 'uri';
        if (c.kind === 'uuid') out.format = 'uuid';
        if (c.kind === 'datetime') out.format = 'date-time';
        if (c.kind === 'regex') { if (c.regex?.source) out.pattern = c.regex.source; }
      }
      break;
    }
    case 'ZodNumber': {
      out.type = 'number';
      const checks = (def.checks as Array<{ kind: string; value?: unknown; inclusive?: boolean }>) ?? [];
      for (const c of checks) {
        if (c.kind === 'min') {
          if (c.inclusive) out.minimum = c.value as number;
          else out.minimum = (c.value as number) + 0.000001; // exclusive
        }
        if (c.kind === 'max') {
          if (c.inclusive) out.maximum = c.value as number;
          else out.maximum = (c.value as number) - 0.000001;
        }
        if (c.kind === 'int') out.type = 'integer';
      }
      break;
    }
    case 'ZodBoolean':
      out.type = 'boolean';
      break;
    case 'ZodNull':
      out.type = 'null';
      break;
    case 'ZodUndefined':
      // undefined is not representable in JSON Schema; omit
      break;
    case 'ZodLiteral':
      out.const = def.value;
      out.type = typeof def.value as string;
      break;
    case 'ZodEnum': {
      const values = def.values as unknown[];
      out.type = 'string';
      out.enum = values;
      break;
    }
    case 'ZodNativeEnum': {
      const vals = Object.values(def.values as object);
      out.enum = vals;
      break;
    }
    case 'ZodArray': {
      out.type = 'array';
      const innerDef = def.type as Record<string, unknown>;
      if (innerDef) out.items = anySchemaToJsonSchema(innerDef);
      const minLen = (def.minLength as { value: number } | undefined)?.value;
      const maxLen = (def.maxLength as { value: number } | undefined)?.value;
      if (minLen !== undefined) out.minItems = minLen;
      if (maxLen !== undefined) out.maxItems = maxLen;
      break;
    }
    case 'ZodObject': {
      out.type = 'object';
      const shape = def.shape as (() => Record<string, unknown>) | Record<string, unknown>;
      const shapeObj = typeof shape === 'function' ? shape() : shape;
      out.properties = {};
      out.required = [];
      for (const [key, fieldSchema] of Object.entries(shapeObj)) {
        const fieldDef = (fieldSchema as Record<string, unknown>)._def as ZodDef | undefined;
        const isOptional = fieldDef && (
          zodDefTypeName(fieldDef) === 'ZodOptional' ||
          zodDefTypeName(fieldDef) === 'ZodDefault'
        );
        out.properties[key] = anySchemaToJsonSchema(fieldSchema as Record<string, unknown>);
        if (!isOptional) out.required.push(key);
      }
      if (out.required.length === 0) delete out.required;
      break;
    }
    case 'ZodOptional': {
      const inner = anySchemaToJsonSchema(def.innerType as Record<string, unknown>);
      const desc = out.description ?? inner.description;
      const result: JsonSchema = { ...inner };
      if (desc !== undefined) result.description = desc;
      return result;
    }
    case 'ZodNullable': {
      const inner = anySchemaToJsonSchema(def.innerType as Record<string, unknown>);
      const desc = out.description ?? inner.description;
      const result: JsonSchema = { anyOf: [inner, { type: 'null' }] };
      if (desc !== undefined) result.description = desc;
      return result;
    }
    case 'ZodDefault': {
      const inner = anySchemaToJsonSchema(def.innerType as Record<string, unknown>);
      const defaultVal = typeof def.defaultValue === 'function'
        ? (def.defaultValue as () => unknown)()
        : def.defaultValue;
      const desc = out.description ?? inner.description;
      const result: JsonSchema = { ...inner, default: defaultVal };
      if (desc !== undefined) result.description = desc;
      return result;
    }
    case 'ZodUnion': {
      const options = def.options as Record<string, unknown>[];
      out.anyOf = options.map(anySchemaToJsonSchema);
      break;
    }
    case 'ZodDiscriminatedUnion': {
      const opts = def.options as Map<unknown, Record<string, unknown>> | Record<string, unknown>[];
      const arr = opts instanceof Map ? [...opts.values()] : opts;
      out.oneOf = arr.map(anySchemaToJsonSchema);
      break;
    }
    case 'ZodIntersection': {
      out.allOf = [
        anySchemaToJsonSchema(def.left as Record<string, unknown>),
        anySchemaToJsonSchema(def.right as Record<string, unknown>),
      ];
      break;
    }
    case 'ZodRecord': {
      out.type = 'object';
      const valSchema = def.valueType as Record<string, unknown> | undefined;
      if (valSchema) out.additionalProperties = anySchemaToJsonSchema(valSchema);
      break;
    }
    case 'ZodTuple': {
      out.type = 'array';
      const items = def.items as Record<string, unknown>[];
      out.items = { oneOf: items.map(anySchemaToJsonSchema) };
      break;
    }
    case 'ZodCoerce':
    case 'ZodPipeline': {
      // For coerce/pipeline, introspect inner
      const inner = (def.out ?? def.schema ?? def.in) as Record<string, unknown> | undefined;
      if (inner) {
        const res = anySchemaToJsonSchema(inner);
        if (out.description !== undefined) {
          res.description = out.description;
        }
        return res;
      }
      out.type = 'string'; // safe fallback for ZodCoerce
      break;
    }
    case 'ZodAny':
    case 'ZodUnknown':
      // No type constraint
      break;
    default:
      // Unknown Zod type — emit an empty schema
      break;
  }

  return out;
}

// ---------------------------------------------------------------------------
// Public converter
// ---------------------------------------------------------------------------

/**
 * Convert any supported schema value to a JSON Schema object.
 *
 * Dispatch order:
 * 1. Zod schema (`_def.typeName` present)
 * 2. Already a JSON Schema plain object (has `type` or `properties`)
 * 3. Standard Schema v1 (`~standard` present) — emits `{}` (no static shape)
 * 4. Fallback — returns `{}`
 */
export function anySchemaToJsonSchema(schema: AnySchema | unknown): JsonSchema {
  if (!schema || typeof schema !== 'object') return {};

  const s = schema as Record<string, unknown>;

  // Zod
  if (isZodSchema(s)) return zodToJsonSchema(s);

  // Plain JSON Schema (already has `type` or `$schema` or `properties`)
  if ('type' in s || 'properties' in s || '$schema' in s || 'anyOf' in s || 'oneOf' in s) {
    return s as JsonSchema;
  }

  // Standard Schema v1 — no static shape available at runtime
  if ('~standard' in s) return {};

  return {};
}

/**
 * Standard Schema & TypeBox/Zod validation adapter for Froot.
 * Provides runtime validation with automatic RFC 9457 Problem Details error responses.
 */

import type { MiddlewareHandler } from '../types/index.js';
import { HTTPException } from '../core/errors.js';

export type ValidationTarget = 'json' | 'query' | 'param' | 'header';

export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown
    ) =>
      | { readonly value: Output; readonly issues?: undefined }
      | { readonly issues: ReadonlyArray<{ readonly message: string; readonly path?: ReadonlyArray<PropertyKey | { key: PropertyKey }> }> };
  };
}

export type SchemaLike<T = unknown> =
  | StandardSchemaV1<unknown, T>
  | { parse: (val: unknown) => T } // Zod legacy
  | { check: (val: unknown) => boolean; errors?: (val: unknown) => unknown[] } // TypeBox
  | ((value: unknown) => T | Promise<T>);

export function validate<T = unknown>(
  target: ValidationTarget,
  schema: SchemaLike<T>
): MiddlewareHandler {
  return async (c, next) => {
    let valueToValidate: unknown;

    if (target === 'json') {
      try {
        valueToValidate = await c.req.json();
      } catch {
        throw new HTTPException(400, 'Malformed JSON payload', {
          detail: 'Unable to parse request body as valid JSON'
        });
      }
    } else if (target === 'query') {
      valueToValidate = c.req.query();
    } else if (target === 'param') {
      valueToValidate = c.req.params;
    } else if (target === 'header') {
      valueToValidate = c.req.headers;
    }

    // 1. Standard Schema specification (~standard)
    if (typeof schema === 'object' && schema !== null && '~standard' in schema) {
      const result = await schema['~standard'].validate(valueToValidate);
      if ('issues' in result && result.issues && result.issues.length > 0) {
        throw new HTTPException(400, 'Schema Validation Failed', {
          detail: `Validation failed for ${target}`,
          invalidParams: result.issues.map((i) => ({
            name: i.path ? i.path.join('.') : target,
            reason: i.message
          }))
        });
      }
      c.set(`valid_${target}`, (result as unknown as { value: T }).value);
    }
    // 2. Zod-like (.parse)
    else if (typeof schema === 'object' && schema !== null && 'parse' in schema) {
      try {
        const validated = (schema as { parse: (val: unknown) => T }).parse(valueToValidate);
        c.set(`valid_${target}`, validated);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Validation Failed';
        const errors = (err as { errors?: Array<{ name: string; reason: string }> }).errors;
        throw new HTTPException(400, 'Validation Failed', {
          detail: message,
          invalidParams: errors
        });
      }
    }
    // 3. Functional Validator
    else if (typeof schema === 'function') {
      try {
        const validated = await schema(valueToValidate);
        c.set(`valid_${target}`, validated);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Validation Failed';
        throw new HTTPException(400, message);
      }
    }

    return await next();
  };
}

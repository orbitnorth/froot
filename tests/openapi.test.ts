/**
 * Tests for Froot Auto-Generated OpenAPI 3.1 and Schema Ecosystem
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Froot } from '../dist/core/app.js';
import {
  anySchemaToJsonSchema,
  buildOpenAPISpec,
  scalarUIPage,
  swaggerUIPage,
} from '../dist/openapi/index.js';

describe('OpenAPI & Schema Ecosystem', () => {
  describe('anySchemaToJsonSchema()', () => {
    it('converts plain JSON Schema objects directly', () => {
      const plain = {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'User name' },
        },
        required: ['name'],
      };
      const result = anySchemaToJsonSchema(plain);
      assert.deepEqual(result, plain);
    });

    it('converts Zod-like schema objects using _def inspection', () => {
      // Mock Zod schema definitions
      const mockZodString = {
        _def: {
          typeName: 'ZodString',
          description: 'A user email address',
          checks: [
            { kind: 'min', value: 5 },
            { kind: 'max', value: 100 },
            { kind: 'email' },
          ],
        },
      };

      const result = anySchemaToJsonSchema(mockZodString);
      assert.equal(result.type, 'string');
      assert.equal(result.description, 'A user email address');
      assert.equal(result.minLength, 5);
      assert.equal(result.maxLength, 100);
      assert.equal(result.format, 'email');
    });

    it('converts Zod-like object schema with required and optional fields', () => {
      const mockZodObject = {
        _def: {
          typeName: 'ZodObject',
          shape: {
            id: {
              _def: {
                typeName: 'ZodString',
                description: 'Unique ID',
                checks: [{ kind: 'uuid' }],
              },
            },
            age: {
              _def: {
                typeName: 'ZodOptional',
                innerType: {
                  _def: {
                    typeName: 'ZodNumber',
                    checks: [{ kind: 'int' }, { kind: 'min', value: 0, inclusive: true }],
                  },
                },
                description: 'Optional age in years',
              },
            },
          },
        },
      };

      const result = anySchemaToJsonSchema(mockZodObject);
      assert.equal(result.type, 'object');
      assert.ok(result.properties);
      assert.equal(result.properties['id']?.type, 'string');
      assert.equal(result.properties['id']?.format, 'uuid');
      assert.equal(result.properties['age']?.type, 'integer');
      assert.equal(result.properties['age']?.description, 'Optional age in years');
      assert.deepEqual(result.required, ['id']);
    });
  });

  describe('buildOpenAPISpec()', () => {
    it('converts Froot parameterized paths to OpenAPI path templates', () => {
      const spec = buildOpenAPISpec([
        {
          method: 'GET',
          path: '/organizations/:orgId/users/:userId',
          summary: 'Get user in organization',
          tags: ['Users'],
        },
      ]);

      assert.ok(spec.paths['/organizations/{orgId}/users/{userId}']);
      const op = spec.paths['/organizations/{orgId}/users/{userId}']?.['get'];
      assert.ok(op);
      assert.equal(op.summary, 'Get user in organization');
      assert.deepEqual(op.tags, ['Users']);
      assert.equal(op.parameters?.length, 2);
      assert.equal(op.parameters?.[0]?.name, 'orgId');
      assert.equal(op.parameters?.[0]?.in, 'path');
      assert.equal(op.parameters?.[0]?.required, true);
      assert.equal(op.parameters?.[1]?.name, 'userId');
    });

    it('includes requestBody and error responses when specified', () => {
      const spec = buildOpenAPISpec([
        {
          method: 'POST',
          path: '/items',
          summary: 'Create item',
          body: {
            type: 'object',
            properties: { title: { type: 'string' } },
            required: ['title'],
          },
          response: {
            type: 'object',
            properties: { id: { type: 'string' } },
          },
          errors: {
            400: { type: 'object', properties: { error: { type: 'string' } } },
          },
        },
      ]);

      const op = spec.paths['/items']?.['post'];
      assert.ok(op);
      assert.ok(op.requestBody?.content['application/json']);
      assert.ok(op.responses['201']?.content?.['application/json']);
      assert.ok(op.responses['400']?.content?.['application/json']);
    });

    it('respects hidden: true and omits routes from the spec', () => {
      const spec = buildOpenAPISpec([
        {
          method: 'GET',
          path: '/internal/metrics',
          hidden: true,
        },
      ]);

      assert.deepEqual(spec.paths, {});
    });
  });

  describe('scalarUIPage() & swaggerUIPage()', () => {
    it('generates Scalar HTML with configured spec URL and theme', () => {
      const html = scalarUIPage({ specUrl: '/custom/openapi.json', theme: 'moon' });
      assert.ok(html.includes('data-url="/custom/openapi.json"'));
      assert.ok(html.includes('&quot;theme&quot;:&quot;moon&quot;'));
      assert.ok(html.includes('@scalar/api-reference'));
    });

    it('generates Swagger UI HTML', () => {
      const html = swaggerUIPage({ specUrl: '/openapi.json', title: 'Test Swagger' });
      assert.ok(html.includes('SwaggerUIBundle'));
      assert.ok(html.includes('/openapi.json'));
      assert.ok(html.includes('<title>Test Swagger</title>'));
    });
  });

  describe('app.openapi() end-to-end integration', () => {
    it('automatically generates /openapi.json and /docs with zero boilerplate', async () => {
      const app = new Froot();

      // Register route with inline OpenAPI options
      app.get(
        '/api/v1/products/:id',
        {
          summary: 'Get product by ID',
          tags: ['Products'],
          operationId: 'getProductById',
          params: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Product identifier' },
            },
          },
          response: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              price: { type: 'number' },
            },
          },
        },
        (c) => {
          return c.json({ id: c.req.param('id'), name: 'Gadget', price: 99.99 });
        }
      );

      // Mount OpenAPI spec and docs
      app.openapi({
        title: 'Store API',
        version: '1.2.3',
        description: 'Auto-generated Store API reference',
      });

      // 1. Fetch /openapi.json
      const specReq = new Request('http://localhost/openapi.json');
      const specRes = await app.fetch(specReq);
      assert.equal(specRes.status, 200);
      assert.ok(specRes.headers.get('content-type')?.includes('application/json'));

      const spec = await specRes.json() as any;
      assert.equal(spec.openapi, '3.1.0');
      assert.equal(spec.info.title, 'Store API');
      assert.equal(spec.info.version, '1.2.3');
      assert.equal(spec.info.description, 'Auto-generated Store API reference');

      const op = spec.paths['/api/v1/products/{id}']?.get;
      assert.ok(op);
      assert.equal(op.summary, 'Get product by ID');
      assert.equal(op.operationId, 'getProductById');
      assert.deepEqual(op.tags, ['Products']);
      assert.equal(op.parameters?.[0]?.name, 'id');
      assert.equal(op.parameters?.[0]?.description, 'Product identifier');
      assert.ok(op.responses['200']?.content['application/json']);

      // 2. Fetch /docs
      const docsReq = new Request('http://localhost/docs');
      const docsRes = await app.fetch(docsReq);
      assert.equal(docsRes.status, 200);
      assert.ok(docsRes.headers.get('content-type')?.includes('text/html'));
      const html = await docsRes.text();
      assert.ok(html.includes('@scalar/api-reference'));
      assert.ok(html.includes('data-url="/openapi.json"'));

      // 3. Normal API route still functions as expected
      const apiReq = new Request('http://localhost/api/v1/products/abc-123');
      const apiRes = await app.fetch(apiReq);
      assert.equal(apiRes.status, 200);
      const apiData = await apiRes.json() as any;
      assert.equal(apiData.id, 'abc-123');
      assert.equal(apiData.name, 'Gadget');
    });

    it('supports custom spec and docs paths, and custom swagger path', async () => {
      const app = new Froot();

      app.get(
        '/hello',
        { summary: 'Say Hello', tags: ['Greeting'] },
        (c) => c.text('Hello World')
      );

      app.openapi({
        specPath: '/custom-spec.json',
        docsPath: '/custom-docs',
        swaggerPath: '/swagger',
      });

      const specRes = await app.fetch(new Request('http://localhost/custom-spec.json'));
      assert.equal(specRes.status, 200);

      const docsRes = await app.fetch(new Request('http://localhost/custom-docs'));
      assert.equal(docsRes.status, 200);
      const docsHtml = await docsRes.text();
      assert.ok(docsHtml.includes('/custom-spec.json'));

      const swaggerRes = await app.fetch(new Request('http://localhost/swagger'));
      assert.equal(swaggerRes.status, 200);
      const swaggerHtml = await swaggerRes.text();
      assert.ok(swaggerHtml.includes('SwaggerUIBundle'));
    });
  });
});

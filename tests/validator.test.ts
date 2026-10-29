import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Froot } from 'frootjs';
import { validate, type StandardSchemaV1 } from 'frootjs/middleware';

describe('Schema Validator & RFC 9457 Problem Details', () => {
  it('should accept valid payload using Standard Schema (~standard)', async () => {
    const userSchema: StandardSchemaV1<{ name: string; age: number }> = {
      '~standard': {
        version: 1,
        vendor: 'custom',
        validate: (value: unknown) => {
          const val = value as { name?: string; age?: number };
          if (typeof val.name === 'string' && typeof val.age === 'number') {
            return { value: { name: val.name, age: val.age } };
          }
          return {
            issues: [{ message: 'Expected name: string and age: number' }]
          };
        }
      }
    };

    const app = new Froot();
    app.post('/users', validate('json', userSchema), (c) => {
      const data = c.get('valid_json') as { name: string; age: number };
      return c.json({ success: true, user: data }, 201);
    });

    const res = await app.fetch(
      new Request('http://localhost/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Bob', age: 30 })
      })
    );

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.deepEqual(body, {
      success: true,
      user: { name: 'Bob', age: 30 }
    });
  });

  it('should reject invalid payload using Standard Schema with RFC 9457 error', async () => {
    const userSchema: StandardSchemaV1<{ name: string; age: number }> = {
      '~standard': {
        version: 1,
        vendor: 'custom',
        validate: (value: unknown) => {
          const val = value as { name?: unknown; age?: unknown };
          const issues = [];
          if (typeof val.name !== 'string') {
            issues.push({ message: 'name must be a string', path: ['name'] });
          }
          if (typeof val.age !== 'number') {
            issues.push({ message: 'age must be a number', path: ['age'] });
          }
          if (issues.length > 0) {
            return { issues };
          }
          return { value: { name: val.name as string, age: val.age as number } };
        }
      }
    };

    const app = new Froot();
    app.post('/users', validate('json', userSchema), (c) => c.text('ok'));

    const res = await app.fetch(
      new Request('http://localhost/users', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 12345, age: 'thirty' })
      })
    );

    assert.equal(res.status, 400);
    assert.equal(res.headers.get('content-type'), 'application/problem+json; charset=utf-8');
    const body = await res.json();
    assert.equal(body.title, 'Schema Validation Failed');
    assert.equal(body.status, 400);
    assert.ok(Array.isArray(body.invalidParams));
    assert.equal(body.invalidParams.length, 2);
  });

  it('should support functional validators', async () => {
    const app = new Froot();
    const isPositiveInt = (val: unknown): number => {
      const parsed = Number((val as Record<string, string>)?.['count']);
      if (isNaN(parsed) || parsed <= 0) {
        throw new Error('count must be positive integer');
      }
      return parsed;
    };

    app.get('/items', validate('query', isPositiveInt), (c) => {
      const count = c.get('valid_query');
      return c.json({ count });
    });

    const resValid = await app.fetch(new Request('http://localhost/items?count=10'));
    assert.equal(resValid.status, 200);
    const bodyValid = await resValid.json();
    assert.equal(bodyValid.count, 10);

    const resInvalid = await app.fetch(new Request('http://localhost/items?count=-5'));
    assert.equal(resInvalid.status, 400);
  });

  it('should reject malformed JSON bodies gracefully', async () => {
    const app = new Froot();
    app.post('/echo', validate('json', (v) => v), (c) => c.text('ok'));

    const res = await app.fetch(
      new Request('http://localhost/echo', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{ malformed json: not valid...'
      })
    );

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.title, 'Malformed JSON payload');
  });
});

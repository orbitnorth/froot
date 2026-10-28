import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Froot, compileSerializer, fastEscapeString } from '../dist/index.js';

describe('AOT Schema JSON Serializer', () => {
  it('should escape strings correctly with fastEscapeString', () => {
    // Fast path: no escaping needed
    assert.equal(fastEscapeString('hello world'), 'hello world');
    assert.equal(fastEscapeString('product_123'), 'product_123');

    // Escaping needed
    assert.equal(fastEscapeString('quotes "inside"'), 'quotes \\"inside\\"');
    assert.equal(fastEscapeString('back\\slash'), 'back\\\\slash');
    assert.equal(fastEscapeString('line\nbreak\ttab'), 'line\\nbreak\\ttab');
  });

  it('should serialize simple flat objects accurately', () => {
    const serializeProduct = compileSerializer<{
      id: string;
      title: string;
      price: number;
      inStock: boolean;
      notes: null;
    }>({
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        price: { type: 'number' },
        inStock: { type: 'boolean' },
        notes: { type: 'null' }
      }
    });

    const data = {
      id: 'prod_100',
      title: 'Gaming Keyboard "RGB"',
      price: 89.99,
      inStock: true,
      notes: null
    };

    const serialized = serializeProduct(data);
    assert.deepEqual(JSON.parse(serialized), data);
  });

  it('should serialize nested objects and arrays of objects', () => {
    const serializeOrder = compileSerializer<{
      orderId: string;
      customer: { name: string; email: string };
      items: Array<{ productId: string; quantity: number; unitPrice: number }>;
      tags: string[];
    }>({
      type: 'object',
      properties: {
        orderId: { type: 'string' },
        customer: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' }
          }
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string' },
              quantity: { type: 'integer' },
              unitPrice: { type: 'number' }
            }
          }
        },
        tags: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    });

    const orderData = {
      orderId: 'ord_999',
      customer: { name: 'Alice Smith', email: 'alice@example.com' },
      items: [
        { productId: 'p1', quantity: 2, unitPrice: 19.99 },
        { productId: 'p2', quantity: 1, unitPrice: 49.5 }
      ],
      tags: ['express-delivery', 'vip']
    };

    const serialized = serializeOrder(orderData);
    assert.deepEqual(JSON.parse(serialized), orderData);
  });

  it('should handle missing, undefined, and null values safely', () => {
    const serializeUser = compileSerializer<{
      id: string;
      nickname?: string;
      age?: number;
      active?: boolean;
    }>({
      type: 'object',
      properties: {
        id: { type: 'string' },
        nickname: { type: 'string' },
        age: { type: 'number' },
        active: { type: 'boolean' }
      }
    });

    const sparseData = { id: 'usr_1' };
    const serialized = serializeUser(sparseData);
    const parsed = JSON.parse(serialized);

    assert.equal(parsed.id, 'usr_1');
    assert.equal(parsed.nickname, null);
    assert.equal(parsed.age, null);
    assert.equal(parsed.active, null);
  });

  it('should integrate seamlessly with c.serialize() in Froot endpoints', async () => {
    const app = new Froot();

    const productSerializer = compileSerializer<{ id: string; name: string; price: number }>({
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        price: { type: 'number' }
      }
    });

    app.get('/api/fast-product', (c) => {
      return c.serialize(
        { id: 'item_1', name: 'Ultra Display', price: 349.99 },
        productSerializer,
        200,
        { 'x-serializer': 'aot-fast' }
      );
    });

    const res = await app.fetch(new Request('http://localhost/api/fast-product'));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.equal(res.headers.get('x-serializer'), 'aot-fast');

    const body = await res.json();
    assert.deepEqual(body, { id: 'item_1', name: 'Ultra Display', price: 349.99 });
  });
});


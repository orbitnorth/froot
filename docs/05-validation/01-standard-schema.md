# Lesson 5.1: Standard Schema Validation

Validation ensures that incoming requests conform to strict schemas before your business logic executes.

In the past, web frameworks locked developers into a single validation library (e.g. Fastify's Ajv dependency). Froot implements the universal **Standard Schema Specification (`~standard`)**, which allows you to use your favorite validation library interchangeably with zero boilerplate.

---

## 1. Supported Schema Libraries

Froot natively supports:
- **TypeBox:** Lightning-fast JSON schema validator based on Ahead-of-Time compilation.
- **Zod:** The most popular TypeScript-first schema declaration library (v3 and v4).
- **ArkType:** Ultra-fast 1:1 TypeScript syntax validator.
- **Valibot:** Modular, tree-shakeable schema validator.
- **Custom Functions:** Any simple validator function `(val) => T`.

---

## 2. Validating Request Bodies (`json`)

Use the `validate` middleware from `froot/middleware`:

```typescript
import { Froot } from 'froot';
import { validate } from 'froot/middleware';
import { z } from 'zod';

const app = new Froot();

// 1. Declare schema
const CreateUserSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  age: z.number().int().positive()
});

// 2. Attach validation middleware
app.post(
  '/api/users',
  validate('json', CreateUserSchema),
  async (c) => {
    // Validated data is attached to context state
    const user = c.get('valid_json') as z.infer<typeof CreateUserSchema>;

    return c.json({
      success: true,
      user
    }, 201);
  }
);
```

---

## 3. Validating Query Parameters, Route Params, & Headers

The `validate()` helper accepts multiple validation targets:
- `'json'`: Parses and validates request body.
- `'query'`: Validates query string parameters.
- `'param'`: Validates route parameters.
- `'header'`: Validates incoming headers.

```typescript
const PaginationSchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().max(100).default(20)
});

app.get(
  '/items',
  validate('query', PaginationSchema),
  (c) => {
    const { page, limit } = c.get('valid_query') as z.infer<typeof PaginationSchema>;
    return c.json({ page, limit, items: [] });
  }
);
```

---

## Next Steps
In the next lesson, we will see what happens when validation fails and how Froot formats RFC 9457 Problem Details error responses.
- Proceed to [Lesson 5.2: RFC 9457 Problem Details](./02-rfc-9457-errors.md)

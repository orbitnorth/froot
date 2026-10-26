# Lesson 3.2: Parameter Extraction & Types

In Express and other legacy frameworks, route parameters are untyped strings in a generic dictionary:

```javascript
// Express.js
app.get('/users/:userId', (req, res) => {
  // req.params is Record<string, string>
  // Typo: req.params.userid will compile with zero errors and fail at runtime!
  const id = req.params.userid; 
});
```

Froot uses TypeScript template literal types to extract route parameter names directly from the path string at compile time.

---

## How Compile-Time Parameter Extraction Works

Under the hood, Froot implements recursive pattern matching using TypeScript's conditional template literal types:

```typescript
export type ExtractParamNames<Path extends string> =
  Path extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractParamNames<`/${Rest}`>
    : Path extends `${infer _Start}:${infer Param}`
    ? Param
    : never;

export type RouteParams<Path extends string> = [ExtractParamNames<Path>] extends [never]
  ? Record<string, string | undefined>
  : { [K in ExtractParamNames<Path>]: string };
```

When you define a route:

```typescript
app.get('/orgs/:orgId/projects/:projectId/issues/:issueId', (c) => {
  // c.param is strictly typed!
});
```

TypeScript evaluates:
```typescript
ExtractParamNames<'/orgs/:orgId/projects/:projectId/issues/:issueId'>
// Evaluates to: "orgId" | "projectId" | "issueId"
```

---

## Developer Experience & IDE Autocompletion

Inside your handler, your IDE offers full autocompletion:

```typescript
app.get('/users/:userId', (c) => {
  // 1. Strict typed access
  const id = c.param('userId'); // string

  // 2. TypeScript compilation error on typos!
  // @ts-expect-error Argument of type '"userid"' is not assignable to parameter of type '"userId"'
  const typo = c.param('userid'); 

  // 3. Or access the entire strongly-typed params dictionary
  const { userId } = c.params; // { userId: string }
});
```

### Zero Runtime Overhead
Because this type calculation is executed exclusively by the TypeScript compiler (`tsc`) during typechecking, there is **zero runtime overhead**. At runtime, parameter extraction occurs through optimized regex group indexing.

---

## Next Steps
In the next lesson, we will learn how to organize large codebases using modular sub-applications and path prefixes.
- Proceed to [Lesson 3.3: Sub-Applications & Route Groups](./03-sub-apps-and-mounting.md)

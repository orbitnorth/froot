# Lesson 2.1: Monomorphic Context Engine

The context object (`c`) is the central currency of any web request. In Froot, every middleware handler, validation step, and route handler receives an instance of `Context`.

---

## The Monomorphic Design Pattern

In the V8 JavaScript engine, every object has an internal hidden class (called a `Map`). When code accesses `object.property`, V8 records the object's `Map` in an **Inline Cache (IC)**. 

If all instances passed through a code path share the exact same `Map`, V8 classifies the call site as **monomorphic** and replaces the property lookup with a single direct memory offset read:

```
[ Monomorphic IC Access ]
c.req  --->  Memory Offset +0x18  (1 CPU instruction)
```

If an object has different properties added in different orders, or changes its prototype, the call site becomes **megamorphic**, forcing V8 to perform expensive hash table traversals on every property read.

### How `FrootContext` Guarantees Monomorphism

`FrootContext` enforces strict property shape stabilization:

```typescript
export class FrootContext<
  TPath extends string = string,
  TEnv extends Env = BlankEnv
> implements Context<TPath, TEnv> {
  // 1. Strict, invariable property declaration order
  public readonly req: FrootRequest<TPath>;
  public readonly rawRequest: Request;
  public readonly responseHeaders: Headers;
  public statusCode: StatusCode = 200;
  public readonly env: NonNullable<TEnv['Bindings']>;
  public readonly executionCtx?: ExecutionContext | undefined;
  private _state: NonNullable<TEnv['Variables']>;
  private _res: Response | undefined = undefined;

  constructor(
    raw: Request,
    params: Record<string, string> = {},
    env?: unknown,
    executionCtx?: unknown
  ) {
    this.rawRequest = raw;
    this.req = new FrootRequest<TPath>(raw, params);
    this.responseHeaders = new Headers();
    this.env = (env ?? {}) as NonNullable<TEnv['Bindings']>;
    this.executionCtx = executionCtx as ExecutionContext | undefined;
    this._state = {} as NonNullable<TEnv['Variables']>;
  }
  // ...
}
```

1. **Fixed Property Order:** All properties are assigned in the exact same sequence in the constructor.
2. **Zero Dynamic Property Assignment:** Handlers never attach ad-hoc properties directly to `c` (e.g. `c.user = ...`). Instead, state is managed through the typed state store: `c.set('user', user)` and `c.get('user')`.
3. **No Prototype Mutation:** Unlike Express, `Object.setPrototypeOf()` is never called.

---

## Lazy Evaluation: Zero Waste Architecture

In traditional web frameworks, every request undergoes eager preprocessing:
- The URL query string is parsed into an object.
- All request headers are copied into a lowercased dictionary.
- Body parsers buffer and deserialize payloads before checking if the route even needs them.

In Froot, **all request properties are computed lazily on first access**:

```typescript
export class FrootRequest<TPath extends string = string> {
  private _queryCache: Record<string, string | undefined> | undefined = undefined;
  private _urlObj: URL | undefined = undefined;

  public query(key?: string) {
    if (!this._queryCache) {
      // Parsed ONLY when c.req.query() is explicitly called
      const cache: Record<string, string | undefined> = {};
      for (const [k, v] of this.parsedUrl.searchParams.entries()) {
        cache[k] = v;
      }
      this._queryCache = cache;
    }
    return key !== undefined ? this._queryCache[key] : this._queryCache;
  }
}
```

For health-check probes, static assets, and RPC calls that don't read query parameters, **0 CPU cycles and 0 byte allocations** are spent parsing URLs.

---

## Next Steps
In the next lesson, we will look into V8 bytecode to inspect why prototype mutation destroys performance in legacy frameworks.
- Proceed to [Lesson 2.2: V8 Hidden Classes & Inline Caches](./02-v8-hidden-classes.md)

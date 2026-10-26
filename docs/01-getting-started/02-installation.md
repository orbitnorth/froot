# Lesson 1.2: Installation & Setup

## Prerequisites

Froot is built using modern Web Standards and ECMAScript features. Ensure your system meets the following baseline requirements:
- **Node.js:** version `20.0.0` or higher (Node 22+ or 26 recommended)
- **Bun:** version `1.0.0` or higher (optional)
- **Deno:** version `1.40.0` or higher (optional)
- **Package Manager:** `pnpm` is strongly recommended for fast, deterministic, non-flat dependency resolution.

---

## 1. Initializing Your Project

Create a new directory for your service and initialize a `package.json` with ESM module resolution:

```bash
mkdir my-froot-service
cd my-froot-service
pnpm init
```

Ensure `"type": "module"` is configured in your `package.json`:

```json
{
  "name": "my-froot-service",
  "version": "1.0.0",
  "type": "module"
}
```

---

## 2. Installing Froot

Install `froot` via `pnpm`:

```bash
pnpm add froot
```

Install TypeScript and type definitions as development dependencies:

```bash
pnpm add -D typescript @types/node
```

---

## 3. Configuring TypeScript

Create a `tsconfig.json` optimized for strict type checking, modern ECMAScript compilation, and Web Standard DOM types:

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

> [!NOTE]
> Including `"DOM"` and `"DOM.Iterable"` in your `compilerOptions.lib` array ensures that standard Web APIs like `Request`, `Response`, `Headers`, and `ReadableStream` are natively recognized by the TypeScript compiler across all runtimes without third-party polyfills.

---

## Next Steps
Now that your environment is configured, let's write your first Froot server.
- Proceed to [Lesson 1.3: Your First Application](./03-first-app.md)

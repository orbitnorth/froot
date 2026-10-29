---
title: Database & ORM
category: Ecosystem & AI
summary: Integrating Drizzle ORM (SQLite/better-sqlite3) and Prisma in Froot applications.
---

Seamlessly integrate Drizzle ORM or Prisma into your Froot applications using `create-frootjs --db drizzle` or `create-frootjs --db prisma`.

## Drizzle ORM with SQLite

```ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';

const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite);
```

Inject your database repository into your service layer or route context for high performance and type-safe query execution.


# Rule: Safe Prisma & Database Operations

Use this rule whenever you are modifying database models, generating migrations, querying data, or working in `prisma/` and database access layers.

---

## 🚦 1. Production Migration Rules

*   **Deploying Migrations:** In production and CI/CD environments, always run **`npx prisma migrate deploy`**. This non-interactive command applies pending migrations and uses database advisory locking to prevent race conditions during rollouts.
*   **Never use `migrate dev` or `db push` in Production:** 
    *   `migrate dev` is strictly for local development and can trigger destructive database resets.
    *   `db push` bypasses migration files entirely, making migrations untrackable and impossible to audit or roll back.
*   **Version Control:** Commit your `schema.prisma` along with the entire `prisma/migrations` folder to Git. This guarantees environment parity across dev, staging, and production.

---

## ⚡ 2. Zero-Downtime & Safety Strategies

*   **The "Expand and Contract" Pattern:** For breaking updates (e.g., renaming columns, splitting tables, changing datatypes), implement changes in three steps:
    1. **Expand:** Add the new column or relation, keeping the old one intact. Update the application layer to write to both columns.
    2. **Backfill:** Run a background script to migrate existing records from the old structure to the new one.
    3. **Contract:** Deploy application code that reads/writes *only* the new column. Once verified, run a final migration to drop the old, unused column.
*   **Review Generated SQL:** Inspect migration SQL files created by `migrate dev` before committing. Check for table drops, data truncation, or unintended data loss warnings.
*   **Concurrent Indexing:** Standard indexing operations (`CREATE INDEX`) can lock tables. For PostgreSQL, customize migration files to use **`CREATE INDEX CONCURRENTLY`** where possible to index active production tables safely.

---

## 🔌 3. Connection Pooling & Query Performance

*   **Global Client Singleton:** In traditional server environments, declare a single global instance of `PrismaClient` to avoid connection leaks caused by framework hot-reloads during development.
*   **Edge & Serverless Environments:** Serverless architectures scale by spawning micro-containers, which can exhaust connection pools instantly. Use connection pooling proxies (such as Prisma Accelerate, PgBouncer, or Supabase connection pooling) to manage connection state.
*   **Avoid N+1 Queries:** Do not write loops that execute nested database queries. Use Prisma's fluent relation APIs (`include` or `select` queries) to fetch join data in a single SQL operation.
*   **Enforce Limits:** Always configure pagination (`take` and `skip`) on query methods returning list items to protect system memory.

---
name: prisma
description: Official database safety best practices for Prisma, covering safe schema updates, zero-downtime migrations, transaction integrity, indexing strategies, and connection pooling.
version: 1.0.0
author: Prisma Official Best Practices
tags:
  - database
  - prisma
  - postgresql
  - migrations
  - performance
---

# Skill: Safe Prisma & Database Operations Playbook

This playbook outlines the official production guidelines and migration safety principles for databases powered by Prisma.

---

## 🚀 When to Activate

Trigger this skill automatically whenever you are:
1. Modifying the database schema configuration (`schema.prisma`).
2. Running migrations or pushing schema updates in any environment.
3. Troubleshooting database connection timeouts or pool exhaustion.
4. Designing indexing, relation links, or complex database transactions.

---

## 🚦 1. Production Migration Rules

*   **Deploying Migrations:** In production/CI-CD environments, always run **`npx prisma migrate deploy`**. This non-interactive command applies pending migrations and uses database advisory locking to prevent race conditions during cluster rollouts.
*   **Never use `migrate dev` or `db push` in Production:** 
    *   `migrate dev` is strictly for development and can trigger destructive database resets.
    *   `db push` bypasses migration files entirely, making migrations untrackable and impossible to audit or roll back.
*   **Version Control:** Commit your `schema.prisma` along with the entire `prisma/migrations` folder to Git. This guarantees environment parity across dev, staging, and production.

---

## ⚡ 2. Zero-Downtime & Safety Strategies

*   **The "Expand and Contract" Pattern:** For breaking updates (e.g. renaming columns, splitting tables, changing datatypes), implement changes in three steps:
    1. **Expand:** Add the new column or relation, keeping the old one intact. Update the application layer to write to both columns.
    2. **Backfill:** Run a background script to migrate existing records from the old structure to the new one.
    3. **Contract:** Deploy application code that reads/writes *only* the new column. Once verified, run a final migration to drop the old, unused column.
*   **Review Generated SQL:** Inspect migration SQL files created by `migrate dev` before committing. Check for table drops, data truncation, or unintended data loss warnings.
*   **Concurrent Indexing:** Standard indexing operations (`CREATE INDEX`) can lock tables, causing application performance degradation. For PostgreSQL, customize migration files to use **`CREATE INDEX CONCURRENTLY`** where possible to index active production tables safely.

---

## 🔌 3. Connection Pooling & Performance

*   **Global Client Singleton:** In traditional server environments, declare a single global instance of `PrismaClient` to avoid connection leaks caused by framework hot-reloads during development.
*   **Edge & Serverless Environments:** Serverless architectures scale by spawning micro-containers, which can exhaust connection pools instantly. Use connection pooling proxies (such as Prisma Accelerate, PgBouncer, or AWS RDS Proxy) to manage connection state.
*   **Avoid N+1 Queries:** Do not write loops that execute nested database queries. Use Prisma's fluent relation APIs (`include` or `select` queries) to fetch join data in a single SQL operation.
*   **Enforce Limits:** Always configure pagination (`take` and `skip`) on query methods returning list items to protect system memory.

---
name: robust-error-handling
description: Provides detailed procedures, templates, and patterns for bulletproof Express controllers, transaction-safe Prisma queries, robust HTTP/scraper wrappers, and strict TS type guards. Use this skill when working on backend API routes, scrapers, database initialization, or network requests.
version: 1.0.0
author: Antigravity Team
tags:
  - backend
  - prisma
  - typescript
  - errors
  - express
---

# Skill: Robust Error Handling & Service Playbook

This skill equips the agent with bulletproof backend patterns to prevent crashes, handle exceptions elegantly, safely conduct DB queries, and provide precise diagnostic logging.

---

## 🚀 When to Activate

Trigger this skill automatically whenever you are:
1. Writing or modifying Express controller routes (`server/src/controllers/`).
2. Constructing database seeds or running heavy migrations (`server/src/db/` or `prisma/`).
3. Interacting with third-party APIs (Reddit, HN, Groq, OpenAI) inside scrapers or services.
4. Handling complex asynchronous promise chaining.

---

## 🛠️ Bulletproof Controller Template (Express + Prisma)

Use this precise structure to design routes. It guarantees all resources are safely released, variables validation is robust, and unexpected errors fail-safe.

```typescript
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma'; // Assumed connection client

export const getProductLeadsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { productId } = req.params;

  // 1. Validation & Early Return
  if (!productId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Product ID parameter is required.',
      },
    });
    return;
  }

  try {
    // 2. Main Logic within Contextual Try
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        leads: {
          orderBy: { created_at: 'desc' },
          take: 50,
        },
      },
    });

    // 3. Entity Presence Verification
    if (!product) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Product with ID "${productId}" not found.`,
        },
      });
      return;
    }

    // 4. Success Response
    res.status(200).json({
      success: true,
      data: product.leads,
    });
  } catch (error) {
    // 5. Safe Error Processing & Forwarding
    console.error(`[GET_PRODUCT_LEADS_ERROR] Error fetching leads for ${productId}:`, error);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected database error occurred while fetching leads.',
      },
    });
  }
};
```

---

## 🛡️ Robust Scraper Fetching Pattern

When scraping Reddit or HackerNews APIs, network requests often time out or get rate-limited. Always wrap them in a retry mechanism and log metadata:

```typescript
import fetch from 'node-fetch';

export async function fetchWithRetry(
  url: string,
  options: Record<string, unknown> = {},
  retries = 3,
  delay = 1000
): Promise<unknown> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limit hit, wait longer
        const wait = delay * (i + 1) * 2;
        console.warn(`[FETCH_RATE_LIMIT] Status 429 received. Waiting ${wait}ms before retry ${i + 1}/${retries}...`);
        await new Promise((res) => setTimeout(res, wait));
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      const isLastAttempt = i === retries - 1;
      console.error(`[FETCH_ATTEMPT_FAILED] Error on attempt ${i + 1}/${retries} for URL: ${url}. Error:`, error);
      
      if (isLastAttempt) throw error;
      
      const backoff = delay * Math.pow(2, i);
      await new Promise((res) => setTimeout(res, backoff));
    }
  }
}
```

---

## 💎 Safe Prisma Transactions

For complex updates involving multiple tables (e.g., adding a scraper run log and updating product active counts), always run them as a transaction so that if one fails, the database safely rolls back:

```typescript
const executeTransactionalLeads = async (leads: LeadInput[], logId: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Create leads
    await tx.lead.createMany({
      data: leads,
      skipDuplicates: true,
    });

    // 2. Update status log
    await tx.scraperLog.update({
      where: { id: logId },
      data: {
        status: 'SUCCESS',
        leadsFound: leads.length,
        completedAt: new Date(),
      },
    });
  });
};
```

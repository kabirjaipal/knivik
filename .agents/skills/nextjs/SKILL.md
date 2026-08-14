---
name: nextjs
description: Guidelines and best practices for Next.js 15 App Router applications, covering React Server Components, client vs server data fetching, routing, caching strategies, and dynamic request APIs.
version: 1.0.0
author: Next.js Official Best Practices
tags:
  - nextjs
  - react
  - rsc
  - caching
  - performance
---

# Skill: Next.js 15 App Router Best Practices Playbook

This playbook outlines official development standards and caching layers for applications running Next.js 15 (App Router) and React 19.

---

## 🚀 When to Activate

Trigger this skill automatically whenever you are:
1. Creating or modifying page layouts, route handlers, or API endpoints.
2. Implementing data fetching queries or caching configurations.
3. Setting up dynamic request contexts (`cookies`, `headers`, `params`, `searchParams`).
4. Structuring Server Actions, mutations, or forms.

---

## ⚡ 1. Next.js 15 Caching Paradigm Shift

Next.js 15 moves away from aggressive caching by default to a **"dynamic by default"** model.

*   **No Default Cache:** `fetch` requests, GET route handlers, and client-side page transitions are **no longer cached by default** (`cache: 'no-store'`).
*   **Explicit Caching:** You must explicitly opt in to caching if you want data to persist across requests.
*   **Async Request APIs:** Critical dynamic context APIs are asynchronous. You must **await** them:
    *   `cookies()` and `headers()`
    *   Dynamic route parameters: `params` and `searchParams`

---

## 📥 2. Data Fetching & Component Co-location

*   **Prioritize Server Components (RSC):** Fetch data directly in Server Components whenever possible. This secures database queries/API keys, reduces bundle size, and allows direct server access.
*   **Co-locate Fetching:** Fetch data inside the component that uses it. React’s **Request Memoization** automatically deduplicates identical requests within a single server render pass.
*   **Parallel Fetching:** Prevent blocking waterfalls by using `Promise.all` for independent data requests:
    ```typescript
    async function DashboardPage() {
      const [leadsData, statsData] = await Promise.all([
        getLeads(),
        getStats()
      ]);
      // ...
    }
    ```
*   **Suspense & Streaming:** Break down complex pages by wrapping slow components in `Suspense` boundaries or using `loading.tsx` to stream UI chunks to the client immediately.

---

## 💾 3. Explicit Caching Control

Configure your caching strategy per resource to balance speed and data freshness:

*   **Static Data (Force Cache):** Cache resources indefinitely:
    ```typescript
    fetch(url, { cache: 'force-cache' })
    ```
*   **Time-Based Revalidation:** Automatically refresh cache after a configured duration:
    ```typescript
    fetch(url, { next: { revalidate: 3600 } }) // 1 hour
    ```
*   **On-Demand Tag Revalidation:** Assign unique cache keys (tags) to invalidations:
    ```typescript
    fetch(url, { next: { tags: ['user-leads'] } })
    ```
    *Trigger invalidation from a Server Action or Route Handler:*
    ```typescript
    import { revalidateTag } from 'next/cache';
    
    async function updateLead() {
      // update database
      revalidateTag('user-leads');
    }
    ```

---

## 🚀 4. Client vs Server Routing Guidelines

*   **Router Cache `staleTime`:** Next.js 15 client-side navigation defaults to `staleTime: 0` for page segments, meaning the client fetches fresh data on route transitions.
*   **Server Actions for Mutations:** Always use Server Actions (`'use server'`) inside forms for secure mutations. This handles CORS, progressive enhancement, and simplifies caching invalidation.

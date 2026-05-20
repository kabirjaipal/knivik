# AGENTS.md

Welcome, AI Agent! This file is the single source of truth for the codebase architecture, conventions, and guardrails in **Knivik**. 

Please read this file carefully before performing any tasks, and ensure that every modification you make complies with these rules.

---

## 🚀 1. Project Overview & Architecture

**Knivik** is an AI-powered Buying Intent Lead Finder. It scans online conversations (Reddit, HackerNews, Twitter) to detect people actively looking for products or solutions, scores their buying intent, and automatically suggests warm-lead outreach replies.

### Directory Structure
```
knivik/
 ├── client/         # Next.js 15 (App Router), React 19, Tailwind CSS, Shadcn UI
 ├── server/         # Node.js, Express, TypeScript, Prisma (PostgreSQL)
 ├── scrapers/       # Ingestion scripts for Reddit, HackerNews, etc.
 └── ai/             # Intent classification & lead scoring engine
```

### Essential Dev Commands
*   **Frontend Development:** `npm run dev` (run from `/client`)
*   **Backend Development:** `npm run dev` (run from `/server`)
*   **Prisma Studio:** `npx prisma studio` (run from `/server`)
*   **Database Migration:** `npx prisma migrate dev` (run from `/server`)

---

## 🛠️ 2. Core Tech Stack Rules

### Frontend (Next.js & React)
*   **React Server Components (RSC) by Default:** Components are server-side by default. Only use `'use client'` when interactive state, React hooks (`useState`, `useEffect`), or client APIs are required.
*   **Data Fetching:** Fetch data on the server in Server Components whenever possible. Use robust caching and revalidation.
*   **Styling & UI:** Use **Tailwind CSS** alongside **Shadcn UI**. Follow a strict, premium visual design system (see `.agent/rules/design_system.md`).
*   **State Management:** Leverage standard React context, URL state, or local state. Keep state as close to where it is used as possible.

### Backend (Node.js & Express)
*   **TypeScript Strictness:** Strict mode is enabled. No implicit `any`. Avoid non-null assertions (`!`) unless fully verified.
*   **Database Access:** Always use **Prisma Client** for database transactions. Write robust migrations and keep schema models cohesive.
*   **Robust Routing:** Organize routes using Controllers and Services. Keep router files thin.

---

## 💎 3. Modern Code Quality Standards

Every line of code you write must conform to these modern design principles:

### 🧩 Simplicity over Complexity
*   Write small, single-responsibility functions. Keep components under 150 lines.
*   Favor simple, descriptive, and readable code over "clever" one-liners or premature optimizations.
*   Keep helper utilities pure and side-effect free.

### 🛡️ Robust Type Safety
*   **Strict Typing:** Never use `any`. If a type is complex or unknown, use `unknown` and type guards.
*   **Discriminated Unions:** Prefer discriminated unions (e.g., `{ success: true; data: T } | { success: false; error: string }`) for API responses and operational results.
*   **Interfaces:** Use interfaces for component props and standard objects; use type aliases for unions, intersections, and primitives.

### 🪚 Early Return Pattern
*   Reduce cognitive load by returning early from conditionals.
*   Avoid nesting levels beyond 2 deep.
*   *Example:*
    ```typescript
    // Incorrect:
    function processUser(user) {
      if (user) {
        if (user.isActive) {
          saveUser(user);
        }
      }
    }

    // Correct:
    function processUser(user) {
      if (!user) return;
      if (!user.isActive) return;
      saveUser(user);
    }
    ```

### 🛑 Explicit Error Handling
*   Never catch errors silently. Every caught error must be logged or properly handled.
*   Always use try-catch blocks in async actions, especially for database calls and network requests.
*   Provide clear, user-friendly error boundaries on the frontend and descriptive JSON error responses on the backend.

---

## 🚦 4. Guardrails & Protocols

### 🟢 ALWAYS
*   Always use the established theme HSL colors for any UI or styling edits; never hardcode ad-hoc hex or CSS color strings.
*   Keep files structured and use clean semantic HTML on the frontend.
*   Use environment variables (`process.env.VAR`) for secrets and external API base URLs.

### 🟡 ASK FIRST
*   Adding new external packages or npm dependencies.
*   Modifying database models (`schema.prisma`) or running schema migrations.
*   Refactoring core shared files or libraries (e.g., in `/client/lib` or `/server/src/services`).

### 🔴 NEVER
*   Never run background development servers, dev tasks, or build processes (e.g., `npm run dev`, `npm run build`, `next dev`, `npm start`). The USER will manage and execute all active dev/build commands.
*   Never run heavy compiler, type-checking, builder, or lint commands (such as `tsc --noEmit`, `npm run build`, or `npm run lint`) yourself. Always tell the user to run them in their terminal.
*   Never commit `.env` or sensitive security credentials to git.
*   Never force-push or skip git pre-commit hook checks.
*   Never bypass TypeScript checks with `// @ts-ignore` or `any` unless explicitly instructed with a detailed comment explaining why it is unavoidable.

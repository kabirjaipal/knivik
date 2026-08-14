# AGENTS.md

Welcome, AI Agent! This file is the single source of truth for the codebase architecture, conventions, and guardrails in **Knivik**. 

Please read this file carefully before performing any tasks, and ensure that every modification you make complies with these rules.

---

## 🚀 1. Project Overview & Architecture

**Knivik** is an AI-powered Buying Intent Lead Finder. It scans online conversations (Reddit, HackerNews, Twitter, GitHub, Bluesky) to detect people actively looking for products or solutions, scores their buying intent, and automatically suggests warm-lead outreach replies.

### Directory Structure
```
knivik/
 ├── app/            # Next.js 15 (App Router): UI pages & API route handlers (/app/api/...)
 ├── components/     # React 19 UI components & Shadcn primitives
 ├── context/        # React context providers (auth, billing)
 ├── lib/            # Shared services, AI engine, scrapers, Better-Auth, mailer & db
 ├── prisma/         # Prisma 7 schema, migrations & seed scripts
 └── public/         # Static assets & icons
```

### Essential Dev Commands
*   **Development Server:** `npm run dev` (run from project root)
*   **Prisma Studio:** `npx prisma studio` (run from project root)
*   **Database Migration:** `npx prisma migrate dev` (run from project root)
*   **Prisma Generate:** `npx prisma generate` (run from project root)

---

## 🛠️ 2. Core Tech Stack Rules

### Fullstack Architecture (Next.js 15 App Router & React 19)
*   **Monolith Design:** All frontend pages, backend API route handlers (`/app/api/...`), ingestion scrapers, AI qualification engines, and authentication reside in this single Next.js project.
*   **React Server Components (RSC) by Default:** Components are server-side by default. Only use `'use client'` when interactive state, React hooks (`useState`, `useEffect`), or client APIs are required.
*   **Data Fetching:** Fetch data on the server in Server Components whenever possible. Use robust caching and revalidation.
*   **Styling & UI:** Use **Tailwind CSS** alongside **Shadcn UI**. Follow a strict, premium visual design system (see `.agent/rules/design_system.md`).
*   **Database Access:** Always use **Prisma Client** (`@/lib/db`) for database transactions.
*   **TypeScript Strictness:** Strict mode is enabled. No implicit `any`. Avoid non-null assertions (`!`) unless fully verified.

---

## 💎 3. Modern Code Quality Standards

Every line of code you write must conform to these modern design principles:

### 🧩 Simplicity over Complexity
*   Write small, single-responsibility functions. Keep components under 150 lines.
*   Favor simple, descriptive, and readable code over "clever" one-liners or premature optimizations.
*   Keep helper utilities pure and side-effect free.
*   **Avoid JSX Repetition:** If JSX nodes (such as navigation links, menu items, or tables rows) are repeated, store the configuration data in an array or object and map over it dynamically instead of duplicating JSX structure.

### 🛡️ Robust Type Safety
*   **Strict Typing:** Never use `any`. Always use package-provided types; if they do not exist, define custom types or interfaces. If a type is truly dynamic or unknown, use `unknown` combined with type guards.
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

### 🛑 Explicit Error Handling & Zero Placeholders
*   Never catch errors silently. Every caught error must be logged or properly handled.
*   Always use try-catch blocks in async actions, especially for database calls and network requests.
*   Provide clear, user-friendly error boundaries on the frontend and descriptive JSON error responses on the backend.
*   **Zero Placeholders:** Never write comments like `// TODO: Implement later`. Implement robust, complete code with real features and data validation.

---

## 📂 4. Modular Directory Extensions & Skills

You must dynamically consult and apply the detailed rules and skills located in these directories:
*   **Workspace Rules:** Check `.agents/rules/` for concern-specific guidelines (e.g., `design_system.md`, `code_quality.md`).
*   **Workspace Skills:** Check `.agents/skills/` for folder-packaged skills. Each folder contains a `SKILL.md` detailing specialized procedures (e.g., `modern-aesthetics`, `prisma`, `web-design-guidelines`).

---

## 🚦 5. Guardrails & Protocols

### 🟢 ALWAYS
*   Always use the established theme HSL colors for any UI or styling edits; never hardcode ad-hoc hex or CSS color strings.
*   Keep files structured and use clean semantic HTML on the frontend.
*   Use environment variables (`process.env.VAR`) for secrets and external API base URLs.
*   Always provide the corresponding raw SQL queries (using ON CONFLICT for upserts) when modifying, inserting, or deleting database seed scripts (seed.ts) or settings, so the USER can run them directly in production without executing the full seed command.

### 🟡 ASK FIRST
*   Adding new external packages or npm dependencies.
*   Modifying database models (`schema.prisma`) or running schema migrations.
*   Refactoring core shared files or libraries.

### 🔴 NEVER
*   Never run background development servers, dev tasks, or build processes (e.g., `npm run dev`, `npm run build`, `next dev`, `npm start`). The USER will manage and execute all active dev/build commands.
*   Never run heavy compiler, type-checking, builder, or lint commands (such as `tsc --noEmit`, `npm run build`, or `npm run lint`) yourself. Always tell the user to run them in their terminal.
*   Never commit `.env` or sensitive security credentials to git.
*   Never force-push or skip git pre-commit hook checks.
*   Never bypass TypeScript checks with `// @ts-ignore` or `any` unless explicitly instructed with a detailed comment explaining why it is unavoidable.
*   Never reset the database to apply schema changes or resolve conflicts. Always solve migration issues in the best, non-destructive way (using custom SQL scripts, Prisma migration resolutions, or data migration scripts).

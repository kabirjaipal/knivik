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

## 🛠️ 2. Core Tech Stack & Framework Rules

### Fullstack Next.js 15 App Router & React 19
*   **Monolith Design:** All frontend pages, backend API route handlers (`/app/api/...`), scrapers, AI qualification engines, and auth reside in this single Next.js project.
*   **RSC by Default:** Server Components by default. Only use `'use client'` when interactive state, React hooks (`useState`, `useEffect`), or client APIs are required.
*   **Async Route Params:** In Next.js 15, route handler `params` are asynchronous: `{ params }: { params: Promise<{ id: string }> }`. Always `await params`.
*   **Data Fetching & Mutations:** Fetch data on the server in Server Components. Use Server Actions or API Route Handlers for mutations with proper `revalidatePath` / `revalidateTag`.
*   **Styling & Modern Aesthetics:** Use **Tailwind CSS** + **Shadcn UI** with HSL theme tokens (never hardcode arbitrary hex). Enforce modern aesthetics: dark mode (`#030712`), glassmorphism cards (`backdrop-blur-md`), micro-animations (`transition-all duration-200`), and tactile click states (`active:scale-[0.98]`).
*   **Database Transactions:** Always use **Prisma Client** (`@/lib/db`). For multi-table operations, wrap inside `prisma.$transaction`.
*   **TypeScript Strictness:** Strict mode enabled. No implicit `any`. Avoid non-null assertions (`!`) unless fully verified.

---

## 🤖 3. AI & LLM Integration Standards

*   **Structured Outputs:** Enforce schema validation on LLM responses using Zod schemas (`Output.object` via Vercel AI SDK or structured parsers). Never assume raw text is valid JSON.
*   **Rate Limits & Backoff:** Implement exponential backoff with jitter on `429` / transient `5xx` errors. Never retry `400` validation errors.
*   **Telemetry & Costs:** Log all model token consumption, latency, and costs via `logLlmUsage` in `@/lib/aiRunner`.
*   **Model Routing:** Use fast models (e.g. `llama-3.1-8b-instant`) for lightweight filtering and versatile models (`llama-3.3-70b-versatile`) for deep reasoning & qualification.

---

## 💎 4. Modern Code Quality & Error Handling

*   **Simplicity:** Write small, single-responsibility functions. Keep components under 150 lines.
*   **No JSX Repetition:** Store repetitive JSX configurations in arrays/objects and map dynamically.
*   **Early Return Pattern:** Flatten conditionals; return early on invalid parameters or error conditions (maximum 2 levels of nesting).
*   **Bulletproof Controllers & Routes:**
    - Always validate input with Zod and return typed error schemas: `{ success: false, error: string, details?: unknown }`.
    - Catch all async errors with structured `logger.error` and return `500` JSON (never leak internal stack traces).
*   **Zero Placeholders:** Never write `// TODO: Implement later`. Always implement real, complete code.

---

## 📂 5. Modular Directory Extensions & Skills

Dynamic runbooks and guidelines are located in:
*   **Workspace Rules:** Check `.agents/rules/` (`design_system.md`, `code_quality.md`, `prisma.md`, `scraper_reliability.md`).
*   **Workspace Skills:** Check `.agents/skills/` (`frontend-design`, `vercel-react-best-practices`).

---

## 🚦 6. Guardrails & Protocols

### 🟢 ALWAYS
*   Use established theme HSL colors; never hardcode ad-hoc hex values.
*   Use environment variables (`process.env.VAR`) for secrets and external API base URLs.
*   Provide raw SQL queries (using `ON CONFLICT` for upserts) when modifying seed data or settings.

### 🟡 ASK FIRST
*   Adding new external packages or npm dependencies.
*   Modifying database models (`schema.prisma`) or running schema migrations.
*   Refactoring core shared files or libraries.

### 🔴 NEVER
*   Never run background development servers, dev tasks, or build processes (`npm run dev`, `npm run build`, `next dev`, `npm start`).
*   Never run heavy compiler, type-checking, or lint commands (`tsc --noEmit`, `npm run build`, `npm run lint`) yourself. Tell the user to run them.
*   Never commit `.env` or sensitive security credentials to git.
*   Never force-push or skip git pre-commit hook checks.
*   Never bypass TypeScript checks with `// @ts-ignore` or `any`.
*   Never reset the database to apply schema changes or resolve conflicts.

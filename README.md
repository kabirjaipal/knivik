<div align="center">

# 🔍 Knivik

**AI-Powered Buying Intent Lead Finder**

Knivik scans Reddit, HackerNews, and X (Twitter) in real-time to detect people actively looking for products or services — then scores their buying intent and generates warm outreach replies using AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

</div>

---

## ✨ What is Knivik?

Instead of cold outreach, Knivik finds **warm leads** — people already talking about the problem your product solves.

**Example conversations Knivik detects:**
- *"Looking for a project management tool for my team"*
- *"Best CRM for freelancers?"*
- *"Any good Notion alternatives?"*
- *"Frustrated with my current email marketing tool"*

Knivik scores these posts by buying intent, notifies you, and generates a suggested reply personalised to your product.

---

## 🚀 Features

| Feature | Description |
|---|---|
| **Multi-Platform Scraping** | Monitors Reddit, HackerNews, and X (Twitter) |
| **AI Intent Scoring** | LLM-powered classification: `BUY_NOW`, `COMPARING` |
| **Lead Dashboard** | Filter and browse leads by product, platform, and score |
| **AI Reply Generator** | Generates personalised, non-spammy outreach replies |
| **Multi-Product Tracking** | Track keywords and competitors across multiple products/services |
| **Email Alerts** | Get notified the moment a new lead is detected |
| **Admin Panel** | Manage users, models, system config, and scan jobs |
| **Cortex AI Agent** | Autonomous chat agent for on-demand social prospecting |
| **Usage Tracking** | Per-user LLM usage logs, scan limits, and billing hooks |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org) (App Router) |
| **Language** | TypeScript (strict mode) |
| **UI** | [Shadcn UI](https://ui.shadcn.com) + Tailwind CSS |
| **Database** | PostgreSQL via [Prisma ORM](https://www.prisma.io) |
| **Auth** | [Better Auth](https://better-auth.com) (email + Google OAuth) |
| **AI / LLM** | [Groq](https://groq.com) (llama-3.1-8b, llama-3.3-70b) |
| **Email** | [Resend](https://resend.com) |
| **Payments** | [Dodo Payments](https://dodopayments.com) *(optional)* |
| **Analytics** | PostHog + Google Analytics *(optional)* |

---

## 📦 Self-Hosting Guide

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** ≥ 14 (local or hosted — [Supabase](https://supabase.com), [Neon](https://neon.tech), [Aiven](https://aiven.io) all work)
- A **Groq API key** (free tier available at [console.groq.com](https://console.groq.com))
- A **Resend API key** (free tier available at [resend.com](https://resend.com))

### 1. Clone the repository

```bash
git clone https://github.com/kabirjaipal/knivik.git
cd knivik
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in at minimum:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/knivik?schema=public"
BETTER_AUTH_SECRET=your_32_char_random_secret   # openssl rand -hex 32
GROQ_API_KEY=your_groq_api_key
RESEND_API_KEY=your_resend_api_key
SMTP_FROM=no-reply@yourdomain.com
CRON_SECRET=your_cron_secret                    # openssl rand -hex 32
```

See [`.env.example`](./.env.example) for all available options with descriptions.

### 4. Set up the database

```bash
# Run migrations
npx prisma migrate dev

# Seed with a default admin user and system config
# Set SEED_OWNER_EMAIL and SEED_OWNER_PASSWORD in your .env first
npx prisma db seed
```

### 5. Start the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) — you're live! 🎉

### 6. (Optional) Run with Docker

Knivik ships with a production-ready `Dockerfile` and `docker-compose.yml`.

**Quickstart (app + PostgreSQL together):**

```bash
# 1. Copy and fill in your secrets
cp .env.example .env

# 2. Build and start
docker compose up -d --build

# 3. The app is now running at http://localhost:3000
```

Docker Compose automatically:
- Spins up a **PostgreSQL 16** container with a persistent volume
- Waits for the DB to be healthy before starting the app
- Runs **Prisma migrations** on every startup
- Reads secrets from your `.env` file — nothing is hardcoded

**DB only** (if you want to run `npm run dev` locally but use a Dockerized DB):

```bash
docker compose up -d db
```

**Useful commands:**

```bash
docker compose logs -f app        # Stream app logs
docker compose down               # Stop containers
docker compose down -v            # Stop + wipe DB volume
docker compose exec app npx prisma db seed   # Seed the DB
```

### 7. (Optional) Deploy to Vercel

Knivik is designed to run on [Vercel](https://vercel.com). Just connect your fork and set the environment variables in the Vercel dashboard.

The cron job is pre-configured in [`vercel.json`](./vercel.json).

---

## 🗂️ Project Structure

```
knivik/
├── app/                  # Next.js App Router — pages & API routes
│   ├── (auth)/           # Login, register, forgot password
│   ├── (marketing)/      # Landing page, pricing, blog
│   ├── dashboard/        # Main app UI (leads, products, settings)
│   ├── admin/            # Admin panel
│   └── api/              # API route handlers (auth, billing, scan, etc.)
├── components/           # Reusable React components & Shadcn primitives
├── context/              # React context providers (auth, billing)
├── lib/                  # Core services and utilities
│   ├── services/         # Scrapers (Reddit, HN, Twitter), AI qualifier
│   ├── prompts/          # LLM prompt templates
│   ├── seo/              # Metadata and structured data helpers
│   ├── ai-runner.ts      # LLM orchestration layer
│   ├── auth.ts           # Better Auth configuration
│   ├── billing.ts        # Subscription & plan management
│   ├── config.ts         # Validated env config (Zod)
│   ├── db.ts             # Prisma client singleton
│   ├── plans.ts          # Plan definitions and limits
│   └── security.ts       # Rate limiting & abuse detection
└── prisma/
    ├── schema.prisma     # Full database schema
    ├── seed.ts           # Initial data seeder
    └── migrations/       # Prisma migration history
```

---

## ⚙️ Configuration Reference

All configuration is managed via environment variables. See [`.env.example`](./.env.example) for the full list.

Key variables:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | ✅ | 32-char secret for session signing |
| `GROQ_API_KEY` | ✅ | Groq API key for LLM inference |
| `RESEND_API_KEY` | ✅ | Resend API key for email alerts |
| `CRON_SECRET` | ✅ | Secures the `/api/cron/scan` endpoint |
| `GOOGLE_CLIENT_ID/SECRET` | ❌ | Enable Google OAuth login |
| `DODO_PAYMENTS_API_KEY` | ❌ | Enable paid plan billing |
| `NEXT_PUBLIC_POSTHOG_KEY` | ❌ | PostHog analytics |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ❌ | Google Analytics 4 |

---

## 🧑‍💻 Development Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npx prisma studio    # Open Prisma Studio GUI (database browser)
npx prisma migrate dev   # Create and apply a new migration
npx prisma generate  # Regenerate Prisma Client after schema changes
npx prisma db seed   # Seed the database
```

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a pull request.

Found a security issue? Please follow the [Security Policy](./SECURITY.md) and report it privately.

---

## 📄 License

[MIT](./LICENSE) — free to use, modify, and distribute.

---

<div align="center">
Built with ❤️ — now open source.
</div>
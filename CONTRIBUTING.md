# Contributing to Knivik

Thank you for taking the time to contribute! 🎉

Whether it's a bug report, a feature idea, or a pull request — all contributions are welcome.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Making a Pull Request](#making-a-pull-request)
- [Code Style](#code-style)

---

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something great.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/your-username/knivik.git
   cd knivik
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up your environment**:
   ```bash
   cp .env.example .env
   # Fill in the required values in .env
   ```
5. **Set up the database**:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
6. **Start the dev server**:
   ```bash
   npm run dev
   ```

---

## Reporting Bugs

- Search [existing issues](https://github.com/kabirjaipal/knivik/issues) first to avoid duplicates
- If it's a **security vulnerability**, follow the [Security Policy](./SECURITY.md) — do NOT open a public issue
- Otherwise, open an issue with:
  - Clear title and description
  - Steps to reproduce
  - Expected vs. actual behavior
  - Environment details (OS, Node version, etc.)

---

## Suggesting Features

Open a [GitHub Discussion](https://github.com/kabirjaipal/knivik/discussions) or an issue tagged `enhancement`.

Describe:
- The problem you're trying to solve
- How your proposed feature addresses it
- Any alternatives you've considered

---

## Making a Pull Request

1. Create a new branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes following the [Code Style](#code-style) below
3. Commit with a clear message (we use [Conventional Commits](https://www.conventionalcommits.org/)):
   ```
   feat: add Twitter/X keyword monitoring
   fix: handle rate limit errors in Reddit scraper
   docs: update self-hosting guide
   ```
4. Push your branch and open a Pull Request against `main`
5. Fill in the PR template and link any related issues

---

## Code Style

- **TypeScript strict mode** is enabled — no `any`, no `@ts-ignore`
- **Shadcn UI** components are preferred over raw HTML elements
- **Tailwind CSS** with HSL theme tokens — no arbitrary hex values
- Keep components under ~150 lines; split if larger
- All async errors must be caught and return structured JSON responses
- Input validation via **Zod** schemas on all API routes
- Run `npm run lint` before submitting a PR (we don't have a CI yet, but it helps!)

---

Thanks again for contributing! 🚀

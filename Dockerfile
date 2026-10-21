# syntax=docker/dockerfile:1
# ============================================================
# Knivik — Production Dockerfile
# Multi-stage build for minimal, secure image size
# ============================================================

# ── Stage 1: Shared base ─────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ── Stage 2: Install dependencies ────────────────────────────
# Needs build tools because argon2 compiles native C bindings on Alpine (musl libc)
FROM base AS deps
RUN apk add --no-cache python3 make g++ gcc

COPY package.json package-lock.json ./
COPY prisma ./prisma

RUN npm ci

# ── Stage 3: Build ────────────────────────────────────────────
FROM base AS builder
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Tell Prisma to generate engines for Alpine (linux-musl) — critical for Alpine runtime
ENV PRISMA_CLI_BINARY_TARGETS="native,linux-musl,linux-musl-openssl-3.0.x"
RUN npx prisma generate

# NEXT_PUBLIC_* vars are baked into client JS at build time.
# Pass them as build-args:
#   docker build --build-arg NEXT_PUBLIC_SITE_URL=https://yourdomain.com .
# docker-compose users: set them in the 'environment' block of the build service,
# or they will fall back to the defaults below (localhost:3000).
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=/api

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ── Stage 4: Production runner (minimal image) ────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Must match the targets set in the builder stage
ENV PRISMA_CLI_BINARY_TARGETS="native,linux-musl,linux-musl-openssl-3.0.x"

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Public folder and static assets (standalone output excludes these — must copy manually)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma schema + migrations (needed for migrate deploy at runtime)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# node_modules from BUILDER (contains prisma generate output for linux-musl)
# NOT from deps — the generated client must match the runner OS
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma

USER nextjs

EXPOSE 3000

# Run Prisma migrations then start the standalone Next.js server
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node server.js"]

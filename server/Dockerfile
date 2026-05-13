# Multi-stage Dockerfile optimized for high-performance Railway production orchestration

# ==========================================
# Build Stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency resolution cache layer
COPY package*.json ./

# Install exact dependency tree cleanly
RUN npm ci

# Copy entire application source
COPY . .

# Generate Prisma client artifacts
RUN npx prisma generate

# Transpile TypeScript modules into static JavaScript artifacts
RUN npm run build

# ==========================================
# Production Stage
# ==========================================
FROM node:20-alpine AS production

# Enforce strict production optimizations for V8 engine and Express
ENV NODE_ENV=production

WORKDIR /app

# Copy minimal configuration layouts
COPY package*.json ./
COPY prisma ./prisma

# Install pure production dependencies and purge residual npm package caches
RUN npm ci --only=production && npm cache clean --force

# Copy static compilation output from builder stage
COPY --from=builder /app/dist ./dist

# Generate production Prisma binaries tailored for minimal container footprint
RUN npx prisma generate

# Transfer full ownership to unprivileged 'node' user to prevent container escalation attacks
RUN chown -R node:node /app

# Switch to standard non-root secure user context
USER node

# Execute live schema migrations synchronously before starting production worker clusters
CMD npx prisma migrate deploy && node dist/index.js

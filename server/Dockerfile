# Multi-stage Dockerfile optimized for high-performance Render/Railway production orchestration

# ==========================================
# Build & Dependency Stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configuration files and prisma schema for dependency resolution cache layer
COPY package*.json ./
COPY prisma ./prisma

# Install exact dependency tree cleanly (including devDependencies required for compilation)
RUN npm ci

# Generate Prisma client artifacts and query engine binaries
RUN npx prisma generate

# Copy entire application source code
COPY . .

# Transpile TypeScript modules into static JavaScript artifacts
# Run tsc directly to avoid running prisma generate again
RUN npx tsc

# ==========================================
# Production Stage
# ==========================================
FROM node:20-alpine AS production

# Enforce strict production optimizations for V8 engine and Express framework
ENV NODE_ENV=production

WORKDIR /app

# Copy minimal configuration layouts required for production execution
COPY package*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

# Copy fully built node_modules and compiled dist from builder stage
# This retains all dependencies and the generated Prisma Client, avoiding npm install in production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Transfer full ownership to unprivileged 'node' user to prevent container escalation attacks
RUN chown -R node:node /app

# Switch runtime execution context to standard non-root secure user
USER node

# Expose standard application HTTP port
EXPOSE 3000

# Execute live schema migrations synchronously before starting production worker clusters
# This runs instantly because prisma is already in the copied node_modules
CMD npx prisma migrate deploy && node dist/index.js


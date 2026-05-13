# Multi-stage Dockerfile optimized for high-performance Render/Railway production orchestration

# ==========================================
# Build Stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configuration files for dependency resolution cache layer
COPY package*.json ./

# Install exact dependency tree cleanly (including devDependencies required for compilation)
RUN npm ci

# Copy entire application source code
COPY . .

# Generate Prisma client artifacts and query engine binaries
RUN npx prisma generate

# Transpile TypeScript modules into static JavaScript artifacts
RUN npm run build

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

# Install pure production dependencies adhering to modern npm standards and purge caches
RUN npm ci --omit=dev && npm cache clean --force

# Copy static compilation output from builder stage
COPY --from=builder /app/dist ./dist

# Generate production Prisma binaries tailored for minimal container footprint
RUN npx prisma generate

# Transfer full ownership to unprivileged 'node' user to prevent container escalation attacks
RUN chown -R node:node /app

# Switch runtime execution context to standard non-root secure user
USER node

# Expose standard application HTTP port
EXPOSE 3000

# Execute live schema migrations synchronously before starting production worker clusters
CMD npx prisma migrate deploy && node dist/index.js

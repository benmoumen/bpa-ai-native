# BPA AI-Native API Application Dockerfile
# Multi-stage build for optimized production image

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/

# Install dependencies
RUN pnpm install --frozen-lockfile

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm --filter=@bpa/db db:generate

# Build the application
RUN pnpm turbo run build --filter=api...

# =============================================================================
# Stage 3: Runner
# =============================================================================
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nestjs
RUN adduser --system --uid 1001 nestjs

# Copy built application and dependencies
COPY --from=builder --chown=nestjs:nestjs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/apps/api/node_modules ./node_modules

# Copy workspace packages (pnpm symlinks need the actual packages)
# @bpa/db - includes Prisma client generated to src/generated/prisma
COPY --from=builder --chown=nestjs:nestjs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=nestjs:nestjs /app/packages/db/src/generated ./packages/db/src/generated
COPY --from=builder --chown=nestjs:nestjs /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder --chown=nestjs:nestjs /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=nestjs:nestjs /app/packages/db/node_modules ./packages/db/node_modules
# @bpa/types
COPY --from=builder --chown=nestjs:nestjs /app/packages/types/dist ./packages/types/dist
COPY --from=builder --chown=nestjs:nestjs /app/packages/types/package.json ./packages/types/package.json

USER nestjs

EXPOSE 4000

ENV PORT=4000

CMD ["node", "dist/main.js"]

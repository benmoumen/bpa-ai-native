# BPA AI-Native

AI-native Business Process Application platform - a greenfield rebuild of the UNCTAD BPA system.

## Overview

This project reimagines the BPA frontend with AI at its core, replacing complex drag-and-drop form building with natural language interactions.

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Check Command |
|------|---------|---------------|
| Node.js | 20.9+ | `node --version` |
| pnpm | 9+ | `pnpm --version` |
| Docker | Latest | `docker --version` |
| Docker Compose | V2+ | `docker compose version` |

### Installing Prerequisites

```bash
# Install Node.js (via nvm recommended)
nvm install 20
nvm use 20

# Install pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Docker Desktop: https://www.docker.com/products/docker-desktop
```

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd bpa-ai-native
pnpm install
```

### 2. Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Generate NextAuth secret
openssl rand -base64 32
# Add the output to NEXTAUTH_SECRET in .env
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL, Redis, and Keycloak
docker compose up -d

# Wait for services to be healthy (check with)
docker compose ps

# View logs if needed
docker compose logs -f
```

### 4. Initialize Database

```bash
# Push schema to database
pnpm db:push

# Generate Prisma client
pnpm db:generate
```

### 5. Start Development Servers

```bash
# Start both web and api in development mode
pnpm dev
```

The applications will be available at:
- **Web**: http://localhost:3000
- **API**: http://localhost:4000
- **Keycloak Admin**: http://localhost:8080 (admin/admin)

### 6. Test Authentication

Use these development credentials:

| Email | Password | Role | Country |
|-------|----------|------|---------|
| designer@example.com | password | SERVICE_DESIGNER | SLV |
| admin@example.com | password | COUNTRY_ADMIN | SLV |
| support@unctad.org | password | UNCTAD_SUPPORT | - |

> **Note**: The test users have example `country_code` attribute set to "SLV" (El Salvador).
> For production deployments, update `infrastructure/keycloak/realm-export.json` with appropriate country codes.

## Architecture

```
bpa-ai-native/
├── apps/
│   ├── web/            # React 19 + Next.js 15 frontend
│   └── api/            # NestJS backend
├── packages/
│   ├── db/             # Prisma schema + migrations
│   ├── ui/             # Shared UI components
│   ├── types/          # Shared TypeScript types
│   └── config/         # Shared configurations
├── infrastructure/
│   └── keycloak/       # Keycloak realm configuration
├── _bmad/              # BMAD workflow configuration
└── _bmad-output/       # Planning artifacts (PRD, Architecture, etc.)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Next.js 15 |
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL + Prisma |
| Cache | Redis |
| Auth | Keycloak SSO |
| LLM Primary | Groq (Llama-3 70B) |
| LLM Fallback | Claude API |
| Form Renderer | JSON Forms |

## Available Commands

### Root Commands

```bash
pnpm install          # Install all dependencies
pnpm dev              # Start development servers (web + api)
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm test             # Run tests
pnpm clean            # Clean build artifacts
```

### Database Commands

```bash
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio (visual database browser)
pnpm db:migrate       # Run database migrations
```

### Docker Commands

```bash
docker compose up -d          # Start infrastructure services
docker compose down           # Stop services (keeps data)
docker compose down -v        # Stop and remove volumes (reset data)
docker compose logs -f        # View service logs
docker compose ps             # Check service status
```

### Individual App Commands

```bash
# Web app
pnpm --filter web dev         # Start web dev server
pnpm --filter web build       # Build web app
pnpm --filter web lint        # Lint web app

# API app
pnpm --filter api dev         # Start api dev server
pnpm --filter api build       # Build api app
pnpm --filter api lint        # Lint api app
```

## Troubleshooting

### Docker Issues

**Services won't start:**
```bash
# Check if ports are in use
lsof -i :5432   # PostgreSQL
lsof -i :6379   # Redis
lsof -i :8080   # Keycloak

# Reset everything
docker compose down -v
docker compose up -d
```

**Keycloak startup fails:**
```bash
# Keycloak depends on PostgreSQL, ensure it's healthy first
docker compose logs postgres
docker compose restart keycloak
```

### Database Issues

**Connection refused:**
```bash
# Ensure PostgreSQL is running
docker compose ps
# Check connection string in .env matches docker-compose.yml
```

**Prisma client outdated:**
```bash
pnpm db:generate
```

### Authentication Issues

**Login fails:**
1. Ensure Keycloak is running: `docker compose ps`
2. Check realm was imported: http://localhost:8080/admin (admin/admin)
3. Verify client exists in "bpa" realm
4. Check KEYCLOAK_* environment variables match

**Session expires immediately:**
- Check NEXTAUTH_SECRET is set and consistent
- Verify browser accepts cookies from localhost

### Build Issues

**Type errors after changes:**
```bash
pnpm clean
pnpm install
pnpm db:generate
pnpm build
```

## Reference Projects

- `../BPA-frontend` - Legacy Angular 15 + Formio (UX/design reference)
- `../BPA-backend` - Existing Spring Boot backend (API reference)

## Documentation

See `_bmad-output/` for:
- Product Requirements Document (PRD)
- Architecture decisions
- Epic and story definitions

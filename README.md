# BPA AI-Native

AI-native Business Process Application platform - a greenfield rebuild of the UNCTAD BPA system.

## Overview

This project reimagines the BPA frontend with AI at its core, replacing complex drag-and-drop form building with natural language interactions.

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

## Reference Projects

- `../BPA-frontend` - Legacy Angular 15 + Formio (UX/design reference)
- `../BPA-backend` - Existing Spring Boot backend (API reference)

## Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test

# Build
pnpm build
```

## Documentation

See `_bmad-output/` for:
- Product Requirements Document (PRD)
- Architecture decisions
- Epic and story definitions

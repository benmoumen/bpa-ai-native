# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

BPA AI-Native is a greenfield rebuild of the UNCTAD Business Process Application platform. It replaces the legacy Angular 15 + Formio system with an AI-native architecture using React 19, NestJS, and LLM-powered form generation.

## Key Concepts

### AI-Native Form Building
- Users describe forms in natural language
- LLM generates JSON Schema forms
- Iterative refinement via chat interface
- No drag-and-drop complexity

### Reference Projects
The legacy systems provide design and API reference:
- `../BPA-frontend` - UX patterns, component designs, user workflows
- `../BPA-backend` - API contracts, data models, business logic

### BMAD Workflow
This project uses BMAD for structured planning:
- PRD, Architecture, Epics in `_bmad-output/`
- Workflow configs in `_bmad/`

## Tech Stack

- **Frontend**: React 19 + Next.js 15 (App Router)
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis
- **Auth**: Keycloak SSO (OAuth2 + PKCE)
- **LLM**: Groq (primary), Claude (fallback), LiteLLM (gateway)
- **Forms**: JSON Forms renderer

## Project Structure

```
bpa-ai-native/
├── apps/
│   ├── web/            # Next.js frontend
│   └── api/            # NestJS backend
├── packages/
│   ├── db/             # Prisma schema
│   ├── ui/             # Shared components
│   ├── types/          # Shared types
│   └── config/         # Shared configs
└── _bmad-output/       # Planning artifacts
```

## Development Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start development servers
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm lint             # Lint code
```

## Commit Messages

Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

Keep messages concise. Never mention AI authorship.

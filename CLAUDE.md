# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

BPA AI-Native is a greenfield rebuild of the UNCTAD Business Process Application platform. It replaces the legacy Angular 15 + Formio system with an AI-native architecture using React 19, NestJS, and LLM-powered form generation.

## CRITICAL: eRegistrations BPA Domain Model

**DO NOT REINVENT THESE PATTERNS** - they are battle-tested from the legacy eRegistrations BPA system. The full analysis is in `_bmad-output/analysis/bpa-api-mental-model-analysis.md`.

### Core Entities (MUST FOLLOW)

| Entity | Definition | Key Point |
|--------|-----------|-----------|
| **Service** | Configuration container | Owns forms, roles, bots, determinants, costs |
| **Registration** | Authorization container | What applicants apply for (data + docs + fees → authorization) |
| **Role** | Processing state executor | UserRole (human) vs BotRole (automated) |
| **RoleStatus** | Workflow outcome tracker | 4 universal statuses per role |

### 4-Status Model (UNIVERSAL WORKFLOW GRAMMAR)

Every workflow role produces ONE of these four outcomes:

```
PENDING (0)  → Waiting for decision
PASSED (1)   → Approved, moves to next role
RETURNED (2) → Sent back for fixes (can retry)
REJECTED (3) → Permanently rejected (terminal)
```

**This is non-negotiable** - all workflow implementations must use this model.

### BOT Contract Architecture

Bots use contract-based I/O, NOT type-based implementations:

```
Bot
├── InputMapping:  form field → service request field
└── OutputMapping: service response field → form field
```

This enables plug & play: AI agents, payment processors, legacy APIs are all different implementations of the same contract interface.

### Key Relationships

- `Service --[N:N]--> Registration` (via service_registration)
- `Role --[N:N]--> Registration` (via RoleRegistration)
- `Role --[N:N]--> Institution` (via RoleInstitution)
- `Role --[1:N]--> RoleStatus` (each role has status options)

### Determinant Polymorphism

Conditional logic varies by field type:
- TextDeterminant, SelectDeterminant, DateDeterminant
- NumericDeterminant, BooleanDeterminant
- ClassificationDeterminant, GridDeterminant

**AI-Native Evolution**: Transform to LLM-evaluable natural language conditions.

### What NOT to Reinvent

1. **4-Status Model** - Use as-is, it's universal
2. **Service/Registration separation** - Keep this distinction
3. **Role inheritance** (UserRole/BotRole) - Proven pattern
4. **Contract-based BOT I/O** - Enables extensibility
5. **Audit trail architecture** - Already solved

### What TO Transform

1. Forms → Conversational interface (LLM-generated)
2. Linear role sequences → Dynamic context routing
3. Field-based determinants → Natural language conditions
4. Static catalogs → AI-augmented lookups

### Field Reference Consistency (ADR-001)

Fields referenced in expressions use **stable `fieldId`** (not mutable names):
- Syntax: `$field.f_abc123` in JSONata/conditions
- Database triggers auto-track references in `field_references` table
- FK constraint blocks delete if field is referenced
- See `_bmad-output/adrs/001-field-reference-consistency.md`

### Architecture Decision Records

Major technical decisions are documented in `_bmad-output/adrs/`. Check these before making architectural changes.

## Legacy BPA Reference (CONSULT BEFORE INVENTING)

When implementing features that exist in legacy BPA, **check the source first**:

### eRegistrations Ecosystem (All in `../`)

**Two Main Systems:**
- **BPA** (Business Process Application) = Design-time tool for creating services
- **DS** (Display System) = Runtime where users submit applications & institutions process them

| Repo | Purpose | Consult For |
|------|---------|-------------|
| **BPA-backend** | BPA Java/Spring API | Enums, entities, business logic |
| **BPA-frontend** | BPA Angular UI | Service designer UX patterns |
| **formio-server** | Form.io builder (used in BPA) | Form schema creation, validation |
| **ds-frontend** | DS new frontend | Applicant/operator UX patterns |
| **eregcms** | DS backend (Python) + deprecated Angular frontend | Backend logic, API patterns |
| **formio.js** / **formiojs-4.x** | Form.io runtime (used in DS) | Form rendering, field behavior |
| **camunda-boot** | Workflow engine | BPMN integration, process definitions |
| **mule3** / **mule4** | Integration layer | BOT implementations, external APIs |
| **mule-common** | Shared Mule code | Common integrations |
| **GDB** | Generic Database Builder | No-code DB creation, auto API, schema versioning, data permissions |
| **keycloak** | Auth server config | SSO, roles, permissions |
| **restheart** | MongoDB REST API | Document storage patterns |
| **eregistrations** | Core eReg platform | Legacy patterns, data models |

### API Documentation

| API | URL |
|-----|-----|
| **BPA REST API** | `https://bpa.dev.els.eregistrations.org/bparest/bpa/v2016/06/v3/api-docs` |

### Where to Find What

| Need | Look In |
|------|---------|
| Enum values (BotType, CostType, etc.) | `../BPA-backend/src/main/java/org/unctad/ereg/bpa/model/` |
| Role/Status types | `../BPA-backend/src/main/java/org/unctad/ereg/bpa/model/role/` |
| Determinant operators | `../BPA-backend/src/main/java/org/unctad/ereg/bpa/model/determinant/` |
| Form types | `../BPA-backend/src/main/java/org/unctad/ereg/bpa/formio/` |
| API endpoints | Fetch the Swagger docs URL above |

### When to Consult Legacy

- Implementing workflow states → Check RoleStatusType enum
- Adding bot types → Check BotType, BotCategoryType enums
- Building cost calculations → Check CostType, formula patterns
- Adding notifications → Check MessageChannel, notification templates
- Form field types → Check FieldType enum and Form.io patterns

### Locked-In Values (These are fixed, don't look up)

```typescript
// 4-Status Model - NEVER change these codes
PENDING = 0, PASSED = 1, RETURNED = 2, REJECTED = 3

// Cost types
CostType = 'FIX' | 'FORMULA'
```

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

### Essential Reading (Before Major Features)
- `_bmad-output/analysis/bpa-api-mental-model-analysis.md` - Full domain analysis
- `_bmad-output/analysis/brainstorming-session-2025-12-29.md` - Transformation decisions

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

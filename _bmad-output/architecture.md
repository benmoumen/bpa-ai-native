---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2025-12-26'
inputDocuments:
  - '_bmad-output/prd.md'
  - 'docs/eR_User_Manual/eR_User_Manual.html'
workflowType: 'architecture'
project_name: 'bpa-ai-native'
user_name: 'Moulaymehdi'
date: '2025-12-25'
hasProjectContext: false
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
66 FRs across 12 capability areas:
- Service Management (8 FRs): CRUD, lifecycle, templates
- Form Configuration (9 FRs): JSON Schema forms, field types, conditional visibility
- Workflow Configuration (7 FRs): Linear approval chains, step transitions
- AI-Powered Assistance (9 FRs): Natural language → config, structured proposals, gap detection
- Determinants & Business Rules (5 FRs): Calculated variables, formula engine
- Preview & Publishing (8 FRs): Simulation, completeness dashboard, publish gates
- User & Access Management (5 FRs): Keycloak SSO, RBAC
- System Administration (6 FRs): Audit logs, YAML export/import
- Demo & Collaboration (3 FRs): Live stakeholder presentations
- Error Handling (2 FRs): Detailed messages, auto-save
- AI Interaction (2 FRs): Streaming, cancel
- Accessibility (1 FR): Keyboard navigation
- Change Management (1 FR): Impact analysis

**Non-Functional Requirements:**
37 NFRs across 7 categories:
- Performance: AI < 10s, streaming < 1s, form preview < 2s
- Security: TLS 1.3, AES-256, OAuth2 + PKCE, OWASP Top 10
- Reliability: 99.5% uptime, daily backups, < 24h RPO
- Accessibility: WCAG 2.1 AA, keyboard nav, screen reader support
- Integration: Keycloak, LLM fallback, Git sync, email notifications
- Cost: < $1.00 per service configuration
- Infrastructure: 5 Mbps minimum, desktop-first (1024px+)

**Scale & Complexity:**

- Primary domain: Full-stack web application (SPA + API + LLM orchestration)
- Complexity level: Enterprise
- Estimated architectural components: 15-20

### Technical Constraints & Dependencies

| Constraint | Impact |
|------------|--------|
| **React 19.2 + Next.js 16.1** | App Router, RSC, Turbopack, "use cache" directive |
| **NestJS 11** | TypeScript, modular architecture, enhanced logging |
| **PostgreSQL + Prisma 7** | Type-safe ORM, migrations, new Studio |
| **Keycloak SSO** | OAuth2 + PKCE, multi-realm federation |
| **JSON Forms** | Form rendering with custom renderers |
| **Groq LLM** | High-speed inference, rate limits |
| **Claude fallback** | Via LiteLLM gateway |
| **Per-country deployment** | Infrastructure isolation, no shared tenancy |
| **WCAG 2.1 AA** | Accessibility baked into all components |
| **5 Mbps baseline** | Optimize for developing country infrastructure |

### Technology Evaluation Decisions

#### Form Rendering: JSON Forms (RJSF rejected)

| Criterion | JSON Forms | RJSF | Decision |
|-----------|------------|------|----------|
| React 19 compatibility | Functional, hooks-based | Class components | JSON Forms |
| Bundle size | ~80KB core | ~150KB | JSON Forms |
| Customization | Renderer pattern, composable | Widget overrides | JSON Forms |
| Accessibility | Strong WCAG focus | Basic ARIA | JSON Forms |
| AI integration | Schema → render pipeline | Same | Tie |

**Rationale:** JSON Forms' renderer pattern aligns with AI-generation pipeline. RJSF's class-component heritage is a liability for React 19 + Next.js 15 App Router.

#### Expression & Rules Layer: JSONata + JSON Rules Engine

**JSONata Scope:**

| Use Case | Phase | AI-Generated? |
|----------|-------|---------------|
| Fee/Cost Formulas | MVP | No — formula builder UI |
| Determinant Calculations | MVP | No — formula builder UI |
| Bot API Response Transforms | Phase 2 | Yes — with examples |
| Evaluation Expressions (risk scoring) | Phase 2 | Suggested, human-approved |
| Auto-Approval Criteria | Phase 2 | Suggested, human-approved |

**JSON Rules Engine Scope:**

| Use Case | Phase | AI-Generated? |
|----------|-------|---------------|
| Workflow Transitions | MVP | Yes — structured JSON |
| Conditional Visibility | MVP | Yes — structured JSON |
| Routing Rules | Phase 2 | Yes — structured JSON |
| Action Triggers | Phase 2 | Yes — structured JSON |

**Rationale:**
- JSONata excels at *calculations* and *data transformation* — concise, purpose-built syntax
- JSON Rules Engine excels at *decisions* and *routing* — AI generates valid JSON structures reliably
- Separation of concerns: expressions (JSONata) vs. decision trees (JSON Rules Engine)

#### Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    JSONata Expression Layer                  │
├─────────────────────────────────────────────────────────────┤
│  Formulas & Determinants    │  Bot Transforms  │ Evaluation │
│  ─────────────────────────  │  ──────────────  │ ────────── │
│  • Fee calculations         │  • API normalize │ • Risk score│
│  • Derived field values     │  • Response map  │ • Auto-check│
│  • Conditional amounts      │  • Error extract │ • Criteria  │
├─────────────────────────────────────────────────────────────┤
│  Stored in: Service YAML config                             │
│  Compiled: Once, cached in memory                           │
│  Sandboxed: No access to external resources                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│               JSON Rules Engine Layer                        │
├─────────────────────────────────────────────────────────────┤
│  • Workflow transitions (if approved → next step)           │
│  • Routing rules (if riskScore > 70 → senior reviewer)      │
│  • Conditional visibility (if companyType = LLC → show X)   │
│  • Action triggers (if complete → send notification)        │
└─────────────────────────────────────────────────────────────┘
```

### Cross-Cutting Concerns Identified

| Concern | Architectural Impact |
|---------|---------------------|
| **Authentication** | Keycloak integration layer, JWT validation, session management |
| **Authorization** | RBAC middleware, country-scoped access control |
| **Audit Logging** | Centralized log service, immutable storage, 2-year retention |
| **Multi-tenancy** | Database-per-instance pattern, no cross-tenant APIs |
| **Accessibility** | Design system with ARIA, focus management, color contrast |
| **i18n/l10n** | Translation framework, RTL support, locale-aware formatting |
| **LLM Orchestration** | Streaming responses, fallback logic, cost tracking, timeouts |
| **Expression Evaluation** | JSONata sandboxing, compilation caching, error handling |
| **Rules Engine** | JSON Rules Engine for decisions, JSON Schema validation |
| **Offline Resilience** | Service worker, operation queue, sync manager (Phase 2) |

## Starter Template Evaluation

### Primary Technology Domain

Full-stack monorepo: Next.js 16.1 (frontend) + NestJS 11 (backend) + shared packages

### Version Matrix (December 2025)

| Technology | Version | Release Date | Key Features |
|------------|---------|--------------|--------------|
| **Next.js** | 16.1 | Dec 18, 2025 | Turbopack stable, React 19.2, "use cache" directive |
| **React** | 19.2 | Dec 2025 | View Transitions, useEffectEvent, Activity |
| **NestJS** | 11.1.10 | Dec 2025 | Enhanced logging, microservice improvements |
| **Prisma** | 7.2.0 | Dec 17, 2025 | Rust-free client, 70% faster type-checking |
| **Turborepo** | Latest | Dec 2025 | File system caching, remote caching |
| **TypeScript** | 5.7+ | Dec 2025 | Required by Prisma 7 |
| **Node.js** | 20.9+ | - | Minimum required |

### Starter Options Considered

| Option | Fit | Decision |
|--------|-----|----------|
| Custom Turborepo setup | 100% | **Selected** |
| vndevteam/nestjs-turbo | 95% | Good but includes auth we'd replace |
| fullstack-turborepo-starter | 90% | Older versions, needs audit |
| create-t3-app | 60% | Uses tRPC, not NestJS |

### Selected Approach: Custom Turborepo Setup

**Rationale:** BPA AI-Native has unique integrations (Keycloak, LiteLLM, JSON Forms, JSONata) that no existing starter provides. Starting with official tools ensures:
- Latest versions (Next.js 16.1, NestJS 11, Prisma 7)
- No technical debt from unused starter features
- Full control over architectural patterns
- Clean foundation for custom packages

**Initialization Commands:**

```bash
# 1. Initialize Turborepo monorepo
pnpm dlx create-turbo@latest bpa-ai-native --package-manager pnpm

# 2. Create Next.js 16 frontend
cd bpa-ai-native/apps
pnpm dlx create-next-app@latest web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --turbopack \
  --src-dir \
  --import-alias "@/*"

# 3. Create NestJS 11 backend
pnpm dlx @nestjs/cli new api \
  --package-manager pnpm \
  --strict

# 4. Initialize Prisma 7 in db package
cd ../packages
mkdir db && cd db
pnpm init
pnpm add prisma@latest @prisma/client@latest
npx prisma init --datasource-provider postgresql

# 5. Add shared packages structure
mkdir -p ../ui ../types ../config
```

**Architectural Decisions from Setup:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Language | TypeScript 5.7+ (strict) | Required by Prisma 7, type safety for AI-generated code |
| Package Manager | pnpm | Efficient monorepo support, workspace protocol |
| Build Tool | Turbopack | Next.js 16 default, 10-14x faster dev startup |
| Monorepo Tool | Turborepo | Vercel-maintained, file system caching stable |
| Styling | Tailwind CSS | Utility-first, works with JSON Forms theming |
| React Features | 19.2 canary | View Transitions, Activity for UX |
| Caching | "use cache" directive | Next.js 16 explicit caching model |
| Linting | ESLint + Prettier | Industry standard |
| Folder Structure | `src/` directory | Clean separation |

**Project Structure:**

```
bpa-ai-native/
├── apps/
│   ├── web/              # Next.js 16.1 frontend
│   └── api/              # NestJS 11 backend
├── packages/
│   ├── db/               # Prisma 7 schema + client
│   ├── ui/               # Shared React components
│   ├── types/            # Shared TypeScript types
│   └── config/           # Shared ESLint, TS configs
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Note:** Project initialization should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Caching strategy (Redis + in-memory hybrid)
- Service configuration storage (DB + Git sync)
- API style (REST + OpenAPI)
- Authentication flow (Keycloak SSO)

**Important Decisions (Shape Architecture):**
- LLM streaming pattern (SSE with abort)
- State management (Zustand + TanStack Query)
- Component strategy (RSC default, client for interactive)
- Hosting approach (Docker + cloud-agnostic)

**Deferred Decisions (Post-MVP):**
- WebSocket for real-time collaboration (Phase 3)
- Kubernetes orchestration (when scale requires)
- Multi-region CDN (when deploying multiple countries)

### Data Architecture

#### Caching Strategy: Hybrid (Redis + In-Memory)

| Cache Type | Technology | Use Cases |
|------------|------------|-----------|
| **Distributed** | Redis | Session tokens, LLM response cache, rate limiting, pub/sub |
| **In-Memory** | LRU Cache | Compiled JSONata expressions, JSON Rules Engine instances |

**Rationale:** Per-country isolation requires distributed cache for sessions. In-memory caching for expression compilation avoids network overhead on hot paths.

#### Service Configuration Storage: DB + Git Sync

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Action   │────▶│   PostgreSQL    │────▶│   Git Repo      │
│   (Save Form)   │     │   (Primary)     │     │   (Audit/Sync)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        Fast reads for
                        runtime rendering
```

| Layer | Purpose |
|-------|---------|
| **PostgreSQL** | Primary storage, fast queries, transactions |
| **Git Repository** | Audit trail, version history, cross-instance sync |
| **YAML Export** | Human-readable, portable service definitions |

**Sync Pattern:**
- On save: Write to DB, queue Git commit
- Background worker: Batch commits every 30 seconds
- On conflict: DB wins, Git shows divergence for manual resolution

### Authentication & Security

#### Keycloak Integration Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│  Keycloak   │────▶│  Country    │
│   Frontend  │     │   Realm     │     │  IdP (opt)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │              JWT Token
       ▼                   │
┌─────────────┐            │
│   NestJS    │◀───────────┘
│   Backend   │
└─────────────┘
```

| Component | Responsibility |
|-----------|---------------|
| **Keycloak Realm** | User management, role assignment, token issuance |
| **Next.js** | PKCE flow initiation, token storage (httpOnly cookies) |
| **NestJS Guard** | JWT validation, role extraction, country-scope enforcement |
| **Country IdP** | Optional federation via SAML/OIDC for national identity |

**Token Strategy:**
- Access token: 1 hour expiry (NFR11)
- Refresh token: 7 days, rotated on use
- Session timeout: 30 minutes inactivity (NFR9)

### API & Communication Patterns

#### REST + OpenAPI Architecture

| Endpoint Pattern | Example | Purpose |
|-----------------|---------|---------|
| `/api/v1/services` | CRUD operations | Service management |
| `/api/v1/services/:id/forms` | Nested resources | Form configuration |
| `/api/v1/ai/generate` | AI operations | LLM interactions |
| `/api/v1/preview/:id` | Read-only | Service preview |

**NestJS Module Structure:**
```
apps/api/src/
├── modules/
│   ├── services/       # Service CRUD
│   ├── forms/          # Form configuration
│   ├── workflows/      # Workflow management
│   ├── ai/             # LLM orchestration
│   ├── auth/           # Keycloak integration
│   └── audit/          # Logging & compliance
├── common/
│   ├── guards/         # Auth guards
│   ├── interceptors/   # Logging, transform
│   └── filters/        # Error handling
└── config/             # Environment config
```

#### LLM Streaming: SSE with Abort Signal

```typescript
// Next.js Route Handler pattern
export async function POST(req: Request) {
  const { signal } = req;

  const stream = new ReadableStream({
    async start(controller) {
      const llmStream = await litellm.stream({
        model: 'groq/llama-3-70b',
        messages: [...],
        signal, // Propagate abort
      });

      for await (const chunk of llmStream) {
        if (signal.aborted) break;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' }
  });
}
```

**Fallback Pattern:**
1. Try Groq (Llama-3 70B) — 310+ tokens/sec
2. On failure/timeout: Fallback to Claude via LiteLLM
3. Track costs per request for budget monitoring

### Frontend Architecture

#### State Management: Zustand + TanStack Query

| State Type | Tool | Examples |
|------------|------|----------|
| **Server State** | TanStack Query | Services list, form configs, workflow data |
| **UI State** | Zustand | Panel visibility, draft changes, modal state |
| **Form State** | JSON Forms | Form field values, validation |

**Store Structure:**
```typescript
// stores/ui.ts
interface UIState {
  activePanel: 'chat' | 'form' | 'workflow' | 'preview';
  draftChanges: Map<string, unknown>;
  isStreaming: boolean;
  abortController: AbortController | null;
}

// hooks/useServices.ts
const useServices = () => useQuery({
  queryKey: ['services'],
  queryFn: () => api.services.list(),
  staleTime: 30_000,
});
```

#### Server vs Client Component Strategy

| Component Type | Rendering | Use Cases |
|---------------|-----------|-----------|
| **Server Component** | RSC | Service list, dashboard, static content |
| **Client Component** | CSR | AI chat, form builder, workflow editor |
| **"use cache"** | Cached RSC | Template gallery, reference data |

**Decision Tree:**
```
Does it need interactivity?
  └─ Yes → Client Component
  └─ No → Does it need fresh data every request?
           └─ Yes → Server Component
           └─ No → "use cache" + Server Component
```

#### AI Chat UI: CopilotKit

**Decision:** Adopt CopilotKit as the AI chat interface framework.

| Criterion | CopilotKit | Custom SSE | Decision |
|-----------|------------|------------|----------|
| Groq Integration | Native support | Manual implementation | CopilotKit |
| Streaming UI | Built-in components | Build from scratch | CopilotKit |
| Context Hooks | useCopilotReadable | Custom context provider | CopilotKit |
| Action Triggers | useCopilotAction | Manual event handlers | CopilotKit |
| Generative UI | useCoAgentStateRender | Not available | CopilotKit |
| Bundle Size | ~45KB | ~15KB custom | Acceptable |
| Maintenance | Active community | Internal team | CopilotKit |

**Rationale:** CopilotKit provides production-ready AI chat components with native Groq support, reducing Epic 6 implementation effort by ~40%. The framework handles SSE streaming, context management, and generative UI patterns out of the box.

**Component Integration:**

| CopilotKit Component | Purpose | Integration Point |
|---------------------|---------|-------------------|
| `CopilotSidebar` | Main AI chat interface | Left panel in split-screen layout |
| `CopilotPopup` | Inline field-level AI help | Form field context menus |
| `useCopilotReadable` | Share form state with AI | Form config, service metadata |
| `useCopilotAction` | AI-triggered form updates | Apply AI suggestions to forms |
| `useCoAgentStateRender` | Generative UI rendering | Live preview updates |

**Configuration:**

```typescript
// app/providers.tsx
import { CopilotKit } from "@copilotkit/react-core";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      transcribeAudioUrl="/api/copilotkit/transcribe"
    >
      {children}
    </CopilotKit>
  );
}

// app/api/copilotkit/route.ts
import { CopilotRuntime, GroqAdapter } from "@copilotkit/runtime";

export async function POST(req: Request) {
  const copilotKit = new CopilotRuntime();
  const groqAdapter = new GroqAdapter({ model: "llama-3.3-70b-versatile" });

  return copilotKit.streamHttpServerResponse(req, res, groqAdapter);
}
```

**Context Sharing Pattern:**

```typescript
// components/FormBuilder.tsx
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";

function FormBuilder({ serviceId }: { serviceId: string }) {
  const { data: formConfig } = useFormConfig(serviceId);

  // Share current form state with AI
  useCopilotReadable({
    description: "Current form configuration",
    value: formConfig,
  });

  // Allow AI to add fields
  useCopilotAction({
    name: "addFormField",
    description: "Add a new field to the form",
    parameters: [
      { name: "fieldType", type: "string", enum: ["text", "number", "date", "select"] },
      { name: "label", type: "string" },
      { name: "required", type: "boolean" },
    ],
    handler: async ({ fieldType, label, required }) => {
      await addField({ serviceId, fieldType, label, required });
    },
  });

  return <FormEditor config={formConfig} />;
}
```

### Infrastructure & Deployment

#### Docker + Cloud-Agnostic Architecture

```yaml
# docker-compose.yml structure
services:
  web:
    build: ./apps/web
    environment:
      - NEXT_PUBLIC_API_URL=http://api:3001
      - KEYCLOAK_URL=${KEYCLOAK_URL}

  api:
    build: ./apps/api
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - LITELLM_URL=${LITELLM_URL}

  postgres:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  litellm:
    image: ghcr.io/berriai/litellm:latest
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
```

**Per-Country Deployment:**
- Each country gets isolated Docker stack
- Data stays within national boundaries
- Shared only: Service templates (via YAML export/import)

#### CI/CD: GitHub Actions + Turborepo

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm turbo build --cache-dir=.turbo
      - run: pnpm turbo test
      - run: pnpm turbo lint
```

**Turborepo Remote Caching:**
- Enabled for faster CI builds
- Shared cache between branches
- ~70% reduction in CI time after warm cache

### Decision Impact Analysis

**Implementation Sequence:**
1. Monorepo initialization (Turborepo + apps + packages)
2. Database schema (Prisma 7 + PostgreSQL)
3. Authentication (Keycloak + NestJS guards)
4. Core API (REST endpoints + OpenAPI)
5. Frontend shell (Next.js 16 + state management)
6. AI integration (LiteLLM + SSE streaming)
7. Form builder (JSON Forms + custom renderers)

**Cross-Component Dependencies:**

| Decision | Affects |
|----------|---------|
| Redis caching | Session management, LLM response cache, rate limiting |
| REST + OpenAPI | NestJS modules, API documentation, client generation |
| Zustand + TanStack Query | All frontend components, data flow |
| Docker deployment | CI/CD, local development, production hosting |
| Git sync | Audit compliance, service portability, version history |

## Implementation Patterns & Consistency Rules

These patterns ensure AI agents implement consistently across the codebase, preventing conflicts and maintaining coherence.

### Naming Conventions

#### Database Naming (Prisma)

```prisma
// Models: PascalCase → Database: snake_case
model Service {
  id          String   @id @default(cuid())
  name        String
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  createdById String   @map("created_by_id")

  @@map("services")
}

model FormConfig {
  id        String @id @default(cuid())
  serviceId String @map("service_id")

  @@map("form_configs")
}
```

**Rules:**
- Model names: PascalCase (Service, FormConfig)
- Database tables: snake_case via `@@map("table_name")`
- Fields: camelCase in TypeScript
- Columns: snake_case via `@map("column_name")`
- Relations: camelCase (service, formConfigs)

#### API Naming (REST)

| Pattern | Example | Rule |
|---------|---------|------|
| Endpoints | `/api/v1/services` | Plural nouns, kebab-case |
| Query params | `?pageSize=10&sortBy=createdAt` | camelCase |
| Path params | `/services/:serviceId` | camelCase with Id suffix |
| Request body | `{ "serviceName": "..." }` | camelCase JSON |
| Response body | `{ "data": {...} }` | camelCase JSON |

#### Code Naming (TypeScript/React)

| Entity | Convention | Example |
|--------|------------|---------|
| React Components | PascalCase | `ServiceCard.tsx`, `FormBuilder.tsx` |
| Hooks | camelCase with use prefix | `useServices.ts`, `useFormConfig.ts` |
| Utilities | camelCase | `formatDate.ts`, `parseSchema.ts` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE` |
| Types/Interfaces | PascalCase | `ServiceDto`, `FormConfigInput` |
| NestJS Controllers | PascalCase + Controller | `ServicesController` |
| NestJS Services | PascalCase + Service | `ServicesService` |
| NestJS Modules | PascalCase + Module | `ServicesModule` |

### File Organization

#### Feature-Based Structure (Frontend)

```
apps/web/src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── callback/
│   ├── (dashboard)/              # Main app route group
│   │   ├── services/
│   │   │   ├── page.tsx          # List page
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx      # Detail page
│   │   │   │   └── edit/
│   │   │   └── new/
│   │   └── layout.tsx
│   ├── api/                      # Route handlers
│   │   └── ai/
│   │       └── generate/
│   └── layout.tsx
├── components/
│   ├── ui/                       # Generic UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── index.ts
│   └── features/                 # Feature-specific components
│       ├── services/
│       │   ├── ServiceCard.tsx
│       │   ├── ServiceList.tsx
│       │   └── index.ts
│       └── forms/
│           ├── FormBuilder.tsx
│           └── FieldEditor.tsx
├── hooks/
│   ├── queries/                  # TanStack Query hooks
│   │   ├── useServices.ts
│   │   └── useFormConfig.ts
│   └── mutations/
│       ├── useCreateService.ts
│       └── useUpdateForm.ts
├── stores/                       # Zustand stores
│   ├── ui.ts
│   └── draft.ts
├── lib/                          # Utilities
│   ├── api.ts
│   └── jsonata.ts
└── types/
    └── index.ts
```

#### Module-Based Structure (Backend)

```
apps/api/src/
├── main.ts
├── app.module.ts
├── modules/
│   ├── services/
│   │   ├── services.module.ts
│   │   ├── services.controller.ts
│   │   ├── services.service.ts
│   │   ├── dto/
│   │   │   ├── create-service.dto.ts
│   │   │   └── update-service.dto.ts
│   │   ├── entities/
│   │   │   └── service.entity.ts
│   │   └── services.controller.spec.ts  # Co-located test
│   ├── forms/
│   ├── workflows/
│   ├── ai/
│   └── auth/
├── common/
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── interceptors/
│   │   └── transform.interceptor.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── decorators/
│       └── current-user.decorator.ts
└── config/
    ├── database.config.ts
    └── keycloak.config.ts
```

### Test Organization

**Pattern:** Co-located unit tests + dedicated integration/e2e directories

```
# Unit tests: co-located with source
src/modules/services/services.service.ts
src/modules/services/services.service.spec.ts

# Integration tests: dedicated directory
test/
├── integration/
│   ├── services.integration.spec.ts
│   └── forms.integration.spec.ts
└── e2e/
    ├── services.e2e-spec.ts
    └── setup.ts
```

### API Response Patterns

#### Standard Response Wrapper

```typescript
// Success response
interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasNext?: boolean;
  };
}

// Error response
interface ApiError {
  error: {
    code: string;           // Machine-readable: 'SERVICE_NOT_FOUND'
    message: string;        // Human-readable: 'Service with ID xyz not found'
    details?: unknown;      // Additional context
    requestId?: string;     // For support correlation
  };
}
```

#### Example Responses

```typescript
// GET /api/v1/services
{
  "data": [
    { "id": "abc123", "name": "Business Registration" }
  ],
  "meta": { "page": 1, "limit": 20, "total": 45, "hasNext": true }
}

// GET /api/v1/services/abc123
{
  "data": { "id": "abc123", "name": "Business Registration", ... }
}

// Error: 404
{
  "error": {
    "code": "SERVICE_NOT_FOUND",
    "message": "Service with ID 'xyz' not found",
    "requestId": "req_abc123"
  }
}
```

### State Management Patterns

#### TanStack Query Keys

```typescript
// packages/types/src/query-keys.ts
export const queryKeys = {
  services: {
    all: ['services'] as const,
    lists: () => [...queryKeys.services.all, 'list'] as const,
    list: (filters: ServiceFilters) => [...queryKeys.services.lists(), filters] as const,
    details: () => [...queryKeys.services.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.services.details(), id] as const,
  },
  forms: {
    all: ['forms'] as const,
    byService: (serviceId: string) => [...queryKeys.forms.all, 'service', serviceId] as const,
    detail: (id: string) => [...queryKeys.forms.all, 'detail', id] as const,
  },
  workflows: {
    all: ['workflows'] as const,
    byService: (serviceId: string) => [...queryKeys.workflows.all, 'service', serviceId] as const,
  },
} as const;
```

#### Zustand Store Pattern

```typescript
// stores/ui.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UIState {
  // State
  activePanel: 'chat' | 'form' | 'workflow' | 'preview';
  isStreaming: boolean;
  abortController: AbortController | null;

  // Actions
  setActivePanel: (panel: UIState['activePanel']) => void;
  startStreaming: () => AbortController;
  stopStreaming: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      activePanel: 'chat',
      isStreaming: false,
      abortController: null,

      setActivePanel: (panel) => set({ activePanel: panel }),

      startStreaming: () => {
        const controller = new AbortController();
        set({ isStreaming: true, abortController: controller });
        return controller;
      },

      stopStreaming: () => {
        get().abortController?.abort();
        set({ isStreaming: false, abortController: null });
      },
    }),
    { name: 'ui-store' }
  )
);
```

### Error Handling Patterns

#### Backend Error Handling

```typescript
// common/filters/http-exception.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse: ApiError = {
      error: {
        code: this.getErrorCode(exception),
        message: this.getErrorMessage(exception),
        requestId: request.headers['x-request-id'] as string,
      }
    };

    response.status(status).json(errorResponse);
  }
}
```

#### Frontend Error Handling

```typescript
// lib/api.ts
export class ApiClient {
  async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new ApiException(error.error.code, error.error.message);
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  }
}
```

### Loading State Patterns

#### Skeleton Components

```typescript
// components/ui/Skeleton.tsx
export function ServiceCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border p-4">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

// Usage with Suspense
<Suspense fallback={<ServiceCardSkeleton />}>
  <ServiceCard id={serviceId} />
</Suspense>
```

#### TanStack Query Loading States

```typescript
// hooks/queries/useServices.ts
export function useServices(filters?: ServiceFilters) {
  return useQuery({
    queryKey: queryKeys.services.list(filters ?? {}),
    queryFn: () => api.services.list(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

// Component usage
function ServiceList() {
  const { data, isLoading, isError, error } = useServices();

  if (isLoading) return <ServiceListSkeleton />;
  if (isError) return <ErrorDisplay error={error} />;

  return <ServiceGrid services={data} />;
}
```

### Enforcement Guidelines

**For AI Agents:**
1. Before creating any file, check if similar patterns exist in the codebase
2. Follow the naming conventions exactly — no variations
3. Use the established directory structure — no new top-level directories without explicit approval
4. Copy existing patterns for new implementations
5. Run `pnpm lint` before completing any task

**Pattern Violations to Catch:**
- Creating `utils/` instead of `lib/`
- Using `index.tsx` for non-barrel exports
- Mixing snake_case in TypeScript code
- Creating new query key structures instead of extending existing
- Using different error response formats

## Project Structure & Boundaries

### Requirements Mapping

| FR Category | Primary Location | Secondary |
|-------------|-----------------|-----------|
| **Service Management (8 FRs)** | `apps/api/src/modules/services/` | `apps/web/src/app/(dashboard)/services/` |
| **Form Configuration (9 FRs)** | `apps/api/src/modules/forms/` | `apps/web/src/components/features/forms/` |
| **Workflow Configuration (7 FRs)** | `apps/api/src/modules/workflows/` | `apps/web/src/components/features/workflows/` |
| **AI-Powered Assistance (9 FRs)** | `apps/api/src/modules/ai/` | `apps/web/src/app/api/ai/` |
| **Determinants & Rules (5 FRs)** | `apps/api/src/modules/determinants/` | `packages/expressions/` |
| **Preview & Publishing (8 FRs)** | `apps/api/src/modules/preview/` | `apps/web/src/app/(dashboard)/preview/` |
| **User & Access (5 FRs)** | `apps/api/src/modules/auth/` | `apps/web/src/app/(auth)/` |
| **System Administration (6 FRs)** | `apps/api/src/modules/admin/` | `apps/web/src/app/(dashboard)/admin/` |
| **Demo & Collaboration (3 FRs)** | `apps/api/src/modules/demo/` | `apps/web/src/components/features/demo/` |

### Complete Project Directory Structure

```
bpa-ai-native/
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .gitignore
├── .env.example
├── .npmrc
├── .nvmrc                            # Node 20.9+
├── docker-compose.yml
├── docker-compose.dev.yml
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-staging.yml
│   │   └── deploy-production.yml
│   └── PULL_REQUEST_TEMPLATE.md
│
├── apps/
│   ├── web/                          # Next.js 16.1 Frontend
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── postcss.config.js
│   │   ├── .env.local.example
│   │   ├── Dockerfile
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   └── locales/
│   │   │       ├── en/
│   │   │       └── fr/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── globals.css
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx
│   │       │   ├── error.tsx
│   │       │   ├── not-found.tsx
│   │       │   ├── (auth)/
│   │       │   │   ├── login/
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── logout/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── callback/
│   │       │   │       └── page.tsx
│   │       │   ├── (dashboard)/
│   │       │   │   ├── layout.tsx
│   │       │   │   ├── page.tsx              # Dashboard home
│   │       │   │   ├── services/
│   │       │   │   │   ├── page.tsx          # Service list
│   │       │   │   │   ├── new/
│   │       │   │   │   │   └── page.tsx
│   │       │   │   │   └── [id]/
│   │       │   │   │       ├── page.tsx      # Service detail
│   │       │   │   │       ├── edit/
│   │       │   │   │       │   └── page.tsx
│   │       │   │   │       ├── forms/
│   │       │   │   │       │   └── page.tsx
│   │       │   │   │       ├── workflow/
│   │       │   │   │       │   └── page.tsx
│   │       │   │   │       └── determinants/
│   │       │   │   │           └── page.tsx
│   │       │   │   ├── preview/
│   │       │   │   │   └── [id]/
│   │       │   │   │       └── page.tsx
│   │       │   │   ├── templates/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── admin/
│   │       │   │       ├── page.tsx
│   │       │   │       ├── users/
│   │       │   │       │   └── page.tsx
│   │       │   │       └── audit/
│   │       │   │           └── page.tsx
│   │       │   └── api/
│   │       │       └── ai/
│   │       │           └── generate/
│   │       │               └── route.ts      # SSE streaming endpoint
│   │       ├── components/
│   │       │   ├── ui/
│   │       │   │   ├── Button.tsx
│   │       │   │   ├── Card.tsx
│   │       │   │   ├── Dialog.tsx
│   │       │   │   ├── Input.tsx
│   │       │   │   ├── Select.tsx
│   │       │   │   ├── Skeleton.tsx
│   │       │   │   ├── Toast.tsx
│   │       │   │   └── index.ts
│   │       │   ├── layout/
│   │       │   │   ├── Header.tsx
│   │       │   │   ├── Sidebar.tsx
│   │       │   │   ├── MainLayout.tsx
│   │       │   │   └── index.ts
│   │       │   └── features/
│   │       │       ├── services/
│   │       │       │   ├── ServiceCard.tsx
│   │       │       │   ├── ServiceList.tsx
│   │       │       │   ├── ServiceForm.tsx
│   │       │       │   └── index.ts
│   │       │       ├── forms/
│   │       │       │   ├── FormBuilder.tsx
│   │       │       │   ├── FieldEditor.tsx
│   │       │       │   ├── FormPreview.tsx
│   │       │       │   ├── renderers/       # JSON Forms custom renderers
│   │       │       │   │   ├── TextRenderer.tsx
│   │       │       │   │   ├── SelectRenderer.tsx
│   │       │       │   │   └── index.ts
│   │       │       │   └── index.ts
│   │       │       ├── workflows/
│   │       │       │   ├── WorkflowEditor.tsx
│   │       │       │   ├── StepNode.tsx
│   │       │       │   ├── TransitionEditor.tsx
│   │       │       │   └── index.ts
│   │       │       ├── ai/
│   │       │       │   ├── ChatPanel.tsx
│   │       │       │   ├── ChatMessage.tsx
│   │       │       │   ├── StreamingIndicator.tsx
│   │       │       │   ├── ProposalCard.tsx
│   │       │       │   └── index.ts
│   │       │       ├── determinants/
│   │       │       │   ├── FormulaEditor.tsx
│   │       │       │   ├── DeterminantList.tsx
│   │       │       │   └── index.ts
│   │       │       └── demo/
│   │       │           ├── DemoMode.tsx
│   │       │           └── index.ts
│   │       ├── hooks/
│   │       │   ├── queries/
│   │       │   │   ├── useServices.ts
│   │       │   │   ├── useService.ts
│   │       │   │   ├── useFormConfig.ts
│   │       │   │   ├── useWorkflow.ts
│   │       │   │   └── index.ts
│   │       │   ├── mutations/
│   │       │   │   ├── useCreateService.ts
│   │       │   │   ├── useUpdateService.ts
│   │       │   │   ├── usePublishService.ts
│   │       │   │   └── index.ts
│   │       │   └── useAuth.ts
│   │       ├── stores/
│   │       │   ├── ui.ts
│   │       │   ├── draft.ts
│   │       │   └── chat.ts
│   │       ├── lib/
│   │       │   ├── api.ts
│   │       │   ├── auth.ts
│   │       │   ├── jsonata.ts
│   │       │   ├── json-forms.ts
│   │       │   └── utils.ts
│   │       ├── types/
│   │       │   └── index.ts
│   │       └── middleware.ts
│   │
│   └── api/                          # NestJS 11 Backend
│       ├── package.json
│       ├── nest-cli.json
│       ├── tsconfig.json
│       ├── tsconfig.build.json
│       ├── .env.example
│       ├── Dockerfile
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── config/
│       │   │   ├── database.config.ts
│       │   │   ├── keycloak.config.ts
│       │   │   ├── redis.config.ts
│       │   │   ├── litellm.config.ts
│       │   │   └── index.ts
│       │   ├── modules/
│       │   │   ├── services/
│       │   │   │   ├── services.module.ts
│       │   │   │   ├── services.controller.ts
│       │   │   │   ├── services.service.ts
│       │   │   │   ├── services.controller.spec.ts
│       │   │   │   ├── dto/
│       │   │   │   │   ├── create-service.dto.ts
│       │   │   │   │   ├── update-service.dto.ts
│       │   │   │   │   └── service-response.dto.ts
│       │   │   │   └── entities/
│       │   │   │       └── service.entity.ts
│       │   │   ├── forms/
│       │   │   │   ├── forms.module.ts
│       │   │   │   ├── forms.controller.ts
│       │   │   │   ├── forms.service.ts
│       │   │   │   ├── forms.controller.spec.ts
│       │   │   │   └── dto/
│       │   │   │       ├── create-form.dto.ts
│       │   │   │       └── update-form.dto.ts
│       │   │   ├── workflows/
│       │   │   │   ├── workflows.module.ts
│       │   │   │   ├── workflows.controller.ts
│       │   │   │   ├── workflows.service.ts
│       │   │   │   ├── rules-engine.service.ts
│       │   │   │   └── dto/
│       │   │   │       └── workflow.dto.ts
│       │   │   ├── ai/
│       │   │   │   ├── ai.module.ts
│       │   │   │   ├── ai.controller.ts
│       │   │   │   ├── ai.service.ts
│       │   │   │   ├── litellm.client.ts
│       │   │   │   ├── prompts/
│       │   │   │   │   ├── form-generation.ts
│       │   │   │   │   ├── workflow-suggestion.ts
│       │   │   │   │   └── determinant-analysis.ts
│       │   │   │   └── dto/
│       │   │   │       └── generate-request.dto.ts
│       │   │   ├── determinants/
│       │   │   │   ├── determinants.module.ts
│       │   │   │   ├── determinants.controller.ts
│       │   │   │   ├── determinants.service.ts
│       │   │   │   ├── jsonata.service.ts
│       │   │   │   └── dto/
│       │   │   │       └── determinant.dto.ts
│       │   │   ├── preview/
│       │   │   │   ├── preview.module.ts
│       │   │   │   ├── preview.controller.ts
│       │   │   │   └── preview.service.ts
│       │   │   ├── auth/
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── keycloak.strategy.ts
│       │   │   │   └── dto/
│       │   │   │       └── user.dto.ts
│       │   │   ├── admin/
│       │   │   │   ├── admin.module.ts
│       │   │   │   ├── admin.controller.ts
│       │   │   │   ├── audit.service.ts
│       │   │   │   └── export.service.ts
│       │   │   └── demo/
│       │   │       ├── demo.module.ts
│       │   │       └── demo.controller.ts
│       │   └── common/
│       │       ├── guards/
│       │       │   ├── auth.guard.ts
│       │       │   └── roles.guard.ts
│       │       ├── decorators/
│       │       │   ├── current-user.decorator.ts
│       │       │   └── roles.decorator.ts
│       │       ├── interceptors/
│       │       │   ├── transform.interceptor.ts
│       │       │   └── logging.interceptor.ts
│       │       ├── filters/
│       │       │   └── http-exception.filter.ts
│       │       └── pipes/
│       │           └── validation.pipe.ts
│       └── test/
│           ├── jest.config.ts
│           ├── integration/
│           │   ├── services.integration.spec.ts
│           │   └── forms.integration.spec.ts
│           └── e2e/
│               ├── app.e2e-spec.ts
│               └── setup.ts
│
├── packages/
│   ├── db/                           # Prisma 7 Database
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── index.ts
│   │       └── client.ts
│   │
│   ├── types/                        # Shared TypeScript Types
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── service.ts
│   │       ├── form.ts
│   │       ├── workflow.ts
│   │       ├── user.ts
│   │       ├── api.ts
│   │       └── query-keys.ts
│   │
│   ├── ui/                           # Shared UI Components
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       └── primitives/
│   │           └── index.ts
│   │
│   ├── config/                       # Shared Configurations
│   │   ├── package.json
│   │   ├── eslint/
│   │   │   └── index.js
│   │   ├── typescript/
│   │   │   ├── base.json
│   │   │   ├── nextjs.json
│   │   │   └── nestjs.json
│   │   └── tailwind/
│   │       └── index.ts
│   │
│   └── expressions/                  # JSONata + JSON Rules Engine
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── jsonata/
│           │   ├── compiler.ts
│           │   ├── sandbox.ts
│           │   └── cache.ts
│           └── rules/
│               ├── engine.ts
│               └── validators.ts
│
├── docs/
│   ├── api/
│   │   └── openapi.yaml
│   ├── architecture/
│   │   └── diagrams/
│   └── development/
│       └── setup.md
│
└── _bmad-output/                     # BMAD Planning Artifacts
    ├── prd.md
    ├── architecture.md
    └── project-planning-artifacts/
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Pattern | Location |
|----------|---------|----------|
| **Public API** | REST + OpenAPI | `/api/v1/*` via NestJS |
| **Internal API** | Direct imports | `packages/*` shared code |
| **AI Streaming** | SSE | `apps/web/src/app/api/ai/` |
| **Auth Boundary** | Keycloak JWT | Guards in `apps/api/src/common/guards/` |

**Data Boundaries:**

| Layer | Access Pattern |
|-------|---------------|
| **Database** | Only via `packages/db` Prisma client |
| **Cache (Redis)** | Only via NestJS services |
| **Cache (In-memory)** | `packages/expressions` for compiled JSONata |
| **External APIs** | LiteLLM gateway via `apps/api/src/modules/ai/` |

**Component Boundaries:**

| Frontend Layer | Server/Client | Communication |
|----------------|---------------|---------------|
| **Pages** | Server Components | Direct DB via server actions or fetch |
| **Interactive** | Client Components | TanStack Query → REST API |
| **State** | Client | Zustand (UI) + TanStack Query (server) |

### Integration Points

**Internal Communication:**
- `apps/web` → `apps/api`: REST API calls via TanStack Query
- `apps/api` → `packages/db`: Prisma client imports
- `apps/api` → `packages/expressions`: JSONata/Rules Engine evaluation
- `apps/*` → `packages/types`: Shared type imports

**External Integrations:**
- Keycloak: OAuth2 + PKCE flow, JWT validation
- LiteLLM: Groq primary, Claude fallback
- Git: Background sync for service configuration audit
- Redis: Session storage, LLM response cache

**Data Flow:**
```
User Action → Next.js Client → REST API → NestJS → Prisma → PostgreSQL
                    ↓
             TanStack Query Cache
                    ↓
              Zustand UI State
```

## Legacy System Alignment (eRegistrations User Manual)

### Terminology Mapping

| Legacy Term | AI-Native Term | Implementation |
|-------------|---------------|----------------|
| Service | Service | Same - CRUD in `modules/services/` |
| Registration | Registration | Sub-entity of Service |
| Determinant | Visibility Rule | JSON Rules Engine conditions |
| Document BOT | Document Processor | `modules/bots/document/` |
| Data BOT | Data Connector | `modules/bots/data/` + JSONata transforms |
| Internal BOT | Service Router | `modules/bots/internal/` |
| Human Role | Manual Step | Workflow pause for operator action |
| BOT Role | Automated Step | Workflow auto-execution |
| GDB | External Registry | `modules/gdb/` API client |
| Instance Catalog | Global Catalog | Scope: INSTANCE |
| Cross-Table | Shared Catalog | Scope: CROSS_SERVICE |
| Service Catalog | Service Catalog | Scope: SERVICE |

### Additional Backend Modules Required

```
apps/api/src/modules/
├── bots/                           # BOT System (3 types)
│   ├── bots.module.ts
│   ├── bots.controller.ts
│   ├── document/                   # Document BOT
│   │   ├── document-bot.service.ts
│   │   └── extractors/
│   │       ├── pdf.extractor.ts
│   │       └── ocr.extractor.ts
│   ├── data/                       # Data BOT
│   │   ├── data-bot.service.ts
│   │   ├── trigger.service.ts      # 1.5s delay trigger
│   │   └── query-builder.ts
│   ├── internal/                   # Internal BOT
│   │   ├── internal-bot.service.ts
│   │   └── polling.service.ts
│   └── mapping/
│       ├── mapping.service.ts
│       └── transformations.ts      # JSONata transforms
│
├── certificates/                   # Certificate Generation
│   ├── certificates.module.ts
│   ├── certificates.controller.ts
│   ├── certificates.service.ts
│   ├── pdf.generator.ts
│   ├── qr-code.generator.ts
│   └── template.service.ts
│
├── gdb/                            # External Registry (GDB)
│   ├── gdb.module.ts
│   ├── gdb.service.ts
│   ├── gdb.client.ts
│   └── dto/
│       ├── query.dto.ts
│       └── record.dto.ts
│
└── catalogs/                       # Catalog Hierarchy
    ├── catalogs.module.ts
    ├── catalogs.controller.ts
    └── catalogs.service.ts
```

### Enhanced Data Models

#### Catalog Hierarchy
```prisma
model Catalog {
  id        String       @id @default(cuid())
  name      String
  scope     CatalogScope
  serviceId String?      @map("service_id")
  items     CatalogItem[]
  groups    CatalogGroup[]

  @@map("catalogs")
}

enum CatalogScope {
  INSTANCE       // Global (countries, currencies)
  CROSS_SERVICE  // Shared across services
  SERVICE        // Service-specific
}

model CatalogItem {
  id        String  @id @default(cuid())
  catalogId String  @map("catalog_id")
  key       String
  value     String
  groupId   String? @map("group_id")

  @@map("catalog_items")
}

model CatalogGroup {
  id        String @id @default(cuid())
  catalogId String @map("catalog_id")
  name      String
  parentId  String? @map("parent_id")

  @@map("catalog_groups")
}
```

#### BOT Configuration
```prisma
model Bot {
  id        String   @id @default(cuid())
  name      String
  type      BotType
  config    Json     // Type-specific configuration
  mappings  BotMapping[]
  serviceId String   @map("service_id")

  @@map("bots")
}

enum BotType {
  DOCUMENT   // PDF/OCR extraction
  DATA       // External DB queries
  INTERNAL   // Service-to-service
}

model BotMapping {
  id             String  @id @default(cuid())
  botId          String  @map("bot_id")
  sourceField    String  @map("source_field")
  targetField    String  @map("target_field")
  transformation String? // JSONata expression

  @@map("bot_mappings")
}
```

#### Enhanced Workflow Roles
```prisma
model WorkflowRole {
  id           String        @id @default(cuid())
  workflowId   String        @map("workflow_id")
  name         String
  type         RoleType
  category     RoleCategory?
  order        Int
  statusConfig Json          @map("status_config")
  formConfig   Json?         @map("form_config")
  botId        String?       @map("bot_id")

  @@map("workflow_roles")
}

enum RoleType {
  HUMAN
  BOT
}

enum RoleCategory {
  REVISION    // Review and decide
  APPROVAL    // Authorize
  COLLECTION  // Issue certificate
}
```

#### Determinant/Visibility Rules
```prisma
model VisibilityRule {
  id           String              @id @default(cuid())
  formId       String              @map("form_id")
  name         String
  sourceField  String              @map("source_field")
  predicate    VisibilityPredicate
  value        String
  behavior     VisibilityBehavior
  targetFields String[]            @map("target_fields")

  @@map("visibility_rules")
}

enum VisibilityPredicate {
  EQUALS
  NOT_EQUALS
  GREATER_THAN
  LESS_THAN
  CONTAINS
  REGEX
}

enum VisibilityBehavior {
  SHOW
  HIDE
}
```

#### Certificate Templates
```prisma
model CertificateTemplate {
  id           String   @id @default(cuid())
  serviceId    String   @map("service_id")
  name         String
  layout       Json     // Template structure
  fieldMappings Json    @map("field_mappings")
  hasQrCode    Boolean  @default(false) @map("has_qr_code")

  @@map("certificate_templates")
}
```

### Updated Frontend Components

```
apps/web/src/components/features/
├── bots/                           # BOT Configuration UI
│   ├── BotBuilder.tsx
│   ├── DocumentBotConfig.tsx
│   ├── DataBotConfig.tsx
│   ├── InternalBotConfig.tsx
│   ├── MappingEditor.tsx
│   └── index.ts
│
├── certificates/                   # Certificate Builder
│   ├── CertificateBuilder.tsx
│   ├── TemplateEditor.tsx
│   ├── QrCodeConfig.tsx
│   ├── FieldMapper.tsx
│   └── index.ts
│
├── catalogs/                       # Catalog Management
│   ├── CatalogManager.tsx
│   ├── CatalogItemEditor.tsx
│   ├── GroupEditor.tsx
│   └── index.ts
│
└── visibility/                     # Visibility Rule Builder
    ├── VisibilityRuleBuilder.tsx
    ├── PredicateSelector.tsx
    └── index.ts
```

### Expression & Rules Engine Scope (Confirmed)

**JSONata Handles:**
- Fee/cost formulas
- Determinant calculations (numeric)
- BOT API response transforms
- Certificate field population
- Mapping transformations
- Evaluation expressions (risk scoring)

**JSON Rules Engine Handles:**
- Visibility predicates (=, !=, >, <, contains, regex)
- Workflow status transitions
- Role routing logic
- BOT trigger conditions
- Conditional document requirements

### Data Flow Patterns (Legacy Aligned)

**Service Configuration Flow:**
```
Admin → Service → Registration → Form Config → Determinants → Workflow Roles
                                     ↓
                               BOT Configs → Mappings
                                     ↓
                         Certificate Template
```

**Application Processing Flow:**
```
Applicant → Guide (determinant-filtered) → Form → Documents → Payment → Submit
                                                      ↓
              Human Role ← Status Transition ← BOT Role (auto)
                   ↓
              Certificate Generation → GDB Record → Applicant Notification
```

**BOT Execution Flow:**
```
Trigger (field change/button/render)
    ↓
BOT Type Selection
    ├── Document BOT → Extract PDF/OCR → Map to Fields
    ├── Data BOT → Query GDB → Transform (JSONata) → Map to Fields
    └── Internal BOT → Redirect → Poll → Map Results
    ↓
Form Update (via mapping)
```


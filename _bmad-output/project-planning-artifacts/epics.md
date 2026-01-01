---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - '_bmad-output/prd.md'
  - '_bmad-output/architecture.md'
project_name: 'bpa-ai-native'
user_name: 'Moulaymehdi'
date: '2025-12-27'
party_mode_review: true
epic_order_validated: true
total_stories: 78
total_epics: 11
validation_status: 'PASSED'
ready_for_development: true
implementation_progress:
  epic_1: 'COMPLETED (7/7 stories)'
  epic_2: 'IN_PROGRESS (3/11 stories)'
  overall: '10 stories completed, 68 remaining'
last_updated: '2025-12-29'
---

# bpa-ai-native - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bpa-ai-native, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Service Management (8 FRs)**
- FR1: Service Designer can create a new government service with basic metadata (name, description, category)
- FR2: Service Designer can view a list of all services with search and filter capabilities
- FR3: Service Designer can edit service metadata and configuration at any time before publication
- FR4: Service Designer can delete a draft service that has not been published
- FR5: Service Designer can duplicate an existing service as a starting point for a new one
- FR6: Service Designer can view a service's current lifecycle state (draft, published, archived)
- FR7: Service Designer can transition a service between lifecycle states with appropriate validations
- FR8: Service Designer can select a service template from a gallery when creating new services

**Form Configuration (9 FRs)**
- FR9: Service Designer can create an Applicant Form for data collection from citizens
- FR10: Service Designer can create a Guide Form for operator workflow steps
- FR11: Service Designer can add form fields of various types (text, number, date, select, upload, etc.)
- FR12: Service Designer can configure field properties (label, placeholder, required, validation rules)
- FR13: Service Designer can organize fields into sections and groups
- FR14: Service Designer can configure conditional visibility rules for fields and sections
- FR15: Service Designer can preview how a form renders to applicants
- FR16: Service Designer can link form fields to determinants for business rule evaluation
- FR17: System generates JSON Schema representation of form configuration

**Workflow Configuration (7 FRs)**
- FR18: Service Designer can define workflow steps (roles) for a service
- FR19: Service Designer can configure transitions between workflow steps
- FR20: Service Designer can specify which actions are available at each step (approve, reject, request info, etc.)
- FR21: Service Designer can assign required form(s) to each workflow step
- FR22: Service Designer can configure linear approval chains with 2-5 steps
- FR23: Service Designer can preview the complete workflow as a visual diagram
- FR24: System validates workflow configuration for completeness (no dead ends, all steps reachable)

**AI-Powered Assistance (9 FRs)**
- FR25: Service Designer can describe a service in natural language via chat interface
- FR26: AI can generate complete service configuration from natural language description
- FR27: AI presents structured proposals with accept/review/modify options
- FR28: Service Designer can iteratively refine AI suggestions through conversation
- FR29: AI can suggest form fields based on service type and description
- FR30: AI can suggest workflow structure based on service requirements
- FR31: AI can detect configuration gaps and proactively suggest additions
- FR32: AI can infer determinants from form field relationships
- FR33: System displays comparison between AI-generated and user-described configurations

**Determinants & Business Rules (5 FRs)**
- FR34: Service Designer can define determinants (variables) derived from form fields
- FR35: Service Designer can configure formulas that calculate determinant values
- FR36: Service Designer can use determinants in conditional visibility rules
- FR37: Service Designer can use determinants in workflow transition conditions
- FR38: System validates determinant references for consistency

**Preview & Publishing (8 FRs)**
- FR39: Service Designer can preview the complete applicant journey (forms → workflow → outcome)
- FR40: Service Designer can simulate form submission with test data
- FR41: Service Designer can simulate workflow progression through all steps
- FR42: System displays a Completeness Dashboard showing status of all service components
- FR43: System performs validation checks before allowing publication
- FR44: Service Designer can publish a service to make it available for applicants
- FR45: Service Designer can view a Publish Readiness Gate with pass/fail checklist
- FR46: Published services remain unchanged while draft modifications are in progress

**User & Access Management (5 FRs)**
- FR47: User can authenticate via Keycloak SSO
- FR48: System enforces role-based access control (Service Designer, Country Admin, UNCTAD Support)
- FR49: Service Designer can only access services within their authorized scope
- FR50: Country Admin can manage users within their country instance
- FR51: UNCTAD Support can access services across country instances for diagnostics

**System Administration (6 FRs)**
- FR52: System logs all configuration changes with user, timestamp, and change details
- FR53: Service Designer can view activity feed of recent changes across services
- FR54: Service Designer can export service configuration as YAML file
- FR55: Service Designer can import service configuration from YAML file
- FR56: System validates imported configurations for schema compliance
- FR57: Country Admin can configure instance-level settings (branding, languages)

**Demo & Collaboration (3 FRs)**
- FR58: Service Designer can enter Demo Mode for safe presentation of services
- FR59: Service Designer can make live configuration changes during stakeholder meetings
- FR60: Changes made in preview do not affect published services until explicitly saved

**Error Handling & Recovery (2 FRs)**
- FR61: Service Designer can view detailed error messages when configuration validation fails
- FR62: System auto-saves draft configuration periodically to prevent data loss

**AI Interaction (2 FRs)**
- FR63: System displays AI response streaming in real-time during generation
- FR64: Service Designer can cancel an in-progress AI generation

**Accessibility (1 FR)**
- FR65: All configuration functions are accessible via keyboard navigation

**Change Management (1 FR)**
- FR66: Service Designer can view impact analysis before saving changes to published services

### NonFunctional Requirements

**Performance (6 NFRs)**
- NFR1: AI generation response time < 10 seconds (from initial prompt to complete service skeleton)
- NFR2: AI streaming first token < 1 second (user sees activity immediately)
- NFR3: Form preview render time < 2 seconds (after configuration change)
- NFR4: Service list load time < 1 second (for up to 100 services)
- NFR5: Auto-save interval every 30 seconds (while user is actively editing)
- NFR6: Publish operation < 30 seconds (from click to confirmation)

**Security (9 NFRs)**
- NFR7: All data encrypted in transit (TLS 1.3)
- NFR8: All data encrypted at rest (AES-256)
- NFR9: Session timeout after 30 minutes of inactivity
- NFR10: OAuth 2.0 + PKCE for authentication
- NFR11: JWT tokens expire after 1 hour
- NFR12: All API endpoints require authentication
- NFR13: Audit log retention for 2 years
- NFR14: OWASP Top 10 compliance
- NFR15: No cross-tenant data access (country instance isolation)

**Reliability (5 NFRs)**
- NFR16: System uptime 99.5%
- NFR17: Data backup frequency daily (full database backup)
- NFR18: Recovery Point Objective (RPO) < 24 hours
- NFR19: Recovery Time Objective (RTO) < 4 hours
- NFR20: Auto-save success rate 99.9%

**Accessibility (6 NFRs)**
- NFR21: WCAG 2.1 Level AA compliance
- NFR22: Keyboard navigation for all functions
- NFR23: Color contrast ratio minimum 4.5:1
- NFR24: Screen reader compatible (ARIA labels on all interactive elements)
- NFR25: No content relying solely on color
- NFR26: Focus indicators visible

**Integration (5 NFRs)**
- NFR27: Keycloak connection timeout < 5 seconds with graceful failure
- NFR28: LLM API fallback (auto-switch Groq → Claude on failure)
- NFR29: LLM API timeout 30 seconds max, then graceful error
- NFR30: Git sync for YAML schemas (atomic commits, conflict detection)
- NFR31: Email notification delivery < 5 minutes after trigger

**Cost Efficiency (3 NFRs)**
- NFR32: LLM cost per service configuration < $1.00
- NFR33: LLM cost per refinement < $0.10
- NFR34: Monthly hosting cost per country (budget TBD)

**Browser & Device Support (3 NFRs)**
- NFR35: Chrome, Firefox, Safari, Edge (last 2 versions)
- NFR36: Minimum screen width 1024px (desktop-first for configuration work)
- NFR37: Stable on 5 Mbps connection (developing country infrastructure)

### Additional Requirements

**From Architecture - Starter Template:**
- Custom Turborepo monorepo setup required (first story)
- Next.js 16.1 + React 19.2 + NestJS 11 + Prisma 7
- pnpm as package manager (NOT npm/yarn)
- TypeScript 5.7+ strict mode

**From Architecture - Technology Stack:**
- JSONata for formulas, calculations, and BOT transforms
- JSON Rules Engine for visibility rules and workflow transitions
- Redis for distributed cache (sessions, LLM responses, rate limiting)
- In-memory LRU cache for compiled JSONata expressions
- SSE streaming for LLM responses with abort signal
- Zustand for UI state, TanStack Query for server state

**From Architecture - Legacy System Alignment:**
- BOT system with 3 types: Document, Data, Internal
- Catalog hierarchy with 3 scopes: INSTANCE, CROSS_SERVICE, SERVICE
- Visibility rules with predicates (=, !=, >, <, contains, regex)
- Certificate templates with PDF generation and QR codes
- GDB integration as external registry client
- Workflow roles: HUMAN (manual steps) and BOT (automated)
- Role categories: REVISION, APPROVAL, COLLECTION

**From Architecture - Data Patterns:**
- DB + Git sync for service configuration (PostgreSQL primary, Git for audit)
- Keycloak SSO with OAuth2 + PKCE
- Per-country deployment isolation (no shared tenancy)
- 2-year audit log retention

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | Create service with metadata |
| FR2 | Epic 2 | View service list with search/filter |
| FR3 | Epic 2 | Edit service configuration |
| FR4 | Epic 2 | Delete draft service |
| FR5 | Epic 2 | Duplicate service |
| FR6 | Epic 2 | View lifecycle state |
| FR7 | Epic 2 | Transition lifecycle states |
| FR8 | Epic 2 | Select service template |
| FR9 | Epic 3 | Create Applicant Form |
| FR10 | Epic 3 | Create Guide Form |
| FR11 | Epic 3 | Add form fields |
| FR12 | Epic 3 | Configure field properties |
| FR13 | Epic 3 | Organize fields into sections |
| FR14 | Epic 3 | Configure visibility rules |
| FR15 | Epic 3 | Preview form rendering |
| FR16 | Epic 3 | Link fields to determinants |
| FR17 | Epic 3 | Generate JSON Schema |
| FR18 | Epic 4 | Define workflow steps |
| FR19 | Epic 4 | Configure transitions |
| FR20 | Epic 4 | Specify step actions |
| FR21 | Epic 4 | Assign forms to steps |
| FR22 | Epic 4 | Configure linear chains |
| FR23 | Epic 4 | Preview workflow diagram |
| FR24 | Epic 4 | Validate workflow completeness |
| FR25 | Epic 6 | Natural language chat |
| FR26 | Epic 6 | AI generates service config |
| FR27 | Epic 6 | Structured proposals |
| FR28 | Epic 6 | Iterative refinement |
| FR29 | Epic 6 | AI suggests form fields |
| FR30 | Epic 6 | AI suggests workflow |
| FR31 | Epic 6 | Gap detection |
| FR32 | Epic 6 | Infer determinants |
| FR33 | Epic 6 | AI vs user comparison |
| FR34 | Epic 5 | Define determinants |
| FR35 | Epic 5 | Configure formulas |
| FR36 | Epic 5 | Determinants in visibility |
| FR37 | Epic 5 | Determinants in workflow |
| FR38 | Epic 5 | Validate references |
| FR39 | Epic 7 | Preview complete journey |
| FR40 | Epic 7 | Simulate form submission |
| FR41 | Epic 7 | Simulate workflow |
| FR42 | Epic 7 | Completeness Dashboard |
| FR43 | Epic 7 | Validation before publish |
| FR44 | Epic 7 | Publish service |
| FR45 | Epic 7 | Readiness Gate |
| FR46 | Epic 7 | Draft/published separation |
| FR47 | Epic 1 | Keycloak SSO auth |
| FR48 | Epic 8 | RBAC enforcement |
| FR49 | Epic 8 | Country-scoped access |
| FR50 | Epic 8 | Admin user management |
| FR51 | Epic 8 | UNCTAD cross-instance |
| FR52 | Epic 9 | Audit logging |
| FR53 | Epic 9 | Activity feed |
| FR54 | Epic 9 | YAML export |
| FR55 | Epic 9 | YAML import |
| FR56 | Epic 9 | Import validation |
| FR57 | Epic 9 | Instance settings |
| FR58 | Epic 10 | Demo Mode |
| FR59 | Epic 10 | Live changes |
| FR60 | Epic 10 | Changes isolated |
| FR61 | Epic 11 | Error messages |
| FR62 | Epic 11 | Auto-save |
| FR63 | Epic 6 | AI streaming |
| FR64 | Epic 6 | Cancel AI generation |
| FR65 | Epic 11 | Keyboard navigation |
| FR66 | Epic 11 | Impact analysis |

## Epic List

### Epic 1: Project Foundation & Developer Experience
**User Outcome:** Development team has a working monorepo with auth infrastructure ready.

**FRs Covered:** FR47
**NFRs Addressed:** NFR7-15 (Security baseline), NFR27 (Keycloak connection)

**Implementation Notes:**
- Custom Turborepo setup (Architecture requirement)
- Prisma schema initialization
- Keycloak integration scaffold
- CI/CD pipeline
- This epic enables all subsequent development

---

### Epic 2: Service Lifecycle Management
**User Outcome:** Service Designers can create, manage, and organize government services.

**FRs Covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8
**NFRs Addressed:** NFR4 (service list < 1s)

**Standalone Value:**
- Create new services with metadata
- View/search/filter service list
- Edit, delete, duplicate services
- Lifecycle state management (draft, published, archived)
- Template gallery for quick-start

**Dependencies:** Epic 1 (auth + database)

---

### Epic 3: Form Building & Configuration
**User Outcome:** Service Designers can build data collection forms with fields, validation, and conditional logic.

**FRs Covered:** FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17
**NFRs Addressed:** NFR3 (preview < 2s)

**Standalone Value:**
- Create Applicant Forms for citizen data collection
- Create Guide Forms for operator workflow
- Add fields (text, number, date, select, upload, etc.)
- Configure field properties (label, required, validation)
- Organize into sections/groups
- Conditional visibility rules
- Preview form rendering
- JSON Schema generation

**Dependencies:** Epic 1, Epic 2 (services to attach forms to)

---

### Epic 4: Workflow Configuration
**User Outcome:** Service Designers can define approval chains with steps, roles, and transitions.

**FRs Covered:** FR18, FR19, FR20, FR21, FR22, FR23, FR24
**NFRs Addressed:** None specific

**Standalone Value:**
- Define workflow steps/roles
- Configure transitions between steps
- Specify actions per step (approve, reject, request info)
- Assign forms to workflow steps
- Linear approval chains (2-5 steps)
- Visual workflow diagram preview
- Workflow validation (no dead ends)

**Dependencies:** Epic 1, Epic 2, Epic 3 (forms to assign to steps)

---

### Epic 5: Determinants & Business Rules
**User Outcome:** Service Designers can configure calculated variables and conditional visibility rules.

**FRs Covered:** FR34, FR35, FR36, FR37, FR38
**NFRs Addressed:** NFR30 (Git sync for formulas)

**Standalone Value:**
- Define determinants from form fields
- Configure calculation formulas (JSONata)
- Use determinants in visibility rules (JSON Rules Engine)
- Use determinants in workflow conditions
- Validation of references for consistency

**Dependencies:** Epic 1, Epic 2, Epic 3 (form fields to derive from), Epic 4 (workflow conditions)

---

### Epic 6: AI-Powered Service Configuration
**User Outcome:** Service Designers can describe services in natural language and receive AI-generated configurations.

**FRs Covered:** FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR63, FR64
**NFRs Addressed:** NFR1 (AI < 10s), NFR2 (streaming < 1s), NFR28-29 (LLM fallback), NFR32-33 (cost)

**Standalone Value:**
- Chat interface for natural language input
- AI generates complete service config
- Structured proposals with accept/review/modify options
- Iterative refinement through conversation
- AI suggests form fields and workflow structure
- Gap detection and proactive suggestions
- Streaming responses with cancel capability
- Comparison: AI-generated vs user-described

**Dependencies:** Epic 1, Epic 2, Epic 3, Epic 4, Epic 5 (AI generates INTO existing structures)

**Note:** This epic was moved from position 3 to position 6 after Party Mode review. The AI module consumes form schemas, workflow patterns, and determinant syntax - it needs these targets to exist first.

---

### Epic 7: Preview & Publishing
**User Outcome:** Service Designers can test complete applicant journeys and deploy services to production.

**FRs Covered:** FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46
**NFRs Addressed:** NFR5 (auto-save 30s), NFR6 (publish < 30s), NFR20 (auto-save 99.9%)

**Standalone Value:**
- Preview complete applicant journey
- Simulate form submission with test data
- Simulate workflow progression
- Completeness Dashboard (visual status)
- Validation checks before publish
- Publish to production
- Readiness Gate checklist
- Draft/published separation

**Dependencies:** Epic 1-6 (needs all components to preview)

---

### Epic 8: User & Access Management
**User Outcome:** Administrators can manage users, roles, and country-scoped access.

**FRs Covered:** FR48, FR49, FR50, FR51
**NFRs Addressed:** NFR9 (session timeout), NFR10-11 (OAuth/JWT), NFR12 (auth required), NFR15 (tenant isolation)

**Standalone Value:**
- RBAC enforcement (Service Designer, Country Admin, UNCTAD Support)
- Country-scoped access control
- User management for Country Admins
- Cross-instance diagnostics for UNCTAD Support

**Dependencies:** Epic 1 (Keycloak foundation)

---

### Epic 9: System Administration & Audit
**User Outcome:** Administrators can track changes, export/import configurations, and manage instance settings.

**FRs Covered:** FR52, FR53, FR54, FR55, FR56, FR57
**NFRs Addressed:** NFR13 (2yr audit retention), NFR30 (Git sync)

**Standalone Value:**
- Audit logging with user, timestamp, change details
- Activity feed of recent changes
- YAML export for service configurations
- YAML import with schema validation
- Instance settings (branding, languages)

**Dependencies:** Epic 1, Epic 2 (content to audit/export)

---

### Epic 10: Demo & Live Collaboration
**User Outcome:** Service Designers can safely demo services to stakeholders and make live changes.

**FRs Covered:** FR58, FR59, FR60
**NFRs Addressed:** None specific

**Standalone Value:**
- Demo Mode for safe presentations
- Live configuration changes during meetings
- Changes isolated until explicitly saved

**Dependencies:** Epic 1-7 (needs preview capability)

---

### Epic 11: Reliability & Accessibility
**User Outcome:** All users have a reliable, accessible, and error-free experience.

**FRs Covered:** FR61, FR62, FR65, FR66
**NFRs Addressed:** NFR16-19 (reliability), NFR21-26 (accessibility), NFR35-37 (browser/device)

**Standalone Value:**
- Detailed error messages for validation failures
- Auto-save for draft configurations
- Keyboard navigation for all functions
- Change impact analysis before saving
- WCAG 2.1 AA compliance

**Dependencies:** All previous epics (polish layer)

---

## Epic Summary

| # | Epic | FRs | User Value | Dependencies |
|---|------|-----|------------|--------------|
| 1 | Project Foundation | 1 | Dev environment ready | None |
| 2 | Service Lifecycle | 8 | Create and manage services | Epic 1 |
| 3 | Form Building | 9 | Build data collection forms | Epic 1, 2 |
| 4 | Workflow Configuration | 7 | Define approval chains | Epic 1, 2, 3 |
| 5 | Determinants & Rules | 5 | Configure business rules | Epic 1-4 |
| 6 | AI Configuration | 11 | Natural language service building | Epic 1-5 |
| 7 | Preview & Publishing | 8 | Test and deploy services | Epic 1-6 |
| 8 | User & Access | 4 | Manage users and permissions | Epic 1 |
| 9 | Administration | 6 | Track changes, export/import | Epic 1, 2 |
| 10 | Demo & Collaboration | 3 | Present to stakeholders | Epic 1-7 |
| 11 | Reliability & Access | 4 | Reliable, accessible experience | All |
| **Total** | | **66** | | |

---

## Dependency Graph

```
Epic 1 (Foundation)
    ├── Epic 2 (Services)
    │       ├── Epic 3 (Forms)
    │       │       ├── Epic 4 (Workflow)
    │       │       │       ├── Epic 5 (Determinants)
    │       │       │       │       └── Epic 6 (AI) ← Moved here after Party Mode review
    │       │       │       │               └── Epic 7 (Preview/Publish)
    │       │       │       │                       └── Epic 10 (Demo)
    │       │       │       │                               └── Epic 11 (Polish)
    │       └── Epic 9 (Admin/Audit)
    └── Epic 8 (User/Access)
```

**Party Mode Review Notes:**
- Original Epic 3 (AI) moved to Epic 6 based on dependency analysis
- AI module imports types from forms/workflows - build order requires these first
- FR33 (AI vs user comparison) requires manual configs to compare against
- Unanimous team agreement: PM, Architect, Dev, Scrum Master, Test Architect

---

## Epic 1: Project Foundation & Developer Experience

**Goal:** Development team has a working monorepo with auth infrastructure ready.

**FRs Covered:** FR47
**NFRs Addressed:** NFR7-15 (Security baseline), NFR27 (Keycloak connection)

---

### Story 1.1: Monorepo Scaffolding with Turborepo

**Status: ✅ COMPLETED**

As a **Developer**,
I want a properly configured Turborepo monorepo with pnpm and TypeScript strict mode,
So that I have a consistent, performant development environment for building the application.

**Acceptance Criteria:**

**Given** a fresh project directory
**When** the developer runs `pnpm install`
**Then** all workspace dependencies are installed correctly
**And** the following folder structure exists:
  - `apps/` (for web and api applications)
  - `packages/` (for shared code)
  - `turbo.json` (Turborepo configuration)
  - `pnpm-workspace.yaml` (workspace configuration)

**Given** the monorepo is set up
**When** the developer runs `pnpm build`
**Then** Turborepo builds all packages in correct dependency order
**And** build caching works for unchanged packages

**Given** TypeScript is configured
**When** a developer writes code with type errors
**Then** the TypeScript compiler (5.7+) reports errors in strict mode
**And** `noImplicitAny`, `strictNullChecks`, and `strictFunctionTypes` are enforced

---

### Story 1.2: Next.js Web Application Setup

**Status: ✅ COMPLETED**

As a **Developer**,
I want the Next.js 16.1 frontend application configured with React 19.2 and App Router,
So that I can build the Service Designer interface with modern React patterns.

**Acceptance Criteria:**

**Given** the `apps/web` directory exists
**When** the developer runs `pnpm dev` from the web app
**Then** Next.js 16.1 development server starts on port 3000
**And** hot module replacement works for file changes

**Given** the App Router is configured
**When** a developer creates a file at `app/page.tsx`
**Then** it renders as the home page at `/`
**And** React 19.2 features (use, Server Components) are available

**Given** the web app is built
**When** the developer runs `pnpm build` in `apps/web`
**Then** the build completes without errors
**And** static analysis (ESLint, TypeScript) passes

---

### Story 1.3: NestJS API Application Setup

**Status: ✅ COMPLETED**

As a **Developer**,
I want the NestJS 11 backend API configured with a health endpoint,
So that I can build backend services with dependency injection and modular architecture.

**Acceptance Criteria:**

**Given** the `apps/api` directory exists
**When** the developer runs `pnpm dev` from the api app
**Then** NestJS 11 development server starts on port 4000
**And** file watching enables automatic restart on changes

**Given** the API server is running
**When** a client sends GET request to `/health`
**Then** the API responds with status 200
**And** the response body contains `{ "status": "ok", "timestamp": "<ISO date>" }`

**Given** the API is built
**When** the developer runs `pnpm build` in `apps/api`
**Then** the build compiles TypeScript to JavaScript
**And** the output is ready for production deployment

---

### Story 1.4: Shared Packages Configuration

**Status: ✅ COMPLETED**

As a **Developer**,
I want shared packages for database, UI components, types, and configuration,
So that code is reusable across web and API applications without duplication.

**Acceptance Criteria:**

**Given** the `packages/` directory structure
**When** the developer inspects the workspace
**Then** the following packages exist:
  - `packages/db` (Prisma client and schema)
  - `packages/ui` (shared React components)
  - `packages/types` (shared TypeScript types)
  - `packages/config` (shared ESLint, TypeScript configs)

**Given** a shared package exports a type or component
**When** the web or api app imports from `@bpa/types` or `@bpa/ui`
**Then** TypeScript resolves the import correctly
**And** Turborepo tracks the dependency for incremental builds

**Given** shared configs are defined in `packages/config`
**When** apps extend `@bpa/config/eslint` or `@bpa/config/typescript`
**Then** consistent linting and type-checking rules apply across the monorepo

---

### Story 1.5: Database Schema & Prisma Setup

**Status: ✅ COMPLETED**

As a **Developer**,
I want PostgreSQL configured with Prisma 7 and baseline schema,
So that the application can persist user sessions and prepare for service data.

**Acceptance Criteria:**

**Given** Prisma 7 is installed in `packages/db`
**When** the developer runs `pnpm db:generate`
**Then** Prisma Client is generated from the schema
**And** TypeScript types for all models are available

**Given** the baseline schema is defined
**When** the developer inspects `schema.prisma`
**Then** the following tables are defined:
  - `User` (id, email, name, keycloakId, createdAt, updatedAt)
  - `Session` (id, userId, token, expiresAt, createdAt)

**Given** a PostgreSQL database is available
**When** the developer runs `pnpm db:push`
**Then** the schema is applied to the database
**And** the tables are created with correct constraints

**Given** Prisma Studio is available
**When** the developer runs `pnpm db:studio`
**Then** a visual database browser opens
**And** the developer can view and edit data

---

### Story 1.6: Keycloak SSO Integration

**Status: ✅ COMPLETED**

As a **User**,
I want to authenticate via Keycloak SSO using OAuth 2.0 + PKCE,
So that I can securely access the Service Designer with my organization credentials.

**Acceptance Criteria:**

**Given** a user is not authenticated
**When** the user accesses a protected route in the web app
**Then** the user is redirected to Keycloak login page
**And** the OAuth 2.0 + PKCE flow is initiated (NFR10)

**Given** a user completes Keycloak authentication
**When** Keycloak redirects back to the application
**Then** the user receives a valid JWT access token (NFR11: expires in 1 hour)
**And** a session is created in the database
**And** the user is redirected to their original destination

**Given** an authenticated user's session
**When** the user is inactive for 30 minutes
**Then** the session is invalidated (NFR9)
**And** the user must re-authenticate on next request

**Given** the API receives a request
**When** the request includes a valid JWT in Authorization header
**Then** the API validates the token with Keycloak
**And** the request proceeds with user context
**And** Keycloak connection timeout is < 5 seconds (NFR27)

**Given** the API receives a request without authentication
**When** the endpoint requires authentication (NFR12)
**Then** the API responds with 401 Unauthorized
**And** no data is leaked in the error response

---

### Story 1.7: CI/CD Pipeline Setup

**Status: ✅ COMPLETED**

As a **Developer**,
I want GitHub Actions workflows for lint, test, build, and deployment,
So that code quality is enforced and deployments are automated.

**Acceptance Criteria:**

**Given** a developer pushes code to a feature branch
**When** the push triggers the CI workflow
**Then** the following checks run:
  - ESLint across all packages
  - TypeScript type checking
  - Unit tests (if present)
  - Build verification

**Given** the CI workflow completes
**When** any check fails
**Then** the workflow reports failure
**And** the developer receives feedback on which step failed

**Given** a pull request is opened
**When** CI checks pass
**Then** the PR is marked as ready for review
**And** branch protection rules prevent merge without passing CI

**Given** code is merged to main branch
**When** the deployment workflow triggers
**Then** the application is built for production
**And** artifacts are ready for deployment to staging environment

---

**Epic 1 Summary:**
- 7 stories created — **ALL COMPLETED ✅**
- FR47 (Keycloak SSO) fully covered
- NFR7-15 (Security) addressed in Story 1.6
- NFR27 (Keycloak connection) addressed in Story 1.6
- Foundation ready for Epic 2 (Service Lifecycle)

---

## Epic 2: Service Lifecycle Management

**Goal:** Service Designers can create, manage, and organize government services.

**FRs Covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8
**NFRs Addressed:** NFR4 (service list < 1s)

---

### Story 2.1: Service Database Model & API Foundation

**Status: ✅ COMPLETED**

As a **Developer**,
I want the Service entity defined in Prisma with basic CRUD API endpoints,
So that the application can persist and retrieve service data.

**Acceptance Criteria:**

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the Service model is defined with fields:
  - `id` (UUID, primary key)
  - `name` (string, required)
  - `description` (text, optional)
  - `category` (string, optional)
  - `status` (enum: DRAFT, PUBLISHED, ARCHIVED)
  - `createdBy` (relation to User)
  - `createdAt`, `updatedAt` (timestamps)

**Given** the API module for services exists
**When** the developer inspects `apps/api/src/services`
**Then** the following endpoints are available:
  - `POST /api/services` (create)
  - `GET /api/services` (list)
  - `GET /api/services/:id` (get one)
  - `PATCH /api/services/:id` (update)
  - `DELETE /api/services/:id` (delete)

**Given** all endpoints require authentication
**When** a request lacks valid JWT
**Then** the API responds with 401 Unauthorized

---

### Story 2.2: Create New Service with Metadata

**Status: ✅ COMPLETED**

As a **Service Designer**,
I want to create a new government service with basic metadata,
So that I can begin configuring a service for my country.

**Acceptance Criteria:**

**Given** the Service Designer is authenticated
**When** they click "Create Service" button
**Then** a modal or form appears with fields:
  - Service Name (required, max 100 chars)
  - Description (optional, max 500 chars)
  - Category (dropdown selection)

**Given** valid metadata is entered
**When** the Service Designer submits the form
**Then** a new service is created with status DRAFT
**And** the Service Designer is redirected to the service editor
**And** an audit log entry is created (FR52 prep)

**Given** the name field is empty
**When** the Service Designer attempts to submit
**Then** validation error is displayed
**And** the form is not submitted

---

### Story 2.3: Service List with Search & Filter

**Status: ✅ COMPLETED**

As a **Service Designer**,
I want to view all services with search and filter capabilities,
So that I can quickly find and access services I'm working on.

**Acceptance Criteria:**

**Given** the Service Designer is on the dashboard
**When** the page loads
**Then** a list of services is displayed within 1 second (NFR4)
**And** each service shows: name, status, category, last modified date

**Given** the service list is displayed
**When** the Service Designer types in the search box
**Then** results are filtered by service name (debounced 300ms)
**And** matching text is highlighted in results

**Given** the service list is displayed
**When** the Service Designer selects a status filter (Draft/Published/Archived)
**Then** only services with that status are shown
**And** filter can be combined with search

**Given** more than 20 services exist
**When** the list is displayed
**Then** pagination is available
**And** the Service Designer can navigate between pages

---

### Story 2.4: Edit Service Metadata

As a **Service Designer**,
I want to edit a service's name, description, and category,
So that I can correct or update service information before publication.

**Acceptance Criteria:**

**Given** the Service Designer opens a DRAFT service
**When** they access service settings
**Then** the current metadata is displayed in editable fields

**Given** the Service Designer modifies metadata
**When** they save changes
**Then** the service is updated with new values
**And** `updatedAt` timestamp is refreshed
**And** an audit log entry records the change

**Given** the Service Designer attempts to edit a PUBLISHED service
**When** they modify metadata
**Then** changes are saved to a draft version
**And** the published version remains unchanged (FR46)

---

### Story 2.5: Delete Draft Service

As a **Service Designer**,
I want to delete a draft service that has not been published,
So that I can remove abandoned or incorrect configurations.

**Acceptance Criteria:**

**Given** a service with status DRAFT
**When** the Service Designer clicks "Delete"
**Then** a confirmation dialog appears
**And** warns that deletion is permanent

**Given** the confirmation dialog is shown
**When** the Service Designer confirms deletion
**Then** the service is permanently removed from the database
**And** the user is redirected to the service list
**And** an audit log entry records the deletion

**Given** a service with status PUBLISHED or ARCHIVED
**When** the Service Designer attempts to delete
**Then** the delete option is disabled or hidden
**And** a tooltip explains why deletion is not available

---

### Story 2.6: Duplicate Existing Service

As a **Service Designer**,
I want to duplicate an existing service as a starting point,
So that I can create similar services without starting from scratch.

**Acceptance Criteria:**

**Given** any existing service (draft, published, or archived)
**When** the Service Designer clicks "Duplicate"
**Then** a new service is created with:
  - Name: "[Original Name] (Copy)"
  - All configuration copied (forms, workflow, determinants)
  - Status: DRAFT

**Given** a service is duplicated
**When** the new service is created
**Then** the Service Designer is redirected to the new service editor
**And** an audit log entry records the duplication with source reference

**Given** a duplicated service
**When** the Service Designer modifies it
**Then** changes do not affect the original service

---

### Story 2.7: Service Lifecycle State Management

As a **Service Designer**,
I want to transition a service between lifecycle states,
So that I can control when services are available to applicants.

**Acceptance Criteria:**

**Given** a service with status DRAFT
**When** the Service Designer views the service
**Then** a status badge shows "Draft"
**And** available actions include: Edit, Publish, Delete

**Given** a DRAFT service passes validation (FR43)
**When** the Service Designer clicks "Publish"
**Then** confirmation is requested
**And** upon confirmation, status changes to PUBLISHED
**And** the service becomes available to applicants

**Given** a PUBLISHED service
**When** the Service Designer views the service
**Then** available actions include: View, Archive, Create Draft Copy
**And** direct editing is disabled

**Given** a PUBLISHED service
**When** the Service Designer clicks "Archive"
**Then** status changes to ARCHIVED
**And** the service is no longer available to new applicants
**And** existing applications continue processing

**Given** an ARCHIVED service
**When** the Service Designer views the service
**Then** available actions include: View, Duplicate
**And** status cannot revert to Published directly

---

### Story 2.8: Service Template Gallery

As a **Service Designer**,
I want to select from a template gallery when creating new services,
So that I can quickly start with common government service patterns.

**Acceptance Criteria:**

**Given** the Service Designer clicks "Create Service"
**When** the creation dialog opens
**Then** a "Start from Template" option is available
**And** a gallery of templates is displayed

**Given** the template gallery is shown
**When** the Service Designer browses templates
**Then** each template shows:
  - Template name and description
  - Preview thumbnail
  - Number of forms and workflow steps

**Given** a template is selected
**When** the Service Designer confirms selection
**Then** a new DRAFT service is created with:
  - Pre-configured forms from template
  - Pre-configured workflow from template
  - Placeholder metadata for customization

**Given** the Service Designer prefers blank start
**When** they select "Start Blank"
**Then** a new empty DRAFT service is created
**And** no template configuration is applied

---

### Story 2.9: Registration Database Model & API

As a **Developer**,
I want the Registration entity defined in Prisma with CRUD API endpoints,
So that Services can contain multiple Registrations (authorization types).

**Background:**
Per the BPA domain model, a Service is a configuration container, while a Registration represents what applicants actually apply for (permit, license, certificate). A Service can have multiple Registrations.

**Acceptance Criteria:**

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the Registration model is defined with fields:
  - `id` (UUID, primary key)
  - `serviceId` (foreign key to Service)
  - `name` (string, required)
  - `shortName` (string, required)
  - `key` (string, unique identifier)
  - `description` (text, optional)
  - `isActive` (boolean, default true)
  - `sortOrder` (integer, default 0)
  - `createdAt`, `updatedAt` (timestamps)

**Given** the API module for registrations exists
**When** the developer inspects `apps/api/src/registrations`
**Then** the following endpoints are available:
  - `POST /api/services/:serviceId/registrations` (create)
  - `GET /api/services/:serviceId/registrations` (list for service)
  - `GET /api/registrations/:id` (get one)
  - `PATCH /api/registrations/:id` (update)
  - `DELETE /api/registrations/:id` (delete)

**Given** all endpoints require authentication
**When** a request lacks valid JWT
**Then** the API responds with 401 Unauthorized

---

### Story 2.10: Registration CRUD within Service

As a **Service Designer**,
I want to create and manage Registrations within a Service,
So that I can define the different authorization types applicants can apply for.

**Acceptance Criteria:**

**Given** the Service Designer is viewing a Service
**When** they navigate to the "Registrations" tab
**Then** a list of existing Registrations is displayed
**And** an "Add Registration" button is available

**Given** the Service Designer clicks "Add Registration"
**When** the creation form appears
**Then** they can enter:
  - Registration Name (required, max 100 chars)
  - Short Name (required, max 20 chars)
  - Unique Key (auto-generated, editable)
  - Description (optional)

**Given** valid registration data is entered
**When** the Service Designer saves the form
**Then** a new Registration is created under the Service
**And** an audit log entry records the creation

**Given** an existing Registration
**When** the Service Designer clicks "Edit"
**Then** they can modify all fields except the unique key
**And** changes are saved with audit trail

**Given** a Registration with no linked applications
**When** the Service Designer clicks "Delete"
**Then** a confirmation dialog appears
**And** upon confirmation, the Registration is removed

---

### Story 2.11: Document Requirements & Costs per Registration

As a **Service Designer**,
I want to configure document requirements and costs for each Registration,
So that applicants know what files to upload and fees to pay.

**Background:**
Document Requirements and Costs are linked to Registrations, not Services directly. This allows different authorization types to have different requirements.

**Acceptance Criteria:**

**Given** the Service Designer is viewing a Registration
**When** they navigate to the "Documents" section
**Then** they can add document requirements with:
  - Document Name (required)
  - Description (optional)
  - Required (boolean)

**Given** the Service Designer is viewing a Registration
**When** they navigate to the "Costs" section
**Then** they can add costs with:
  - Cost Name (required)
  - Cost Type (FIXED or FORMULA)
  - Amount (for FIXED type)
  - Formula expression (for FORMULA type, using JSONata)
  - Currency code

**Given** document requirements exist
**When** the applicant submits an application
**Then** required documents must be uploaded
**And** optional documents may be uploaded

**Given** costs are configured
**When** the applicant views the application
**Then** the calculated fees are displayed
**And** payment is required before submission

---

**Epic 2 Summary:**
- 11 stories created (8 Service + 3 Registration)
- **3 stories COMPLETED ✅** (2.1, 2.2, 2.3: DB model, Create, List)
- **8 stories remaining** (2.4-2.11: Edit, Delete, Duplicate, Lifecycle, Templates, Registration CRUD)
- FR1-FR8 fully covered + Registration domain concepts
- NFR4 (service list < 1s) addressed in Story 2.3
- Depends on Epic 1 (auth + database)
- Enables Epic 3 (forms attached to services/registrations)

---

## Epic 3: Form Building & Configuration

**Goal:** Service Designers can build data collection forms with fields, validation, and conditional logic.

**FRs Covered:** FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17
**NFRs Addressed:** NFR3 (preview < 2s)

---

### Story 3.1: Form Database Model & API

As a **Developer**,
I want Form and FormField entities in Prisma with CRUD API endpoints,
So that form configurations can be persisted and retrieved.

**Acceptance Criteria:**

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the following models are defined:
  - `Form` (id, serviceId, type: APPLICANT|GUIDE, name, sections as JSON, createdAt, updatedAt)
  - `FormField` (id, formId, sectionId, type, label, name, required, properties as JSON, order)
  - `FormSection` (id, formId, name, order, parentSectionId for nesting)

**Given** the API module for forms exists
**When** the developer inspects `apps/api/src/forms`
**Then** endpoints are available for:
  - Form CRUD (`/api/services/:serviceId/forms`)
  - Field CRUD (`/api/forms/:formId/fields`)
  - Section CRUD (`/api/forms/:formId/sections`)

**Given** forms are linked to services
**When** a service is deleted
**Then** all associated forms are cascade deleted

---

### Story 3.2: Create Applicant Form

As a **Service Designer**,
I want to create an Applicant Form for data collection from citizens,
So that I can define what information applicants must provide.

**Acceptance Criteria:**

**Given** the Service Designer is editing a service
**When** they navigate to the Forms tab
**Then** an "Add Applicant Form" button is visible

**Given** the Service Designer clicks "Add Applicant Form"
**When** the form creation dialog opens
**Then** they can enter a form name
**And** the form type is preset to APPLICANT

**Given** a valid form name is entered
**When** the Service Designer confirms creation
**Then** the form is created and linked to the service
**And** the form editor opens with an empty canvas
**And** the form appears in the Forms list

---

### Story 3.3: Create Guide Form

As a **Service Designer**,
I want to create a Guide Form for operator workflow steps,
So that I can define what information operators collect during processing.

**Acceptance Criteria:**

**Given** the Service Designer is editing a service
**When** they navigate to the Forms tab
**Then** an "Add Guide Form" button is visible

**Given** the Service Designer clicks "Add Guide Form"
**When** the form creation dialog opens
**Then** they can enter a form name
**And** the form type is preset to GUIDE

**Given** a Guide Form is created
**When** the form editor opens
**Then** it has the same field types and capabilities as Applicant Form
**And** can be assigned to workflow steps (Epic 4)

---

### Story 3.4: Add Form Fields

As a **Service Designer**,
I want to add form fields of various types,
So that I can collect different kinds of data from users.

**Acceptance Criteria:**

**Given** the Service Designer is in the form editor
**When** they click "Add Field"
**Then** a field type selector appears with options:
  - Text (single line)
  - Textarea (multi-line)
  - Number
  - Date
  - Select (dropdown)
  - Radio (single choice)
  - Checkbox (multiple choice)
  - File Upload
  - Email
  - Phone

**Given** a field type is selected
**When** the field is added to the form
**Then** it appears at the end of the current section
**And** a default label is assigned (e.g., "New Text Field")
**And** the field is immediately editable

**Given** multiple fields exist
**When** the Service Designer drags a field
**Then** the field can be reordered within the form
**And** the new order is saved automatically

---

### Story 3.5: Configure Field Properties

As a **Service Designer**,
I want to configure field properties like label, placeholder, and validation,
So that fields collect data correctly and guide users.

**Acceptance Criteria:**

**Given** a field is selected in the form editor
**When** the properties panel opens
**Then** the following properties are configurable:
  - Label (displayed text)
  - Name (technical identifier, auto-generated from label)
  - Placeholder (hint text)
  - Required (checkbox)
  - Help text (tooltip/description)

**Given** a field type supports validation
**When** the Service Designer configures validation rules
**Then** options are available based on field type:
  - Text: min/max length, regex pattern
  - Number: min/max value, integer only
  - Date: min/max date, future/past only
  - File: allowed extensions, max size

**Given** a Select/Radio/Checkbox field
**When** the Service Designer configures options
**Then** they can add, edit, reorder, and remove choices
**And** each choice has a label and value

---

### Story 3.6: Organize Fields into Sections

As a **Service Designer**,
I want to organize fields into sections and groups,
So that complex forms are structured and easier to complete.

**Acceptance Criteria:**

**Given** the Service Designer is in the form editor
**When** they click "Add Section"
**Then** a new section is created with a default name
**And** fields can be added to or moved into the section

**Given** a section exists
**When** the Service Designer selects the section
**Then** section properties are configurable:
  - Section title
  - Description/instructions
  - Collapsible (yes/no)

**Given** multiple sections exist
**When** the Service Designer drags a section
**Then** the section order can be changed
**And** all fields within move with the section

**Given** a section contains fields
**When** the section is collapsed in the editor
**Then** a field count badge is displayed
**And** fields are hidden but preserved

---

### Story 3.7: Configure Conditional Visibility Rules

As a **Service Designer**,
I want to configure conditional visibility rules for fields and sections,
So that forms adapt dynamically based on user input.

**Acceptance Criteria:**

**Given** a field or section is selected
**When** the Service Designer opens the visibility panel
**Then** options are available:
  - Always visible (default)
  - Conditional visibility (rule-based)

**Given** conditional visibility is selected
**When** the Service Designer configures a rule
**Then** they can specify:
  - Source field (another field in the form)
  - Operator (equals, not equals, contains, greater than, etc.)
  - Value (comparison value)

**Given** multiple conditions are needed
**When** the Service Designer adds conditions
**Then** they can combine with AND/OR logic
**And** nested groups are supported

**Given** visibility rules are configured
**When** rules are saved
**Then** JSON Rules Engine format is generated internally
**And** rules reference field names correctly

---

### Story 3.8: Form Preview Rendering

As a **Service Designer**,
I want to preview how a form renders to applicants,
So that I can verify the form appearance before publication.

**Acceptance Criteria:**

**Given** the Service Designer is in the form editor
**When** they click "Preview"
**Then** a preview panel opens showing the form as applicants will see it
**And** the preview renders within 2 seconds (NFR3)

**Given** the preview is displayed
**When** the Service Designer interacts with fields
**Then** conditional visibility rules are active
**And** validation errors appear when rules are violated

**Given** the form has sections
**When** the preview is displayed
**Then** sections render with correct styling
**And** collapsible sections can be expanded/collapsed

**Given** changes are made in the editor
**When** the Service Designer refreshes preview
**Then** the preview updates to reflect changes

---

### Story 3.9: Link Fields to Determinants

As a **Service Designer**,
I want to link form fields to determinants for business rule evaluation,
So that form data can drive workflow decisions and calculations.

**Acceptance Criteria:**

**Given** a field is selected in the form editor
**When** the Service Designer opens advanced properties
**Then** a "Link to Determinant" option is available

**Given** the linking dialog opens
**When** the Service Designer clicks "Create Determinant"
**Then** a new determinant is created with:
  - Name derived from field name
  - Type matching field type
  - Source pointing to this field

**Given** determinants exist in the service
**When** the Service Designer links a field
**Then** they can select from existing determinants
**And** the link is bidirectionally visible

**Given** a field is linked to a determinant
**When** the form is previewed with test data
**Then** the determinant value updates based on field input

---

### Story 3.10: JSON Schema Generation

As a **System**,
I want to generate JSON Schema representation of form configuration,
So that forms can be rendered by JSON Forms and validated consistently.

**Acceptance Criteria:**

**Given** a form exists with fields and sections
**When** the form is saved
**Then** a JSON Schema is automatically generated
**And** stored alongside the form configuration

**Given** the generated JSON Schema
**When** it is inspected
**Then** it includes:
  - Properties for each field with correct types
  - Required array for mandatory fields
  - Validation keywords (minLength, maximum, pattern, etc.)
  - UI schema for section layout

**Given** a form has conditional visibility rules
**When** JSON Schema is generated
**Then** rules are represented in a companion rules document
**And** can be evaluated by JSON Rules Engine at runtime

**Given** the form configuration changes
**When** the form is saved
**Then** the JSON Schema is regenerated
**And** version history is maintained for published forms

---

**Epic 3 Summary:**
- 10 stories created
- FR9-FR17 fully covered
- NFR3 (preview < 2s) addressed in Story 3.8
- Depends on Epic 1, Epic 2 (services to attach forms)
- Enables Epic 4 (assign forms to workflow steps)

---

## Epic 4: Workflow Configuration

**Goal:** Service Designers can define approval chains with steps, roles, and transitions.

**FRs Covered:** FR18, FR19, FR20, FR21, FR22, FR23, FR24
**NFRs Addressed:** None specific

---

### Story 4.1: Workflow Database Model & API

As a **Developer**,
I want Workflow, WorkflowStep, and Transition entities in Prisma with API endpoints,
So that workflow configurations can be persisted and managed.

**Acceptance Criteria:**

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the following models are defined:
  - `Workflow` (id, serviceId, name, createdAt, updatedAt)
  - `WorkflowStep` (id, workflowId, name, roleType: HUMAN|BOT, category: REVISION|APPROVAL|COLLECTION, order, formId)
  - `WorkflowTransition` (id, workflowId, fromStepId, toStepId, action, condition as JSON)

**Given** the API module for workflows exists
**When** the developer inspects `apps/api/src/workflows`
**Then** endpoints are available for:
  - Workflow CRUD (`/api/services/:serviceId/workflow`)
  - Step CRUD (`/api/workflows/:workflowId/steps`)
  - Transition CRUD (`/api/workflows/:workflowId/transitions`)

**Given** workflows are linked to services
**When** a service is deleted
**Then** the associated workflow is cascade deleted

---

### Story 4.2: Define Workflow Steps

As a **Service Designer**,
I want to define workflow steps (roles) for a service,
So that I can specify who processes applications at each stage.

**Acceptance Criteria:**

**Given** the Service Designer is editing a service
**When** they navigate to the Workflow tab
**Then** a workflow editor canvas is displayed
**And** options to add steps are available

**Given** the Service Designer clicks "Add Step"
**When** the step creation dialog opens
**Then** they can configure:
  - Step name (e.g., "Initial Review", "Manager Approval")
  - Role type: HUMAN (manual) or BOT (automated)
  - Category: REVISION, APPROVAL, or COLLECTION

**Given** a step is created
**When** it appears on the workflow canvas
**Then** it shows the step name and role type icon
**And** can be selected for further configuration

**Given** multiple steps exist
**When** the Service Designer reorders steps
**Then** the workflow sequence is updated
**And** transitions are automatically adjusted

---

### Story 4.3: Configure Workflow Transitions

As a **Service Designer**,
I want to configure transitions between workflow steps,
So that applications flow correctly through the approval process.

**Acceptance Criteria:**

**Given** two workflow steps exist
**When** the Service Designer drags a connection between them
**Then** a transition is created from source to target step
**And** the transition is visualized as an arrow

**Given** a transition is selected
**When** the properties panel opens
**Then** the following are configurable:
  - Transition label (displayed on diagram)
  - Action that triggers the transition
  - Condition (optional, for conditional routing)

**Given** conditional routing is configured
**When** the Service Designer sets a condition
**Then** they can reference determinants
**And** use operators (equals, greater than, etc.)
**And** the condition is stored in JSON format

**Given** a step has no outgoing transition
**When** the workflow is validated
**Then** a warning is displayed for unreachable endpoints
**And** unless it's marked as a terminal step

---

### Story 4.4: Specify Step Actions

As a **Service Designer**,
I want to specify which actions are available at each workflow step,
So that operators know what decisions they can make.

**Acceptance Criteria:**

**Given** a workflow step is selected
**When** the Service Designer opens the actions panel
**Then** available action types are listed:
  - Approve (advance to next step)
  - Reject (end with rejection)
  - Request Information (return to applicant)
  - Revise (send back to previous step)
  - Custom action (configurable label)

**Given** actions are configured for a step
**When** the Service Designer enables an action
**Then** they can specify:
  - Button label
  - Target step (for routing actions)
  - Required fields (must be filled before action)

**Given** a step has multiple actions
**When** displayed in preview
**Then** each action appears as a distinct button
**And** appropriate confirmation dialogs are shown

---

### Story 4.5: Assign Forms to Workflow Steps

As a **Service Designer**,
I want to assign forms to each workflow step,
So that operators see the correct data entry interface.

**Acceptance Criteria:**

**Given** a workflow step is selected
**When** the Service Designer opens the forms assignment panel
**Then** a list of available Guide Forms is displayed
**And** the currently assigned form (if any) is highlighted

**Given** the Service Designer selects a form
**When** they confirm the assignment
**Then** the form is linked to the workflow step
**And** the step displays the assigned form name

**Given** a step has an assigned form
**When** an operator reaches that step at runtime
**Then** the assigned form is displayed for data entry
**And** previous form data is visible but read-only

**Given** no form is assigned to a step
**When** the workflow is validated
**Then** a warning is displayed (optional for simple approvals)

---

### Story 4.6: Linear Approval Chain Configuration

As a **Service Designer**,
I want to configure linear approval chains with 2-5 steps,
So that I can quickly set up common approval patterns.

**Acceptance Criteria:**

**Given** the Service Designer is creating a new workflow
**When** they select "Linear Chain Template"
**Then** a wizard prompts for number of steps (2-5)
**And** step names and roles can be specified

**Given** the wizard is completed
**When** the workflow is generated
**Then** steps are created in sequence
**And** transitions are automatically created between consecutive steps
**And** final step has Approve/Reject actions configured

**Given** a linear workflow exists
**When** the Service Designer modifies it
**Then** they can add branches or parallel paths
**And** the linear structure is not enforced after initial creation

**Given** the workflow has more than 5 steps
**When** the Service Designer adds another step
**Then** a warning suggests the workflow may be overly complex
**And** the step is still allowed (soft limit)

---

### Story 4.7: Workflow Diagram Preview

As a **Service Designer**,
I want to preview the complete workflow as a visual diagram,
So that I can verify the approval flow is correct.

**Acceptance Criteria:**

**Given** a workflow is configured
**When** the Service Designer clicks "Preview Diagram"
**Then** a visual flowchart is displayed showing:
  - All steps as nodes
  - Transitions as directed edges
  - Action labels on edges
  - Role type indicators on nodes

**Given** the diagram is displayed
**When** the Service Designer hovers over a node
**Then** a tooltip shows:
  - Step name and role
  - Assigned form (if any)
  - Available actions

**Given** the diagram is complex
**When** it exceeds the viewport
**Then** zoom and pan controls are available
**And** a minimap shows the full workflow

**Given** conditional transitions exist
**When** displayed in the diagram
**Then** conditions are shown as labels on edges
**And** branching paths are clearly visible

---

### Story 4.8: Workflow Validation

As a **System**,
I want to validate workflow configuration for completeness,
So that no dead ends or unreachable steps exist.

**Acceptance Criteria:**

**Given** a workflow is configured
**When** the Service Designer clicks "Validate"
**Then** the system checks for:
  - At least one start step (no incoming transitions)
  - At least one end step (no outgoing transitions or terminal action)
  - All steps are reachable from start
  - No orphan steps (disconnected from the flow)

**Given** validation errors are found
**When** results are displayed
**Then** each issue is listed with:
  - Severity (error or warning)
  - Description of the problem
  - Affected step highlighted on diagram

**Given** all validations pass
**When** results are displayed
**Then** a success message confirms the workflow is complete
**And** the service can proceed to publishing

**Given** the workflow is saved
**When** it contains validation errors
**Then** saving is allowed (draft state)
**And** publishing is blocked until resolved (FR43)

---

### Story 4.9: Role Status Configuration (4-Status Model)

As a **Service Designer**,
I want to configure statuses for each workflow role following the 4-Status model,
So that application states are consistent and well-defined across all registrations.

**Acceptance Criteria:**

**Given** a workflow step (role) is selected
**When** the Service Designer opens the Status Configuration panel
**Then** the 4-Status model is displayed:
  - PENDING (awaiting processing)
  - PASSED (approved by this role)
  - RETURNED (sent back for revision)
  - REJECTED (permanently declined)

**Given** the Service Designer configures a role status
**When** they edit a status entry
**Then** they can configure:
  - Status name (localized label)
  - Notification message template
  - Weight (priority for conflict resolution)
  - Sort order (display ordering)
  - Allowed transitions (which statuses this can move to)

**Given** status transitions are configured
**When** the role is at a specific status
**Then** only valid transitions are available to operators
**And** invalid transitions are disabled with explanation

**Given** a BOT role is configured
**When** status outcomes are defined
**Then** SUCCESS maps to PASSED status
**And** FAILURE can map to RETURNED or REJECTED based on config
**And** retry logic is applied for transient failures

**Given** the role status configuration is saved
**When** the workflow is validated
**Then** the system verifies:
  - At least PENDING and one terminal status exist
  - All transitions form valid state machine
  - No orphan statuses (unreachable from PENDING)

**Technical Notes:**
- Implements `RoleStatus` entity per `WorkflowRole`
- Uses `ApplicationStatus` enum: PENDING (0), PASSED (1), RETURNED (2), REJECTED (3)
- Status messages link to notification templates
- Weight determines priority when multiple statuses apply

---

### Story 4.10: Role-Registration Binding

As a **Service Designer**,
I want to bind workflow roles to specific registrations,
So that each registration type has its own processing path.

**Acceptance Criteria:**

**Given** a workflow role is selected
**When** the Service Designer opens the Registration Binding panel
**Then** all registrations in the service are listed
**And** currently bound registrations are checked

**Given** the Service Designer binds a registration to a role
**When** they check a registration
**Then** a `RoleRegistration` link is created
**And** `finalResultIssued` defaults to false

**Given** a role can issue final results
**When** the Service Designer marks it as "Final Approver"
**Then** `finalResultIssued` is set to true
**And** the role's PASSED/REJECTED statuses become terminal for that registration

**Given** a registration has no roles bound
**When** the workflow is validated
**Then** an error is displayed: "Registration has no processing roles"

**Given** multiple registrations are bound to a role
**When** applications are processed
**Then** the role handles all bound registration types
**And** status transitions apply per registration context

---

### Story 4.11: Role-Institution Assignment

As a **Service Designer**,
I want to assign institutions to workflow roles,
So that the service can be published and roles know which org handles them.

**Acceptance Criteria:**

**Given** a workflow role is selected
**When** the Service Designer opens the Institution Assignment panel
**Then** available institutions are listed
**And** currently assigned institutions are highlighted

**Given** the Service Designer assigns an institution
**When** they select from the list
**Then** a `RoleInstitution` link is created
**And** the role displays the institution badge

**Given** a role has no institution assigned
**When** the service is validated for publishing
**Then** an error blocks publishing: "Role requires institution assignment"

**Given** multiple institutions are assigned to a role
**When** applications are processed
**Then** any operator from those institutions can process
**And** institution context is tracked in audit log

**Given** all roles have institution assignments
**When** the service publish is attempted
**Then** validation passes for role assignments
**And** the service can proceed to final publishing checks

---

**Epic 4 Summary:**
- 11 stories created (expanded from 8)
- FR18-FR24 fully covered
- **NEW:** 4-Status Model (Story 4.9) aligns with legacy BPA patterns
- **NEW:** Role-Registration binding (Story 4.10) enables multi-registration support
- **NEW:** Role-Institution assignment (Story 4.11) required for publishing
- Depends on Epic 1, Epic 2, Epic 3 (forms to assign)
- Enables Epic 5 (determinants in workflow conditions)

---

## Epic 5: Determinants & Business Rules

**Goal:** Service Designers can configure calculated variables and conditional visibility rules.

**FRs Covered:** FR34, FR35, FR36, FR37, FR38
**NFRs Addressed:** NFR30 (Git sync for formulas)

---

### Story 5.1: Determinant Database Model & API

As a **Developer**,
I want Determinant entities in Prisma with API endpoints,
So that calculated variables can be persisted and managed.

**Acceptance Criteria:**

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the Determinant model is defined with fields:
  - `id` (UUID, primary key)
  - `serviceId` (foreign key to Service)
  - `name` (unique within service)
  - `type` (STRING, NUMBER, BOOLEAN, DATE)
  - `sourceType` (FIELD, FORMULA, EXTERNAL)
  - `sourceFieldId` (optional, for FIELD type)
  - `formula` (optional, JSONata expression for FORMULA type)
  - `createdAt`, `updatedAt` (timestamps)

**Given** the API module for determinants exists
**When** the developer inspects `apps/api/src/determinants`
**Then** endpoints are available for:
  - Determinant CRUD (`/api/services/:serviceId/determinants`)
  - Formula validation (`/api/determinants/validate`)
  - Reference check (`/api/determinants/:id/references`)

---

### Story 5.2: Define Determinants from Form Fields

As a **Service Designer**,
I want to define determinants derived from form fields,
So that field values can be used in business rules.

**Acceptance Criteria:**

**Given** the Service Designer is editing a service
**When** they navigate to the Determinants tab
**Then** a list of existing determinants is displayed
**And** an "Add Determinant" button is available

**Given** the Service Designer clicks "Add Determinant"
**When** the creation dialog opens
**Then** they can configure:
  - Determinant name (auto-suggested from field if linking)
  - Type (STRING, NUMBER, BOOLEAN, DATE)
  - Source: Link to Form Field

**Given** "Link to Form Field" is selected
**When** the field picker opens
**Then** all forms in the service are listed
**And** the Service Designer can select a specific field
**And** the determinant type is auto-set from field type

**Given** a field-linked determinant is created
**When** the determinant is saved
**Then** it appears in the determinants list
**And** the source field reference is displayed

---

### Story 5.3: Configure Calculation Formulas

As a **Service Designer**,
I want to configure formulas that calculate determinant values using JSONata,
So that I can derive complex values from multiple form fields.

**Acceptance Criteria:**

**Given** the Service Designer creates a formula determinant
**When** the formula editor opens
**Then** a code editor is displayed with JSONata syntax highlighting
**And** available field references are shown in a sidebar

**Given** the Service Designer writes a formula
**When** they type field references
**Then** autocomplete suggests available fields and determinants
**And** the syntax follows JSONata format (e.g., `$field.age * 12`)

**Given** a formula is entered
**When** the Service Designer clicks "Validate"
**Then** the formula is parsed and checked for:
  - Valid JSONata syntax
  - All referenced fields/determinants exist
  - No circular dependencies

**Given** validation passes
**When** the Service Designer saves the determinant
**Then** the formula is stored
**And** a test evaluation can be run with sample data

**Given** formula uses external data
**When** JSONata expression includes lookups
**Then** catalog references are supported (e.g., `$catalog.countries`)
**And** the expression is cached for performance

---

### Story 5.4: Determinants in Visibility Rules

As a **Service Designer**,
I want to use determinants in conditional visibility rules,
So that form sections adapt based on calculated values.

**Acceptance Criteria:**

**Given** a field or section visibility rule is being configured
**When** the Service Designer selects condition source
**Then** both form fields and determinants are available
**And** determinants are marked with a calculated icon

**Given** a determinant is selected as condition source
**When** the rule is configured
**Then** operators match the determinant type:
  - NUMBER: equals, not equals, greater than, less than, between
  - STRING: equals, not equals, contains, starts with
  - BOOLEAN: is true, is false
  - DATE: before, after, between

**Given** a visibility rule uses a formula determinant
**When** the form is previewed
**Then** the formula is evaluated in real-time
**And** visibility updates as source fields change

**Given** visibility rules are saved
**When** the JSON Rules Engine format is generated
**Then** determinant references are resolved correctly
**And** rules can be evaluated client-side and server-side

---

### Story 5.5: Determinants in Workflow Conditions

As a **Service Designer**,
I want to use determinants in workflow transition conditions,
So that application routing depends on business logic.

**Acceptance Criteria:**

**Given** a workflow transition condition is being configured
**When** the Service Designer opens the condition builder
**Then** all service determinants are available for selection

**Given** a determinant is selected
**When** the condition is configured
**Then** comparison operators are available based on type
**And** literal values or other determinants can be compared

**Given** multiple conditions are needed
**When** the Service Designer adds conditions
**Then** AND/OR logic is supported
**And** nested groups can be created

**Given** transition conditions use determinants
**When** an application reaches the step at runtime
**Then** determinant values are calculated from current data
**And** the correct transition path is selected

---

### Story 5.6: Reference Validation

As a **System**,
I want to validate determinant references for consistency,
So that broken references don't cause runtime errors.

**Acceptance Criteria:**

**Given** a determinant references a form field
**When** the field is deleted
**Then** a validation error is raised
**And** the Service Designer is warned about broken references

**Given** a determinant references another determinant
**When** a circular dependency would be created
**Then** the system prevents the save
**And** displays the dependency cycle

**Given** a visibility rule references a determinant
**When** the determinant is deleted
**Then** a validation error is raised
**And** affected rules are listed

**Given** the Service Designer clicks "Validate References"
**When** the validation runs
**Then** all determinants are checked for:
  - Valid source references (fields exist)
  - Valid formula syntax
  - No circular dependencies
  - All consumers (rules, conditions) are valid

**Given** validation completes
**When** issues are found
**Then** a detailed report is displayed
**And** each issue links to the affected configuration

---

**Epic 5 Summary:**
- 6 stories created
- FR34-FR38 fully covered
- NFR30 (Git sync) addressed via formula storage
- Depends on Epic 1-4 (forms and workflows to reference)
- Enables Epic 6 (AI inference of determinants)

---

## Epic 6: AI Agent for Service Configuration

**Goal:** An intelligent AI Agent operates as a "junior engineer" - understanding backend state, executing multi-step operations, respecting constraints, and auto-healing when possible.

**Architecture:** Vercel AI SDK (revised from CopilotKit)
**Detailed Spec:** See `_bmad-output/implementation-artifacts/epic-6-ai-agent-stories.md`

**FRs Covered:** FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR63, FR64
**NFRs Addressed:** NFR1 (AI < 10s), NFR2 (streaming < 1s), NFR28-29 (LLM fallback), NFR32-33 (cost efficiency)

---

### Story 6.0: AI Agent Architecture Spike

As a **Developer**,
I want to validate the Vercel AI SDK architecture with a minimal E2E implementation,
So that we confirm the approach before full build-out.

**Acceptance Criteria:**

**Given** Vercel AI SDK with Groq adapter
**When** integrated into the Next.js app
**Then** streaming responses work with `streamText()`
**And** a single tool (createService) executes successfully

**Given** the spike implementation
**When** tested end-to-end
**Then** tool → API → Database flow is validated
**And** learnings are documented for remaining stories

---

### Story 6.1: AI Agent Core Runtime

As a **Developer**,
I want a BPAAgent class with multi-step reasoning capability,
So that the AI can chain multiple tool calls to complete complex tasks.

**Acceptance Criteria:**

**Given** `packages/ai-agent` exists
**When** the developer inspects `src/runtime/agent.ts`
**Then** BPAAgent class implements:
  - `chat()` method with streaming response
  - System prompt with service context injection
  - Multi-step reasoning (`maxSteps: 10`)
  - Step completion hooks for error handling

**Given** Groq is unavailable
**When** the request fails
**Then** LiteLLM fallback to Claude is triggered (NFR28)
**And** fallback is logged for monitoring

---

### Story 6.1a: Dynamic Tool Registry

As a **Developer**,
I want tools auto-generated from OpenAPI specification,
So that the AI agent always has access to current API capabilities.

**Acceptance Criteria:**

**Given** the OpenAPI spec at `/api/v1/openapi.json`
**When** the tool generator processes it
**Then** Vercel AI SDK tools are created for all endpoints:
  - Parameters converted to Zod schemas
  - Tool metadata includes: mutates, scope, requiresConfirmation
  - HTTP executor handles auth and error responses

**Given** the OpenAPI spec changes
**When** tools are regenerated
**Then** new endpoints are available immediately
**And** removed endpoints no longer appear

---

### Story 6.1b: Constraint Engine

As a **Developer**,
I want a YAML-based rule engine for action constraints,
So that destructive or expensive operations require confirmation.

**Acceptance Criteria:**

**Given** `src/constraints/rules.yaml` exists
**When** a tool is about to execute
**Then** the constraint engine evaluates applicable rules:
  - `require_confirmation`: Pause for user approval
  - `block`: Prevent execution entirely
  - `warn`: Allow but show warning
  - `transform`: Modify parameters before execution

**Given** the rules file is updated
**When** the application is restarted
**Then** new rules take effect
**And** rule changes are logged

**Default Rules (MVP):**
- Confirm: delete, remove, publish operations
- Block: Session cost > $1.00
- Warn: Bulk modifications (> 5 items)

---

### Story 6.1c: Self-Healing Layer

As a **Developer**,
I want error classification and automatic recovery,
So that transient failures are handled without user intervention.

**Acceptance Criteria:**

**Given** a tool execution fails
**When** the error is classified
**Then** one of four categories is assigned:
  - `retryable`: Rate limits (429), temporary failures (503)
  - `conflict`: Optimistic lock failures (409)
  - `user_fixable`: Validation errors (400, 422)
  - `fatal`: Auth errors (401, 403), server errors (500)

**Given** a retryable error occurs
**When** auto-heal is enabled
**Then** exponential backoff retry is executed
**And** success/failure is logged

**Given** a conflict error occurs
**When** auto-heal executes
**Then** context is refreshed and operation retried
**And** user is informed of the recovery

---

### Story 6.1d: Backend Event Stream

As a **Developer**,
I want real-time backend state awareness via WebSocket,
So that the AI agent knows when entities change.

**Acceptance Criteria:**

**Given** a WebSocket connection to `/ws/events`
**When** an entity is created/updated/deleted
**Then** the event is received with:
  - Entity type and ID
  - Change type (create, update, delete)
  - Timestamp

**Given** events are received
**When** the context store (Zustand) is updated
**Then** the AI agent has current state
**And** stale data issues are prevented

**Given** the WebSocket disconnects
**When** reconnection is attempted
**Then** exponential backoff is used
**And** missed events are reconciled

---

### Story 6.1e: Observability Layer

As a **Developer**,
I want audit logging and LLM cost tracking,
So that usage is monitored and costs are controlled.

**Acceptance Criteria:**

**Given** a tool is executed
**When** the action completes
**Then** an audit log entry is created:
  - Tool name and parameters
  - Result (success/error)
  - Duration (ms)
  - User ID and session

**Given** LLM tokens are consumed
**When** a request completes
**Then** token usage is logged
**And** session cost is calculated (NFR32: < $1/service)

**Given** the cost dashboard is accessed
**When** the operator views metrics
**Then** cost per service is visible
**And** usage trends are displayed

---

### Story 6.2: Chat Interface Foundation

As a **Service Designer**,
I want a chat sidebar to interact with the AI Agent,
So that I can request and review changes conversationally.

**Acceptance Criteria:**

**Given** the service builder is open
**When** the chat sidebar is displayed
**Then** it includes:
  - Message input area with send button
  - Streaming response display
  - Message history with user/agent distinction

**Given** a message is sent
**When** the AI processes it
**Then** a typing indicator is shown
**And** the first token appears within 1 second (NFR2)

**Given** the AI calls a tool
**When** it modifies the service
**Then** the change is reflected in the UI immediately
**And** the agent confirms the action in chat

---

### Story 6.3: Confirmation Flow UI

As a **Service Designer**,
I want to confirm constrained actions before execution,
So that destructive changes require my explicit approval.

**Acceptance Criteria:**

**Given** the AI attempts a constrained action
**When** confirmation is required
**Then** a dialog is displayed:
  - Action description
  - Preview of changes
  - Accept/Reject buttons

**Given** I accept the confirmation
**When** the action executes
**Then** the service is updated
**And** the agent confirms success in chat

**Given** confirmation is not provided within 60 seconds
**When** the timeout expires
**Then** the action is cancelled
**And** the agent reports the timeout

---

### Story 6.4: Service Generation Flow

As a **Service Designer**,
I want to describe a service in natural language and receive complete configuration,
So that I can quickly create working services.

**Acceptance Criteria:**

**Given** I describe a service (e.g., "business registration with two-step approval")
**When** the AI processes my description
**Then** a complete configuration is generated:
  - Service metadata (name, description)
  - Form fields appropriate for the service type
  - Workflow steps matching the approval chain

**Given** generation is in progress
**When** steps complete
**Then** progress is shown (e.g., "Generating form fields...")
**And** partial results are displayed as available

**Given** generation completes
**When** the configuration is presented
**Then** I can review each section before applying (NFR1: < 10s total)
**And** cost is logged (NFR32: < $1.00)

---

### Story 6.5: Iterative Refinement

As a **Service Designer**,
I want to refine AI-generated configuration through conversation,
So that I achieve the exact configuration I need.

**Acceptance Criteria:**

**Given** an AI-generated configuration exists
**When** I request a change (e.g., "add a phone number field")
**Then** only the affected component is modified
**And** previous changes are preserved

**Given** my request is ambiguous
**When** the AI detects unclear intent
**Then** clarifying questions are asked
**And** I can guide the resolution

**Given** I want to undo a change
**When** I say "undo the last change"
**Then** the previous state is restored
**And** the agent confirms the rollback

---

### Story 6.6: Gap Detection

As a **Service Designer**,
I want the AI to proactively identify configuration gaps,
So that my service is complete before publication.

**Acceptance Criteria:**

**Given** a service configuration is in progress
**When** the AI analyzes the current state
**Then** potential gaps are identified:
  - Missing required fields
  - Incomplete workflow transitions
  - Unlinked determinants

**Given** gaps are detected
**When** displayed to me
**Then** each gap shows:
  - What's missing
  - Why it matters
  - "Fix it for me" option

**Given** I accept a fix
**When** applied to the service
**Then** the gap is resolved
**And** the change is confirmed

---

### Story 6.7: Agent Settings & Preferences

As a **Service Designer**,
I want to configure agent behavior,
So that the AI operates according to my preferences.

**Acceptance Criteria:**

**Given** the agent settings panel
**When** I configure preferences
**Then** options include:
  - Verbosity (concise/detailed)
  - Auto-apply mode (with/without confirmation)
  - Preferred language for responses

**Given** preferences are saved
**When** I interact with the agent
**Then** behavior matches my settings
**And** settings persist across sessions

---

**Epic 6 Summary:**
- 13 stories (6-0 spike + 6-1 core + 6-1a-e infrastructure + 6-2 to 6-7 features)
- Architecture: Vercel AI SDK with dynamic tool generation
- Key capabilities: Multi-step reasoning, constraint engine, self-healing, real-time state
- FR25-FR33, FR63-FR64 fully covered
- NFR1, NFR2, NFR28-29, NFR32-33 addressed
- Depends on Epic 1-5 (AI generates into existing structures)
- Enables Epic 7 (preview AI-generated configs)

---

## Epic 7: Preview & Publishing

**Goal:** Service Designers can test complete applicant journeys and deploy services to production.

**FRs Covered:** FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46
**NFRs Addressed:** NFR5 (auto-save 30s), NFR6 (publish < 30s), NFR20 (auto-save 99.9%)

---

### Story 7.1: Complete Applicant Journey Preview

As a **Service Designer**,
I want to preview the complete applicant journey from forms to workflow to outcome,
So that I can experience the service as an applicant would.

**Acceptance Criteria:**

**Given** a service has forms and workflow configured
**When** the Service Designer clicks "Preview Journey"
**Then** a simulation environment opens showing:
  - Initial form presentation
  - Step-by-step progression
  - Outcome display

**Given** the journey preview is active
**When** the Service Designer navigates through steps
**Then** forms render as they would for applicants
**And** conditional visibility works correctly
**And** workflow transitions are simulated

**Given** the preview reaches the final step
**When** the outcome is displayed
**Then** approval/rejection screens are shown
**And** certificate templates render (if configured)

---

### Story 7.2: Simulate Form Submission with Test Data

As a **Service Designer**,
I want to simulate form submission with test data,
So that I can verify form validation and data flow.

**Acceptance Criteria:**

**Given** a form is open in preview mode
**When** the Service Designer clicks "Load Test Data"
**Then** sample data populates the form fields
**And** data matches expected field types

**Given** test data is loaded
**When** the Service Designer submits the form
**Then** validation rules are evaluated
**And** errors are displayed for invalid data
**And** successful submission advances to next step

**Given** the Service Designer wants custom test data
**When** they click "Edit Test Data"
**Then** a JSON editor opens with current data
**And** custom values can be entered
**And** changes are applied to the preview

**Given** form submission is simulated
**When** determinants are calculated
**Then** calculated values are displayed
**And** the Service Designer can verify formulas

---

### Story 7.3: Simulate Workflow Progression

As a **Service Designer**,
I want to simulate workflow progression through all steps,
So that I can verify transitions and actions work correctly.

**Acceptance Criteria:**

**Given** an application is in the simulation
**When** the Service Designer views a workflow step
**Then** available actions are displayed
**And** assigned forms are shown

**Given** the Service Designer clicks an action (e.g., "Approve")
**When** the transition is triggered
**Then** the application moves to the next step
**And** conditional routing is evaluated

**Given** a transition has a condition
**When** the condition evaluates to false
**Then** the transition is blocked
**And** the Service Designer sees why (condition not met)

**Given** the workflow reaches a terminal state
**When** the outcome is determined
**Then** approved/rejected status is displayed
**And** the simulation can be restarted

---

### Story 7.4: Completeness Dashboard

As a **Service Designer**,
I want a Completeness Dashboard showing status of all service components,
So that I can quickly identify what's missing before publication.

**Acceptance Criteria:**

**Given** the Service Designer opens the Completeness Dashboard
**When** the dashboard loads
**Then** all service components are displayed:
  - Service metadata (complete/incomplete)
  - Forms (count, validation status)
  - Workflow (steps, transitions, validation)
  - Determinants (count, validation status)

**Given** a component has issues
**When** displayed on the dashboard
**Then** a warning icon is shown
**And** clicking reveals specific issues
**And** direct links navigate to fix locations

**Given** all components are complete
**When** the dashboard is viewed
**Then** a green "Ready to Publish" indicator is shown
**And** the publish button is enabled

**Given** the service is modified
**When** returning to the dashboard
**Then** status is refreshed automatically
**And** new issues are highlighted

---

### Story 7.5: Validation Checks Before Publication

As a **System**,
I want to perform validation checks before allowing publication,
So that only valid, complete services go live.

**Acceptance Criteria:**

**Given** the Service Designer clicks "Publish"
**When** pre-publish validation runs
**Then** the following checks are performed:
  - At least one Applicant Form exists
  - Workflow is valid (no dead ends)
  - All determinant references are valid
  - All visibility rules are valid
  - Required fields have proper configuration

**Given** validation errors are found
**When** results are displayed
**Then** publication is blocked
**And** each error is listed with severity
**And** links navigate to problem locations

**Given** all validations pass
**When** results are displayed
**Then** a confirmation dialog appears
**And** the Service Designer can proceed to publish

---

### Story 7.6: Publish Service

As a **Service Designer**,
I want to publish a service to make it available for applicants,
So that citizens can start using the configured service.

**Acceptance Criteria:**

**Given** all pre-publish validations pass
**When** the Service Designer confirms publication
**Then** the service status changes to PUBLISHED
**And** the operation completes within 30 seconds (NFR6)

**Given** publication is in progress
**When** the Service Designer waits
**Then** a progress indicator is shown
**And** steps include: validation, snapshot, activation

**Given** publication completes successfully
**When** the result is displayed
**Then** a success message confirms availability
**And** the published version is locked from editing
**And** applicants can now access the service

**Given** publication fails
**When** the error is displayed
**Then** the service remains in DRAFT state
**And** detailed error information is provided

---

### Story 7.7: Publish Readiness Gate

As a **Service Designer**,
I want a Publish Readiness Gate with a pass/fail checklist,
So that I can systematically verify service quality.

**Acceptance Criteria:**

**Given** the Service Designer opens the Readiness Gate
**When** the checklist loads
**Then** items are grouped by category:
  - Required: Must pass for publication
  - Recommended: Should pass for quality
  - Optional: Nice-to-have enhancements

**Given** each checklist item
**When** evaluated
**Then** status shows: Pass, Fail, or Not Checked
**And** failed items show specific issues
**And** not-checked items can be manually verified

**Given** all required items pass
**When** the gate is evaluated
**Then** "Ready to Publish" is indicated
**And** recommended failures show as warnings

**Given** required items fail
**When** the gate is evaluated
**Then** "Not Ready" is indicated
**And** publish is blocked until resolved

---

### Story 7.8: Draft/Published Separation

As a **Service Designer**,
I want published services to remain unchanged while I modify a draft copy,
So that applicants aren't affected by work-in-progress changes.

**Acceptance Criteria:**

**Given** a service is PUBLISHED
**When** the Service Designer clicks "Edit"
**Then** a DRAFT copy is created automatically
**And** the published version remains active

**Given** a draft copy exists
**When** the Service Designer makes changes
**Then** changes are saved to the draft only
**And** the published version is not affected
**And** applicants continue using the published version

**Given** the draft is ready
**When** the Service Designer publishes it
**Then** the new version replaces the published version
**And** the old published version is archived
**And** transition is atomic (no downtime)

**Given** the Service Designer abandons the draft
**When** they click "Discard Draft"
**Then** the draft is deleted
**And** the published version remains unchanged

---

**Epic 7 Summary:**
- 8 stories created
- FR39-FR46 fully covered
- NFR5, NFR6, NFR20 addressed
- Depends on Epic 1-6 (full service configuration)
- Enables Epic 10 (demo mode uses preview)

---

## Epic 8: User & Access Management

**Goal:** Administrators can manage users, roles, and country-scoped access.

**FRs Covered:** FR48, FR49, FR50, FR51
**NFRs Addressed:** NFR9 (session timeout), NFR10-11 (OAuth/JWT), NFR12 (auth required), NFR15 (tenant isolation)

---

### Story 8.1: Role-Based Access Control Implementation

As a **System Administrator**,
I want role-based access control enforced across the application,
So that users only access features appropriate to their role.

**Acceptance Criteria:**

**Given** the system defines three roles
**When** access is evaluated
**Then** the following roles exist:
  - Service Designer: Create/edit services within scope
  - Country Admin: Manage users, instance settings
  - UNCTAD Support: Cross-instance diagnostics

**Given** a user has a role
**When** they access features
**Then** unauthorized features are hidden or disabled
**And** API endpoints return 403 for unauthorized actions

**Given** role permissions change
**When** the user's next request is processed
**Then** new permissions take effect immediately
**And** session remains valid (no forced logout)

---

### Story 8.2: Country-Scoped Access Control

As a **Service Designer**,
I want to only access services within my authorized country instance,
So that country data remains isolated and secure.

**Acceptance Criteria:**

**Given** a Service Designer is authenticated
**When** they view the service list
**Then** only services from their country are displayed
**And** no cross-country data is visible (NFR15)

**Given** a Service Designer attempts API access
**When** the request targets another country's service
**Then** the API returns 403 Forbidden
**And** the attempt is logged for security audit

**Given** a user has access to multiple countries
**When** they log in
**Then** they can switch between country contexts
**And** each context shows only that country's data

---

### Story 8.3: User Management for Country Admins

As a **Country Admin**,
I want to manage users within my country instance,
So that I can control who has access to configure services.

**Acceptance Criteria:**

**Given** a Country Admin is authenticated
**When** they access User Management
**Then** a list of users in their country is displayed
**And** each user shows: name, email, role, status

**Given** the Country Admin wants to add a user
**When** they click "Add User"
**Then** they can enter user details:
  - Email (must be unique)
  - Name
  - Role (Service Designer or Country Admin)

**Given** a new user is added
**When** the creation is confirmed
**Then** the user receives an invitation email
**And** they can authenticate via Keycloak

**Given** the Country Admin wants to modify a user
**When** they edit user details
**Then** role can be changed
**And** access can be suspended/reactivated

---

### Story 8.4: UNCTAD Support Cross-Instance Access

As a **UNCTAD Support** user,
I want to access services across all country instances,
So that I can provide technical support and diagnostics.

**Acceptance Criteria:**

**Given** a UNCTAD Support user is authenticated
**When** they access the dashboard
**Then** a country selector is available
**And** they can switch between any country instance

**Given** UNCTAD Support accesses a country's services
**When** they view service details
**Then** full configuration is visible (read-only by default)
**And** audit logs show UNCTAD access

**Given** UNCTAD Support needs to modify a service
**When** elevated access is required
**Then** explicit permission must be granted by Country Admin
**And** all changes are logged with UNCTAD user identifier

**Given** UNCTAD Support performs diagnostics
**When** they access system health data
**Then** cross-instance metrics are available
**And** individual country data remains isolated

---

**Epic 8 Summary:**
- 4 stories created
- FR48-FR51 fully covered
- NFR9, NFR10-11, NFR12, NFR15 addressed
- Depends on Epic 1 (Keycloak foundation)
- Independent of service configuration epics

---

## Epic 9: System Administration & Audit

**Goal:** Administrators can track changes, export/import configurations, and manage instance settings.

**FRs Covered:** FR52, FR53, FR54, FR55, FR56, FR57
**NFRs Addressed:** NFR13 (2yr audit retention), NFR30 (Git sync)

---

### Story 9.1: Audit Logging

As a **System**,
I want to log all configuration changes with user, timestamp, and details,
So that changes can be tracked and reviewed for compliance.

**Acceptance Criteria:**

**Given** any configuration change occurs
**When** the change is saved
**Then** an audit log entry is created with:
  - User ID and name
  - Timestamp (ISO 8601)
  - Action type (CREATE, UPDATE, DELETE)
  - Entity type and ID
  - Before/after values (for updates)

**Given** audit logs exist
**When** they are stored
**Then** logs are retained for 2 years (NFR13)
**And** logs are immutable (append-only)

**Given** audit data needs archival
**When** logs exceed 2 years
**Then** they are archived to cold storage
**And** older logs are purged from active database

---

### Story 9.2: Activity Feed

As a **Service Designer**,
I want to view an activity feed of recent changes across services,
So that I can stay informed about team activity.

**Acceptance Criteria:**

**Given** the Service Designer opens the Activity Feed
**When** the feed loads
**Then** recent activities are displayed chronologically
**And** each entry shows: action, user, service, timestamp

**Given** the activity feed is displayed
**When** the Service Designer filters by service
**Then** only activities for that service are shown
**And** filter persists during the session

**Given** the activity feed is displayed
**When** the Service Designer clicks an entry
**Then** details expand showing:
  - Full change description
  - Link to affected configuration
  - Before/after comparison (if applicable)

**Given** new activities occur
**When** the feed is open
**Then** new entries appear in real-time
**And** unread count is displayed

---

### Story 9.3: YAML Export

As a **Service Designer**,
I want to export service configuration as a YAML file,
So that I can backup, version control, or migrate services.

**Acceptance Criteria:**

**Given** a service is selected
**When** the Service Designer clicks "Export"
**Then** a YAML file is generated containing:
  - Service metadata
  - All forms and fields
  - Workflow configuration
  - Determinants and formulas
  - Visibility rules

**Given** the export is generated
**When** the download completes
**Then** the file is named `{service-name}-{version}-{date}.yaml`
**And** the YAML is human-readable and properly formatted

**Given** Git sync is configured (NFR30)
**When** a service is exported
**Then** the YAML can be committed to a Git repository
**And** version history is maintained

---

### Story 9.4: YAML Import

As a **Service Designer**,
I want to import service configuration from a YAML file,
So that I can restore backups or migrate services between instances.

**Acceptance Criteria:**

**Given** the Service Designer clicks "Import"
**When** the import dialog opens
**Then** they can upload a YAML file
**And** drag-and-drop is supported

**Given** a YAML file is uploaded
**When** the file is parsed
**Then** a preview shows what will be imported
**And** conflicts with existing services are highlighted

**Given** the import is confirmed
**When** the service is created/updated
**Then** all configuration is applied
**And** an audit log records the import source

**Given** the import fails
**When** errors are displayed
**Then** specific parsing/validation issues are shown
**And** the user can correct and retry

---

### Story 9.5: Import Validation

As a **System**,
I want to validate imported configurations for schema compliance,
So that invalid configurations don't corrupt the system.

**Acceptance Criteria:**

**Given** a YAML file is being imported
**When** validation runs
**Then** the following checks are performed:
  - Valid YAML syntax
  - Schema version compatibility
  - Required fields present
  - Reference integrity (fields, determinants)

**Given** validation errors are found
**When** results are displayed
**Then** each error shows:
  - Location in YAML
  - Expected vs actual
  - Suggested fix

**Given** validation warnings exist
**When** the user reviews them
**Then** they can proceed with warnings
**And** warnings are logged with import

**Given** validation passes
**When** import proceeds
**Then** no schema violations occur at runtime

---

### Story 9.6: Instance Settings

As a **Country Admin**,
I want to configure instance-level settings like branding and languages,
So that the application reflects my country's identity.

**Acceptance Criteria:**

**Given** a Country Admin accesses Instance Settings
**When** the settings page loads
**Then** configurable options include:
  - Instance name
  - Logo upload
  - Primary color scheme
  - Available languages

**Given** branding is configured
**When** settings are saved
**Then** the application reflects new branding
**And** all users see updated appearance

**Given** languages are configured
**When** a language is enabled/disabled
**Then** the language selector is updated
**And** translation files are loaded/unloaded

**Given** settings are modified
**When** saved
**Then** an audit log records the change
**And** previous settings can be viewed in history

---

**Epic 9 Summary:**
- 6 stories created
- FR52-FR57 fully covered
- NFR13, NFR30 addressed
- Depends on Epic 1, Epic 2 (content to audit/export)
- Independent of other epics

---

## Epic 10: Demo & Live Collaboration

**Goal:** Service Designers can safely demo services to stakeholders and make live changes.

**FRs Covered:** FR58, FR59, FR60
**NFRs Addressed:** None specific

---

### Story 10.1: Demo Mode

As a **Service Designer**,
I want to enter Demo Mode for safe presentation of services,
So that I can show stakeholders without affecting production.

**Acceptance Criteria:**

**Given** a service is selected
**When** the Service Designer clicks "Enter Demo Mode"
**Then** a sandboxed environment is created
**And** all changes are isolated from production

**Given** Demo Mode is active
**When** the UI is displayed
**Then** a prominent "DEMO" indicator is shown
**And** the indicator distinguishes from production view

**Given** Demo Mode is active
**When** the Service Designer navigates
**Then** all preview features are available
**And** applicant journey can be simulated

**Given** the presentation is complete
**When** the Service Designer exits Demo Mode
**Then** all demo changes are discarded
**And** production state is unchanged

---

### Story 10.2: Live Configuration Changes

As a **Service Designer**,
I want to make live configuration changes during stakeholder meetings,
So that I can incorporate feedback in real-time.

**Acceptance Criteria:**

**Given** Demo Mode is active
**When** the Service Designer makes configuration changes
**Then** changes are visible immediately in the demo
**And** stakeholders see updates in real-time

**Given** changes are made in demo
**When** the Service Designer edits a form field
**Then** the form preview updates immediately
**And** changes are not saved to production

**Given** changes are made in demo
**When** the Service Designer modifies workflow
**Then** the workflow diagram updates
**And** simulation reflects new transitions

**Given** beneficial changes are made
**When** the Service Designer wants to keep them
**Then** they can "Apply to Draft" before exiting
**And** changes are saved to the draft version (not published)

---

### Story 10.3: Demo Changes Isolation

As a **Service Designer**,
I want changes made in demo mode isolated from production,
So that experimental changes don't affect live services.

**Acceptance Criteria:**

**Given** Demo Mode is active
**When** changes are made
**Then** they exist only in the demo session
**And** no database writes occur to production tables

**Given** Demo Mode is exited without saving
**When** the session ends
**Then** all changes are discarded
**And** the next demo session starts fresh

**Given** Demo Mode is used by multiple users
**When** they demo the same service simultaneously
**Then** each user has their own isolated session
**And** changes don't conflict between sessions

**Given** the browser is closed during demo
**When** the user returns
**Then** the demo session is terminated
**And** no orphan demo data remains

---

**Epic 10 Summary:**
- 3 stories created
- FR58-FR60 fully covered
- Depends on Epic 1-7 (preview capability)
- Enables stakeholder presentations

---

## Epic 11: Reliability & Accessibility

**Goal:** All users have a reliable, accessible, and error-free experience.

**FRs Covered:** FR61, FR62, FR65, FR66
**NFRs Addressed:** NFR16-19 (reliability), NFR21-26 (accessibility), NFR35-37 (browser/device)

---

### Story 11.1: Detailed Error Messages

As a **Service Designer**,
I want detailed error messages when configuration validation fails,
So that I can quickly identify and fix problems.

**Acceptance Criteria:**

**Given** a validation error occurs
**When** the error is displayed
**Then** the message includes:
  - What went wrong (specific issue)
  - Where it happened (field/section/step)
  - How to fix it (suggested action)

**Given** multiple errors exist
**When** displayed to the user
**Then** errors are grouped by component
**And** severity is indicated (error, warning, info)

**Given** an error message is shown
**When** the user clicks on it
**Then** navigation jumps to the problem location
**And** the field/section is highlighted

**Given** technical errors occur
**When** displayed to non-technical users
**Then** jargon is avoided
**And** actionable guidance is provided

---

### Story 11.2: Auto-Save Draft Configurations

As a **Service Designer**,
I want draft configurations auto-saved periodically,
So that I don't lose work due to browser crashes or disconnections.

**Acceptance Criteria:**

**Given** the Service Designer is editing a service
**When** changes are made
**Then** auto-save triggers every 30 seconds (NFR5)
**And** a "Saving..." indicator appears briefly

**Given** auto-save is in progress
**When** the save completes
**Then** a timestamp shows "Last saved: [time]"
**And** success rate is 99.9% (NFR20)

**Given** auto-save fails
**When** the error is detected
**Then** the user is notified
**And** manual save is suggested
**And** local backup is attempted

**Given** the browser crashes
**When** the user returns
**Then** the last auto-saved state is restored
**And** a recovery prompt is shown

---

### Story 11.3: Keyboard Navigation

As a **User with accessibility needs**,
I want all configuration functions accessible via keyboard navigation,
So that I can use the application without a mouse.

**Acceptance Criteria:**

**Given** any interactive element
**When** the user navigates with Tab
**Then** focus moves in logical order
**And** focus indicators are visible (NFR26)

**Given** a form field is focused
**When** the user presses Enter
**Then** the expected action is triggered
**And** keyboard shortcuts are consistent

**Given** a modal dialog opens
**When** keyboard navigation is used
**Then** focus is trapped within the modal
**And** Escape closes the modal

**Given** complex components (drag-drop, tree views)
**When** keyboard alternatives are needed
**Then** arrow keys navigate within the component
**And** space/enter activates selections

---

### Story 11.4: Change Impact Analysis

As a **Service Designer**,
I want to view impact analysis before saving changes to published services,
So that I understand how changes affect existing applications.

**Acceptance Criteria:**

**Given** a published service has a draft with changes
**When** the Service Designer previews the publish
**Then** an impact analysis is displayed:
  - Number of active applications affected
  - Specific changes summarized
  - Risk assessment (low/medium/high)

**Given** form fields are removed
**When** impact analysis runs
**Then** warning shows data that will become orphaned
**And** the Service Designer can choose to proceed or reconsider

**Given** workflow changes affect routing
**When** impact analysis runs
**Then** in-flight applications are identified
**And** transition plan is suggested

**Given** the analysis is reviewed
**When** the Service Designer proceeds
**Then** they acknowledge the impact
**And** the decision is logged for audit

---

### Story 11.5: WCAG 2.1 AA Compliance

As a **User with disabilities**,
I want the application to meet WCAG 2.1 Level AA standards,
So that I can use it with assistive technologies.

**Acceptance Criteria:**

**Given** any text content
**When** displayed against a background
**Then** color contrast ratio is at least 4.5:1 (NFR23)
**And** large text has at least 3:1 ratio

**Given** interactive elements
**When** rendered
**Then** ARIA labels are present (NFR24)
**And** screen readers announce elements correctly

**Given** information is conveyed
**When** color is used
**Then** additional indicators are provided (NFR25)
**And** color-blind users can distinguish elements

**Given** form fields
**When** rendered
**Then** labels are programmatically associated
**And** error messages reference the field

---

### Story 11.6: Browser & Device Support

As a **User**,
I want the application to work on modern browsers and reasonable connections,
So that I can use it from various locations.

**Acceptance Criteria:**

**Given** supported browsers (NFR35)
**When** the application loads
**Then** it functions correctly on:
  - Chrome (last 2 versions)
  - Firefox (last 2 versions)
  - Safari (last 2 versions)
  - Edge (last 2 versions)

**Given** the application is accessed
**When** screen width is at least 1024px (NFR36)
**Then** all features are fully functional
**And** layout is optimized for desktop configuration work

**Given** network conditions vary
**When** connection speed is 5 Mbps (NFR37)
**Then** the application remains stable
**And** large operations show progress indicators

**Given** unsupported browsers are detected
**When** the user accesses the application
**Then** a clear message explains requirements
**And** upgrade suggestions are provided

---

**Epic 11 Summary:**
- 6 stories created
- FR61, FR62, FR65, FR66 fully covered
- NFR16-19, NFR21-26, NFR35-37 addressed
- Depends on all previous epics (polish layer)
- Completes the MVP feature set

---

## Final Summary

### Story Count by Epic

| Epic | Name | Stories |
|------|------|---------|
| 1 | Project Foundation & Developer Experience | 7 |
| 2 | Service Lifecycle Management | 8 |
| 3 | Form Building & Configuration | 10 |
| 4 | Workflow Configuration | 8 |
| 5 | Determinants & Business Rules | 6 |
| 6 | AI-Powered Service Configuration | 12 |
| 7 | Preview & Publishing | 8 |
| 8 | User & Access Management | 4 |
| 9 | System Administration & Audit | 6 |
| 10 | Demo & Live Collaboration | 3 |
| 11 | Reliability & Accessibility | 6 |
| **Total** | | **78** |

### Requirements Coverage

- **Functional Requirements:** 66 FRs fully covered
- **Non-Functional Requirements:** 37 NFRs addressed
- **Additional Requirements:** All architecture requirements incorporated

### Implementation Order

The epics should be implemented in order (1-11) based on the dependency analysis from Party Mode review:

1. **Foundation (Epic 1)** → Enables all development
2. **Services (Epic 2)** → Core entity for all features
3. **Forms (Epic 3)** → Data collection capability
4. **Workflow (Epic 4)** → Approval chains
5. **Determinants (Epic 5)** → Business rules
6. **AI (Epic 6)** → Generates into existing structures
7. **Preview/Publish (Epic 7)** → Test and deploy
8. **User/Access (Epic 8)** → Can start after Epic 1
9. **Admin/Audit (Epic 9)** → Can start after Epic 2
10. **Demo (Epic 10)** → Requires preview capability
11. **Reliability (Epic 11)** → Polish across all features

### Document Status

- ✅ Step 1: Requirements extracted and validated
- ✅ Step 2: Epics designed and reordered via Party Mode
- ✅ Step 3: All 78 stories created with acceptance criteria
- ✅ Step 4: Final validation completed

### Final Validation Summary

| Validation Check | Status | Details |
|------------------|--------|---------|
| FR Coverage | ✅ PASSED | All 66 FRs mapped to stories |
| Architecture Implementation | ✅ PASSED | Starter template in 1.1, incremental DB |
| Story Quality | ✅ PASSED | All 78 stories single-dev completable |
| Epic Structure | ✅ PASSED | All epics deliver user value |
| Dependency Validation | ✅ PASSED | No forward dependencies |

**This document is ready for development.**

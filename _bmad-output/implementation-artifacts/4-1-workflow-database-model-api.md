# Story 4-1: Workflow Database Model & API

> **Epic**: 4 - Workflow Configuration
> **Story ID**: 4-1
> **Status**: ready-for-dev
> **Created**: 2026-01-01
> **Updated**: 2026-01-01

---

## Story Overview

### User Story

As a **Developer**,
I want Workflow, WorkflowStep, and Transition entities in Prisma with API endpoints,
So that workflow configurations can be persisted and managed.

### Business Context

This story lays the database foundation for Epic 4 (Workflow Configuration). The models defined here directly map to the proven legacy BPA domain model, using the **Role → RoleStatus → WorkflowTransition** pattern that has been battle-tested in production.

**Key insight from spike 4-0**: The legacy system uses "Role" terminology for workflow steps, not "WorkflowStep". We align to this for compatibility while maintaining clarity.

### Value Proposition

- Enables all subsequent Epic 4 stories
- Establishes 4-Status Model as the universal workflow grammar
- Provides API foundation for workflow configuration UI

---

## Acceptance Criteria

### AC1: Prisma Schema - Role Model

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the `Role` model is defined with polymorphic support:
  - `id` (cuid, primary key)
  - `serviceId` (foreign key to Service, cascade delete)
  - `roleType` (enum: USER | BOT)
  - `name` (unique per service)
  - `shortName` (optional)
  - `description` (optional, text)
  - `isStartRole` (boolean, default false)
  - `sortOrder` (int, default 100)
  - `isActive` (boolean, default true)
  - `conditions` (JSON, nullable)
  - UserRole-specific: `formId` (optional FK to Form)
  - BotRole-specific: `retryEnabled`, `retryIntervalMinutes`, `timeoutMinutes`
  - `createdAt`, `updatedAt`

### AC2: Prisma Schema - RoleStatus Model

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the `RoleStatus` model is defined:
  - `id` (cuid, primary key)
  - `roleId` (foreign key to Role, cascade delete)
  - `code` (enum: PENDING=0, PASSED=1, RETURNED=2, REJECTED=3)
  - `name` (display name)
  - `isDefault` (boolean, default false)
  - `sortOrder` (int)
  - `conditions` (JSON, nullable)
  - `createdAt`, `updatedAt`

### AC3: Prisma Schema - WorkflowTransition Model

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the `WorkflowTransition` model is defined:
  - `id` (cuid, primary key)
  - `fromStatusId` (foreign key to RoleStatus, cascade delete)
  - `toRoleId` (foreign key to Role, cascade delete)
  - `sortOrder` (int)
  - `conditions` (JSON, nullable)
  - `createdAt`, `updatedAt`
  - Unique constraint on `[fromStatusId, toRoleId]`

### AC4: Required Enums

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the following enums are defined:
```prisma
enum RoleType {
  USER
  BOT
}

enum RoleStatusCode {
  PENDING   // 0 - Waiting for decision
  PASSED    // 1 - Approved, moves forward
  RETURNED  // 2 - Sent back for fixes
  REJECTED  // 3 - Permanently rejected
}
```

### AC5: Roles API Module

**Given** the API module for workflows exists at `apps/api/src/modules/workflows/`
**When** the developer inspects the module
**Then** endpoints are available:
  - `POST /api/services/:serviceId/roles` - Create role
  - `GET /api/services/:serviceId/roles` - List roles (sorted by sortOrder)
  - `GET /api/roles/:roleId` - Get single role
  - `PATCH /api/roles/:roleId` - Update role
  - `DELETE /api/roles/:roleId` - Delete role

### AC6: Role Status API Endpoints

**Given** the workflows API module
**When** the developer inspects role status endpoints
**Then** endpoints are available:
  - `POST /api/roles/:roleId/statuses` - Create status
  - `GET /api/roles/:roleId/statuses` - List statuses
  - `PATCH /api/role-statuses/:statusId` - Update status
  - `DELETE /api/role-statuses/:statusId` - Delete status

### AC7: Workflow Transition API Endpoints

**Given** the workflows API module
**When** the developer inspects transition endpoints
**Then** endpoints are available:
  - `POST /api/role-statuses/:statusId/transitions` - Create transition
  - `GET /api/role-statuses/:statusId/transitions` - List transitions
  - `DELETE /api/transitions/:transitionId` - Delete transition

### AC8: Cascade Delete Behavior

**Given** a service with roles, statuses, and transitions
**When** the service is deleted
**Then** all associated roles are cascade deleted
**And** all role statuses are cascade deleted
**And** all workflow transitions are cascade deleted

### AC9: Validation - Role Name Uniqueness

**Given** a service with existing roles
**When** creating a role with a duplicate name
**Then** a 409 Conflict is returned
**And** error message indicates name collision

### AC10: Migration Generation

**Given** the schema changes are complete
**When** `pnpm db:migrate dev` is run
**Then** migration files are generated successfully
**And** database schema is updated

---

## Technical Requirements

### Prisma Schema Changes

Add to `packages/db/prisma/schema.prisma`:

```prisma
// =============================================================================
// Workflow Enums
// =============================================================================

/// RoleType - discriminator for Role polymorphism
enum RoleType {
  USER  // Human decision point (operator/approver)
  BOT   // Automated processing (integrations)
}

/// RoleStatusCode - 4-Status Model (FIXED, non-negotiable)
enum RoleStatusCode {
  PENDING   // 0 - Waiting for decision
  PASSED    // 1 - Approved, moves forward
  RETURNED  // 2 - Sent back for fixes (can retry)
  REJECTED  // 3 - Permanently rejected (terminal)
}

// =============================================================================
// Workflow Models
// =============================================================================

/// Role - workflow step (polymorphic via roleType)
/// Represents a processing point in the workflow - either human (USER) or automated (BOT)
model Role {
  id              String       @id @default(cuid())
  serviceId       String       @map("service_id")
  roleType        RoleType     @map("role_type")
  name            String       @db.VarChar(255)
  shortName       String?      @map("short_name") @db.VarChar(50)
  description     String?      @db.Text
  isStartRole     Boolean      @default(false) @map("is_start_role")
  sortOrder       Int          @default(100) @map("sort_order")
  isActive        Boolean      @default(true) @map("is_active")
  conditions      Json?        // Determinant-based activation conditions
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  // UserRole-specific fields (nullable, applies only when roleType = USER)
  formId          String?      @map("form_id")

  // BotRole-specific fields (nullable, applies only when roleType = BOT)
  retryEnabled    Boolean?     @default(false) @map("retry_enabled")
  retryIntervalMinutes Int?    @map("retry_interval_minutes")
  timeoutMinutes  Int?         @map("timeout_minutes")

  // Relations
  service         Service      @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  form            Form?        @relation(fields: [formId], references: [id], onDelete: SetNull)
  statuses        RoleStatus[]
  incomingTransitions WorkflowTransition[] @relation("TransitionTarget")

  @@unique([serviceId, name])
  @@index([serviceId])
  @@index([roleType])
  @@index([sortOrder])
  @@index([isActive])
  @@map("roles")
}

/// RoleStatus - workflow outcome options (4-Status Model)
/// Each role has 1-4 status options representing possible decisions
model RoleStatus {
  id              String          @id @default(cuid())
  roleId          String          @map("role_id")
  code            RoleStatusCode
  name            String          @db.VarChar(100)
  isDefault       Boolean         @default(false) @map("is_default")
  sortOrder       Int             @default(0) @map("sort_order")
  conditions      Json?           // When to show this status option
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  // Relations
  role            Role            @relation(fields: [roleId], references: [id], onDelete: Cascade)
  transitions     WorkflowTransition[] @relation("FromStatus")

  @@index([roleId])
  @@index([code])
  @@map("role_statuses")
}

/// WorkflowTransition - routing from status outcome to next role
/// Defines where the workflow goes after a role produces a status
model WorkflowTransition {
  id              String       @id @default(cuid())
  fromStatusId    String       @map("from_status_id")
  toRoleId        String       @map("to_role_id")
  sortOrder       Int          @default(0) @map("sort_order")
  conditions      Json?        // Conditional routing
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  // Relations
  fromStatus      RoleStatus   @relation("FromStatus", fields: [fromStatusId], references: [id], onDelete: Cascade)
  toRole          Role         @relation("TransitionTarget", fields: [toRoleId], references: [id], onDelete: Cascade)

  @@unique([fromStatusId, toRoleId])
  @@index([fromStatusId])
  @@index([toRoleId])
  @@map("workflow_transitions")
}
```

### Required Relation Updates

Add to `Service` model:
```prisma
model Service {
  // ... existing fields ...
  roles         Role[]
}
```

Add to `Form` model:
```prisma
model Form {
  // ... existing fields ...
  roles         Role[]
}
```

### NestJS Module Structure

Create `apps/api/src/modules/workflows/`:
```
workflows/
├── workflows.module.ts
├── roles/
│   ├── roles.controller.ts
│   ├── roles.service.ts
│   └── dto/
│       ├── create-role.dto.ts
│       ├── update-role.dto.ts
│       └── role.response.ts
├── role-statuses/
│   ├── role-statuses.controller.ts
│   ├── role-statuses.service.ts
│   └── dto/
│       ├── create-role-status.dto.ts
│       ├── update-role-status.dto.ts
│       └── role-status.response.ts
├── transitions/
│   ├── transitions.controller.ts
│   ├── transitions.service.ts
│   └── dto/
│       ├── create-transition.dto.ts
│       └── transition.response.ts
└── index.ts
```

### API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/services/:serviceId/roles` | Create role |
| GET | `/api/services/:serviceId/roles` | List roles |
| GET | `/api/roles/:roleId` | Get role |
| PATCH | `/api/roles/:roleId` | Update role |
| DELETE | `/api/roles/:roleId` | Delete role |
| POST | `/api/roles/:roleId/statuses` | Create status |
| GET | `/api/roles/:roleId/statuses` | List statuses |
| PATCH | `/api/role-statuses/:statusId` | Update status |
| DELETE | `/api/role-statuses/:statusId` | Delete status |
| POST | `/api/role-statuses/:statusId/transitions` | Create transition |
| GET | `/api/role-statuses/:statusId/transitions` | List transitions |
| DELETE | `/api/transitions/:transitionId` | Delete transition |

### DTO Patterns

Follow existing patterns from `services/` and `forms/` modules:

```typescript
// create-role.dto.ts
import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, Min, MaxLength } from 'class-validator';
import { RoleType } from '@repo/db';

export class CreateRoleDto {
  @IsEnum(RoleType)
  roleType: RoleType;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  shortName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isStartRole?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  // UserRole fields
  @IsOptional()
  @IsString()
  formId?: string;

  // BotRole fields
  @IsOptional()
  @IsBoolean()
  retryEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  retryIntervalMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  timeoutMinutes?: number;
}
```

---

## Developer Notes

### Domain Context from Spike 4-0

**Terminology Mapping:**
- Legacy "Role" = Our "Role" (workflow step)
- Legacy "RoleStatus" = Our "RoleStatus" (step outcome)
- Legacy "RoleStatusDestination" = Our "WorkflowTransition" (routing)

**4-Status Model is FIXED:**
```
PENDING  (0) → Waiting for decision
PASSED   (1) → Approved, moves forward
RETURNED (2) → Sent back for fixes (can retry)
REJECTED (3) → Permanently rejected (terminal)
```

### What NOT to Implement in This Story

- Bot/BotMapping models (deferred to 4-4)
- RoleRegistration binding (4-10, deferrable)
- RoleInstitution assignment (4-11, deferrable)
- Workflow validation logic (4-8, deferrable)
- UI components (separate stories)

### Architecture Patterns to Follow

1. **Module Pattern**: Follow existing `services/` and `forms/` structure
2. **Controller Pattern**: Use `@ApiTags()`, `@ApiBearerAuth()`, OpenAPI decorators
3. **Service Pattern**: Inject `PrismaService`, use transactions where needed
4. **DTO Pattern**: class-validator + class-transformer
5. **Error Handling**: Use `NotFoundException`, `ConflictException` for 409

### Testing Requirements

- Unit tests for services with mocked Prisma
- E2E tests for API endpoints
- Test cascade delete behavior
- Test unique constraint violations

### Migration Notes

Run after schema changes:
```bash
cd packages/db
pnpm prisma migrate dev --name add-workflow-models
```

---

## Dependencies

### Blocking Dependencies
- Epic 1: Project Foundation ✅ (done)
- Epic 2: Service Lifecycle ✅ (done)
- Epic 3: Form Building ✅ (done)
- Story 4-0: Workflow Spike ✅ (done)

### Non-Blocking Dependencies
- None

---

## Definition of Done

- [ ] Prisma schema includes Role, RoleStatus, WorkflowTransition models
- [ ] RoleType and RoleStatusCode enums defined
- [ ] Migration generated and applied
- [ ] Roles controller with CRUD endpoints
- [ ] RoleStatuses controller with CRUD endpoints
- [ ] Transitions controller with CRD endpoints
- [ ] DTOs with validation for all endpoints
- [ ] OpenAPI documentation (Swagger) for all endpoints
- [ ] Unit tests for services (≥80% coverage)
- [ ] E2E tests for API endpoints
- [ ] Cascade delete verified
- [ ] Unique constraint errors return 409
- [ ] Sprint status updated to "done"

---

## Tasks/Subtasks

### Task 1: Add Workflow Enums to Prisma Schema
- [ ] Add `RoleType` enum (USER, BOT)
- [ ] Add `RoleStatusCode` enum (PENDING, PASSED, RETURNED, REJECTED)

### Task 2: Add Role Model to Prisma Schema
- [ ] Create `Role` model with all fields per AC1
- [ ] Add relation to Service (cascade delete)
- [ ] Add relation to Form (set null on delete)
- [ ] Add unique constraint on [serviceId, name]
- [ ] Add indexes for serviceId, roleType, sortOrder, isActive

### Task 3: Add RoleStatus Model to Prisma Schema
- [ ] Create `RoleStatus` model with all fields per AC2
- [ ] Add relation to Role (cascade delete)
- [ ] Add indexes for roleId, code

### Task 4: Add WorkflowTransition Model to Prisma Schema
- [ ] Create `WorkflowTransition` model with all fields per AC3
- [ ] Add relations to RoleStatus and Role (cascade delete)
- [ ] Add unique constraint on [fromStatusId, toRoleId]
- [ ] Add indexes for fromStatusId, toRoleId

### Task 5: Update Existing Models with Role Relations
- [ ] Add `roles` relation to Service model
- [ ] Add `roles` relation to Form model

### Task 6: Generate and Apply Migration
- [ ] Run `pnpm prisma migrate dev --name add-workflow-models`
- [ ] Verify migration applied successfully
- [ ] Regenerate Prisma client

### Task 7: Create Workflows Module Structure
- [ ] Create `apps/api/src/modules/workflows/` directory
- [ ] Create `workflows.module.ts`
- [ ] Create roles/, role-statuses/, transitions/ subdirectories
- [ ] Create index.ts for module exports

### Task 8: Implement Roles Service and Controller
- [ ] Create `roles.service.ts` with CRUD operations
- [ ] Create `roles.controller.ts` with endpoints per AC5
- [ ] Create DTOs: create-role.dto.ts, update-role.dto.ts, role.response.ts
- [ ] Add 409 Conflict handling for duplicate names per AC9

### Task 9: Implement Role Statuses Service and Controller
- [ ] Create `role-statuses.service.ts` with CRUD operations
- [ ] Create `role-statuses.controller.ts` with endpoints per AC6
- [ ] Create DTOs: create-role-status.dto.ts, update-role-status.dto.ts, role-status.response.ts

### Task 10: Implement Transitions Service and Controller
- [ ] Create `transitions.service.ts` with CRD operations
- [ ] Create `transitions.controller.ts` with endpoints per AC7
- [ ] Create DTOs: create-transition.dto.ts, transition.response.ts

### Task 11: Register Workflows Module in App
- [ ] Import WorkflowsModule in app.module.ts
- [ ] Verify OpenAPI/Swagger docs are generated

### Task 12: Write Unit Tests
- [ ] Create `roles.service.spec.ts` with mocked Prisma
- [ ] Create `role-statuses.service.spec.ts` with mocked Prisma
- [ ] Create `transitions.service.spec.ts` with mocked Prisma
- [ ] Test unique constraint violation returns 409

### Task 13: Write E2E Tests
- [ ] Create `roles.e2e-spec.ts` for CRUD endpoints
- [ ] Create `role-statuses.e2e-spec.ts` for CRUD endpoints
- [ ] Create `transitions.e2e-spec.ts` for CRD endpoints
- [ ] Test cascade delete behavior per AC8

---

## Dev Agent Record

### Implementation Plan
<!-- To be filled during development -->

### Debug Log
<!-- To be filled during development -->

### Completion Notes
<!-- To be filled at completion -->

---

## File List

### New Files
<!-- To be filled during development -->

### Modified Files
<!-- To be filled during development -->

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-01 | Story created | SM Agent |

---

## References

- Spike findings: `_bmad-output/implementation-artifacts/4-0-spike-findings.md`
- Architecture: `_bmad-output/architecture.md`
- Legacy model: `../BPA-backend/src/main/java/org/unctad/ereg/bpa/model/role/`
- Domain analysis: `_bmad-output/analysis/bpa-api-mental-model-analysis.md`

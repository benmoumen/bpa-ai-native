# Story 4.10: Role-Registration Binding

> **Epic**: 4 - Workflow Configuration
> **Story ID**: 4-10
> **Status**: done
> **Priority**: Deferrable (N:N binding for multi-registration services)
> **Effort**: 5-8 points
> **Created**: 2026-01-01

---

## Story

As a **Service Designer**,
I want to bind workflow roles to specific registrations,
So that each registration type has its own processing path.

---

## Acceptance Criteria

### AC1: View Registration Bindings

**Given** a workflow role is selected
**When** the Service Designer opens the Registration Binding panel
**Then** all registrations in the service are listed
**And** currently bound registrations are checked

### AC2: Bind Registration to Role

**Given** the Service Designer binds a registration to a role
**When** they check a registration
**Then** a `RoleRegistration` link is created
**And** `finalResultIssued` defaults to false

### AC3: Final Approver Role

**Given** a role can issue final results
**When** the Service Designer marks it as "Final Approver"
**Then** `finalResultIssued` is set to true
**And** the role's PASSED/REJECTED statuses become terminal for that registration

### AC4: Validation for Unbound Registrations

**Given** a registration has no roles bound
**When** the workflow is validated
**Then** a warning is displayed: "Registration has no processing roles"

### AC5: Multi-Registration Support

**Given** multiple registrations are bound to a role
**When** applications are processed
**Then** the role handles all bound registration types
**And** status transitions apply per registration context

---

## Tasks / Subtasks

- [x] **Task 1: Add RoleRegistration model** (AC: 1, 2, 3)
  - [x] 1.1 Add `RoleRegistration` model to schema.prisma
  - [x] 1.2 Add relations to Role and Registration models
  - [x] 1.3 Include `finalResultIssued` boolean field
  - [x] 1.4 Run migration

- [x] **Task 2: Create RoleRegistration DTOs** (AC: 1, 2, 3)
  - [x] 2.1 Add `role-registration.dto.ts` with create/update/response DTOs
  - [x] 2.2 Export from dto/index.ts

- [x] **Task 3: Create RoleRegistrationService** (AC: 1, 2, 3)
  - [x] 3.1 Add `role-registrations.service.ts`
  - [x] 3.2 Implement getBindingsForRole(roleId)
  - [x] 3.3 Implement bindRegistration(roleId, registrationId, finalResultIssued)
  - [x] 3.4 Implement unbindRegistration(roleId, registrationId)
  - [x] 3.5 Implement updateBinding(id, finalResultIssued)

- [x] **Task 4: Add API endpoints** (AC: 1, 2, 3)
  - [x] 4.1 GET /roles/:roleId/registrations - list bindings
  - [x] 4.2 POST /roles/:roleId/registrations/:registrationId - bind
  - [x] 4.3 DELETE /roles/:roleId/registrations/:registrationId - unbind
  - [x] 4.4 PATCH /role-registrations/:id - update finalResultIssued

- [x] **Task 5: Add validation for unbound registrations** (AC: 4)
  - [x] 5.1 Add `UNBOUND_REGISTRATION` to ValidationIssueCode
  - [x] 5.2 Check all registrations have at least one bound role
  - [x] 5.3 Return warning for each unbound registration

- [x] **Task 6: Build RegistrationBindingPanel component** (AC: 1, 2, 3)
  - [x] 6.1 Create `RegistrationBindingPanel.tsx`
  - [x] 6.2 List all registrations with checkboxes
  - [x] 6.3 Show "Final Approver" toggle for bound registrations
  - [x] 6.4 Add save/cancel actions

- [x] **Task 7: Integrate into role edit UI** (AC: 1-5)
  - [x] 7.1 Add RegistrationBindingPanel to RolesList expanded view
  - [x] 7.2 Add useRoleRegistrations hook
  - [x] 7.3 Update role detail view

---

## Dev Notes

### RoleRegistration Model

```prisma
model RoleRegistration {
  id                String   @id @default(cuid())
  roleId            String   @map("role_id")
  registrationId    String   @map("registration_id")
  finalResultIssued Boolean  @default(false) @map("final_result_issued")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  role         Role         @relation(fields: [roleId], references: [id], onDelete: Cascade)
  registration Registration @relation(fields: [registrationId], references: [id], onDelete: Cascade)

  @@unique([roleId, registrationId])
  @@index([roleId])
  @@index([registrationId])
  @@map("role_registrations")
}
```

### API Response Shape

```typescript
interface RoleRegistrationDto {
  id: string;
  roleId: string;
  registrationId: string;
  registrationName: string;
  registrationKey: string;
  finalResultIssued: boolean;
  createdAt: string;
}
```

### Project Structure

```
packages/db/prisma/
└── schema.prisma                        # MODIFIED: Add RoleRegistration

apps/api/src/
├── roles/
│   ├── dto/
│   │   └── role-registration.dto.ts     # NEW
│   ├── role-registrations.service.ts    # NEW
│   ├── role-registrations.controller.ts # NEW
│   ├── roles.module.ts                  # MODIFIED
│   └── workflow-validation.service.ts   # MODIFIED: Add unbound check

apps/web/src/
├── components/workflow/
│   ├── RegistrationBindingPanel.tsx     # NEW
│   └── index.ts                         # MODIFIED
├── lib/api/
│   └── role-registrations.ts            # NEW
└── hooks/
    └── use-role-registrations.ts        # NEW
```

### References

- [Domain Model: N:N Role-Registration](../../CLAUDE.md#key-relationships)
- [Story 4.8: Workflow Validation](./4-8-workflow-validation.md)
- [Source: epics.md#Story-4.10](_bmad-output/project-planning-artifacts/epics.md)

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (create-story workflow)

### Completion Notes List

- Story file created from Epic 4 context
- RoleRegistration is N:N join table with finalResultIssued flag
- Integrates with existing workflow validation
- Follows existing roles module patterns

### File List

**Database**:
- `packages/db/prisma/schema.prisma` - MODIFIED: Add RoleRegistration model

**Backend (API)**:
- `apps/api/src/roles/dto/role-registration.dto.ts` - NEW
- `apps/api/src/roles/dto/index.ts` - MODIFIED
- `apps/api/src/roles/role-registrations.service.ts` - NEW
- `apps/api/src/roles/role-registrations.controller.ts` - NEW
- `apps/api/src/roles/roles.module.ts` - MODIFIED
- `apps/api/src/roles/workflow-validation.service.ts` - MODIFIED

**Frontend (Web)**:
- `apps/web/src/components/workflow/RegistrationBindingPanel.tsx` - NEW
- `apps/web/src/components/workflow/index.ts` - MODIFIED
- `apps/web/src/lib/api/role-registrations.ts` - NEW
- `apps/web/src/hooks/use-role-registrations.ts` - NEW

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-01 | Story created by create-story workflow |

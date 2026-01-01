# Story 4.11: Role-Institution Assignment

> **Epic**: 4 - Workflow Configuration
> **Story ID**: 4-11
> **Status**: ready-for-dev
> **Priority**: Deferrable (Phase 2 - required for publishing)
> **Effort**: 5-8 points
> **Created**: 2026-01-01

---

## Story

As a **Service Designer**,
I want to assign institutions to workflow roles,
So that the service can be published and roles know which org handles them.

---

## Acceptance Criteria

### AC1: View Available Institutions

**Given** a workflow role is selected
**When** the Service Designer opens the Institution Assignment panel
**Then** available institutions are listed
**And** currently assigned institutions are highlighted

### AC2: Assign Institution to Role

**Given** the Service Designer assigns an institution
**When** they select from the list
**Then** a `RoleInstitution` link is created
**And** the role displays the institution badge

### AC3: Validation for Unassigned Roles

**Given** a role has no institution assigned
**When** the service is validated for publishing
**Then** an error blocks publishing: "Role requires institution assignment"

### AC4: Multi-Institution Support

**Given** multiple institutions are assigned to a role
**When** applications are processed
**Then** any operator from those institutions can process
**And** institution context is tracked in audit log

### AC5: Publishing Gate

**Given** all roles have institution assignments
**When** the service publish is attempted
**Then** validation passes for role assignments
**And** the service can proceed to final publishing checks

---

## Tasks / Subtasks

- [ ] **Task 1: Add Institution model** (AC: 1, 2)
  - [ ] 1.1 Add `Institution` model to schema.prisma
  - [ ] 1.2 Add basic fields: name, code, country, isActive
  - [ ] 1.3 Run migration

- [ ] **Task 2: Add RoleInstitution join model** (AC: 2, 4)
  - [ ] 2.1 Add `RoleInstitution` N:N model to schema.prisma
  - [ ] 2.2 Add relations to Role and Institution
  - [ ] 2.3 Run migration

- [ ] **Task 3: Create Institution DTOs** (AC: 1, 2)
  - [ ] 3.1 Add `institution.dto.ts` with create/update/response DTOs
  - [ ] 3.2 Add `role-institution.dto.ts` for assignments
  - [ ] 3.3 Export from dto/index.ts

- [ ] **Task 4: Create InstitutionsService** (AC: 1, 2)
  - [ ] 4.1 Add `institutions.service.ts`
  - [ ] 4.2 Implement CRUD for institutions
  - [ ] 4.3 Implement seed/fixture for demo institutions

- [ ] **Task 5: Create RoleInstitutionsService** (AC: 1, 2, 4)
  - [ ] 5.1 Add `role-institutions.service.ts`
  - [ ] 5.2 Implement getInstitutionsForRole(roleId)
  - [ ] 5.3 Implement assignInstitution(roleId, institutionId)
  - [ ] 5.4 Implement unassignInstitution(roleId, institutionId)

- [ ] **Task 6: Add API endpoints** (AC: 1, 2, 4)
  - [ ] 6.1 GET /institutions - list all institutions
  - [ ] 6.2 GET /roles/:roleId/institutions - list assignments
  - [ ] 6.3 POST /roles/:roleId/institutions/:institutionId - assign
  - [ ] 6.4 DELETE /roles/:roleId/institutions/:institutionId - unassign

- [ ] **Task 7: Add validation for unassigned roles** (AC: 3, 5)
  - [ ] 7.1 Add `UNASSIGNED_INSTITUTION` to ValidationIssueCode
  - [ ] 7.2 Check all UserRoles have at least one institution
  - [ ] 7.3 Return error for roles without institutions

- [ ] **Task 8: Build InstitutionAssignmentPanel component** (AC: 1, 2)
  - [ ] 8.1 Create `InstitutionAssignmentPanel.tsx`
  - [ ] 8.2 List all institutions with checkboxes
  - [ ] 8.3 Show assigned institutions with badges
  - [ ] 8.4 Add assign/unassign actions

- [ ] **Task 9: Integrate into role edit UI** (AC: 1-5)
  - [ ] 9.1 Add InstitutionAssignmentPanel to RolesList expanded view
  - [ ] 9.2 Add useRoleInstitutions hook
  - [ ] 9.3 Show institution badges on role row

---

## Dev Notes

### Institution Model

```prisma
model Institution {
  id        String   @id @default(cuid())
  name      String
  code      String   @unique
  country   String?
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  roles RoleInstitution[]

  @@index([country])
  @@map("institutions")
}
```

### RoleInstitution Model

```prisma
model RoleInstitution {
  id            String   @id @default(cuid())
  roleId        String   @map("role_id")
  institutionId String   @map("institution_id")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  role        Role        @relation(fields: [roleId], references: [id], onDelete: Cascade)
  institution Institution @relation(fields: [institutionId], references: [id], onDelete: Cascade)

  @@unique([roleId, institutionId])
  @@index([roleId])
  @@index([institutionId])
  @@map("role_institutions")
}
```

### API Response Shape

```typescript
interface InstitutionDto {
  id: string;
  name: string;
  code: string;
  country?: string;
  isActive: boolean;
}

interface RoleInstitutionDto {
  id: string;
  roleId: string;
  institutionId: string;
  institutionName: string;
  institutionCode: string;
  createdAt: string;
}
```

### Project Structure

```
packages/db/prisma/
└── schema.prisma                         # MODIFIED: Add Institution, RoleInstitution

apps/api/src/
├── institutions/                         # NEW MODULE
│   ├── dto/
│   │   └── institution.dto.ts           # NEW
│   ├── institutions.service.ts          # NEW
│   ├── institutions.controller.ts       # NEW
│   └── institutions.module.ts           # NEW
├── roles/
│   ├── dto/
│   │   └── role-institution.dto.ts      # NEW
│   ├── role-institutions.service.ts     # NEW
│   ├── role-institutions.controller.ts  # NEW
│   ├── roles.module.ts                  # MODIFIED
│   └── workflow-validation.service.ts   # MODIFIED: Add unassigned check

apps/web/src/
├── components/workflow/
│   ├── InstitutionAssignmentPanel.tsx   # NEW
│   ├── RolesList.tsx                    # MODIFIED
│   └── index.ts                         # MODIFIED
├── lib/api/
│   ├── institutions.ts                  # NEW
│   └── role-institutions.ts             # NEW
└── hooks/
    ├── use-institutions.ts              # NEW
    └── use-role-institutions.ts         # NEW
```

### Demo Institutions (Seed Data)

```typescript
const demoInstitutions = [
  { code: 'MOC', name: 'Ministry of Commerce', country: 'GN' },
  { code: 'MOF', name: 'Ministry of Finance', country: 'GN' },
  { code: 'CUS', name: 'Customs Authority', country: 'GN' },
  { code: 'ENV', name: 'Environmental Agency', country: 'GN' },
  { code: 'TAX', name: 'Tax Authority', country: 'GN' },
];
```

### References

- [Domain Model: N:N Role-Institution](../../CLAUDE.md#key-relationships)
- [Story 4.10: Role-Registration Binding](./4-10-role-registration-binding.md)
- [Source: epics.md#Story-4.11](_bmad-output/project-planning-artifacts/epics.md)

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (create-story workflow)

### Completion Notes List

- Story file created from Epic 4 context
- RoleInstitution is N:N join table for role assignments
- Institution entity is global (shared across services)
- Validation blocks publishing without assignments
- Follows pattern from Story 4-10 (Role-Registration Binding)

### File List

**Database**:
- `packages/db/prisma/schema.prisma` - MODIFIED: Add Institution, RoleInstitution models

**Backend (API)**:
- `apps/api/src/institutions/dto/institution.dto.ts` - NEW
- `apps/api/src/institutions/institutions.service.ts` - NEW
- `apps/api/src/institutions/institutions.controller.ts` - NEW
- `apps/api/src/institutions/institutions.module.ts` - NEW
- `apps/api/src/roles/dto/role-institution.dto.ts` - NEW
- `apps/api/src/roles/dto/index.ts` - MODIFIED
- `apps/api/src/roles/role-institutions.service.ts` - NEW
- `apps/api/src/roles/role-institutions.controller.ts` - NEW
- `apps/api/src/roles/roles.module.ts` - MODIFIED
- `apps/api/src/roles/workflow-validation.service.ts` - MODIFIED
- `apps/api/src/app.module.ts` - MODIFIED

**Frontend (Web)**:
- `apps/web/src/components/workflow/InstitutionAssignmentPanel.tsx` - NEW
- `apps/web/src/components/workflow/RolesList.tsx` - MODIFIED
- `apps/web/src/components/workflow/index.ts` - MODIFIED
- `apps/web/src/lib/api/institutions.ts` - NEW
- `apps/web/src/lib/api/role-institutions.ts` - NEW
- `apps/web/src/hooks/use-institutions.ts` - NEW
- `apps/web/src/hooks/use-role-institutions.ts` - NEW

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-01 | Story created by create-story workflow |

# Story 4.8: Workflow Validation

> **Epic**: 4 - Workflow Configuration
> **Story ID**: 4-8
> **Status**: done
> **Priority**: Deferrable (Validation before publishing)
> **Effort**: 5-8 points
> **Created**: 2026-01-01

---

## Story

As a **System**,
I want to validate workflow configuration for completeness,
So that no dead ends or unreachable steps exist.

---

## Acceptance Criteria

### AC1: Validate Workflow Structure

**Given** a workflow is configured
**When** the Service Designer clicks "Validate"
**Then** the system checks for:
- At least one start step (isStartRole = true, no incoming transitions)
- At least one end step (no outgoing transitions or terminal action)
- All steps are reachable from start
- No orphan steps (disconnected from the flow)

### AC2: Display Validation Errors

**Given** validation errors are found
**When** results are displayed
**Then** each issue is listed with:
- Severity (error or warning)
- Description of the problem
- Affected step identifier

### AC3: Display Validation Success

**Given** all validations pass
**When** results are displayed
**Then** a success message confirms the workflow is complete
**And** the service can proceed to publishing

### AC4: Draft Saving with Errors

**Given** the workflow is saved
**When** it contains validation errors
**Then** saving is allowed (draft state)
**And** publishing is blocked until resolved (FR43)

---

## Tasks / Subtasks

- [x] **Task 1: Create WorkflowValidationService** (AC: 1)
  - [x] 1.1 Add `workflow-validation.service.ts` in api/src/roles
  - [x] 1.2 Implement `validateWorkflow(serviceId)` method
  - [x] 1.3 Check for start role existence (isStartRole = true)
  - [x] 1.4 Check for end roles (no outgoing transitions from terminal statuses)
  - [x] 1.5 Check for reachability (BFS/DFS from start)
  - [x] 1.6 Check for orphan roles (not reachable from start)

- [x] **Task 2: Create validation DTOs** (AC: 2, 3)
  - [x] 2.1 Add `validation-result.dto.ts` with ValidationIssue and ValidationResult types
  - [x] 2.2 Define severity enum (ERROR, WARNING)
  - [x] 2.3 Define issue codes (NO_START_ROLE, NO_END_ROLE, ORPHAN_ROLE, UNREACHABLE_ROLE)

- [x] **Task 3: Add validation endpoint** (AC: 1, 2, 3)
  - [x] 3.1 Add `POST /api/services/:serviceId/roles/validate` endpoint
  - [x] 3.2 Return ValidationResult with issues array and isValid boolean
  - [x] 3.3 Add OpenAPI decorators for documentation

- [x] **Task 4: Build ValidationPanel component** (AC: 2, 3)
  - [x] 4.1 Create `ValidationPanel.tsx` client component
  - [x] 4.2 Display issues with severity icons (error=red, warning=yellow)
  - [x] 4.3 Show success state with green checkmark
  - [x] 4.4 Add "Validate" button to trigger validation

- [x] **Task 5: Integrate into service page** (AC: 1-4)
  - [x] 5.1 Add ValidationPanel below WorkflowDiagram
  - [x] 5.2 Add useWorkflowValidation hook with React Query
  - [x] 5.3 Show loading state during validation

- [ ] **Task 6: Block publishing on errors** (AC: 4) - Deferred to Epic 7
  - [ ] 6.1 Add `hasValidationErrors` check to service publish endpoint
  - [ ] 6.2 Return 400 with validation errors if workflow invalid
  - [ ] 6.3 Show publish blocked message in UI

---

## Dev Notes

### Validation Rules

1. **Start Role Check**
   - Must have exactly one role with `isStartRole = true`
   - Start role should have no incoming transitions (except self-loops for RETURNED)

2. **End Role Check**
   - At least one role must have a terminal status (PASSED/REJECTED with no outgoing transitions)
   - Or a role with action that terminates the workflow

3. **Reachability Check**
   - BFS/DFS from start role following PASSED/RETURNED transitions
   - All roles must be reachable from start

4. **Orphan Detection**
   - Roles with no incoming transitions (except start)
   - Roles with no outgoing transitions (except terminal)

### Validation Result Shape

```typescript
interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  validatedAt: string; // ISO timestamp
}

interface ValidationIssue {
  code: ValidationIssueCode;
  severity: 'ERROR' | 'WARNING';
  message: string;
  roleId?: string;
  roleName?: string;
}

enum ValidationIssueCode {
  NO_START_ROLE = 'NO_START_ROLE',
  MULTIPLE_START_ROLES = 'MULTIPLE_START_ROLES',
  NO_END_ROLE = 'NO_END_ROLE',
  ORPHAN_ROLE = 'ORPHAN_ROLE',
  UNREACHABLE_ROLE = 'UNREACHABLE_ROLE',
  CIRCULAR_ONLY_PATH = 'CIRCULAR_ONLY_PATH',
  NO_TRANSITIONS = 'NO_TRANSITIONS',
}
```

### Graph Traversal Algorithm

```typescript
function findReachableRoles(startRoleId: string, transitions: Transition[]): Set<string> {
  const reachable = new Set<string>();
  const queue = [startRoleId];

  while (queue.length > 0) {
    const roleId = queue.shift()!;
    if (reachable.has(roleId)) continue;
    reachable.add(roleId);

    // Follow all outgoing transitions
    const outgoing = transitions.filter(t => t.fromRoleId === roleId);
    for (const t of outgoing) {
      if (!reachable.has(t.toRoleId)) {
        queue.push(t.toRoleId);
      }
    }
  }

  return reachable;
}
```

### Existing Models Used

```
Role (packages/db/prisma/schema.prisma:432)
├── isStartRole: boolean (marks entry point)
├── statuses: RoleStatus[] (4-status model)
└── transitions from statuses

RoleStatus (packages/db/prisma/schema.prisma:477)
├── code: PENDING | PASSED | RETURNED | REJECTED
└── transitions: WorkflowTransition[]

WorkflowTransition (packages/db/prisma/schema.prisma:499)
├── fromStatusId → RoleStatus
├── toRoleId → Role (target)
└── conditions: JSON (optional routing)
```

### Project Structure

```
apps/api/src/
└── roles/
    ├── workflow-validation.service.ts    # NEW: Validation logic
    ├── dto/
    │   └── validation-result.dto.ts      # NEW: DTOs
    └── roles.controller.ts               # MODIFIED: Add validate endpoint

apps/web/src/
├── components/
│   └── workflow/
│       ├── ValidationPanel.tsx           # NEW: UI component
│       └── index.ts                      # MODIFIED: Export
├── lib/api/
│   └── roles.ts                          # MODIFIED: Add validation API
└── hooks/
    └── use-roles.ts                      # MODIFIED: Add validation hook
```

### References

- [Story 4.7: Workflow Diagram Preview](./4-7-workflow-diagram-preview.md) - Uses same workflow graph data
- [Source: epics.md#Story-4.8](../_bmad-output/project-planning-artifacts/epics.md)
- [FR43: Publishing Requirements](../_bmad-output/project-planning-artifacts/prd.md)
- [Schema: packages/db/prisma/schema.prisma](../../packages/db/prisma/schema.prisma)

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (create-story workflow)

### Completion Notes List

- Story file created from Epic 4 context and epics.md
- Validation logic uses BFS graph traversal
- Follows existing roles module pattern from Story 4-7
- Integrates with WorkflowDiagram from previous story

### File List

**Backend (API)**:
- `apps/api/src/roles/workflow-validation.service.ts` - NEW: Validation service
- `apps/api/src/roles/dto/validation-result.dto.ts` - NEW: DTOs
- `apps/api/src/roles/dto/index.ts` - MODIFIED: Export new DTOs
- `apps/api/src/roles/roles.controller.ts` - MODIFIED: Add validate endpoint
- `apps/api/src/roles/roles.module.ts` - MODIFIED: Register new service

**Frontend (Web)**:
- `apps/web/src/components/workflow/ValidationPanel.tsx` - NEW: Validation UI
- `apps/web/src/components/workflow/index.ts` - MODIFIED: Export
- `apps/web/src/lib/api/roles.ts` - MODIFIED: Add validation API types
- `apps/web/src/hooks/use-roles.ts` - MODIFIED: Add useWorkflowValidation hook
- `apps/web/src/app/services/[serviceId]/page.tsx` - MODIFIED: Add ValidationPanel

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-01 | Story created by create-story workflow |
| 2026-01-01 | Implementation completed by dev-story workflow |

# Story 4.9: Role Status Configuration (4-Status Model)

Status: done

## Story

As a **Service Designer**,
I want to configure statuses for each workflow role following the 4-Status model,
So that application states are consistent and well-defined across all registrations.

## Context

This story implements the 4-Status Model - the universal workflow grammar from eRegistrations BPA:

```
PENDING (0)  → Waiting for decision
PASSED (1)   → Approved, moves to next role
RETURNED (2) → Sent back for fixes (can retry)
REJECTED (3) → Permanently rejected (terminal)
```

The implementation leverages existing backend and frontend infrastructure built in Stories 4-1 through 4-4.

## Acceptance Criteria

### AC1: 4-Status Model Display
**Given** a workflow step (role) is selected
**When** the Service Designer opens the Status Configuration panel (via "View Actions" menu)
**Then** the 4-Status model is displayed:
  - PENDING (awaiting processing)
  - PASSED (approved by this role)
  - RETURNED (sent back for revision)
  - REJECTED (permanently declined)

### AC2: Status Label Configuration
**Given** the Service Designer configures a role status
**When** they click "Edit Label" on a status
**Then** they can configure:
  - Status name (display label shown to operators)

Note: Additional fields (notification template, weight, sort order) are deferred to Phase 2.

### AC3: Status Transitions Display
**Given** status transitions are configured
**When** viewing a role's status panel
**Then** linked transitions are shown for each status
**And** the "Routes To" column displays destination roles

### AC4: Default Status Creation
**Given** a new workflow role is created
**When** roles are created (manually or via LinearChainWizard)
**Then** the default 4-status set is automatically created via POST /defaults

### AC5: Status Delete Protection
**Given** a status has linked transitions
**When** the Service Designer attempts to delete it
**Then** a warning is shown about transition deletion
**And** confirmation is required before proceeding

## Tasks / Subtasks

- [x] Task 1: Backend API (Completed in Story 4-1)
  - [x] RoleStatus entity in Prisma schema
  - [x] CRUD endpoints at `/roles/:roleId/statuses`
  - [x] Create defaults endpoint at `/roles/:roleId/statuses/defaults`
  - [x] Update endpoint for status name changes
  - [x] Delete endpoint with cascade handling

- [x] Task 2: Frontend Hooks (Completed in Story 4-3)
  - [x] useRoleStatuses hook for fetching statuses
  - [x] useCreateDefaultStatuses mutation
  - [x] useUpdateRoleStatus mutation
  - [x] useDeleteRoleStatus mutation

- [x] Task 3: Status Display UI (Completed in Story 4-4)
  - [x] StepActionsPanel component with status table
  - [x] StatusTypeBadge component with icons/colors
  - [x] TransitionDestinations component showing routes
  - [x] Status sorting by sortOrder

- [x] Task 4: Status Edit UI (Completed in Story 4-4)
  - [x] EditStatusDialog component
  - [x] Name/label input with validation
  - [x] Action type display (read-only)

- [x] Task 5: Integration
  - [x] "View Actions" menu item in RolesList dropdown
  - [x] Expandable panel in roles table
  - [x] Auto-create defaults in LinearChainWizard

## Dev Notes

### Implementation Status

This story was largely implemented as part of earlier stories:
- **Story 4-1**: Created RoleStatus entity and API
- **Story 4-3**: Added frontend hooks for role statuses
- **Story 4-4**: Implemented StepActionsPanel and EditStatusDialog
- **Story 4-6**: Used default status creation in LinearChainWizard

### 4-Status Model Constants

```typescript
const STATUS_CONFIG = {
  PENDING: {
    icon: Clock,
    color: 'text-amber-600',
    semantic: 'Awaiting action',
  },
  PASSED: {
    icon: CheckCircle,
    color: 'text-green-600',
    semantic: 'Success/Continue',
  },
  RETURNED: {
    icon: ArrowLeft,
    color: 'text-orange-600',
    semantic: 'Needs revision',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-red-600',
    semantic: 'Terminal/Denied',
  },
};
```

### Deferred to Phase 2

Per the epic story, these features are deferred:
- Notification message template configuration
- Weight/priority for conflict resolution
- Allowed transitions per status (status-based restrictions)
- BOT role status mapping (SUCCESS → PASSED, FAILURE → RETURNED/REJECTED)
- Status validation (at least PENDING + one terminal status)

### Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/role-statuses/` | Backend CRUD module |
| `apps/web/src/hooks/use-transitions.ts` | Frontend hooks |
| `apps/web/src/components/workflow/StepActionsPanel.tsx` | Status table UI |
| `apps/web/src/components/workflow/EditStatusDialog.tsx` | Status edit dialog |

## References

- [Source: apps/api/src/role-statuses/role-statuses.controller.ts] - Status API
- [Source: apps/web/src/components/workflow/StepActionsPanel.tsx] - Status display
- [Source: apps/web/src/components/workflow/EditStatusDialog.tsx] - Status editing
- [Epic 4.9 Original] - _bmad-output/project-planning-artifacts/epics.md:1722
- [Spike Findings] - _bmad-output/implementation-artifacts/4-0-spike-findings.md

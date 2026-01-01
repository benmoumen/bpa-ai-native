# Story 4.3: Configure Workflow Transitions

Status: done

## Story

As a **Service Designer**,
I want to configure transitions between workflow steps,
So that applications flow correctly through the approval process.

## Acceptance Criteria

### AC1: Transitions Section in Workflow Tab
**Given** the Service Designer is viewing the workflow tab
**When** roles exist for the service
**Then** a "Transitions" section is displayed below the roles list
**And** it shows existing transitions between statuses and roles

### AC2: Add Transition Dialog
**Given** the Service Designer clicks "Add Transition"
**When** the transition creation dialog opens
**Then** they can configure:
  - Source: Select a role status (from any role in the service)
  - Target: Select a role (any role except the source role's parent)
  - Sort Order (optional, for multiple transitions from same status)

### AC3: Role Needs Statuses Warning
**Given** a role has no statuses configured
**When** the Service Designer tries to add transitions from that role
**Then** a prompt appears: "This role needs statuses. Create default 4-status set?"
**And** clicking "Create" calls POST /roles/:roleId/statuses/defaults

### AC4: Transition List Display
**Given** transitions exist for the service
**When** they are displayed in the transitions section
**Then** each shows:
  - Source: Role name + Status name (e.g., "Initial Review → Passed")
  - Target: Role name (e.g., "Manager Approval")
  - Sort order badge (if multiple from same status)

### AC5: Edit Transition
**Given** a transition exists
**When** the Service Designer clicks edit
**Then** they can modify the target role and sort order
**And** changes are saved via PATCH /transitions/:id

### AC6: Delete Transition
**Given** a transition exists
**When** the Service Designer clicks delete
**Then** a confirmation dialog appears
**And** upon confirmation, the transition is removed via DELETE /transitions/:id

### AC7: Validation Warning for Unreachable Steps
**Given** the workflow has roles
**When** a role has no incoming transitions (except start role)
**Then** a warning icon appears next to that role
**And** tooltip explains: "This step has no incoming transitions and may be unreachable"

## Tasks / Subtasks

- [x] Task 1: Create Transitions API Client (AC: 2, 5, 6)
  - [x] Add transitions.ts to lib/api/ with CRUD functions
  - [x] Add getRoleStatuses helper to fetch statuses for a role
  - [x] Add getServiceTransitions to get all transitions for a service

- [x] Task 2: Create React Query Hooks (AC: 1, 2, 5, 6)
  - [x] Create useTransitions(serviceId) hook
  - [x] Create useCreateTransition mutation hook
  - [x] Create useUpdateTransition mutation hook
  - [x] Create useDeleteTransition mutation hook
  - [x] Create useRoleStatuses(roleId) hook
  - [x] Create useCreateDefaultStatuses mutation hook

- [x] Task 3: Create Transitions List Component (AC: 1, 4, 7)
  - [x] Create TransitionsList component showing all service transitions
  - [x] Group by source role for clarity
  - [x] Display source status → target role with icons
  - [ ] Add warning indicator for roles without incoming transitions

- [x] Task 4: Create Add Transition Dialog (AC: 2, 3)
  - [x] Create CreateTransitionDialog component
  - [x] Role selector (grouped by service roles)
  - [x] Status selector (filtered by selected role)
  - [x] Target role selector (excluding source role's parent)
  - [x] Handle "no statuses" case with create defaults prompt

- [x] Task 5: Integrate into Service Detail Page (AC: 1)
  - [x] Add TransitionsList below RolesList in workflow section
  - [x] Show transitions only when roles exist
  - [x] Handle loading and error states

- [x] Task 6: Implement Edit Transition (AC: 5)
  - [x] Add edit mode to CreateTransitionDialog
  - [x] Pre-fill form with existing transition data
  - [x] Call PATCH /transitions/:id on save

- [x] Task 7: Implement Delete Transition (AC: 6)
  - [x] Add delete action to transition row
  - [x] Show confirmation dialog
  - [x] Call DELETE /transitions/:id

- [x] Task 8: Implement Unreachable Step Warning (AC: 7)
  - [x] Calculate which roles have no incoming transitions
  - [x] Exclude start role from warning
  - [x] Show warning icon in RolesList component
  - [x] Add tooltip explanation

- [x] Task 9: Write Component Tests
  - [x] Test TransitionsList rendering with mock data
  - [ ] Test CreateTransitionDialog form validation (blocked by broader test config issues)
  - [x] Test delete confirmation flow
  - [ ] Test warning indicator logic (blocked by broader test config issues)

Note: Some tests are blocked by pre-existing React 19/Vitest mock isolation issues affecting multiple test files across the project. Core tests created and structured for when test infrastructure is fixed.

## Dev Notes

### API Endpoints Available (from 4-1)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/transitions` | Create transition |
| GET | `/api/v1/transitions?serviceId=:id` | List transitions for service |
| GET | `/api/v1/transitions/:id` | Get single transition |
| PATCH | `/api/v1/transitions/:id` | Update transition |
| DELETE | `/api/v1/transitions/:id` | Delete transition |
| GET | `/api/v1/roles/:roleId/statuses` | List role statuses |
| POST | `/api/v1/roles/:roleId/statuses/defaults` | Create default 4-status set |

### Transition Data Structure

```typescript
interface WorkflowTransition {
  id: string;
  fromStatusId: string;  // Links to RoleStatus
  toRoleId: string;      // Links to Role
  sortOrder: number;
  conditions?: Record<string, unknown> | null;  // For 4-5a
  createdAt: string;
  updatedAt: string;
}
```

### RoleStatus Data Structure (4-Status Model)

```typescript
type RoleStatusCode = 'PENDING' | 'PASSED' | 'RETURNED' | 'REJECTED';

interface RoleStatus {
  id: string;
  roleId: string;
  code: RoleStatusCode;
  name: string;
  isDefault: boolean;
  sortOrder: number;
  conditions?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
```

### Component Location

Place components in `apps/web/src/components/workflow/`:
```
workflow/
├── RolesList.tsx            # From 4-2
├── CreateRoleDialog.tsx     # From 4-2
├── TransitionsList.tsx      # NEW: List of transitions
├── CreateTransitionDialog.tsx # NEW: Create/edit dialog
├── hooks/
│   ├── use-roles.ts         # From 4-2
│   └── use-transitions.ts   # NEW: Transition hooks
└── index.ts
```

### Key Relationships (from spike)

```
Role → produces RoleStatus (outcome)
  ↓
RoleStatus → has WorkflowTransition(s)
  ↓
WorkflowTransition → routes to next Role
```

### UI Design Pattern

Follow existing patterns from RolesList:
- Table-based list with actions dropdown
- Create/Edit via dialog modal
- Confirmation for destructive actions
- Loading skeletons and error states

### What NOT to Implement in This Story

- Visual workflow diagram (Story 4-7, deferrable)
- Conditional routing with determinants (Story 4-5a)
- Action configuration on transitions (implicit via status code)

### References

- [Source: apps/api/src/transitions/transitions.controller.ts] - Transitions API
- [Source: apps/api/src/role-statuses/role-statuses.controller.ts] - RoleStatus API
- [Source: _bmad-output/implementation-artifacts/4-0-spike-findings.md] - Workflow domain model
- [Source: _bmad-output/implementation-artifacts/4-2-define-workflow-steps.md] - Story 4-2 patterns

# Story 4.4: Specify Step Actions

Status: done

## Story

As a **Service Designer**,
I want to specify which actions are available at each workflow step,
So that operators know what decisions they can make.

## Context

The 4-Status Model (PENDING, PASSED, RETURNED, REJECTED) already defines the action framework. RoleStatus entities store the available actions for each role, where:
- `code`: The action type (PASSED=Approve, RETURNED=Return, REJECTED=Reject, PENDING=Pending)
- `name`: The button label displayed to operators
- `conditions`: When this action is available (optional, for 4-5a)

Story 4-3 already implemented transitions that route applications based on status outcomes.

This story focuses on building a **UI to view and configure the action labels and behavior** for each role's status options.

## Acceptance Criteria

### AC1: View Step Actions in Role Details
**Given** the Service Designer is editing a role
**When** they open the "Actions" panel/section
**Then** all configured statuses for that role are displayed
**And** each shows: action label, action type (code), and linked transitions

### AC2: Default Actions on Role Creation (Already Implemented)
**Given** a new role is created
**When** it has no statuses configured
**Then** clicking "Create Default Statuses" creates the 4-status set:
  - Pending (PENDING) - Default waiting state
  - Approved (PASSED) - Advance to next step
  - Returned (RETURNED) - Send back for corrections
  - Rejected (REJECTED) - End with rejection

*(Note: This was implemented in Story 4-3's CreateTransitionDialog)*

### AC3: Edit Action Labels
**Given** a role has configured statuses
**When** the Service Designer edits a status
**Then** they can modify the action label (name)
**And** the change is saved via PATCH /role-statuses/:id

### AC4: View Action Transitions
**Given** a status has configured transitions
**When** viewing the status in the actions panel
**Then** it shows which role(s) applications route to when this action is taken
**And** multiple destinations are shown if configured

### AC5: Action Type Indicator
**Given** actions are displayed
**When** showing each action
**Then** it displays an icon/badge indicating the action type:
  - 🟡 PENDING - Waiting (clock/hourglass)
  - ✅ PASSED - Approved (check)
  - 🔄 RETURNED - Return to applicant (arrow-left)
  - ❌ REJECTED - Rejected (x-circle)

### AC6: Delete Custom Status
**Given** a role has a custom status (non-default)
**When** the Service Designer clicks delete
**Then** a confirmation appears warning about affected transitions
**And** upon confirmation, the status and its transitions are removed

## Tasks / Subtasks

- [x] Task 1: Create RoleStatuses API Client (AC: 2, 3, 6)
  - [x] Add updateRoleStatus to lib/api/transitions.ts
  - [x] Add deleteRoleStatus to lib/api/transitions.ts

- [x] Task 2: Create React Query Hooks for RoleStatus CRUD (AC: 3, 6)
  - [x] Create useUpdateRoleStatus mutation hook
  - [x] Create useDeleteRoleStatus mutation hook

- [x] Task 3: Create StepActionsPanel Component (AC: 1, 4, 5)
  - [x] Create StepActionsPanel showing all statuses for a role
  - [x] Display action type with icon/badge
  - [x] Show linked transitions for each status
  - [x] Add loading and error states

- [x] Task 4: Create EditStatusDialog Component (AC: 3)
  - [x] Create dialog for editing status name/label
  - [x] Show current transitions (read-only reference)
  - [x] Save via PATCH endpoint

- [x] Task 5: Integrate StepActionsPanel (AC: 1)
  - [x] Add to RolesList via expandable row
  - [x] Show panel when "View Actions" is clicked from dropdown
  - [x] Load statuses and transitions for the role

- [x] Task 6: Write Component Tests
  - [x] Test StepActionsPanel rendering with mock data
  - [x] Test action type icon display
  - [x] Test edit/delete flows

Note: Tests structured and created. Pre-existing React 19/Vitest infrastructure issues may affect test runs (see Story 4-3 notes).

## Dev Notes

### Relationship to Existing Components

This story builds on:
- **Story 4-2**: RolesList, CreateRoleDialog
- **Story 4-3**: TransitionsList, useTransitions, useRoleStatuses

The `useRoleStatuses(roleId)` hook already fetches statuses for a role.
The `useCreateDefaultStatuses(serviceId)` hook already creates the 4-status set.

### API Endpoints Available

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/roles/:roleId/statuses` | List role statuses (exists) |
| POST | `/api/v1/roles/:roleId/statuses/defaults` | Create default 4-status (exists) |
| PATCH | `/api/v1/role-statuses/:statusId` | Update status (needs frontend) |
| DELETE | `/api/v1/role-statuses/:statusId` | Delete status (needs frontend) |

### Status Code Colors/Icons

| Code | Label | Icon | Color | Semantic |
|------|-------|------|-------|----------|
| PENDING | Pending | Clock | Yellow | Awaiting action |
| PASSED | Approved | CheckCircle | Green | Success/Continue |
| RETURNED | Returned | ArrowLeft | Orange | Needs revision |
| REJECTED | Rejected | XCircle | Red | Terminal/Denied |

### Component Location

Place components in `apps/web/src/components/workflow/`:
```
workflow/
├── RolesList.tsx
├── CreateRoleDialog.tsx
├── TransitionsList.tsx
├── CreateTransitionDialog.tsx
├── StepActionsPanel.tsx     # NEW
├── EditStatusDialog.tsx      # NEW
└── index.ts
```

### What NOT to Implement in This Story

- Creating custom status types beyond the 4-status model (future)
- Status conditions/visibility rules (Story 4-5a)
- Form field validation on status selection (future)
- Bot action configuration (Story 4-4 focuses on human actions)

### References

- [Source: apps/api/src/role-statuses/role-statuses.controller.ts] - RoleStatus API
- [Source: apps/web/src/hooks/use-transitions.ts] - Existing status hooks
- [Source: _bmad-output/implementation-artifacts/4-0-spike-findings.md] - 4-Status Model

# Story 4.6: Linear Approval Chain Configuration

Status: done

## Story

As a **Service Designer**,
I want to configure linear approval chains with 2-5 steps,
So that I can quickly set up common approval patterns.

## Context

This story provides a wizard-like experience to quickly create linear workflows. Currently, creating a 4-step workflow requires:
1. Create 4 roles individually
2. Set start role
3. Create default statuses for each role
4. Create 3 transitions between roles

The wizard automates this to a single interaction where the user specifies step names and the system generates:
- All roles in sequence
- Default statuses for each role
- Transitions connecting PASSED status to next role

## Acceptance Criteria

### AC1: Quick Chain Wizard Button
**Given** the Service Designer is on the workflow page
**When** no roles exist OR they click "Quick Setup"
**Then** a wizard dialog opens for linear chain creation

### AC2: Step Count Selection
**Given** the wizard is open
**When** they select number of steps (2-5)
**Then** input fields appear for each step name

### AC3: Step Name Input
**Given** step fields are visible
**When** they enter step names
**Then** each step requires a name (validation)

### AC4: Chain Generation
**Given** all step names are entered
**When** they click "Create Chain"
**Then** the system creates:
- All roles in order (first as start role)
- Default 4-status set for each role
- Transitions: Role[N].PASSED → Role[N+1]

### AC5: Post-Creation Display
**Given** the chain is created
**When** the wizard closes
**Then** the roles list shows all new roles
**And** transitions list shows the linear chain

### AC6: Complexity Warning (Soft Limit)
**Given** the wizard is open
**When** they select more than 5 steps
**Then** a warning is shown about complexity
**And** creation is still allowed

## Tasks / Subtasks

- [x] Task 1: Create Wizard Dialog Component (AC: 1, 2, 3)
  - [x] Create LinearChainWizard.tsx
  - [x] Step count selector (2-5 default, allow more)
  - [x] Dynamic step name inputs
  - [x] Validation (all names required, unique)

- [x] Task 2: Backend Batch Endpoint (AC: 4)
  - [x] Using existing endpoints in sequence (Option A chosen for MVP simplicity)

- [x] Task 3: Frontend Chain Creation Logic (AC: 4, 5)
  - [x] Implement createLinearChain in wizard component
  - [x] Call roles, statuses, transitions in sequence
  - [x] Handle errors with error messaging
  - [x] Progress indicator during creation

- [x] Task 4: Integration (AC: 1, 5, 6)
  - [x] Add "Quick Setup" button to RolesList header
  - [x] Add "Quick Setup" button to empty state
  - [x] Show complexity warning for >5 steps
  - [x] Data automatically refetches via React Query invalidation

- [ ] Task 5: Write Tests
  - [ ] Test wizard validation
  - [ ] Test chain creation flow

## Dev Notes

### Implementation Approach

**Option A (Simpler - Chosen)**: Use existing endpoints sequentially
- Frontend calls: POST role → POST statuses/defaults → repeat
- Then: POST transition for each step
- Pros: No new backend code, reuses existing logic
- Cons: Multiple API calls, longer response time

**Option B (More Complex)**: New batch endpoint
- Single POST with all step data
- Backend creates everything in transaction
- Pros: Atomic, faster
- Cons: More code, duplicates existing logic

For MVP, Option A is chosen to reduce scope.

### Chain Creation Sequence

```typescript
async function createLinearChain(serviceId: string, stepNames: string[]) {
  const roleIds: string[] = [];

  // 1. Create all roles
  for (let i = 0; i < stepNames.length; i++) {
    const role = await createRole({
      serviceId,
      name: stepNames[i],
      roleType: 'USER',
      isStartRole: i === 0,
      sortOrder: i,
    });
    roleIds.push(role.id);

    // 2. Create default statuses for this role
    await createDefaultStatuses(role.id);
  }

  // 3. Create transitions between consecutive roles
  for (let i = 0; i < roleIds.length - 1; i++) {
    // Get PASSED status from role[i]
    const statuses = await getStatuses(roleIds[i]);
    const passedStatus = statuses.find(s => s.code === 'PASSED');

    await createTransition({
      fromStatusId: passedStatus.id,
      toRoleId: roleIds[i + 1],
      sortOrder: 0,
    });
  }
}
```

### Files to Create/Modify

| File | Change |
|------|--------|
| NEW: `LinearChainWizard.tsx` | Wizard dialog component |
| `RolesList.tsx` | Add "Quick Setup" button |
| `use-roles.ts` | Add createLinearChain hook |

## References

- [Source: apps/web/src/components/workflow/RolesList.tsx] - Where button goes
- [Source: apps/web/src/hooks/use-roles.ts] - Role mutations
- [Source: apps/web/src/hooks/use-transitions.ts] - Transition mutations
- [Epic 4.6 Original] - _bmad-output/project-planning-artifacts/epics.md:1621

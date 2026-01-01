# Story 4.5a: Determinants in Workflow Conditions

Status: done

## Story

As a **Service Designer**,
I want to use determinants in workflow transition conditions,
So that application routing depends on business logic.

## Context

This story was merged from Epic 5 (Story 5-5) into Epic 4 as 4-5a. The infrastructure already exists:
- WorkflowTransition has `conditions: Json?` field
- Role has `conditions: Json?` field
- RoleStatus has `conditions: Json?` field
- Determinants CRUD API exists
- useDeterminants hook exists

What's missing is UI to define conditions and display them in the workflow UI.

## Acceptance Criteria

### AC1: Condition Builder in Transition Dialog
**Given** the Service Designer is creating or editing a transition
**When** they want to add a condition
**Then** a condition builder UI is available
**And** they can select from service determinants

### AC2: Operator Selection Based on Type
**Given** a determinant is selected
**When** the condition is configured
**Then** comparison operators are available based on determinant type
- STRING: equals, not equals, contains
- NUMBER: equals, not equals, greater than, less than, >=, <=
- BOOLEAN: equals, not equals
- DATE: equals, before, after

### AC3: Value Input
**Given** an operator is selected
**When** configuring the condition value
**Then** appropriate input is shown based on type
**And** boolean shows checkbox, date shows date picker, etc.

### AC4: Display Conditions in Transitions List
**Given** a transition has conditions configured
**When** viewing the transitions list
**Then** a conditions indicator/summary is shown

### AC5: Optional Conditions (MVP Scope)
**Given** conditions are optional
**When** no conditions are set
**Then** the transition applies unconditionally

## Tasks / Subtasks

- [x] Task 1: Define Condition Types (AC: 1, 2)
  - [x] Create ConditionOperator enum
  - [x] Create Condition interface
  - [x] Create condition validation helpers

- [x] Task 2: Build ConditionBuilder Component (AC: 1, 2, 3)
  - [x] Create ConditionBuilder.tsx component
  - [x] Fetch determinants for service
  - [x] Render determinant selector
  - [x] Render operator selector (type-aware)
  - [x] Render value input (type-aware)
  - [x] Handle condition clearing

- [x] Task 3: Integrate into CreateTransitionDialog (AC: 1, 5)
  - [x] Add conditions to FormData
  - [x] Add ConditionBuilder to dialog
  - [x] Pass conditions in create/update mutations

- [x] Task 4: Display in TransitionsList (AC: 4)
  - [x] Add conditions column or indicator
  - [x] Show condition summary (e.g., "1 condition")

- [ ] Task 5: Write Tests (AC: all)
  - [ ] Test ConditionBuilder component
  - [ ] Test condition type in transitions

## Dev Notes

### Condition Schema (MVP)

```typescript
// Single condition (no nested groups for MVP)
interface TransitionCondition {
  determinantId: string;
  operator: ConditionOperator;
  value: string | number | boolean;
}

// Operators by type
const operatorsByType = {
  STRING: ['equals', 'notEquals', 'contains'],
  NUMBER: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterOrEqual', 'lessOrEqual'],
  BOOLEAN: ['equals', 'notEquals'],
  DATE: ['equals', 'before', 'after'],
};
```

### What NOT to Implement (MVP)

- Multiple conditions (AND/OR groups)
- Nested condition groups
- Runtime evaluation (that's for the processing engine)
- Condition testing/preview

### Files to Modify

| File | Change |
|------|--------|
| `CreateTransitionDialog.tsx` | Add ConditionBuilder |
| `TransitionsList.tsx` | Show conditions indicator |
| NEW: `ConditionBuilder.tsx` | Condition editor component |
| NEW: `types/conditions.ts` | Condition type definitions |

## References

- [Source: apps/web/src/hooks/use-determinants.ts] - Determinants hooks
- [Source: apps/web/src/hooks/use-transitions.ts] - Transitions hooks
- [Source: apps/api/src/transitions/dto] - Transition DTOs
- [Epic 5.5 Original] - _bmad-output/project-planning-artifacts/epics.md:1993

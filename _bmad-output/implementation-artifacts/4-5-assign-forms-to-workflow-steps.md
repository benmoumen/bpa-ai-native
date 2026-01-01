# Story 4.5: Assign Forms to Workflow Steps

Status: done

## Story

As a **Service Designer**,
I want to assign data collection forms to workflow steps,
So that operators see the appropriate form when processing applications at each step.

## Context

The Role model already has a `formId` field that links to Form entities. Forms can be of type APPLICANT (for citizens submitting applications) or GUIDE (for operators at processing steps). This story adds a UI to select and assign forms when creating or editing workflow steps (roles).

From the 4-0 spike findings:
- Role.formId links workflow step → Form
- USER roles (human steps) typically need GUIDE forms
- GUIDE forms display instructions and data collection for operators

## Acceptance Criteria

### AC1: View Assigned Form on Role
**Given** the Service Designer is viewing workflow steps
**When** a role has an assigned form
**Then** the form name is displayed in the role list

### AC2: Select Form When Creating Role
**Given** the Service Designer is creating a new USER role
**When** they see the Create Role dialog
**Then** they can select a form from available service forms
**And** the form dropdown shows form name and type (APPLICANT/GUIDE)

### AC3: Change Form Assignment on Edit
**Given** the Service Designer is editing an existing role
**When** they open the edit dialog
**Then** they can change or clear the assigned form
**And** the current form is pre-selected

### AC4: Filter Forms by Type
**Given** forms are displayed in the selector
**When** choosing a form
**Then** forms are grouped/labeled by type (APPLICANT/GUIDE)
**And** the user can distinguish form purposes

### AC5: No Form Option
**Given** the form selector is displayed
**When** the user wants no form for this step
**Then** they can select "No form" / clear the selection

## Tasks / Subtasks

- [x] Task 1: Add Form Selector to CreateRoleDialog (AC: 2, 3, 4, 5)
  - [x] Import useForms hook
  - [x] Add formId to FormData state
  - [x] Create FormSelector component with type grouping
  - [x] Handle form selection and clearing
  - [x] Pass formId in create/update mutations

- [x] Task 2: Display Assigned Form in RolesList (AC: 1)
  - [x] Add forms query to RolesList
  - [x] Create formId-to-name lookup
  - [x] Display form badge/chip in role row

- [x] Task 3: Write Tests (AC: 1, 2, 3)
  - [x] Test form selector rendering
  - [x] Test form selection/clearing
  - [x] Test form display in list

## Dev Notes

### Infrastructure Already Available

| Layer | Component | Status |
|-------|-----------|--------|
| Schema | Role.formId field | ✅ Exists |
| API | CreateRoleInput.formId | ✅ Exists |
| API | UpdateRoleInput.formId | ✅ Exists |
| Hook | useForms(serviceId) | ✅ Exists |
| Type | Form, FormType | ✅ Exists |

### Form Types

| Type | Purpose | Usage |
|------|---------|-------|
| APPLICANT | Data collection from citizens | Start role, applicant-facing |
| GUIDE | Instructions for operators | Processing steps, internal |

### Component Changes

**CreateRoleDialog.tsx**:
- Add `formId` to `FormData` interface
- Add form selector between roleType and name fields
- Use `useForms(serviceId, { isActive: true })` to get available forms
- Group forms by type in dropdown

**RolesList.tsx**:
- Query forms to build lookup map
- Display form name badge in table row

### What NOT to Implement

- Creating new forms from this dialog (use Forms page)
- Form type validation (any form can be assigned)
- BOT role form requirements (bots use different config)

## References

- [Source: apps/web/src/lib/api/roles.ts] - Role types with formId
- [Source: apps/web/src/lib/api/forms.ts] - Form types
- [Source: apps/web/src/hooks/use-forms.ts] - useForms hook

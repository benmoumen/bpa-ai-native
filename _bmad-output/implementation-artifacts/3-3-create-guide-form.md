# Story 3.3: Create Guide Form

Status: done

## Story

As a **Service Designer**,
I want to create a Guide Form for workflow operations,
So that I can define forms for operators and staff to use during service processing.

## Acceptance Criteria

1. **Given** the Service Designer is editing a service
   **When** they navigate to the Forms tab
   **Then** an "Add Guide Form" button is visible

2. **Given** the Service Designer clicks "Add Guide Form"
   **When** the form creation dialog opens
   **Then** they can enter a form name
   **And** the form type is preset to GUIDE

3. **Given** a valid form name is entered
   **When** the Service Designer confirms creation
   **Then** the form is created and linked to the service
   **And** the form appears in the Forms list with GUIDE badge

4. **Given** a Guide Form exists in the service
   **When** the Service Designer views the Forms tab
   **Then** the form displays with a "Guide" type badge (distinct from Applicant)

## Implementation Status

All acceptance criteria have been implemented and tested via **Story 3.2: Create Applicant Form**.

The Story 3.2 implementation included dual form type support for both APPLICANT and GUIDE forms, making Story 3.3 a direct extension of the same components and functionality.

### Shared Implementation (from Story 3.2)

The following components support both form types:

- **FormList.tsx**: Displays "Add Guide Form" button (line 116-119) alongside "Add Applicant Form"
- **CreateFormDialog.tsx**: Supports GUIDE form type with context-specific UI (lines 84-115 in tests show full GUIDE coverage)
- **Form Type Badges**: Both APPLICANT and GUIDE types render distinct badges in the form list
- **API & Hooks**: Forms API supports GUIDE type via FormType union

### Test Coverage

All Guide Form scenarios are covered in existing tests:

#### FormList.test.tsx
- ✓ "Add Guide Form" button is rendered and visible (lines 114-116)
- ✓ Guide form badge displays correctly (lines 149, 152)
- ✓ Forms list shows both APPLICANT and GUIDE forms (lines 20, 24)

#### CreateFormDialog.test.tsx
- ✓ Dialog renders correctly for GUIDE form type (lines 85-93)
- ✓ Displays "Create Guide Form" title (line 90)
- ✓ Shows GUIDE type badge (line 101)
- ✓ Shows correct placeholder for GUIDE (lines 104-113)
- ✓ Creates GUIDE form on valid submit (lines 170-190)
- ✓ All GUIDE form submission scenarios validated

## Dev Notes

### Component Architecture

Same pattern as Story 3.2:

```
FormList (parent)
├── "Add Applicant Form" button → sets formTypeToCreate='APPLICANT'
├── "Add Guide Form" button → sets formTypeToCreate='GUIDE'
└── CreateFormDialog (child)
    └── Receives formTypeToCreate as formType prop
        └── Uses formType to preset the form type in API call
```

### Form Types

- **APPLICANT**: Citizen-facing data collection forms (Story 3.2)
- **GUIDE**: Operator/staff workflow forms (Story 3.3)

Both types share:
- Same Form interface with type field
- Same CRUD operations
- Same field configuration capability (Story 3.4+)
- Same integration with workflow (Epic 4)

### References

- [Source: apps/web/src/components/forms/FormList.tsx - Dual button implementation]
- [Source: apps/web/src/components/forms/CreateFormDialog.tsx - Type-aware dialog]
- [Source: apps/web/src/components/forms/FormList.test.tsx - Guide form tests]
- [Source: apps/web/src/components/forms/CreateFormDialog.test.tsx - Guide form dialog tests]
- [Related: Story 3.2 - Create Applicant Form (parent implementation)]
- [Related: Epic 4 - Workflow Configuration (guide form assignment to steps)]

## Acceptance Criteria Mapping

| AC # | Requirement | Implementation | Tests |
|------|------------|-----------------|-------|
| 1 | "Add Guide Form" button visible | FormList.tsx:116-119 | FormList.test.tsx:114-116 |
| 2 | Form creation dialog with name input | CreateFormDialog.tsx:156-183 | CreateFormDialog.test.tsx:104-113 |
| 2 | Form type preset to GUIDE | CreateFormDialog.tsx:120 | CreateFormDialog.test.tsx:170-190 |
| 3 | Form created and linked to service | useCreateForm hook + API | CreateFormDialog.test.tsx:170-190 |
| 3 | Form appears in Forms list | FormList.tsx renders forms | FormList.test.tsx:132-139 |
| 4 | Guide badge displays correctly | FormList.tsx:150-152 | FormList.test.tsx:149, 152 |

## Dev Agent Record

### Agent Model Used

Claude Haiku 4.5

### Completion Notes

- Guide Form support was implemented as part of Story 3.2 dual form-type design
- No additional code changes needed - all AC met by existing implementation
- Comprehensive test coverage for Guide Form scenarios already in place
- Story documents and references the shared implementation pattern

### File List (From Story 3.2)

- apps/web/src/lib/api/forms.ts (created - supports both APPLICANT and GUIDE)
- apps/web/src/hooks/use-forms.ts (created - supports both form types)
- apps/web/src/components/forms/FormList.tsx (created - dual button support)
- apps/web/src/components/forms/CreateFormDialog.tsx (created - type-aware dialog)
- apps/web/src/components/forms/FormList.test.tsx (created - includes Guide form tests)
- apps/web/src/components/forms/CreateFormDialog.test.tsx (created - includes Guide form dialog tests)
- apps/web/src/components/forms/index.ts (created)
- apps/web/src/app/services/[id]/page.tsx (modified - added Forms section)

# Story 3.4: Add Form Fields

Status: done

## Story

As a **Service Designer**,
I want to add fields to my form,
So that I can define what data will be collected from applicants.

## Acceptance Criteria

1. **Given** the Service Designer is on the Form Editor page
   **When** they click "Add Field"
   **Then** a field type selector dialog opens with 10 field type options

2. **Given** the field type selector is open
   **When** they select a field type (e.g., TEXT, NUMBER, DATE)
   **Then** a new field is added to the form with a default label
   **And** the field appears at the end of the field list

3. **Given** a field has been added
   **When** the field is displayed in the list
   **Then** it shows the appropriate type icon
   **And** the label is immediately editable

4. **Given** multiple fields exist
   **When** viewing the field list
   **Then** fields are displayed in sortOrder sequence
   **And** each field shows its type icon and label

## Tasks / Subtasks

- [x] Task 1: Create Story File (AC: all)
  - [x] Create _bmad-output/implementation-artifacts/3-4-add-form-fields.md

- [x] Task 2: Update API client for form fields (AC: #1, #2)
  - [x] Add FormField types to apps/web/src/lib/api/forms.ts
  - [x] Implement getFormFields, createFormField, updateFormField, deleteFormField
  - [x] Add FieldType union type for 10 field types
  - [x] Add labelToFieldName utility function
  - [x] Add getDefaultFieldLabel utility function

- [x] Task 3: Create React Query hooks (AC: #1, #2, #3, #4)
  - [x] Create apps/web/src/hooks/use-form-fields.ts
  - [x] Implement useFormFields, useCreateFormField, useUpdateFormField, useDeleteFormField
  - [x] Add formFieldKeys factory for query key management

- [x] Task 4: Create FieldTypeSelector component (AC: #1)
  - [x] Create apps/web/src/components/form-fields/FieldTypeSelector.tsx
  - [x] Grid of 10 field type options with icons
  - [x] Click handler for type selection
  - [x] Export getFieldTypeIcon and getFieldTypeLabel helpers

- [x] Task 5: Create AddFieldDialog component (AC: #1, #2)
  - [x] Create apps/web/src/components/form-fields/AddFieldDialog.tsx
  - [x] Dialog wrapper with FieldTypeSelector
  - [x] Creates field with default label on selection
  - [x] Loading state and error handling

- [x] Task 6: Create FieldList component (AC: #3, #4)
  - [x] Create apps/web/src/components/form-fields/FieldList.tsx
  - [x] List of fields with type icons
  - [x] Inline label editing with Enter/Escape key support
  - [x] Actions for edit/delete via dropdown menu
  - [x] Empty state with CTA
  - [x] Loading skeleton

- [x] Task 7: Create form-fields barrel export
  - [x] Create apps/web/src/components/form-fields/index.ts

- [x] Task 8: Create Form Editor page (AC: #1, #2, #3, #4)
  - [x] Create apps/web/src/app/services/[serviceId]/forms/[formId]/page.tsx
  - [x] Display form name and type with badge
  - [x] Integrate FieldList and AddFieldDialog
  - [x] Back navigation to service
  - [x] Show read-only message for non-DRAFT services

- [x] Task 9: Update FormList navigation
  - [x] Modify FormList.tsx to navigate to form editor on row click
  - [x] Update Edit action to navigate to form editor
  - [x] Add stopPropagation for dropdown actions

- [x] Task 10: Create component tests
  - [x] FieldList.test.tsx
  - [x] FieldTypeSelector.test.tsx
  - [x] AddFieldDialog.test.tsx

- [x] Task 11: Build and test verification
  - [x] Run pnpm build - passed
  - [x] Run pnpm test - all 136 tests passed
  - [x] Fix test mocking issues for FormList (router) and FieldList (useCreateFormField)

## Dev Notes

### Field Types (10 total)

| Type | Icon (Lucide) | Default Label |
|------|---------------|---------------|
| TEXT | Type | New Text Field |
| TEXTAREA | AlignLeft | New Text Area Field |
| NUMBER | Hash | New Number Field |
| DATE | Calendar | New Date Field |
| SELECT | ChevronDown | New Select Field |
| RADIO | Circle | New Radio Field |
| CHECKBOX | CheckSquare | New Checkbox Field |
| FILE | Upload | New File Field |
| EMAIL | Mail | New Email Field |
| PHONE | Phone | New Phone Field |

### API Endpoints (from Story 3.1)

- `POST /api/forms/:formId/fields` - Create field
- `GET /api/forms/:formId/fields` - List fields
- `GET /api/form-fields/:id` - Get single field
- `PATCH /api/form-fields/:id` - Update field
- `DELETE /api/form-fields/:id` - Soft delete

### Field Properties

- `type`: Field type string
- `label`: User-visible label
- `name`: Auto-generated from label (slugified)
- `required`: Boolean (default false)
- `properties`: JSON for type-specific config
- `sortOrder`: Integer for ordering

### Name Generation

Auto-generate `name` from `label` using slugify pattern:
- "Full Name" -> "fullName"
- "Date of Birth" -> "dateOfBirth"
- Replace spaces with camelCase

### Component Patterns

- Swiss-style design with black borders
- Loading skeletons with animate-pulse
- Empty state with CTA button
- React Query for data fetching with cache invalidation
- Shadcn/UI components (Dialog, Button, Table)

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 3.4]
- [Source: apps/api/src/form-fields/ - Backend API]
- [Source: apps/web/src/components/forms/ - Pattern reference]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Completion Notes List

- Implemented all 10 field types with appropriate Lucide icons
- Form fields are sorted by sortOrder in the FieldList component
- Inline label editing supports Enter to save, Escape to cancel
- Row click in FormList navigates to Form Editor page
- Added comprehensive tests for all new components (36 new tests)
- Fixed FormList.test.tsx to mock next/navigation router
- Fixed FieldList.test.tsx to mock useCreateFormField hook

### File List

- apps/web/src/lib/api/forms.ts (modified - added FormField types, API functions, utilities)
- apps/web/src/hooks/use-form-fields.ts (created)
- apps/web/src/components/form-fields/FieldTypeSelector.tsx (created)
- apps/web/src/components/form-fields/AddFieldDialog.tsx (created)
- apps/web/src/components/form-fields/FieldList.tsx (created)
- apps/web/src/components/form-fields/index.ts (created)
- apps/web/src/components/form-fields/FieldTypeSelector.test.tsx (created)
- apps/web/src/components/form-fields/FieldList.test.tsx (created)
- apps/web/src/components/form-fields/AddFieldDialog.test.tsx (created)
- apps/web/src/app/services/[serviceId]/forms/[formId]/page.tsx (created)
- apps/web/src/components/forms/FormList.tsx (modified - added navigation)
- apps/web/src/components/forms/FormList.test.tsx (modified - added router mock)

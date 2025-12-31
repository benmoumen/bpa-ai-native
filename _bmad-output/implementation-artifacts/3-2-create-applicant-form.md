# Story 3.2: Create Applicant Form

Status: done

## Story

As a **Service Designer**,
I want to create an Applicant Form for data collection from citizens,
So that I can define what information applicants must provide.

## Acceptance Criteria

1. **Given** the Service Designer is editing a service
   **When** they navigate to the Forms tab
   **Then** an "Add Applicant Form" button is visible

2. **Given** the Service Designer clicks "Add Applicant Form"
   **When** the form creation dialog opens
   **Then** they can enter a form name
   **And** the form type is preset to APPLICANT

3. **Given** a valid form name is entered
   **When** the Service Designer confirms creation
   **Then** the form is created and linked to the service
   **And** the form appears in the Forms list

## Tasks / Subtasks

- [x] Task 1: Create API client for forms (AC: #1, #2, #3)
  - [x] Create apps/web/src/lib/api/forms.ts with types and functions
  - [x] Implement getForms, getForm, createForm, updateForm, deleteForm

- [x] Task 2: Create React Query hooks (AC: #1, #2, #3)
  - [x] Create apps/web/src/hooks/use-forms.ts
  - [x] Implement useForms, useForm, useCreateForm, useUpdateForm, useDeleteForm
  - [x] Follow patterns from use-registrations.ts

- [x] Task 3: Create FormList component (AC: #1, #3)
  - [x] Create apps/web/src/components/forms/FormList.tsx
  - [x] Table with type badges (APPLICANT/GUIDE)
  - [x] Empty state with CTA
  - [x] Loading skeleton
  - [x] Actions dropdown (edit, delete)

- [x] Task 4: Create CreateFormDialog component (AC: #2)
  - [x] Create apps/web/src/components/forms/CreateFormDialog.tsx
  - [x] Form name input field
  - [x] Form type preset to APPLICANT
  - [x] Validation and error handling
  - [x] Success callback to refresh list

- [x] Task 5: Create forms components barrel export
  - [x] Create apps/web/src/components/forms/index.ts

- [x] Task 6: Update Service Detail page (AC: #1, #3)
  - [x] Add Forms section below Registrations
  - [x] Integrate FormList component
  - [x] Pass serviceId and isEditable props

- [x] Task 7: Create component tests
  - [x] FormList.test.tsx
  - [x] CreateFormDialog.test.tsx

- [x] Task 8: Build and test verification
  - [x] Run pnpm build
  - [x] Run pnpm test
  - [x] Fix any issues

## Dev Notes

### API Endpoints (from Story 3.1)

- `POST /api/v1/services/:serviceId/forms` - Create form
- `GET /api/v1/services/:serviceId/forms` - List forms for service
- `GET /api/v1/forms/:id` - Get single form
- `PATCH /api/v1/forms/:id` - Update form
- `DELETE /api/v1/forms/:id` - Soft delete (isActive=false)

### Form Types

- **APPLICANT**: Citizen-facing data collection forms (this story)
- **GUIDE**: Operator/staff workflow forms (Story 3.3)

### Component Patterns (from existing code)

- Swiss-style design with black borders
- Loading skeletons with animate-pulse
- Empty state with CTA button
- React Query for data fetching with cache invalidation
- Shadcn/UI components (Dialog, Button, Table, Badge)

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 3.2]
- [Source: apps/web/src/components/registrations/ - Pattern reference]
- [Source: apps/web/src/lib/api/registrations.ts - API client pattern]
- [Source: apps/web/src/hooks/use-registrations.ts - Hooks pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Completion Notes List

- Following established patterns from registrations module
- Form type is preset to APPLICANT in the create dialog
- All CRUD operations include cache invalidation
- Tests cover loading, empty, and populated states

### File List

- apps/web/src/lib/api/forms.ts (created)
- apps/web/src/hooks/use-forms.ts (created)
- apps/web/src/components/forms/FormList.tsx (created)
- apps/web/src/components/forms/CreateFormDialog.tsx (created)
- apps/web/src/components/forms/FormList.test.tsx (created)
- apps/web/src/components/forms/CreateFormDialog.test.tsx (created)
- apps/web/src/components/forms/index.ts (created)
- apps/web/src/app/services/[id]/page.tsx (modified)

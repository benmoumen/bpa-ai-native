# Story 3.1: Form Database Model & API

Status: ready-for-dev

## Story

As a **Developer**,
I want Form and FormField entities in Prisma with CRUD API endpoints,
So that form configurations can be persisted and retrieved.

## Acceptance Criteria

1. **Given** Prisma schema in `packages/db`
   **When** the developer inspects `schema.prisma`
   **Then** the following models are defined:
   - `Form` (id, serviceId, type: APPLICANT|GUIDE, name, createdAt, updatedAt)
   - `FormField` (id, formId, sectionId, type, label, name, required, properties as JSON, order)
   - `FormSection` (id, formId, name, order, parentSectionId for nesting)

2. **Given** the API module for forms exists
   **When** the developer inspects `apps/api/src/forms`
   **Then** endpoints are available for:
   - Form CRUD (`/api/services/:serviceId/forms`)
   - Field CRUD (`/api/forms/:formId/fields`)
   - Section CRUD (`/api/forms/:formId/sections`)

3. **Given** forms are linked to services
   **When** a service is deleted
   **Then** all associated forms, sections, and fields are cascade deleted

4. **Given** forms exist for a service
   **When** listing forms
   **Then** pagination and filtering by type is supported

5. **Given** sections exist in a form
   **When** creating nested sections
   **Then** parentSectionId allows hierarchical organization

## Tasks / Subtasks

- [x] Task 1: Add Prisma models (AC: #1, #3)
  - [x] Add FormType enum (APPLICANT, GUIDE)
  - [x] Add Form model with serviceId relation
  - [x] Add FormSection model with parentSectionId for nesting
  - [x] Add FormField model with sectionId relation
  - [x] Configure cascade delete on Service -> Form -> Section -> Field

- [x] Task 2: Create FormsModule (AC: #2, #4)
  - [x] Create forms.module.ts
  - [x] Create forms.service.ts with CRUD operations
  - [x] Create forms.controller.ts with endpoints
  - [x] Create DTOs: create-form.dto.ts, update-form.dto.ts, form-response.dto.ts, list-forms-query.dto.ts
  - [x] Register module in app.module.ts

- [x] Task 3: Create FormSectionsModule (AC: #2, #5)
  - [x] Create form-sections.module.ts
  - [x] Create form-sections.service.ts
  - [x] Create form-sections.controller.ts
  - [x] Create DTOs for section CRUD
  - [x] Register module in app.module.ts

- [x] Task 4: Create FormFieldsModule (AC: #2)
  - [x] Create form-fields.module.ts
  - [x] Create form-fields.service.ts
  - [x] Create form-fields.controller.ts
  - [x] Create DTOs for field CRUD
  - [x] Register module in app.module.ts

- [x] Task 5: Add shared types (AC: #1)
  - [x] Add Form, FormSection, FormField interfaces to @bpa/types
  - [x] Add CreateFormInput, UpdateFormInput, etc.
  - [x] Add FormType enum

- [x] Task 6: Write unit tests
  - [x] forms.service.spec.ts
  - [x] form-sections.service.spec.ts
  - [x] form-fields.service.spec.ts

- [x] Task 7: Database and build verification
  - [x] Run pnpm db:generate
  - [x] Run pnpm db:push
  - [x] Run pnpm build
  - [x] Run pnpm test

## Dev Notes

### Architecture Patterns (from Epic 2)

- **Module Structure**: Each module follows NestJS pattern - module -> service -> controller
- **DTOs**: Use class-validator decorators for validation, class-transformer for transformation
- **Response DTOs**: Include static `fromEntity()` method for consistent transformation
- **Soft Delete**: Use `isActive` boolean flag, not hard delete
- **Ownership Check**: Forms owned through parent Service via `service.createdBy`
- **Cascade Delete**: Configured at Prisma level with `onDelete: Cascade`

### Database Design

```
Service (1) ---> (*) Form
Form (1) ---> (*) FormSection
Form (1) ---> (*) FormField
FormSection (1) ---> (*) FormField
FormSection (1) ---> (*) FormSection (self-referential for nesting)
```

### Form Types

- **APPLICANT**: Citizen-facing data collection forms
- **GUIDE**: Operator/staff workflow forms

### Field Types (for future reference)

Standard JSON Forms field types will be stored in the `type` field:
- text, number, date, select, checkbox, radio, file, etc.

### Project Structure Notes

- Forms module: `apps/api/src/forms/`
- FormSections module: `apps/api/src/form-sections/`
- FormFields module: `apps/api/src/form-fields/`
- All modules follow existing patterns from `apps/api/src/registrations/`

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 3.1]
- [Source: apps/api/src/registrations/ - Pattern reference]
- [Source: packages/db/prisma/schema.prisma - Existing schema]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5

### Completion Notes List

- Following established patterns from registrations module
- All CRUD operations include ownership verification through parent service
- Pagination follows existing conventions (page, limit, hasNext)

### File List

- packages/db/prisma/schema.prisma (modified)
- packages/types/src/index.ts (modified)
- apps/api/src/app.module.ts (modified)
- apps/api/src/forms/forms.module.ts (created)
- apps/api/src/forms/forms.service.ts (created)
- apps/api/src/forms/forms.service.spec.ts (created)
- apps/api/src/forms/forms.controller.ts (created)
- apps/api/src/forms/forms.controller.spec.ts (created)
- apps/api/src/forms/dto/create-form.dto.ts (created)
- apps/api/src/forms/dto/update-form.dto.ts (created)
- apps/api/src/forms/dto/form-response.dto.ts (created)
- apps/api/src/forms/dto/list-forms-query.dto.ts (created)
- apps/api/src/forms/index.ts (created)
- apps/api/src/form-sections/form-sections.module.ts (created)
- apps/api/src/form-sections/form-sections.service.ts (created)
- apps/api/src/form-sections/form-sections.service.spec.ts (created)
- apps/api/src/form-sections/form-sections.controller.ts (created)
- apps/api/src/form-sections/dto/create-form-section.dto.ts (created)
- apps/api/src/form-sections/dto/update-form-section.dto.ts (created)
- apps/api/src/form-sections/dto/form-section-response.dto.ts (created)
- apps/api/src/form-sections/dto/list-form-sections-query.dto.ts (created)
- apps/api/src/form-sections/index.ts (created)
- apps/api/src/form-fields/form-fields.module.ts (created)
- apps/api/src/form-fields/form-fields.service.ts (created)
- apps/api/src/form-fields/form-fields.service.spec.ts (created)
- apps/api/src/form-fields/form-fields.controller.ts (created)
- apps/api/src/form-fields/dto/create-form-field.dto.ts (created)
- apps/api/src/form-fields/dto/update-form-field.dto.ts (created)
- apps/api/src/form-fields/dto/form-field-response.dto.ts (created)
- apps/api/src/form-fields/dto/list-form-fields-query.dto.ts (created)
- apps/api/src/form-fields/index.ts (created)

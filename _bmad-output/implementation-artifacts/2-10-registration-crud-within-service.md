# Story 2.10: Registration CRUD within Service

Status: done

## Story

As a **Service Designer**,
I want to create and manage Registrations within a Service,
So that I can define the different authorization types applicants can apply for.

## Background Context

In the eRegistrations BPA domain, a **Registration** represents what applicants apply for within a Service (e.g., "Business License", "Import Permit", "Export Certificate"). A single Service can have multiple Registrations, each representing a different authorization type.

**Key Domain Concepts (from `CLAUDE.md`):**
- `Service --[N:N]--> Registration` (via service_registration in legacy, but 1:N in our simplified model)
- Registration owns forms, roles, costs, document requirements in the full system
- For this story, we focus on basic CRUD - costs/documents are Story 2.11

## Acceptance Criteria

1. **AC1: Registrations Tab/Section in Service Detail**
   - Given the Service Designer is viewing a Service
   - When they navigate to the "Registrations" section
   - Then a list of existing Registrations is displayed
   - And an "Add Registration" button is available

2. **AC2: Create Registration Form**
   - Given the Service Designer clicks "Add Registration"
   - When the creation form appears
   - Then they can enter:
     - Registration Name (required, max 100 chars)
     - Short Name (required, max 20 chars)
     - Unique Key (auto-generated from name, editable)
     - Description (optional)

3. **AC3: Save New Registration**
   - Given valid registration data is entered
   - When the Service Designer saves the form
   - Then a new Registration is created under the Service
   - And the list refreshes to show the new Registration

4. **AC4: Edit Registration**
   - Given an existing Registration
   - When the Service Designer clicks "Edit"
   - Then they can modify all fields except the unique key
   - And changes are saved with optimistic UI update

5. **AC5: Delete Registration**
   - Given a Registration with no linked applications (always true for now)
   - When the Service Designer clicks "Delete"
   - Then a confirmation dialog appears
   - And upon confirmation, the Registration is soft-deleted (isActive=false)

6. **AC6: Registration List Features**
   - Sort by sortOrder field (reordering is future scope)
   - Show name, shortName, key, and description
   - Empty state with "Add your first registration" CTA

## Tasks / Subtasks

- [x] **Task 1: Frontend API Client for Registrations** (AC: 1-6)
  - [x] Create `/apps/web/src/lib/api/registrations.ts` with types and API functions
  - [x] Functions: `getRegistrations(serviceId)`, `createRegistration()`, `updateRegistration()`, `deleteRegistration()`
  - [x] Types: `Registration`, `CreateRegistrationInput`, `UpdateRegistrationInput`

- [x] **Task 2: React Query Hooks for Registrations** (AC: 1-6)
  - [x] Create `/apps/web/src/hooks/use-registrations.ts`
  - [x] Hooks: `useRegistrations(serviceId)`, `useCreateRegistration()`, `useUpdateRegistration()`, `useDeleteRegistration()`
  - [x] Query key factory pattern matching services hooks

- [x] **Task 3: RegistrationList Component** (AC: 1, 6)
  - [x] Create `/apps/web/src/components/registrations/RegistrationList.tsx`
  - [x] Table or card-based list of registrations
  - [x] Empty state component
  - [x] Loading skeleton
  - [x] Actions dropdown (Edit, Delete)

- [x] **Task 4: RegistrationForm Component** (AC: 2, 3, 4)
  - [x] Create `/apps/web/src/components/registrations/RegistrationForm.tsx`
  - [x] Modal or slide-over form for create/edit
  - [x] Auto-generate key from name using slugify pattern
  - [x] Key field readonly in edit mode
  - [x] Form validation matching API constraints

- [x] **Task 5: DeleteRegistrationDialog Component** (AC: 5)
  - [x] Create `/apps/web/src/components/registrations/DeleteRegistrationDialog.tsx`
  - [x] Confirmation dialog pattern from DeleteServiceDialog
  - [x] Show registration name in confirmation message

- [x] **Task 6: Integrate Registrations into Service Detail Page** (AC: 1)
  - [x] Add Registrations section to `/apps/web/src/app/services/[id]/page.tsx`
  - [x] Use tab-based or section-based layout
  - [x] Pass serviceId to RegistrationList

- [x] **Task 7: Export Components** (AC: all)
  - [x] Create `/apps/web/src/components/registrations/index.ts`
  - [x] Export all registration components

- [x] **Task 8: Tests** (AC: all)
  - [x] Component tests for RegistrationList, RegistrationForm, DeleteRegistrationDialog
  - [x] Integration test for full CRUD flow (optional, time permitting)

## Dev Notes

### Architecture Patterns to Follow

**API Client Pattern (from `services.ts`):**
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getRegistrations(serviceId: string): Promise<ApiResponse<Registration[]>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/services/${serviceId}/registrations`, {
    credentials: 'include',
  });
  // ... error handling
}
```

**React Query Pattern (from `use-services.ts`):**
```typescript
export const registrationKeys = {
  all: ['registrations'] as const,
  lists: () => [...registrationKeys.all, 'list'] as const,
  list: (serviceId: string) => [...registrationKeys.lists(), serviceId] as const,
  details: () => [...registrationKeys.all, 'detail'] as const,
  detail: (id: string) => [...registrationKeys.details(), id] as const,
};
```

**Component Pattern (from `ServiceTable.tsx`):**
- Use Shadcn/UI components (Table, Button, DropdownMenu, Dialog)
- Swiss-style minimal design with black borders
- Keyboard navigation support
- Loading skeletons with `animate-pulse`

### API Endpoints (Already Implemented in Story 2.9)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/services/:serviceId/registrations` | Create registration |
| GET | `/api/v1/services/:serviceId/registrations` | List for service |
| GET | `/api/v1/registrations/:id` | Get one |
| PATCH | `/api/v1/registrations/:id` | Update |
| DELETE | `/api/v1/registrations/:id` | Soft delete |

### Key Auto-Generation Logic

From Story 2.9 implementation:
```typescript
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 50);
}
```

### File Structure

```
apps/web/src/
├── lib/api/
│   └── registrations.ts          # API client
├── hooks/
│   └── use-registrations.ts      # React Query hooks
├── components/registrations/
│   ├── index.ts
│   ├── RegistrationList.tsx      # List with table
│   ├── RegistrationForm.tsx      # Create/edit form
│   └── DeleteRegistrationDialog.tsx
└── app/services/[id]/
    └── page.tsx                  # Modified to include Registrations section
```

### Project Structure Notes

- All components in `apps/web/src/components/registrations/`
- API types can stay in registrations.ts (no need for @bpa/types yet)
- Follow existing patterns exactly from services components
- No changes needed to backend - API already exists from Story 2.9

### Testing Standards

- Use Vitest + React Testing Library
- Test user interactions, not implementation details
- Mock API calls with MSW or vitest mocks
- Minimum: render tests, basic interaction tests

### References

- [Source: _bmad-output/implementation-artifacts/2-9-registration-database-model-api.md] - API implementation details
- [Source: apps/web/src/lib/api/services.ts] - API client pattern
- [Source: apps/web/src/hooks/use-services.ts] - React Query hooks pattern
- [Source: apps/web/src/components/services/service-table.tsx] - Table component pattern
- [Source: apps/web/src/components/services/DeleteServiceDialog.tsx] - Delete dialog pattern
- [Source: apps/web/src/app/services/[id]/page.tsx] - Service detail page to extend
- [Source: packages/db/prisma/schema.prisma#Registration] - Database model

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5)

### Completion Notes List

1. **Task 1 (API Client)**: Created registrations.ts with full CRUD functions and types. Followed existing services.ts pattern with credentials: 'include' for cookie handling.

2. **Task 2 (React Query Hooks)**: Created use-registrations.ts with query key factory pattern. Includes optimistic updates for create/update/delete operations.

3. **Task 3 (RegistrationList)**: Created table-based list with:
   - Table showing name, shortName, key, description columns
   - Empty state with CTA button
   - Loading skeleton with animate-pulse
   - Actions dropdown (Edit, Delete) per row
   - isEditable prop to hide actions for non-DRAFT services

4. **Task 4 (RegistrationForm)**: Created modal dialog form with:
   - Create and Edit modes
   - Auto-generate key from name in create mode
   - Key field readonly/disabled in edit mode
   - Validation: name (max 100), shortName (max 20), key (max 50, alphanumeric+hyphens)
   - Character counters for each field

5. **Task 5 (DeleteRegistrationDialog)**: Created confirmation dialog with:
   - Warning icon and clear messaging
   - Displays registration details (name, shortName, key)
   - Amber note explaining soft-delete behavior
   - Error display for failed deletions

6. **Task 6 (Integration)**: Added RegistrationList to service detail page:
   - Added below ServiceMetadataForm
   - Separated by border-top with padding
   - Passes isEditable based on service status (DRAFT only)

7. **Task 7 (Exports)**: Created index.ts exporting all 3 components.

8. **Task 8 (Tests)**: Created comprehensive tests:
   - RegistrationList.test.tsx: 12 tests covering rendering, loading, error, empty state, actions
   - RegistrationForm.test.tsx: 14 tests covering create mode, edit mode, validation, submission
   - DeleteRegistrationDialog.test.tsx: 14 tests covering rendering, delete action, cancel, error handling
   - Fixed ResizeObserver mock in test setup to use class-based mock

### File List

**Created:**
- `apps/web/src/lib/api/registrations.ts` - API client with types
- `apps/web/src/hooks/use-registrations.ts` - React Query hooks
- `apps/web/src/components/registrations/RegistrationList.tsx` - List component
- `apps/web/src/components/registrations/RegistrationForm.tsx` - Create/Edit form
- `apps/web/src/components/registrations/DeleteRegistrationDialog.tsx` - Delete confirmation
- `apps/web/src/components/registrations/index.ts` - Component exports
- `apps/web/src/components/registrations/RegistrationList.test.tsx` - List tests
- `apps/web/src/components/registrations/RegistrationForm.test.tsx` - Form tests
- `apps/web/src/components/registrations/DeleteRegistrationDialog.test.tsx` - Dialog tests

**Modified:**
- `apps/web/src/app/services/[id]/page.tsx` - Added RegistrationList section
- `apps/web/src/test/setup.ts` - Fixed ResizeObserver mock to use class

### Validation Results

- **Lint**: Passed (pnpm turbo run lint --filter=web)
- **Build**: Passed (pnpm turbo run build --filter=web)
- **Tests**: All 71 tests passing (pnpm turbo run test --filter=web)

## Code Review Record

### Issues Found and Resolved

1. **HIGH - Key Validation Regex**: Updated key validation regex from `/^[a-z0-9-]+$/` to `/^[a-z][a-z0-9-]*$/` to require starting with a letter (preventing keys like `123-abc`).

2. **HIGH - Description Field Max Length**: Added `maxLength={MAX_DESCRIPTION_LENGTH}` to description Textarea and added character counter (`{formData.description.length}/{MAX_DESCRIPTION_LENGTH} characters`).

3. **HIGH - Test Error Message Mismatch**: Updated test to match new key validation error message: "Key must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens".

### Post-Review Validation

- **Tests**: All 71 tests passing after code review fixes
- **Lint**: Passed
- **Build**: Passed

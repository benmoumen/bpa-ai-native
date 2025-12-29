# Story 2.2: Create New Service with Metadata

Status: complete

## Story

As a **Service Designer**,
I want to create a new government service with basic metadata,
So that I can begin configuring a service for my country.

## Acceptance Criteria

1. **AC1: Create Service Button**
   - Given the Service Designer is authenticated
   - When they click "New Service" card on the dashboard
   - Then a modal/dialog appears with service creation form

2. **AC2: Service Creation Form**
   - Given the dialog is open
   - When the Service Designer views the form
   - Then it displays fields:
     - Service Name (required, max 255 chars)
     - Description (optional, textarea)
     - Category (optional, max 100 chars)

3. **AC3: Form Validation**
   - Given the name field is empty
   - When the Service Designer attempts to submit
   - Then validation error is displayed
   - And the form is not submitted

4. **AC4: Successful Creation**
   - Given valid metadata is entered
   - When the Service Designer submits the form
   - Then a new service is created with status DRAFT
   - And the dialog closes
   - And the service list refreshes to show the new service
   - And a success toast is displayed

5. **AC5: Error Handling**
   - Given the API returns an error
   - When the Service Designer submits the form
   - Then an error message is displayed
   - And the form remains open for retry

6. **AC6: Loading State**
   - Given the form is being submitted
   - When the API call is in progress
   - Then the submit button shows loading state
   - And form inputs are disabled

## Tasks / Subtasks

- [x] **Task 1: Install Form Dependencies** (AC: 2, 3)
  - [x] 1.1 Add react-hook-form to web app
  - [x] 1.2 Add zod for validation
  - [x] 1.3 Add @hookform/resolvers for zod integration

- [x] **Task 2: Add UI Components** (AC: 1, 2)
  - [x] 2.1 Initialize shadcn/ui in web app (using Radix primitives + CVA)
  - [x] 2.2 Add Dialog component
  - [x] 2.3 Add Button component
  - [x] 2.4 Add Input component
  - [x] 2.5 Add Label component
  - [x] 2.6 Add Textarea component

- [x] **Task 3: Create API Client** (AC: 4, 5)
  - [x] 3.1 Create services API client module
  - [x] 3.2 Add createService function
  - [x] 3.3 Add TypeScript types for API response

- [x] **Task 4: Build CreateServiceDialog Component** (AC: 1, 2, 3, 4, 5, 6)
  - [x] 4.1 Create form schema with zod
  - [x] 4.2 Build dialog with form using react-hook-form
  - [x] 4.3 Add field validation with error messages
  - [x] 4.4 Add loading state during submission
  - [x] 4.5 Handle API errors with display

- [x] **Task 5: Integrate with Dashboard** (AC: 1, 4)
  - [x] 5.1 Make "New Service" card clickable
  - [x] 5.2 Add dialog state management
  - [ ] 5.3 Refresh service list on successful creation (deferred to Story 2.3)

- [x] **Task 6: Write Tests** (AC: all)
  - [x] 6.1 Unit tests for form validation
  - [x] 6.2 Component tests for dialog behavior
  - [x] 6.3 Integration tests for API calls (mocked)

## Dev Notes

### Architecture Patterns

**Form Handling:**
- react-hook-form for form state management
- zod for schema validation
- @hookform/resolvers for integration

**API Client Pattern:**
```typescript
// apps/web/src/lib/api/services.ts
export async function createService(data: CreateServiceInput): Promise<Service> {
  const response = await fetch('/api/v1/services', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create service');
  }
  return response.json();
}
```

**Component Structure:**
```
apps/web/src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   │   ├── dialog.tsx
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── textarea.tsx
│   └── services/
│       └── CreateServiceDialog.tsx
├── lib/
│   └── api/
│       └── services.ts        # API client
└── app/
    └── page.tsx               # Updated with dialog integration
```

### Form Schema

```typescript
const createServiceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().max(500).optional(),
  category: z.string().max(100).optional(),
});
```

### Key Dependencies

- `react-hook-form` - Form state management
- `zod` - Schema validation
- `@hookform/resolvers` - Connect zod to react-hook-form
- `@radix-ui/react-dialog` - Accessible dialog primitive

### References

- [Source: _bmad-output/project-planning-artifacts/epics.md#Story 2.2]
- [Source: apps/api/src/services/ - Backend API from Story 2.1]
- [Source: apps/web/src/app/page.tsx - Current dashboard layout]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5)

### Completion Notes List

1. **Dependencies installed**: react-hook-form@7.69.0, zod@4.2.1, @hookform/resolvers@5.2.2
2. **Radix UI primitives**: @radix-ui/react-dialog, @radix-ui/react-label, @radix-ui/react-slot
3. **CVA for variants**: class-variance-authority for component styling consistency
4. **Testing setup**: Vitest with @testing-library/react, jsdom, 13 tests passing
5. **Form validation**: Zod schema with reactive validation via react-hook-form
6. **API client pattern**: Fetch-based with typed responses and error handling
7. **Service list refresh** deferred to Story 2.3 when service list component is built
8. **Toast notification** deferred until toast component is added

### File List

**New Files Created:**
- `apps/web/src/components/ui/dialog.tsx` - Radix Dialog wrapper
- `apps/web/src/components/ui/button.tsx` - Button with CVA variants
- `apps/web/src/components/ui/input.tsx` - Input component
- `apps/web/src/components/ui/label.tsx` - Label component
- `apps/web/src/components/ui/textarea.tsx` - Textarea component
- `apps/web/src/components/ui/index.ts` - UI components barrel export
- `apps/web/src/lib/api/services.ts` - Services API client
- `apps/web/src/lib/api/index.ts` - API client barrel export
- `apps/web/src/components/services/CreateServiceDialog.tsx` - Main dialog component
- `apps/web/src/components/services/CreateServiceDialog.test.tsx` - Component tests
- `apps/web/src/components/services/index.ts` - Services barrel export
- `apps/web/vitest.config.ts` - Vitest configuration
- `apps/web/src/test/setup.ts` - Test setup with mocks

**Modified Files:**
- `apps/web/package.json` - Added dependencies and test scripts
- `apps/web/src/app/page.tsx` - Integrated CreateServiceDialog

# Story 2.6: Duplicate Existing Service

Status: done

## Story

As a **Service Designer**,
I want to duplicate an existing service,
So that I can create variations without starting from scratch.

## Acceptance Criteria

1. **AC1: Duplicate Button Visibility**
   - Given the Service Designer is viewing the service list
   - When viewing any service (DRAFT, PUBLISHED, or ARCHIVED)
   - Then a duplicate option is available in the actions dropdown menu

2. **AC2: Duplicate Service Creation**
   - Given the Service Designer clicks the duplicate option
   - When the duplication is processed
   - Then a new service is created with name "[Original Name] (Copy)"
   - And the duplicate has DRAFT status regardless of original status
   - And the duplicate copies description and category from the original

3. **AC3: Navigation After Duplicate**
   - Given the duplication succeeds
   - When the new service is created
   - Then the user is navigated to the new service's detail page
   - And the duplicate is immediately editable (since it's DRAFT)

4. **AC4: Error Handling**
   - Given the original service does not exist
   - When attempting to duplicate via API
   - Then a 404 error is returned
   - And an appropriate error message is shown to the user

## Technical Notes

### Dependencies
- Story 2.1: Service Database Model & API Foundation (done)
- Story 2.3: Service List with Search & Filter (done)

### API Endpoints
- `POST /api/v1/services/:id/duplicate`
  - Returns the newly created `Service` object on success
  - Returns 404 if original service not found
  - Duplicate always has DRAFT status

### Backend Implementation
- Add `duplicate(id: string, userId: string)` method to ServicesService
- Fetches original service via `findById()`
- Creates new service with modified name and DRAFT status
- Uses Prisma `create` with copied metadata

### Frontend Implementation
- `duplicateService` function in API client (`apps/web/src/lib/api/services.ts`)
- `useDuplicateService` React Query mutation hook (`apps/web/src/hooks/use-services.ts`)
- Duplicate option in dropdown menu (`apps/web/src/components/services/service-table.tsx`)
- Loading spinner during duplication
- Navigation to new service detail page on success

## Out of Scope
- Deep copying of related entities (registrations, form fields, etc.)
- Custom naming for duplicates (always uses "(Copy)" suffix)
- Bulk duplication
- Version linking between original and duplicate

---

## Implementation Notes (Completed 2025-12-30)

### API Changes
- `apps/api/src/services/services.service.ts` - Added `duplicate(id: string, userId: string)` method
- `apps/api/src/services/services.controller.ts` - Added `POST :id/duplicate` endpoint with Swagger docs

### Tests Added
- `apps/api/src/services/services.service.spec.ts` - 6 test cases for duplicate method:
  - Creates duplicate of existing service
  - Duplicates PUBLISHED service as DRAFT
  - Duplicates ARCHIVED service as DRAFT
  - Throws NotFoundException for non-existent service
  - Preserves description and category
  - Uses current user as createdBy

### Frontend Changes
- `apps/web/src/lib/api/services.ts` - Added `duplicateService` function
- `apps/web/src/hooks/use-services.ts` - Added `useDuplicateService` hook
- `apps/web/src/components/services/service-table.tsx` - Added dropdown menu with Edit, Duplicate, Delete options
- `apps/web/src/components/ui/dropdown-menu.tsx` - Created Radix UI dropdown menu component

### New Dependencies
- `@radix-ui/react-dropdown-menu` - Dropdown menu primitives for actions menu

### Technical Decisions
1. **All statuses can be duplicated**: Unlike delete (DRAFT only), any service can be duplicated
2. **Duplicate always DRAFT**: Enables immediate editing regardless of original status
3. **Navigation to detail page**: Uses existing `/services/[id]` route (not a separate edit route)
4. **Loading state on trigger button**: Shows spinner while duplicating
5. **Query invalidation**: Services list invalidated to show new duplicate

### Acceptance Criteria Status
- AC1: Dropdown menu with Duplicate option for all services
- AC2: Creates copy with "(Copy)" suffix and DRAFT status, preserving metadata
- AC3: Navigates to `/services/[newId]` where new service is editable
- AC4: NotFoundException thrown for non-existent service, handled by React Query

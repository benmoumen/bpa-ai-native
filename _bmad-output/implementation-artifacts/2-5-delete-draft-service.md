# Story 2.5: Delete Draft Service

Status: done

## Story

As a **Service Designer**,
I want to permanently delete a draft service,
So that I can remove services I no longer need.

## Acceptance Criteria

1. **AC1: Delete Button Visibility**
   - Given the Service Designer is viewing the service list
   - When a service has DRAFT status
   - Then a delete button is visible for that service
   - And for non-DRAFT services, the delete button is disabled with a tooltip explanation

2. **AC2: Delete Confirmation Dialog**
   - Given the Service Designer clicks the delete button
   - When the delete confirmation dialog appears
   - Then a clear warning is displayed that this action cannot be undone
   - And the service name is shown in the confirmation

3. **AC3: Successful Deletion**
   - Given the Service Designer confirms the deletion
   - When the service is successfully deleted
   - Then the service is removed from the database permanently
   - And the service list is refreshed
   - And the dialog closes

4. **AC4: Non-DRAFT Protection**
   - Given a service has PUBLISHED or ARCHIVED status
   - When attempting to delete via API
   - Then a 400 error is returned with clear message
   - And the service remains unchanged

## Technical Notes

### Dependencies
- Story 2.1: Service Database Model & API Foundation (done)
- Story 2.3: Service List with Search & Filter (done)

### API Endpoints
- `DELETE /api/v1/services/:id/permanent`
  - Returns `{ id: string, deleted: true }` on success
  - Returns 400 if service is not DRAFT
  - Returns 404 if service not found

### Backend Implementation
- Add `deletePermanently` method to ServicesService
- Check status === DRAFT before deletion
- Use Prisma `delete` for permanent removal

### Frontend Implementation
- `DeleteServiceDialog` component with warning message
- Delete button in service table Actions column
- Button disabled with tooltip for non-DRAFT services
- `useDeleteService` React Query mutation hook

## Out of Scope
- Soft delete (archiving is handled by separate endpoint)
- Bulk deletion
- Undo/restore after permanent delete
- Cascading deletes of related entities

---

## Implementation Notes (Completed 2025-12-30)

### API Changes
- `apps/api/src/services/services.service.ts` - Added `deletePermanently(id: string)` method
- `apps/api/src/services/services.controller.ts` - Added `DELETE :id/permanent` endpoint

### Tests Added
- `apps/api/src/services/services.service.spec.ts` - 4 test cases for deletePermanently
- `apps/api/src/services/services.controller.spec.ts` - 3 test cases for endpoint

### Frontend Changes
- `apps/web/src/lib/api/services.ts` - Added `deleteServicePermanently` function
- `apps/web/src/hooks/use-services.ts` - Added `useDeleteService` hook
- `apps/web/src/components/services/DeleteServiceDialog.tsx` - Confirmation dialog
- `apps/web/src/components/services/service-table.tsx` - Added Actions column with delete button
- `apps/web/src/components/services/index.ts` - Exported DeleteServiceDialog

### Technical Decisions
1. **Permanent delete path**: Used `/permanent` suffix to distinguish from soft delete
2. **Status validation in service layer**: BadRequestException thrown for non-DRAFT services
3. **Disabled button UX**: Button visible but disabled for non-DRAFT with native title tooltip
4. **React Query invalidation**: List invalidated and detail removed from cache on success

### Acceptance Criteria Status
- AC1: Delete button in Actions column, disabled for non-DRAFT with tooltip
- AC2: Warning dialog with red alert icon and service name
- AC3: Prisma delete + cache invalidation on success
- AC4: BadRequestException with clear message for non-DRAFT

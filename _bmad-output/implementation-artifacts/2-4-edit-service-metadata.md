# Story 2.4: Edit Service Metadata

Status: done

## Story

As a **Service Designer**,
I want to edit a service's name, description, and category,
So that I can correct or update service information before publication.

## Acceptance Criteria

1. **AC1: View Service Detail**
   - Given the Service Designer clicks on a service from the list
   - When the detail page loads
   - Then the current metadata is displayed (name, description, category, status)
   - And the page shows creation and last modified timestamps

2. **AC2: Edit Metadata**
   - Given the Service Designer is viewing a DRAFT service
   - When they access service settings
   - Then the metadata fields are editable
   - And changes can be saved

3. **AC3: Save Changes**
   - Given the Service Designer modifies metadata
   - When they save changes
   - Then the service is updated with new values
   - And `updatedAt` timestamp is refreshed
   - And a success notification is shown

4. **AC4: Published Service Warning**
   - Given the Service Designer views a PUBLISHED service
   - When they see the metadata
   - Then editing is disabled with a message explaining published services cannot be modified
   - (Future: FR46 - changes saved to draft version)

5. **AC5: Validation**
   - Given the Service Designer attempts to save with empty name
   - Then validation error is shown
   - And the save is prevented

## Technical Notes

### Dependencies
- Story 2.3: Service List with Search & Filter (done)

### API Endpoints (already implemented in 2.1)
- `GET /api/v1/services/:id` - Get service by ID
- `PATCH /api/v1/services/:id` - Update service metadata

### Frontend Implementation
- Service detail page at `/services/[id]`
- Editable form for metadata fields
- Save button with loading state
- Navigation back to list

### Components to Create
1. `ServiceDetailPage` - Main page component
2. `ServiceMetadataForm` - Editable form for name, description, category
3. Add `updateService` to API client
4. Add `useUpdateService` mutation hook

### State Management
- React Query mutation for updates
- Cache invalidation on successful update
- Optimistic updates (optional)

## Out of Scope
- Published → Draft versioning (FR46, future story)
- Audit log display (Story 9.2)
- Delete service (Story 2.5)

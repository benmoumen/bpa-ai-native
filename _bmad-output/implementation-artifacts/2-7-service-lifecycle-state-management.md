# Story 2.7: Service Lifecycle State Management

## Status: Done

## Story

**As a** service designer
**I want to** manage the lifecycle state of services (publish, archive, restore)
**So that** I can control which services are visible to applicants and manage deprecated services

## Acceptance Criteria

- [x] DRAFT services can be published to PUBLISHED status
- [x] PUBLISHED services can be archived to ARCHIVED status
- [x] ARCHIVED services can be restored to DRAFT status
- [x] State transitions are validated (only allowed transitions work)
- [x] Status badge shows appropriate colors for each state
- [x] Action buttons show only valid transitions for current state
- [x] Confirmation dialogs prevent accidental state changes

## Implementation Summary

### State Machine

```
DRAFT ──(publish)──> PUBLISHED
                          │
                     (archive)
                          │
                          v
                      ARCHIVED ──(restore)──> DRAFT
```

### API Endpoints

| Endpoint | Method | From Status | To Status |
|----------|--------|-------------|-----------|
| `/api/v1/services/:id/publish` | POST | DRAFT | PUBLISHED |
| `/api/v1/services/:id/archive` | POST | PUBLISHED | ARCHIVED |
| `/api/v1/services/:id/restore` | POST | ARCHIVED | DRAFT |

### Backend Files Modified/Created

- `apps/api/src/services/services.controller.ts` - Added publish, archive, restore endpoints
- `apps/api/src/services/services.service.ts` - Added state transition methods with validation
- `apps/api/src/services/services.controller.spec.ts` - Added 18 new tests for lifecycle transitions
- `apps/api/src/services/services.service.spec.ts` - Added service-level tests

### Frontend Files Modified/Created

- `apps/web/src/lib/api/services.ts` - Added `publishService()`, `archiveService()`, `restoreService()` API functions
- `apps/web/src/hooks/use-services.ts` - Added `usePublishService`, `useArchiveService`, `useRestoreService` mutation hooks
- `apps/web/src/components/services/ServiceStatusBadge.tsx` - New reusable status badge component
- `apps/web/src/components/services/ServiceActions.tsx` - New action buttons with confirmation dialogs
- `apps/web/src/components/services/index.ts` - Exported new components

### Component Details

#### ServiceStatusBadge

Displays colored badge based on service status:
- **DRAFT**: Yellow/amber badge
- **PUBLISHED**: Green badge
- **ARCHIVED**: Gray badge

```tsx
<ServiceStatusBadge status="DRAFT" />
<ServiceStatusBadge status="PUBLISHED" />
<ServiceStatusBadge status="ARCHIVED" />
```

#### ServiceActions

Provides action buttons with confirmation dialogs:
- **DRAFT** status shows "Publish" button
- **PUBLISHED** status shows "Archive" button
- **ARCHIVED** status shows "Restore to Draft" button

Each action opens a confirmation dialog with:
- Icon and title
- Service name highlighted
- Information message about the action
- Cancel and confirm buttons
- Loading state during API call
- Error display if action fails

```tsx
<ServiceActions
  serviceId="uuid"
  serviceName="My Service"
  status="DRAFT"
  onSuccess={() => console.log('Action completed')}
/>
```

### React Query Integration

Mutation hooks properly invalidate and update cache:
- Invalidate service list queries to reflect updated status
- Update service detail cache with new data from API response

### Validation Rules

Backend validates state transitions:
- Only DRAFT services can be published (returns 409 Conflict otherwise)
- Only PUBLISHED services can be archived (returns 409 Conflict otherwise)
- Only ARCHIVED services can be restored (returns 409 Conflict otherwise)
- Non-existent services return 404 Not Found

### Test Coverage

- **API Tests**: 110 tests passing (18 new for lifecycle)
- **Frontend Tests**: 28 tests passing

## Dependencies

- Story 2.1: Service Create Form (for initial DRAFT services)
- Badge component variants from shadcn/ui

## Notes

- The service-table component already displays status badges using the same variant pattern
- ServiceStatusBadge provides a standalone reusable component for consistent status display
- ServiceActions is designed to be placed in service detail pages or edit views

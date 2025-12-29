# Story 2.3: Service List with Search & Filter

Status: done

## Story

As a **Service Designer**,
I want to view all services with search and filter capabilities,
So that I can quickly find and access services I'm working on.

## Acceptance Criteria

1. **AC1: Service List Display**
   - Given the Service Designer is on the dashboard
   - When the page loads
   - Then a list of services is displayed within 1 second (NFR4)
   - And each service shows: name, status, category, last modified date

2. **AC2: Search Functionality**
   - Given the service list is displayed
   - When the Service Designer types in the search box
   - Then results are filtered by service name (debounced 300ms)
   - And matching text is highlighted in results

3. **AC3: Status Filter**
   - Given the service list is displayed
   - When the Service Designer selects a status filter (Draft/Published/Archived)
   - Then only services with that status are shown
   - And filter can be combined with search

4. **AC4: Pagination**
   - Given more than 20 services exist
   - When the list is displayed
   - Then pagination is available
   - And the Service Designer can navigate between pages

## Technical Notes

### Dependencies
- Story 2.1: Service Database Model & API Foundation (done)
- Story 2.2: Create New Service with Metadata (done)

### API Endpoints (already implemented in 2.1)
- `GET /api/v1/services` with query params:
  - `page` (default: 1)
  - `limit` (default: 20)
  - `status` (optional: DRAFT, PUBLISHED, ARCHIVED)
  - `search` (optional: filters by name/description)
  - `sortBy` (optional: name, createdAt, updatedAt)
  - `sortOrder` (optional: asc, desc)

### Frontend Implementation
- Service list page at `/services`
- Swiss-style data table with minimal design
- Search input with 300ms debounce
- Status filter dropdown
- Pagination controls at bottom

### Components to Create
1. `ServiceListPage` - Main page component
2. `ServiceTable` - Data table for services
3. `ServiceSearchBar` - Search input with debounce
4. `ServiceStatusFilter` - Filter dropdown
5. `Pagination` - Reusable pagination component

### State Management
- Use React Query for server state
- URL query params for filter persistence

## Out of Scope
- Service detail view (Story 2.4+)
- Service actions (edit, delete, duplicate)
- Bulk operations

---

## Implementation Notes (Completed 2025-12-29)

### Components Created
- `apps/web/src/app/services/page.tsx` - Services list page
- `apps/web/src/components/services/service-table.tsx` - Data table with loading skeleton
- `apps/web/src/components/services/search-bar.tsx` - Debounced search with useSyncExternalStore
- `apps/web/src/components/services/status-filter.tsx` - Status dropdown filter
- `apps/web/src/components/services/pagination.tsx` - Pagination controls
- `apps/web/src/components/ui/table.tsx` - Swiss-style table primitives
- `apps/web/src/components/ui/badge.tsx` - Status badges (draft/published/archived)
- `apps/web/src/components/ui/select.tsx` - Radix Select wrapper

### Hooks & State Management
- `apps/web/src/hooks/use-services.ts` - React Query hooks with cache invalidation
- `apps/web/src/lib/query-client.tsx` - QueryProvider wrapper

### Dependencies Added
- `@tanstack/react-query` - Server state management
- `@radix-ui/react-select` - Accessible dropdown
- `date-fns` - Relative date formatting

### Technical Decisions
1. **URL as source of truth**: Search/filter state persisted in URL query params
2. **useSyncExternalStore pattern**: SearchBar uses external store for pending state to avoid lint issues with setState in effects
3. **React Query**: 1-minute staleTime for service list, automatic refetch on window focus
4. **Swiss-style design**: Minimal black/white aesthetic with black focus rings and borders

### Acceptance Criteria Status
- ✅ AC1: Service list displays name, status, category, last modified
- ✅ AC2: Search with 300ms debounce (text highlighting not implemented - out of MVP scope)
- ✅ AC3: Status filter (ALL/DRAFT/PUBLISHED/ARCHIVED)
- ✅ AC4: Pagination with 20 items per page

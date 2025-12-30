# Story 2.9: Registration Database Model & API

## Status: Done

## Description

Implement the Registration entity and CRUD API to allow registrations to be created, managed, and associated with services. In the eRegistrations BPA domain, a Registration represents what applicants apply for within a Service (e.g., "Business License Application", "Import Permit").

## Acceptance Criteria

- [x] Registration model added to Prisma schema with proper relations
- [x] Auto-generated keys from name (slugified)
- [x] Compound unique constraint on (serviceId, key)
- [x] Full CRUD endpoints implemented
- [x] Unit tests for service and controller layers
- [x] Types exported from @bpa/types package

## Implementation Details

### Database Schema

Added Registration model to `packages/db/prisma/schema.prisma`:

```prisma
model Registration {
  id          String   @id @default(cuid())
  serviceId   String   @map("service_id")
  name        String   @db.VarChar(100)
  shortName   String   @db.VarChar(20) @map("short_name")
  key         String   @db.VarChar(50)
  description String?  @db.Text
  isActive    Boolean  @default(true) @map("is_active")
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  service Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@unique([serviceId, key])
  @@index([serviceId])
  @@index([isActive])
  @@map("registrations")
}
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/services/:serviceId/registrations` | Create registration within service |
| GET | `/api/services/:serviceId/registrations` | List registrations for service (paginated) |
| GET | `/api/registrations/:id` | Get single registration |
| PATCH | `/api/registrations/:id` | Update registration |
| DELETE | `/api/registrations/:id` | Soft delete (sets isActive=false) |

### Key Features

1. **Auto-generated key**: If `key` is not provided, it's auto-generated from `name` using slugification:
   - Lowercase
   - Replace spaces/underscores with hyphens
   - Remove non-alphanumeric characters

2. **Compound unique constraint**: Each service can only have one registration with a given key

3. **Soft delete pattern**: DELETE endpoint sets `isActive=false` rather than hard delete

4. **Pagination**: List endpoint supports page, limit, isActive filter, search, and custom sorting

### Files Created/Modified

**Created:**
- `apps/api/src/registrations/registrations.module.ts`
- `apps/api/src/registrations/registrations.service.ts`
- `apps/api/src/registrations/registrations.controller.ts`
- `apps/api/src/registrations/index.ts`
- `apps/api/src/registrations/dto/create-registration.dto.ts`
- `apps/api/src/registrations/dto/update-registration.dto.ts`
- `apps/api/src/registrations/dto/list-registrations-query.dto.ts`
- `apps/api/src/registrations/dto/registration-response.dto.ts`
- `apps/api/src/registrations/registrations.service.spec.ts`
- `apps/api/src/registrations/registrations.controller.spec.ts`

**Modified:**
- `packages/db/prisma/schema.prisma` - Added Registration model
- `packages/types/src/index.ts` - Added Registration types
- `apps/api/src/app.module.ts` - Registered RegistrationsModule

### Test Coverage

- **Service tests**: 18 tests covering create, findAllByService, findOne, update, remove
- **Controller tests**: 15 tests covering all endpoints and error handling

All tests pass (110 total in test suite).

## Technical Notes

- Follows existing patterns from ServicesModule exactly
- Uses NestJS module architecture with DI
- Full Swagger/OpenAPI documentation
- Proper error handling with NotFoundException and ConflictException
- Service validates parent service exists before creating registration

## Related Stories

- Story 2.1: Service Database Model (dependency)
- Story 2.2: Service CRUD API (pattern reference)

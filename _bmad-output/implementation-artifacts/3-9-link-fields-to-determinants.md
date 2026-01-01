# Story 3.9: Link Fields to Determinants

## Status: done

## Story

As a **Service Designer**,
I want to link form fields to determinants for business rule evaluation,
So that form data can drive workflow decisions and calculations.

## Acceptance Criteria

1. **Given** a field is selected in the form editor
   **When** the Service Designer opens advanced properties
   **Then** a "Link to Determinant" option is available

2. **Given** the linking dialog opens
   **When** the Service Designer clicks "Create Determinant"
   **Then** a new determinant is created with:
   - Name derived from field name
   - Type matching field type
   - Source pointing to this field

3. **Given** determinants exist in the service
   **When** the Service Designer links a field
   **Then** they can select from existing determinants
   **And** the link is bidirectionally visible

4. **Given** a field is linked to a determinant
   **When** the form is previewed with test data
   **Then** the determinant value updates based on field input

## Technical Implementation

### Tasks

1. **Create Determinant Database Model**
   - Add `Determinant` model to Prisma schema
   - Fields: id, serviceId, name, type, sourceFieldId, formula, isActive, timestamps
   - Create migration
   - Add relation to Service and FormField

2. **Create Determinant API Endpoints**
   - Create `apps/api/src/determinants/` module
   - Implement CRUD endpoints: GET, POST, PATCH, DELETE
   - Route: `/api/services/:serviceId/determinants`
   - Add validation for determinant creation

3. **Create Determinant Types**
   - Add `Determinant`, `DeterminantType` types to `packages/types/`
   - Types: STRING, NUMBER, BOOLEAN, DATE (matching field types)

4. **Create Frontend Determinant Hooks**
   - Create `apps/web/src/hooks/use-determinants.ts`
   - Implement useDeterminants, useCreateDeterminant, useLinkFieldToDeterminant

5. **Create Link to Determinant Dialog**
   - Create `apps/web/src/components/form-editor/LinkToDeterminantDialog.tsx`
   - Show list of existing service determinants
   - Create new determinant option
   - Auto-derive name and type from field

6. **Update Field Properties Panel**
   - Add "Link to Determinant" button to field advanced properties
   - Show linked determinant badge if linked
   - Allow unlinking

7. **Update Form Preview with Determinant Values**
   - Evaluate determinant values from field inputs
   - Display in preview debug panel

### File Structure

```
packages/db/prisma/schema.prisma (update)
packages/types/src/index.ts (update)
apps/api/src/determinants/
├── determinants.module.ts
├── determinants.controller.ts
├── determinants.controller.spec.ts
├── determinants.service.ts
├── determinants.service.spec.ts
└── dto/
    ├── create-determinant.dto.ts
    └── update-determinant.dto.ts
apps/web/src/hooks/use-determinants.ts
apps/web/src/lib/api/determinants.ts
apps/web/src/components/form-editor/
├── LinkToDeterminantDialog.tsx
└── DeterminantBadge.tsx
```

## Dependencies

- Story 3.4: Add Form Fields (field model)
- Story 3.5: Configure Field Properties (field properties panel)
- Story 3.8: Form Preview Rendering (preview integration)

## Dev Notes

### Determinant Type Mapping

| Field Type | Determinant Type |
|------------|-----------------|
| TEXT, EMAIL, PHONE, TEXTAREA | STRING |
| NUMBER | NUMBER |
| CHECKBOX | BOOLEAN |
| DATE | DATE |
| SELECT, RADIO | STRING |

### API Contract

```typescript
// GET /api/services/:serviceId/determinants
// Response: Determinant[]

// POST /api/services/:serviceId/determinants
// Body: { name, type, sourceFieldId?, formula? }
// Response: Determinant

// PATCH /api/determinants/:id
// Body: { name?, formula? }
// Response: Determinant

// DELETE /api/determinants/:id
// Response: void

// POST /api/form-fields/:fieldId/link-determinant
// Body: { determinantId }
// Response: FormField
```

### Prisma Schema Addition

```prisma
enum DeterminantType {
  STRING
  NUMBER
  BOOLEAN
  DATE
}

model Determinant {
  id            String          @id @default(cuid())
  serviceId     String          @map("service_id")
  name          String          @db.VarChar(100)
  type          DeterminantType
  sourceFieldId String?         @map("source_field_id")
  formula       String?         @db.Text // JSONata expression (for Epic 5)
  isActive      Boolean         @default(true) @map("is_active")
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")

  // Relations
  service      Service     @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  sourceField  FormField?  @relation("SourceField", fields: [sourceFieldId], references: [id], onDelete: SetNull)
  linkedFields FormField[] @relation("LinkedDeterminant")

  @@unique([serviceId, name])
  @@index([serviceId])
  @@index([isActive])
  @@map("determinants")
}
```

### FormField Update

```prisma
model FormField {
  // ... existing fields ...
  determinantId String? @map("determinant_id")

  // Relations
  determinant Determinant? @relation("LinkedDeterminant", fields: [determinantId], references: [id], onDelete: SetNull)
  derivedDeterminants Determinant[] @relation("SourceField")
}
```

### Project Structure Notes

- Follow existing patterns from forms module
- Use TanStack Query for data fetching
- Swiss-style minimal design for dialog
- Badge shows determinant name with link icon

### References

- [Source: epics.md#Story 3.9] - Original requirements
- [Source: epics.md#Epic 5] - Determinants & Business Rules (future expansion)
- [Source: architecture.md#Determinant] - Visibility Rule patterns
- [Source: bpa-api-mental-model-analysis.md#Determinant System] - Legacy determinant patterns
- [Source: 3-8-form-preview-rendering.md] - Previous story patterns

---

## Dev Agent Record

### Agent Model Used
claude-opus-4-5

### Debug Log References
- All 296 API tests pass
- Web build successful

### Completion Notes List
1. Created Determinant model in Prisma schema with DeterminantType enum (STRING, NUMBER, BOOLEAN, DATE)
2. Added bidirectional relations: Determinant -> FormField (sourceField, linkedFields)
3. Created full CRUD API for determinants at `/api/v1/services/:serviceId/determinants`
4. Created field linking endpoints at `/api/v1/form-fields/:fieldId/link-determinant`
5. Added frontend hooks: useDeterminants, useCreateDeterminant, useLinkFieldToDeterminant, useUnlinkFieldFromDeterminant
6. Created LinkToDeterminantDialog with create/select modes
7. Created DeterminantBadge component for field properties panel
8. Updated FieldPropertiesPanel with Business Rule Linking section
9. Added determinant debug panel to FormPreview with live value display

### File List
- packages/db/prisma/schema.prisma (updated)
- packages/types/src/index.ts (updated)
- apps/api/src/determinants/determinants.module.ts (created)
- apps/api/src/determinants/determinants.controller.ts (created)
- apps/api/src/determinants/determinants.service.ts (created)
- apps/api/src/determinants/determinants.service.spec.ts (created)
- apps/api/src/determinants/dto/create-determinant.dto.ts (created)
- apps/api/src/determinants/dto/update-determinant.dto.ts (created)
- apps/api/src/determinants/dto/determinant-response.dto.ts (created)
- apps/api/src/determinants/dto/list-determinants-query.dto.ts (created)
- apps/api/src/determinants/dto/index.ts (created)
- apps/api/src/determinants/index.ts (created)
- apps/api/src/app.module.ts (updated)
- apps/web/src/lib/api/determinants.ts (created)
- apps/web/src/lib/api/forms.ts (updated - added determinantId to FormField)
- apps/web/src/hooks/use-determinants.ts (created)
- apps/web/src/components/form-fields/LinkToDeterminantDialog.tsx (created)
- apps/web/src/components/form-fields/DeterminantBadge.tsx (created)
- apps/web/src/components/form-fields/FieldPropertiesPanel.tsx (updated)
- apps/web/src/components/form-fields/index.ts (updated)
- apps/web/src/components/form-preview/FormPreview.tsx (updated)
- apps/web/src/app/services/[serviceId]/forms/[formId]/page.tsx (updated)

# Story 3.6: Organize Fields into Sections

## Status: Done

## Story

**As a** Service Designer
**I want to** organize form fields into logical sections
**So that** forms are easier to navigate and complete for applicants

## Acceptance Criteria

1. **Add Section Button**
   - Form Editor displays "Add Section" button
   - Clicking creates a new section with default name "New Section"
   - New section appears at the end of the section list

2. **Section Properties**
   - Title: Editable section title
   - Description: Optional description text
   - Collapsible: Boolean toggle (UI preference, not persisted)

3. **Field-Section Assignment**
   - Fields can be moved into sections via dropdown action
   - "Move to Section" action shows list of available sections
   - Fields without section appear in "Unsectioned Fields" group

4. **Section Reordering**
   - Sections can be reordered (via sortOrder)
   - Section order persists to database

5. **Collapsible Sections**
   - Collapsible sections show expand/collapse toggle
   - Collapsed sections show field count badge
   - Collapse state is client-side only (not persisted)

6. **Section Management**
   - Edit section properties via side panel
   - Delete section (fields become unsectioned)

## Technical Notes

### Existing Infrastructure

The backend already supports sections:

**Database Schema (Prisma):**
```prisma
model FormSection {
  id              String   @id @default(cuid())
  formId          String   @map("form_id")
  parentSectionId String?  @map("parent_section_id")
  name            String   @db.VarChar(255)
  description     String?  @db.Text
  sortOrder       Int      @default(0)
  isActive        Boolean  @default(true)
  // ... timestamps and relations
}
```

**API Endpoints:**
- POST `/api/forms/:formId/sections` - Create section
- GET `/api/forms/:formId/sections` - List sections
- GET `/api/form-sections/:id` - Get single section
- PATCH `/api/form-sections/:id` - Update section
- DELETE `/api/form-sections/:id` - Soft delete

**FormField already has sectionId:**
```prisma
model FormField {
  sectionId  String?  @map("section_id")
  section    FormSection? @relation(...)
}
```

### Frontend Implementation

1. **API Client** (`apps/web/src/lib/api/forms.ts`):
   - Add FormSection type
   - Add CRUD functions for sections

2. **React Query Hooks** (`apps/web/src/hooks/use-form-sections.ts`):
   - useFormSections(formId)
   - useCreateFormSection()
   - useUpdateFormSection()
   - useDeleteFormSection()

3. **Components** (`apps/web/src/components/form-fields/`):
   - SectionList.tsx - Main container replacing FieldList
   - SectionHeader.tsx - Collapsible section header
   - SectionPropertiesPanel.tsx - Side panel for editing
   - Update FieldList.tsx with "Move to Section" action

4. **Form Editor Page**:
   - Replace FieldList with SectionList
   - Add section selection for properties panel

### UI Design

```
┌─────────────────────────────────────────────────────┐
│ Form: Application Form                    [Add Section] │
├─────────────────────────────────────────────────────┤
│ ▼ Personal Information (3 fields)           [⋮]    │
│   ├─ Full Name          Text     Required   [⋮]    │
│   ├─ Date of Birth      Date     Required   [⋮]    │
│   └─ Email Address      Email    Required   [⋮]    │
├─────────────────────────────────────────────────────┤
│ ► Contact Details (2 fields)                [⋮]    │  ← collapsed
├─────────────────────────────────────────────────────┤
│ ▼ Unsectioned Fields                               │
│   └─ Other Field        Text     Optional   [⋮]    │
└─────────────────────────────────────────────────────┘
```

## Tasks

- [x] Create story file
- [x] Extend forms.ts API client with FormSection types and functions
- [x] Create use-form-sections.ts React Query hooks
- [x] Create SectionList.tsx component
- [x] Create SectionHeader.tsx component
- [x] Create SectionPropertiesPanel.tsx component
- [x] Update FieldList.tsx with "Move to Section" action
- [x] Update Form Editor page to use SectionList
- [x] Write/update tests (existing tests pass)
- [x] Verify build passes

## Dev Notes

- The `isCollapsible` property mentioned in requirements is not in the schema
- Implementing collapse as UI-only state (localStorage or component state)
- Sections support nesting via parentSectionId (optional, not required for MVP)

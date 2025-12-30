# Story 2.8: Service Template Gallery

Status: done

## Story

As a **Service Designer**,
I want to select from a template gallery when creating new services,
So that I can quickly start with common government service patterns.

## Acceptance Criteria

1. **AC1: Template Option on Create**
   - Given the Service Designer clicks "Create Service"
   - When the creation dialog opens
   - Then a "Start from Template" option is available
   - And a "Start Blank" option is available (current behavior)

2. **AC2: Template Gallery Display**
   - Given the template gallery is shown
   - When the Service Designer browses templates
   - Then each template shows:
     - Template name and description
     - Preview thumbnail/icon
     - Number of forms included
     - Number of workflow steps included

3. **AC3: Create from Template**
   - Given a template is selected
   - When the Service Designer confirms selection
   - Then a new DRAFT service is created with:
     - Pre-configured metadata from template
     - Service name set to "[Template Name] (Copy)"
     - Template's description and category applied
   - And the user is redirected to the new service

4. **AC4: Start Blank Option**
   - Given the Service Designer prefers blank start
   - When they select "Start Blank"
   - Then the current create service dialog flow is used
   - And no template configuration is applied

5. **AC5: Template List Endpoint**
   - Given the frontend requests available templates
   - When calling GET /api/v1/templates
   - Then a list of templates is returned with:
     - id, name, description, category
     - previewImageUrl (optional)
     - formCount, workflowStepCount metadata

## Technical Notes

### Dependencies
- Story 2.1: Service Database Model & API Foundation (done)
- Story 2.2: Create New Service with Metadata (done)

### Database Schema

```prisma
model ServiceTemplate {
  id              String   @id @default(uuid())
  name            String
  description     String?
  category        String
  previewImageUrl String?

  // Metadata computed from config
  formCount       Int      @default(0)
  workflowSteps   Int      @default(0)

  // Template configuration stored as JSON
  config          Json     // { forms: [], workflow: {} }

  // System fields
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### API Endpoints

**List Templates**
- `GET /api/v1/templates`
- Returns: `{ data: Template[], meta: { total } }`
- No authentication required (templates are public)
- Query params: `?category=` for filtering

**Create from Template**
- `POST /api/v1/services/from-template/:templateId`
- Returns: `Service` (the newly created service)
- Requires authentication
- Creates DRAFT service with template config applied

### Backend Implementation

1. **TemplatesModule**
   - `apps/api/src/templates/templates.module.ts`
   - `apps/api/src/templates/templates.controller.ts`
   - `apps/api/src/templates/templates.service.ts`

2. **ServicesService Extension**
   - Add `createFromTemplate(templateId: string, userId: string)` method
   - Copy template config to new service
   - Set service name as "[Template Name] (Copy)"

3. **Template Seeding**
   - Seed database with starter templates:
     - "Business Registration" (5 forms, 3 steps)
     - "Import/Export License" (7 forms, 5 steps)
     - "Construction Permit" (4 forms, 4 steps)

### Frontend Implementation

1. **Template Gallery Component**
   - `apps/web/src/components/templates/TemplateGallery.tsx`
   - Grid/list view of available templates
   - Template card with thumbnail, name, description, counts

2. **Create Service Dialog Update**
   - Add tab/toggle: "Start Blank" vs "Start from Template"
   - Integrate TemplateGallery when "Start from Template" selected
   - Call `createFromTemplate` API when template selected

3. **API Client**
   - `apps/web/src/lib/api/templates.ts`
   - `getTemplates()` - fetch template list
   - `createServiceFromTemplate(templateId)` - create from template

4. **React Query Hooks**
   - `apps/web/src/hooks/use-templates.ts`
   - `useTemplates()` - list templates
   - `useCreateFromTemplate()` - mutation hook

### UI/UX Considerations

- Templates displayed in a responsive grid (3 columns on desktop, 1 on mobile)
- Placeholder thumbnail for templates without custom preview
- Template cards show category badge
- "Most Popular" or "Recently Added" badge for featured templates
- Loading skeleton while templates fetch

## Out of Scope

- Custom template creation by users (admin-only via DB)
- Template versioning
- Template preview with full form rendering
- Template import/export
- Template ratings or usage analytics

## Tasks / Subtasks

### Backend
- [x] Add ServiceTemplate model to Prisma schema
- [x] Create TemplatesModule with controller and service
- [x] Implement GET /api/v1/templates endpoint
- [x] Implement POST /api/v1/services/from-template/:templateId
- [x] Add template seed data (3 starter templates)
- [x] Write unit tests for templates service
- [x] Write unit tests for templates controller
- [x] Write tests for createFromTemplate in services service

### Frontend
- [x] Create templates API client functions
- [x] Create useTemplates and useCreateFromTemplate hooks
- [x] Create TemplateCard component
- [x] Create TemplateGallery component
- [x] Update CreateServiceDialog with template option
- [x] Add loading and error states
- [x] Write component tests

### Integration
- [x] Run pnpm build to verify no type errors
- [x] Run pnpm test to verify all tests pass
- [ ] Manual testing of template gallery flow

## Dev Notes

### Phase 1 Simplification
Since Epic 3 (Form Building) and Epic 4 (Workflow Configuration) are not yet implemented, templates in Phase 1 will only contain metadata (name, description, category). The `config` JSON field and form/workflow counts will be placeholders prepared for future expansion.

Template config structure (for future):
```json
{
  "forms": [
    { "type": "applicant", "name": "Application Form", "fields": [] }
  ],
  "workflow": {
    "steps": [
      { "name": "Submission", "roleType": "BOT" },
      { "name": "Review", "roleType": "HUMAN" }
    ]
  }
}
```

### Migration Strategy
1. Create ServiceTemplate table
2. Seed with placeholder templates
3. Templates become functional as form/workflow features are added

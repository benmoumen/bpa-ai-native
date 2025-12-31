# Story 3.8: Form Preview Rendering

## Status: done

## Story

As a **Service Designer**,
I want to preview how a form renders to applicants,
So that I can verify the form appearance before publication.

## Acceptance Criteria

1. **Given** the Service Designer is in the form editor
   **When** they click "Preview"
   **Then** a preview panel opens showing the form as applicants will see it
   **And** the preview renders within 2 seconds (NFR3)

2. **Given** the preview is displayed
   **When** the Service Designer interacts with fields
   **Then** conditional visibility rules are active
   **And** validation errors appear when rules are violated

3. **Given** the form has sections
   **When** the preview is displayed
   **Then** sections render with correct styling
   **And** collapsible sections can be expanded/collapsed

4. **Given** changes are made in the editor
   **When** the Service Designer refreshes preview
   **Then** the preview updates to reflect changes

## Technical Implementation

### Tasks

1. **Create FormPreview Component**
   - Create `apps/web/src/components/form-preview/` folder
   - Implement `FormPreview.tsx` - main preview container
   - Implement `FormPreviewSection.tsx` - renders sections with fields
   - Implement `FormPreviewField.tsx` - renders individual fields

2. **Field Type Renderers**
   - Create field renderers for each field type:
     - `TextPreview.tsx` - Text, Email, Phone, Textarea
     - `NumberPreview.tsx` - Number with validation
     - `SelectPreview.tsx` - Select, Radio, Checkbox
     - `DatePreview.tsx` - Date picker
     - `FilePreview.tsx` - File upload placeholder

3. **Visibility Rule Evaluation**
   - Implement `evaluateVisibilityRule.ts` utility
   - Apply visibility rules to fields and sections
   - Handle AND/OR logic for multiple conditions

4. **Validation Display**
   - Implement validation message display
   - Show required field errors
   - Show type-specific validation (min/max length, number range, etc.)

5. **Preview Panel Integration**
   - Add Preview button to form editor page
   - Implement split view or modal preview
   - Add refresh capability

### File Structure

```
apps/web/src/components/form-preview/
├── index.ts
├── FormPreview.tsx
├── FormPreviewSection.tsx
├── FormPreviewField.tsx
├── fields/
│   ├── index.ts
│   ├── TextPreview.tsx
│   ├── NumberPreview.tsx
│   ├── SelectPreview.tsx
│   ├── DatePreview.tsx
│   └── FilePreview.tsx
└── utils/
    ├── evaluateVisibilityRule.ts
    └── validateField.ts
```

## Dependencies

- Story 3.4: Add Form Fields (field types and properties)
- Story 3.6: Organize Fields into Sections (section structure)
- Story 3.7: Configure Conditional Visibility Rules (visibility rule structure)

## Dev Notes

- Use Swiss-style minimal design consistent with the editor
- Preview should be read-only but interactive (for testing visibility rules)
- Focus on applicant-facing view, not internal admin view

---

## Dev Agent Record

### File List

**New Files:**
- `apps/web/src/components/form-preview/index.ts` - Module exports
- `apps/web/src/components/form-preview/FormPreview.tsx` - Main preview container
- `apps/web/src/components/form-preview/FormPreviewSection.tsx` - Section renderer with collapsible
- `apps/web/src/components/form-preview/FormPreviewField.tsx` - Field renderer with validation
- `apps/web/src/components/form-preview/fields/index.ts` - Field type exports
- `apps/web/src/components/form-preview/fields/TextPreview.tsx` - Text/Email/Phone/Textarea
- `apps/web/src/components/form-preview/fields/NumberPreview.tsx` - Number with min/max
- `apps/web/src/components/form-preview/fields/SelectPreview.tsx` - Select/Radio/Checkbox
- `apps/web/src/components/form-preview/fields/DatePreview.tsx` - Date picker
- `apps/web/src/components/form-preview/fields/FilePreview.tsx` - File upload placeholder
- `apps/web/src/components/form-preview/utils/evaluateVisibilityRule.ts` - Visibility rule evaluation
- `apps/web/src/components/form-preview/utils/validateField.ts` - Field validation logic
- `apps/web/src/components/form-preview/utils/evaluateVisibilityRule.test.ts` - Visibility tests (32 tests)
- `apps/web/src/components/form-preview/utils/validateField.test.ts` - Validation tests (28 tests)

**Modified Files:**
- `apps/web/src/app/services/[serviceId]/forms/[formId]/page.tsx` - Added Preview button and panel integration

### Change Log

1. Created form-preview component folder structure per technical spec
2. Implemented FormPreview.tsx with validation summary, reset, and refresh
3. Implemented FormPreviewSection.tsx with collapsible sections
4. Implemented FormPreviewField.tsx with field type routing
5. Created all field type renderers (Text, Number, Select, Date, File)
6. Implemented evaluateVisibilityRule.ts with AND/OR logic support
7. Implemented validateField.ts with type-specific validation
8. Integrated FormPreview into form editor page with Preview button
9. Added accessibility improvements (aria-invalid, aria-describedby, id attributes)
10. Added empty options handling for Select/Radio fields
11. Created comprehensive unit tests (60 tests total)

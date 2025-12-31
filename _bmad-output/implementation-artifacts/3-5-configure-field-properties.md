# Story 3.5: Configure Field Properties

## Status: Done

## Story Description
When a field is selected in the form editor, a properties panel opens with configurable options for the field including common properties (label, name, placeholder, required, helpText) and type-specific properties.

## Acceptance Criteria
- [x] Clicking a field in FieldList opens a FieldPropertiesPanel
- [x] Common properties section with label, name, placeholder, required, helpText
- [x] Name auto-generates from label with option to unlink
- [x] Type-specific properties for TEXT (min/max length)
- [x] Type-specific properties for NUMBER (min/max value, decimal places)
- [x] Type-specific properties for SELECT/RADIO/CHECKBOX (options list with add/remove)
- [x] Type-specific properties for DATE (min/max date)
- [x] Type-specific properties for FILE (accepted types, max size)
- [x] Changes persist via API on save
- [x] Panel can be closed to return to field list view

## Technical Design

### Components Created
1. `FieldPropertiesPanel.tsx` - Main panel component with common properties
2. `TextFieldProperties.tsx` - minLength, maxLength inputs
3. `NumberFieldProperties.tsx` - min, max, decimalPlaces inputs
4. `SelectFieldProperties.tsx` - Options list editor with add/remove
5. `DateFieldProperties.tsx` - minDate, maxDate date pickers
6. `FileFieldProperties.tsx` - acceptedTypes array, maxSizeKB input

### Property Storage Schema
Properties are stored in the `FormField.properties` JSON field:

```typescript
// Common (in properties)
{ placeholder?: string; helpText?: string }

// TEXT field
{ minLength?: number; maxLength?: number }

// TEXTAREA field
{ minLength?: number; maxLength?: number }

// NUMBER field
{ min?: number; max?: number; decimalPlaces?: number }

// SELECT/RADIO/CHECKBOX field
{ options: Array<{ label: string; value: string }> }

// DATE field
{ minDate?: string; maxDate?: string }  // ISO date strings

// FILE field
{ acceptedTypes?: string[]; maxSizeKB?: number }
```

### State Management
- FieldList manages `selectedFieldId` state
- Selected field data passed to FieldPropertiesPanel
- Panel uses useUpdateFormField hook to persist changes
- Optimistic updates for better UX

## Implementation Tasks
- [x] Create story file
- [x] Create FieldPropertiesPanel component
- [x] Create TextFieldProperties component
- [x] Create NumberFieldProperties component
- [x] Create SelectFieldProperties component
- [x] Create DateFieldProperties component
- [x] Create FileFieldProperties component
- [x] Update FieldList to handle field selection
- [x] Update Form Editor page layout for panel
- [x] Add component tests
- [x] Update exports in index.ts

## Files Modified
- `apps/web/src/components/form-fields/FieldPropertiesPanel.tsx` (new)
- `apps/web/src/components/form-fields/TextFieldProperties.tsx` (new)
- `apps/web/src/components/form-fields/NumberFieldProperties.tsx` (new)
- `apps/web/src/components/form-fields/SelectFieldProperties.tsx` (new)
- `apps/web/src/components/form-fields/DateFieldProperties.tsx` (new)
- `apps/web/src/components/form-fields/FileFieldProperties.tsx` (new)
- `apps/web/src/components/form-fields/FieldList.tsx` (modified)
- `apps/web/src/components/form-fields/index.ts` (modified)
- `apps/web/src/app/services/[serviceId]/forms/[formId]/page.tsx` (modified)

## Test Coverage
- FieldPropertiesPanel renders with common properties
- Type-specific editors render correctly
- Options list add/remove works for SELECT fields
- Name auto-generation from label
- Save persists changes via API

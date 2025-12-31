# Story 3.7: Configure Conditional Visibility Rules

Status: ready-for-dev

## Story

As a **Service Designer**,
I want to configure conditional visibility rules for fields and sections,
So that forms adapt dynamically based on user input.

## Acceptance Criteria

### AC1: Visibility Mode Selection
**Given** a field or section is selected in the Form Editor
**When** the Service Designer opens the properties panel
**Then** a visibility mode selector is available with options:
  - Always visible (default)
  - Conditional visibility (rule-based)

### AC2: Simple Condition Configuration
**Given** conditional visibility is selected
**When** the Service Designer configures a rule
**Then** they can specify:
  - Source field (dropdown of other fields in the form)
  - Operator (equals, not equals, contains, greater than, less than, is empty, is not empty)
  - Value (comparison value - text input or dropdown based on source field type)

### AC3: Multiple Conditions with Logic
**Given** multiple conditions are needed
**When** the Service Designer adds conditions
**Then** they can combine with AND/OR logic
**And** nested condition groups are supported (optional for MVP)

### AC4: Rule Persistence
**Given** visibility rules are configured
**When** rules are saved
**Then** rules are stored in the field/section's visibilityRule JSON property
**And** rules reference field names correctly

### AC5: Rule Validation
**Given** visibility rules reference other fields
**When** saving the rule
**Then** the system validates that referenced fields exist
**And** prevents circular references (field can't depend on itself)

## Tasks / Subtasks

- [ ] Task 1: Database Schema Update (AC: #4)
  - [ ] 1.1 Add `visibilityRule` JSON field to FormField model
  - [ ] 1.2 Add `visibilityRule` JSON field to FormSection model
  - [ ] 1.3 Run `pnpm db:generate` and `pnpm db:push`
  - [ ] 1.4 Update packages/types with VisibilityRule interfaces

- [ ] Task 2: Backend DTO & Validation (AC: #4, #5)
  - [ ] 2.1 Define VisibilityRule TypeScript interfaces:
    - VisibilityMode: 'always' | 'conditional'
    - VisibilityCondition: { fieldName, operator, value }
    - VisibilityRule: { mode, conditions, logic ('AND' | 'OR') }
  - [ ] 2.2 Update UpdateFormFieldDto to accept visibilityRule
  - [ ] 2.3 Update UpdateFormSectionDto to accept visibilityRule
  - [ ] 2.4 Add validation for visibilityRule (referenced fields exist)

- [ ] Task 3: Frontend Types & API (AC: #1-4)
  - [ ] 3.1 Add VisibilityRule types to web/lib/api/forms.ts
  - [ ] 3.2 Ensure updateField mutation handles visibilityRule
  - [ ] 3.3 Ensure updateSection mutation handles visibilityRule

- [ ] Task 4: Visibility Rule Builder Component (AC: #1-3)
  - [ ] 4.1 Create VisibilityRuleBuilder.tsx component
  - [ ] 4.2 Create VisibilityConditionRow.tsx for single condition
  - [ ] 4.3 Create OperatorSelect.tsx with appropriate operators
  - [ ] 4.4 Create SourceFieldSelect.tsx (dropdown of form fields)
  - [ ] 4.5 Create ValueInput.tsx (dynamic based on source field type)

- [ ] Task 5: Integration into Properties Panels (AC: #1-4)
  - [ ] 5.1 Update FieldPropertiesPanel.tsx with visibility section
  - [ ] 5.2 Update SectionPropertiesPanel.tsx with visibility section
  - [ ] 5.3 Add visibility mode toggle (Always / Conditional)
  - [ ] 5.4 Show/hide VisibilityRuleBuilder based on mode

- [ ] Task 6: Tests (AC: #1-5)
  - [ ] 6.1 Write unit tests for VisibilityRuleBuilder
  - [ ] 6.2 Write tests for condition add/remove/edit
  - [ ] 6.3 Write tests for validation (circular reference prevention)
  - [ ] 6.4 Verify existing tests still pass

- [ ] Task 7: Build & Verification
  - [ ] 7.1 Run `pnpm build` - ensure no TypeScript errors
  - [ ] 7.2 Run `pnpm test` - all tests passing
  - [ ] 7.3 Run `pnpm lint` - no new errors

## Dev Notes

### Database Schema Change

Add `visibilityRule` JSON field to both FormField and FormSection:

```prisma
model FormField {
  // ... existing fields
  visibilityRule Json? @map("visibility_rule") // Visibility rule configuration
}

model FormSection {
  // ... existing fields
  visibilityRule Json? @map("visibility_rule") // Visibility rule configuration
}
```

### VisibilityRule JSON Structure

```typescript
// packages/types/src/index.ts

export type VisibilityMode = 'always' | 'conditional';

export type VisibilityOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty';

export interface VisibilityCondition {
  fieldName: string;      // Reference to another field's name
  operator: VisibilityOperator;
  value?: string | number | boolean; // Required for most operators, optional for is_empty/is_not_empty
}

export interface VisibilityRule {
  mode: VisibilityMode;
  conditions?: VisibilityCondition[];
  logic?: 'AND' | 'OR';   // How to combine multiple conditions (default: AND)
}
```

### Operator Mapping to JSON Rules Engine

For future Story 3.8 (Form Preview), the visibility rules will be converted to JSON Rules Engine format:

```typescript
// Example conversion (not implemented in this story)
const ruleToJsonRulesEngine = (rule: VisibilityRule): EngineRule => ({
  conditions: {
    [rule.logic || 'all']: rule.conditions?.map(c => ({
      fact: c.fieldName,
      operator: mapOperator(c.operator),
      value: c.value,
    })),
  },
  event: { type: 'visible' },
});
```

### Component Structure

```
apps/web/src/components/form-fields/
├── visibility/
│   ├── index.ts
│   ├── VisibilityRuleBuilder.tsx    # Main container
│   ├── VisibilityConditionRow.tsx   # Single condition row
│   ├── OperatorSelect.tsx           # Operator dropdown
│   ├── SourceFieldSelect.tsx        # Field picker dropdown
│   └── ValueInput.tsx               # Dynamic value input
├── FieldPropertiesPanel.tsx         # (update) Add visibility section
└── SectionPropertiesPanel.tsx       # (update) Add visibility section
```

### UI Design

```
┌─────────────────────────────────────────────────────────────────┐
│ Field Properties: Business Type                                  │
├─────────────────────────────────────────────────────────────────┤
│ Label: [Business Type            ]                               │
│ Required: [x]                                                    │
│ ...                                                              │
├─────────────────────────────────────────────────────────────────┤
│ Visibility                                                       │
│ ○ Always visible                                                 │
│ ● Conditional                                                    │
│                                                                  │
│ Show this field when:                                            │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Country        ▼] [equals    ▼] [United States    ]   [×] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ [AND ▼]                                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [Business Size  ▼] [is not empty ▼] [                 ]  [×]│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [+ Add Condition]                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Previous Story Learnings (from 3.6)

1. **State Pattern**: Use inverted state (collapsedSections) to avoid setState in render
2. **React Query**: Mutations already handle optimistic updates and cache invalidation
3. **Component Pattern**: Split into container (SectionList) + presentational (SectionHeader)
4. **Validation**: JSON properties allow flexible type-specific config storage

### Project Structure Notes

- Follow established NestJS module pattern (controller → service → dto)
- Use class-validator for DTO validation
- Response DTOs have static `fromEntity()` methods
- Frontend uses React Query hooks with proper cache invalidation
- Swiss-style minimal design with black borders

### References

- [Source: project-context.md#JSON Rules Engine] - RulesEngineService pattern
- [Source: project-context.md#JSONata Expression Engine] - Expression patterns
- [Source: epics.md#Story 3.7] - Original requirements
- [Source: epics.md#Story 5.4] - Future determinant integration (deferred)
- [Source: 3-6-organize-fields-into-sections.md] - Previous story patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5)

### Debug Log References

### Completion Notes List

### File List

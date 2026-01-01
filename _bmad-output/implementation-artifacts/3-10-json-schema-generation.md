# Story 3.10: JSON Schema Generation

## Status: done

## Story

As a **System**,
I want to generate JSON Schema representation of form configuration,
So that forms can be rendered by JSON Forms and validated consistently.

## Acceptance Criteria

1. **Given** a form exists with fields and sections
   **When** the form schema is requested via API
   **Then** a JSON Schema is generated and returned
   **And** the schema reflects current form configuration

2. **Given** the generated JSON Schema
   **When** it is inspected
   **Then** it includes:
   - Properties for each field with correct JSON Schema types
   - Required array for mandatory fields
   - Validation keywords (minLength, maxLength, minimum, maximum, pattern, etc.)
   - Format keywords for specialized types (email, date, phone)

3. **Given** a form has sections
   **When** JSON Schema is generated
   **Then** a companion UI schema is also generated
   **And** the UI schema organizes fields by section with layout hints

4. **Given** a form has conditional visibility rules
   **When** JSON Schema is generated
   **Then** rules are included in a companion rules document
   **And** can be evaluated by JSON Rules Engine at runtime

5. **Given** the form configuration changes
   **When** the schema is requested again
   **Then** the updated JSON Schema reflects the changes
   **And** version info is included in the response

## Technical Implementation

### Tasks

1. **Create JSON Schema Generator Service**
   - Create `apps/api/src/forms/schema-generator.service.ts`
   - Implement `generateJsonSchema(formId)` method
   - Map field types to JSON Schema types
   - Extract validation rules from field properties
   - Handle required fields

2. **Create UI Schema Generator**
   - Add `generateUiSchema(formId)` method to schema generator
   - Organize fields by sections with layout directives
   - Include section titles and descriptions
   - Respect sortOrder for field/section ordering

3. **Create Rules Export for Visibility**
   - Add `generateVisibilityRules(formId)` method
   - Convert visibility rules to JSON Rules Engine format
   - Support field AND section visibility rules

4. **Create Schema API Endpoint**
   - Add `GET /api/v1/forms/:formId/schema` endpoint
   - Response includes: `{ jsonSchema, uiSchema, rules, version }`
   - Version computed from form updatedAt timestamp

5. **Create Shared Types**
   - Add `GeneratedFormSchema` type to `packages/types/`
   - Include JsonSchema7, UiSchema, VisibilityRulesExport interfaces

6. **Create Frontend Hook**
   - Create `apps/web/src/hooks/use-form-schema.ts`
   - Implement `useFormSchema(formId)` with caching

7. **Update Form Preview to Use Generated Schema**
   - Optionally show raw schema in debug panel
   - Validate preview renders match schema expectations

### File Structure

```
apps/api/src/forms/
├── schema-generator.service.ts (new)
├── schema-generator.service.spec.ts (new)
├── dto/
│   └── form-schema-response.dto.ts (new)
├── forms.controller.ts (update - add schema endpoint)
└── forms.module.ts (update - add SchemaGeneratorService)
packages/types/src/index.ts (update - add schema types)
apps/web/src/lib/api/forms.ts (update - add getFormSchema)
apps/web/src/hooks/use-form-schema.ts (new)
```

## Dev Notes

### Field Type to JSON Schema Mapping

| Field Type | JSON Schema Type | Format | Additional |
|------------|-----------------|--------|------------|
| TEXT | `string` | - | minLength, maxLength, pattern |
| TEXTAREA | `string` | - | minLength, maxLength |
| EMAIL | `string` | `email` | pattern for email validation |
| PHONE | `string` | - | pattern for phone validation |
| NUMBER | `number` | - | minimum, maximum, multipleOf |
| DATE | `string` | `date` | minDate/maxDate via pattern |
| CHECKBOX | `boolean` | - | - |
| SELECT | `string` | - | enum from options |
| RADIO | `string` | - | enum from options |
| FILE | `string` | `data-url` | maxSize via custom keyword |

### JSON Schema Structure

```typescript
interface GeneratedJsonSchema {
  $schema: "http://json-schema.org/draft-07/schema#";
  type: "object";
  title: string; // Form name
  properties: Record<string, JsonSchemaProperty>;
  required: string[]; // Field names where required=true
}

interface JsonSchemaProperty {
  type: "string" | "number" | "boolean" | "integer";
  title: string; // Field label
  description?: string; // Field helpText
  format?: "email" | "date" | "data-url";
  enum?: string[]; // For SELECT/RADIO
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  default?: unknown;
}
```

### UI Schema Structure (JSON Forms)

```typescript
interface GeneratedUiSchema {
  type: "VerticalLayout" | "Group";
  elements: UiSchemaElement[];
}

interface UiSchemaElement {
  type: "Control" | "Group" | "VerticalLayout" | "HorizontalLayout";
  scope?: string; // "#/properties/fieldName"
  label?: string; // Section name or field label override
  elements?: UiSchemaElement[]; // For Group/Layout types
  options?: {
    multi?: boolean; // For textarea
    format?: string; // Custom format hints
  };
}
```

### Visibility Rules Export

```typescript
interface VisibilityRulesExport {
  fields: VisibilityRuleMapping[];
  sections: VisibilityRuleMapping[];
}

interface VisibilityRuleMapping {
  targetId: string; // Field or Section ID
  targetName: string; // Field name or Section name
  rule: JsonRulesEngineRule; // Compatible with json-rules-engine
}

interface JsonRulesEngineRule {
  conditions: {
    all?: Condition[];
    any?: Condition[];
  };
  event: {
    type: "visible" | "hidden";
  };
}
```

### API Contract

```typescript
// GET /api/v1/forms/:formId/schema
// Response: FormSchemaResponse

interface FormSchemaResponse {
  formId: string;
  formName: string;
  version: string; // ISO timestamp of form.updatedAt
  jsonSchema: GeneratedJsonSchema;
  uiSchema: GeneratedUiSchema;
  rules: VisibilityRulesExport;
}
```

### Implementation Pattern (SchemaGeneratorService)

```typescript
@Injectable()
export class SchemaGeneratorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async generateFormSchema(formId: string): Promise<FormSchemaResponse> {
    // 1. Fetch form with fields and sections (active only)
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: {
        fields: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        sections: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      },
    });

    // 2. Generate JSON Schema
    const jsonSchema = this.buildJsonSchema(form);

    // 3. Generate UI Schema with sections
    const uiSchema = this.buildUiSchema(form);

    // 4. Export visibility rules
    const rules = this.exportVisibilityRules(form);

    return {
      formId: form.id,
      formName: form.name,
      version: form.updatedAt.toISOString(),
      jsonSchema,
      uiSchema,
      rules,
    };
  }

  private buildJsonSchema(form: FormWithFieldsAndSections): GeneratedJsonSchema {
    const properties: Record<string, JsonSchemaProperty> = {};
    const required: string[] = [];

    for (const field of form.fields) {
      properties[field.name] = this.fieldToJsonSchema(field);
      if (field.required) {
        required.push(field.name);
      }
    }

    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      title: form.name,
      properties,
      required,
    };
  }

  private fieldToJsonSchema(field: FormField): JsonSchemaProperty {
    // Implementation per field type mapping table above
  }
}
```

### Project Structure Notes

- Follow existing FormsService patterns for Prisma queries
- Use existing DTO patterns with class-validator decorators
- Schema endpoint is GET-only (no mutations)
- Consider caching schema generation for performance (optional optimization)
- Version string uses form.updatedAt for cache invalidation

### Previous Story Learnings (Story 3.9)

- Determinants module created at `apps/api/src/determinants/`
- Field properties stored as JSON with type-specific keys
- Visibility rules already use JSON-compatible structure
- FormPreview already evaluates visibility rules client-side
- All 296 API tests passing - maintain test coverage

### References

- [Source: epics.md#Story 3.10] - Original requirements
- [Source: architecture.md#JSON Forms] - Form rendering technology choice
- [Source: project-context.md#JSON Forms] - Custom renderer patterns
- [Source: 3-9-link-fields-to-determinants.md] - Previous story patterns
- [Source: forms.service.ts] - Existing forms API patterns

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5)

### Debug Log References

N/A

### Completion Notes List

1. **SchemaGeneratorService** - Full implementation with JSON Schema Draft-07 generation, UI Schema for JSON Forms, and visibility rules in JSON Rules Engine format
2. **Field Type Mapping** - All field types mapped correctly:
   - TEXT/TEXTAREA → string
   - NUMBER → number
   - EMAIL → string with format "email" and pattern
   - CHECKBOX → boolean
   - SELECT/RADIO → string with enum/enumNames
   - DATE → string with format "date"
   - FILE → string with format "data-url"
3. **UI Schema Generation** - Properly organizes fields by sections using Group elements, handles orphaned fields, respects sortOrder
4. **Visibility Rules Export** - Converts internal visibility rules to JSON Rules Engine format with conditions and events
5. **API Endpoint** - `GET /forms/:id/schema` returns FormSchemaResponse with versioning
6. **Frontend Integration** - useFormSchema hook with React Query caching, Schema debug panel in FormPreview
7. **Test Coverage** - 15 comprehensive tests covering all field types, sections, visibility rules, versioning

### File List

**Created:**
- `apps/api/src/forms/schema-generator.service.ts` - Core schema generation service
- `apps/api/src/forms/schema-generator.service.spec.ts` - Unit tests (15 tests)
- `apps/api/src/forms/dto/form-schema-response.dto.ts` - Swagger-documented DTO
- `apps/web/src/hooks/use-form-schema.ts` - React Query hook

**Updated:**
- `apps/api/src/forms/forms.controller.ts` - Added schema endpoint
- `apps/api/src/forms/forms.module.ts` - Added SchemaGeneratorService provider
- `packages/types/src/index.ts` - Added form schema generation types
- `apps/web/src/lib/api/forms.ts` - Added getFormSchema function
- `apps/web/src/components/form-preview/FormPreview.tsx` - Added Schema debug panel

# ADR-001: Field Reference Consistency Strategy

**Status**: Accepted
**Date**: 2026-01-01
**Decision Makers**: Architecture Team
**Context**: Epic 4 (Workflow Configuration), Epic 5 (Determinants)

---

## Context

Form fields can be referenced in multiple locations throughout the system:

| Reference Location | Storage Type | Example |
|-------------------|--------------|---------|
| `Determinant.sourceFieldId` | Relational FK | Direct field link |
| `Determinant.formula` | JSONata expression | `$field.f_abc123 * 1.1` |
| `Role.conditions` | JSON Rules Engine | `{"field": "$field.f_xyz"}` |
| `RoleStatus.conditions` | JSON | Conditional status display |
| `WorkflowTransition.conditions` | JSON | Routing conditions |
| `FormField.visibilityRule` | JSON | Show/hide logic |
| `Cost.formula` | JSONata | `$field.f_quantity * 10` |
| `BotMapping.sourceField` | Relational (by name) | Field name mapping |

**The Problem**: When a field is deleted, JSON-embedded references become orphaned. Unlike relational FKs, the database cannot automatically enforce referential integrity for string references inside JSON columns.

**Requirements**:
1. Prevent deletion of fields that are referenced elsewhere
2. Provide clear feedback about what references a field
3. Support field renames without breaking references
4. Validate expressions contain only valid field references
5. Cannot be bypassed (even by direct SQL)

---

## Decision

We adopt a **hybrid data-first approach** that combines:

1. **Database-level enforcement** (triggers, FK constraints) for consistency guarantees
2. **Application-level services** for user experience (preview, rich errors)

### Core Design Principles

1. **Stable Field Identifiers**: Each field has an immutable `fieldId` (separate from mutable `name`)
2. **Reference Registry**: A `field_references` table tracks all usages, auto-populated by triggers
3. **FK Constraint**: Delete blocked at database level via `ON DELETE RESTRICT`
4. **Expression Validation**: Triggers validate field references on save

---

## Conceptual Model: The Compilation Analogy

This design mirrors how compilers handle symbol resolution and linking. Understanding this analogy helps reason about the system:

### Mapping to Compiler Concepts

| Compiler Concept | Our System | Purpose |
|------------------|------------|---------|
| **Source Code** | User-authored expressions | Human-readable, uses field names |
| **Symbols** | Field names (`businessName`) | Human-friendly identifiers |
| **Symbol Table** | `field_references` table | Tracks all symbol usages |
| **Object Code** | Stored expressions | Contains resolved references |
| **Addresses** | Stable `fieldId` (`f_clyq123`) | Machine-stable identifiers |
| **Compile Errors** | Save-time validation | "Undefined symbol" on invalid ref |
| **Linker Errors** | Delete blocked | "Symbol in use" prevents removal |

### The Compilation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  SOURCE (Human-Authored)           OBJECT (Machine-Stored)      │
│                                                                 │
│  "Calculate tax on revenue"   ──►  $field.f_clyq123abc * 0.15  │
│         ▲                                    │                  │
│         │ display                            │ store            │
│         │                                    ▼                  │
│  ┌──────┴──────┐                    ┌───────────────┐          │
│  │ Symbol Table │◄───── sync ───────│ field_refs DB │          │
│  │  (runtime)   │                   │  (persisted)  │          │
│  └─────────────┘                    └───────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Error Types (Compiler Parallels)

| Phase | Compiler Error | Our Error | When |
|-------|---------------|-----------|------|
| **Compile** | "Undefined symbol 'foo'" | `INVALID_FIELD_REFS` | Saving expression with non-existent field |
| **Link** | "Symbol 'foo' still referenced" | `FIELD_IN_USE` | Deleting field that's still referenced |

### Why This Analogy Matters

1. **Separation of concerns**: Human-readable names vs machine-stable addresses
2. **Deferred resolution**: References resolved at "compile time" (save), not "runtime"
3. **Safe refactoring**: Rename symbols without breaking addresses
4. **Dependency tracking**: Symbol table knows all usages
5. **IDE-like tooling**: Find All References, Safe Delete, Safe Rename

### Tooling Enabled by This Model

```
┌────────────────────────────────────────────────────────────────┐
│  IDE-Like Operations (powered by field_references table)       │
├────────────────────────────────────────────────────────────────┤
│  Find All References  │  SELECT * FROM field_references        │
│                       │  WHERE field_id = 'f_xyz'              │
├───────────────────────┼────────────────────────────────────────┤
│  Safe Rename          │  UPDATE form_fields SET name = 'new'   │
│                       │  WHERE field_id = 'f_xyz'              │
│                       │  (expressions unchanged - use fieldId) │
├───────────────────────┼────────────────────────────────────────┤
│  Safe Delete          │  1. Check field_references count       │
│                       │  2. Show blockers if any               │
│                       │  3. FK constraint enforces at DB level │
├───────────────────────┼────────────────────────────────────────┤
│  Unused Field Finder  │  SELECT * FROM form_fields ff          │
│                       │  WHERE NOT EXISTS (                    │
│                       │    SELECT 1 FROM field_references fr   │
│                       │    WHERE fr.field_id = ff.field_id     │
│                       │  )                                     │
└───────────────────────┴────────────────────────────────────────┘
```

---

## Architecture

### Schema Changes

```prisma
model FormField {
  id        String   @id @default(cuid())
  fieldId   String   @unique @default(cuid()) @map("field_id")  // Immutable after creation
  formId    String   @map("form_id")
  name      String   @db.VarChar(100)  // Mutable display name
  // ... other fields

  @@map("form_fields")
}

model FieldReference {
  id                    String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  fieldId               String   @map("field_id")
  referencingEntityType String   @map("referencing_entity_type")
  referencingEntityId   String   @map("referencing_entity_id")
  expressionPath        String?  @map("expression_path")
  createdAt             DateTime @default(now()) @map("created_at")

  @@unique([fieldId, referencingEntityType, referencingEntityId])
  @@index([fieldId])
  @@map("field_references")
}
```

### Expression Syntax

All expressions reference fields by stable `fieldId`, not mutable `name`:

```jsonata
// JSONata formula
$field.f_clyq123abc * 1.1

// JSON Rules Engine condition
{
  "conditions": {
    "all": [{
      "fact": "formData",
      "path": "$.fields.$field.f_xyz789def",
      "operator": "equal",
      "value": "approved"
    }]
  }
}
```

### Database Components

#### 1. Reference Extraction Function

```sql
-- Extract field references from any text (JSONB, JSONata, etc.)
CREATE OR REPLACE FUNCTION extract_field_refs(content text)
RETURNS text[] AS $$
  SELECT COALESCE(
    array_agg(DISTINCT match[1]),
    ARRAY[]::text[]
  )
  FROM regexp_matches(content, '\$field\.([a-zA-Z0-9_]+)', 'g') AS match;
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE;
```

#### 2. Auto-Sync Trigger Function

```sql
CREATE OR REPLACE FUNCTION sync_field_references()
RETURNS TRIGGER AS $$
DECLARE
  combined_content text;
  refs text[];
BEGIN
  -- Combine all expression columns (adjust per table)
  combined_content := COALESCE(NEW.conditions::text, '')
                   || COALESCE(NEW.formula, '')
                   || COALESCE(NEW.visibility_rule::text, '');

  -- Extract field references
  refs := extract_field_refs(combined_content);

  -- Clear old references for this entity
  DELETE FROM field_references
  WHERE referencing_entity_type = TG_TABLE_NAME
    AND referencing_entity_id = NEW.id;

  -- Insert new references (if any)
  IF array_length(refs, 1) > 0 THEN
    INSERT INTO field_references (field_id, referencing_entity_type, referencing_entity_id)
    SELECT unnest(refs), TG_TABLE_NAME, NEW.id
    ON CONFLICT (field_id, referencing_entity_type, referencing_entity_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 3. Triggers Per Table

```sql
-- Determinants
CREATE TRIGGER sync_field_refs_determinants
  AFTER INSERT OR UPDATE ON determinants
  FOR EACH ROW EXECUTE FUNCTION sync_field_references();

-- Roles
CREATE TRIGGER sync_field_refs_roles
  AFTER INSERT OR UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION sync_field_references();

-- Role Statuses
CREATE TRIGGER sync_field_refs_role_statuses
  AFTER INSERT OR UPDATE ON role_statuses
  FOR EACH ROW EXECUTE FUNCTION sync_field_references();

-- Workflow Transitions
CREATE TRIGGER sync_field_refs_transitions
  AFTER INSERT OR UPDATE ON workflow_transitions
  FOR EACH ROW EXECUTE FUNCTION sync_field_references();

-- Form Fields (visibility rules)
CREATE TRIGGER sync_field_refs_form_fields
  AFTER INSERT OR UPDATE ON form_fields
  FOR EACH ROW EXECUTE FUNCTION sync_field_references();

-- Costs
CREATE TRIGGER sync_field_refs_costs
  AFTER INSERT OR UPDATE ON costs
  FOR EACH ROW EXECUTE FUNCTION sync_field_references();

-- Cleanup on delete
CREATE TRIGGER cleanup_field_refs_on_delete
  AFTER DELETE ON determinants
  FOR EACH ROW EXECUTE FUNCTION cleanup_field_references();
-- (repeat for each table)
```

#### 4. FK Constraint (Block Delete)

```sql
ALTER TABLE field_references
  ADD CONSTRAINT fk_field_references_field
  FOREIGN KEY (field_id)
  REFERENCES form_fields(field_id)
  ON DELETE RESTRICT;
```

#### 5. Rich Error Trigger

```sql
CREATE OR REPLACE FUNCTION block_field_delete_with_details()
RETURNS TRIGGER AS $$
DECLARE
  ref_count int;
  ref_details jsonb;
BEGIN
  SELECT
    count(*),
    jsonb_agg(jsonb_build_object(
      'type', referencing_entity_type,
      'id', referencing_entity_id,
      'path', expression_path
    ))
  INTO ref_count, ref_details
  FROM field_references
  WHERE field_id = OLD.field_id;

  IF ref_count > 0 THEN
    RAISE EXCEPTION 'FIELD_IN_USE::%::%', OLD.field_id, ref_details
      USING ERRCODE = 'P0001';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_field_delete
  BEFORE DELETE ON form_fields
  FOR EACH ROW EXECUTE FUNCTION block_field_delete_with_details();
```

#### 6. Expression Validation Trigger

```sql
CREATE OR REPLACE FUNCTION validate_field_refs_exist()
RETURNS TRIGGER AS $$
DECLARE
  combined_content text;
  refs text[];
  missing text[];
  service_id_val text;
BEGIN
  -- Get service_id (adjust based on table structure)
  service_id_val := COALESCE(
    NEW.service_id,
    (SELECT service_id FROM roles WHERE id = NEW.role_id),
    (SELECT f.service_id FROM forms f JOIN form_fields ff ON ff.form_id = f.id WHERE ff.id = NEW.id)
  );

  -- Combine expression columns
  combined_content := COALESCE(NEW.conditions::text, '')
                   || COALESCE(NEW.formula, '');

  refs := extract_field_refs(combined_content);

  IF array_length(refs, 1) > 0 THEN
    -- Find references that don't exist in this service
    SELECT array_agg(r)
    INTO missing
    FROM unnest(refs) AS r
    WHERE NOT EXISTS (
      SELECT 1
      FROM form_fields ff
      JOIN forms f ON ff.form_id = f.id
      WHERE ff.field_id = r
        AND f.service_id = service_id_val
    );

    IF array_length(missing, 1) > 0 THEN
      RAISE EXCEPTION 'INVALID_FIELD_REFS::%', array_to_json(missing)
        USING ERRCODE = 'P0002';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_determinant_refs
  BEFORE INSERT OR UPDATE ON determinants
  FOR EACH ROW EXECUTE FUNCTION validate_field_refs_exist();
-- (repeat for other tables)
```

### Application Layer

#### Exception Filter

```typescript
// apps/api/src/common/filters/field-reference.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@repo/db';

@Catch(Prisma.PrismaClientKnownRequestError)
export class FieldReferenceExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // Handle custom PostgreSQL errors
    if (exception.code === 'P2010') { // Raw query error
      const message = exception.message;

      // FIELD_IN_USE::fieldId::references
      if (message.includes('FIELD_IN_USE::')) {
        const parts = message.match(/FIELD_IN_USE::([^:]+)::(.+)/);
        if (parts) {
          const [, fieldId, refsJson] = parts;
          const references = JSON.parse(refsJson);

          return response.status(HttpStatus.CONFLICT).json({
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message: `Cannot delete field '${fieldId}' - it is referenced by ${references.length} entities`,
            fieldId,
            references,
          });
        }
      }

      // INVALID_FIELD_REFS::["f_abc", "f_xyz"]
      if (message.includes('INVALID_FIELD_REFS::')) {
        const parts = message.match(/INVALID_FIELD_REFS::(.+)/);
        if (parts) {
          const missingFields = JSON.parse(parts[1]);

          return response.status(HttpStatus.BAD_REQUEST).json({
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Bad Request',
            message: 'Expression references non-existent fields',
            missingFields,
          });
        }
      }
    }

    // Re-throw if not our custom error
    throw exception;
  }
}
```

#### Preview Service

```typescript
// apps/api/src/modules/form-fields/field-references.service.ts
@Injectable()
export class FieldReferencesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all entities that reference a field (for preview before delete)
   */
  async getFieldUsages(fieldId: string): Promise<FieldUsageDto[]> {
    const references = await this.prisma.fieldReference.findMany({
      where: { fieldId },
    });

    // Enrich with entity details
    return Promise.all(
      references.map(async (ref) => {
        const entity = await this.getEntityDetails(
          ref.referencingEntityType,
          ref.referencingEntityId,
        );
        return {
          entityType: ref.referencingEntityType,
          entityId: ref.referencingEntityId,
          entityName: entity?.name ?? 'Unknown',
          expressionPath: ref.expressionPath,
        };
      }),
    );
  }

  /**
   * Check if field can be safely deleted
   */
  async canDelete(fieldId: string): Promise<{ canDelete: boolean; blockers: FieldUsageDto[] }> {
    const usages = await this.getFieldUsages(fieldId);
    return {
      canDelete: usages.length === 0,
      blockers: usages,
    };
  }

  private async getEntityDetails(type: string, id: string) {
    switch (type) {
      case 'determinants':
        return this.prisma.determinant.findUnique({ where: { id }, select: { name: true } });
      case 'roles':
        return this.prisma.role.findUnique({ where: { id }, select: { name: true } });
      case 'costs':
        return this.prisma.cost.findUnique({ where: { id }, select: { name: true } });
      default:
        return null;
    }
  }
}
```

#### API Endpoints

```typescript
// GET /api/form-fields/:fieldId/usages
@Get(':fieldId/usages')
async getFieldUsages(@Param('fieldId') fieldId: string): Promise<FieldUsageDto[]> {
  return this.fieldReferencesService.getFieldUsages(fieldId);
}

// GET /api/form-fields/:fieldId/can-delete
@Get(':fieldId/can-delete')
async canDeleteField(@Param('fieldId') fieldId: string): Promise<CanDeleteDto> {
  return this.fieldReferencesService.canDelete(fieldId);
}

// DELETE /api/form-fields/:fieldId
@Delete(':fieldId')
async deleteField(
  @Param('fieldId') fieldId: string,
  @Query('force') force?: boolean,
): Promise<void> {
  // Even with force=true, database will block if references exist
  // Force only works if you first remove the references
  return this.formFieldsService.delete(fieldId);
}
```

---

## Consequences

### Positive

1. **Cannot be bypassed**: Even direct SQL respects FK constraints and triggers
2. **Always consistent**: Reference table always reflects reality
3. **Survives renames**: Stable `fieldId` decouples from display `name`
4. **Rich feedback**: Users see exactly what references a field before delete
5. **Performance**: Single transaction, no application round-trips for validation
6. **IDE-like experience**: "Find Usages" before delete/refactor

### Negative

1. **PostgreSQL-specific**: Triggers and functions are not portable
2. **Hidden logic**: Business logic in SQL migrations, not TypeScript
3. **Testing complexity**: Need database for integration tests
4. **Migration overhead**: Adding new expression-bearing columns requires trigger updates
5. **Regex limitations**: Pattern matching may miss edge cases in complex expressions

### Mitigations

| Risk | Mitigation |
|------|------------|
| PostgreSQL lock-in | We're already committed to PostgreSQL for JSONB, PostgREST |
| Hidden logic | Document thoroughly in ADR, comment triggers |
| Testing | Use testcontainers for integration tests |
| New columns | Create reusable trigger generator function |
| Regex edge cases | Add unit tests for extraction function |

---

## Alternatives Considered

### 1. Application-Only Validation

**Approach**: NestJS services check references before operations
**Rejected because**: Can be bypassed by raw SQL, multiple code paths to maintain

### 2. Soft Delete Only

**Approach**: Never hard-delete fields, mark as inactive
**Rejected because**: Data accumulation, expressions may still fail at runtime

### 3. Event Sourcing

**Approach**: Track all changes as events, rebuild state
**Rejected because**: Overkill for this use case, significant complexity

### 4. Graph Database

**Approach**: Store references in Neo4j or similar
**Rejected because**: Additional infrastructure, sync complexity

---

## Implementation Plan

1. **Story**: Add `fieldId` to FormField schema (migration)
2. **Story**: Create `field_references` table and FK constraint
3. **Story**: Implement extraction triggers for each table
4. **Story**: Implement validation triggers
5. **Story**: Add application-layer services and exception filter
6. **Story**: Add API endpoints for usage preview
7. **Story**: Update expression syntax documentation

---

## References

- [PostgreSQL Triggers Documentation](https://www.postgresql.org/docs/current/triggers.html)
- [Prisma Raw Queries](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access)
- Legacy BPA `$id` field mapping pattern
- `_bmad-output/analysis/bpa-api-mental-model-analysis.md`

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-01 | Initial decision | Architecture Team |
| 2026-01-01 | Added Conceptual Model: Compilation Analogy | Architecture Team |

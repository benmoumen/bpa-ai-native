# Story ADR-P1: ADR Schema Foundation

> **Epic**: ADR Implementation (Phase 1)
> **Story ID**: ADR-P1
> **Status**: ready-for-dev
> **Created**: 2026-01-01
> **Priority**: HIGH (unblocks Epic 6)
> **Effort**: 3-5 points

---

## Story Overview

### User Story

As a **Developer**,
I want the foundational enums and fields from ADR-002 and ADR-003 added to the Prisma schema,
So that the data model supports procedure types, trigger types, actor types, and element types for future features.

### Business Context

This story implements Phase 1 of the ADR implementation strategy, adding **schema-only** changes that are fully backward compatible. No API changes, no UI changes, no renames—just additive enums and nullable/defaulted columns.

**Key principle**: All changes use defaults that preserve existing behavior:
- `procedureType` defaults to `AUTHORIZATION` (current implicit behavior)
- `triggerType` defaults to `USER_INITIATED` (current implicit behavior)
- `actorType` defaults to `OPERATOR` (current implicit behavior)
- New fields are nullable or have safe defaults

### Value Proposition

- Unblocks Epic 6 (AI Agent) with richer domain model
- Enables future ApplicationElement implementation (Phase 2)
- Zero breaking changes to existing functionality
- Establishes vocabulary for procedure/element types

### ADRs Implemented

| ADR | Scope in This Story |
|-----|---------------------|
| ADR-002 | Enums + columns only (no rename) |
| ADR-003 | Enums + Role columns only (no new models) |

---

## Acceptance Criteria

### AC1: ProcedureType Enum

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the `ProcedureType` enum is defined:

```prisma
/// ProcedureType - defines the output type of a procedure
enum ProcedureType {
  AUTHORIZATION  // Issues document (license, permit, certificate)
  INQUIRY        // Returns information (no document issued)
  OBLIGATION     // Collects required data (compliance, tax filing)
  NOTIFICATION   // Acknowledges receipt (no approval workflow)
}
```

### AC2: TriggerType Enum

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the `TriggerType` enum is defined:

```prisma
/// TriggerType - defines who/what initiates the procedure
enum TriggerType {
  USER_INITIATED  // Applicant decides to apply
  SCHEDULED       // Time-based trigger (annual renewal)
  INSTITUTION     // Government requires submission
  EVENT           // External trigger (ownership change, relocation)
}
```

### AC3: Registration Model Extended

**Given** Prisma schema in `packages/db`
**When** the developer inspects the `Registration` model
**Then** the following fields are added:

```prisma
model Registration {
  // ... existing fields ...

  // NEW: ADR-002 fields with backward-compatible defaults
  procedureType   ProcedureType  @default(AUTHORIZATION) @map("procedure_type")
  triggerType     TriggerType    @default(USER_INITIATED) @map("trigger_type")
  outputConfig    Json?          @map("output_config")  // Type-specific config

  // ... existing relations and indexes ...

  // NEW: Index for procedureType queries
  @@index([procedureType])
  @@index([triggerType])
}
```

### AC4: ActorType Enum

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the `ActorType` enum is defined:

```prisma
/// ActorType - identifies who performs actions in workflow
enum ActorType {
  APPLICANT  // The person/entity applying
  OPERATOR   // Government staff processing
  SYSTEM     // Automated bot processing
}
```

### AC5: ElementType Enum

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the `ElementType` enum is defined:

```prisma
/// ElementType - categorizes application components (future use)
enum ElementType {
  QUALIFIER    // Questions determining other elements (was GUIDE)
  DATA         // Information collection (was APPLICANT form)
  EVIDENCE     // Document uploads
  PAYMENT      // Fee items
  DECLARATION  // Sworn statements, terms acceptance
  SUBMISSION   // Final submit action
}
```

### AC6: RelationType Enum

**Given** Prisma schema in `packages/db`
**When** the developer inspects `schema.prisma`
**Then** the `RelationType` enum is defined:

```prisma
/// RelationType - defines relationships between elements (future use)
enum RelationType {
  SHOWS       // Answer shows another element
  HIDES       // Answer hides another element
  REQUIRES    // Element requires another
  CALCULATES  // Element calculates value
  VALIDATES   // Element validates another
  ROUTES_TO   // Element routes to workflow step
}
```

### AC7: Role Model Extended

**Given** Prisma schema in `packages/db`
**When** the developer inspects the `Role` model
**Then** the following fields are added:

```prisma
model Role {
  // ... existing fields ...

  // NEW: ADR-003 fields with backward-compatible defaults
  actorType     ActorType    @default(OPERATOR) @map("actor_type")
  isEntryPoint  Boolean      @default(false) @map("is_entry_point")

  // ... existing relations and indexes ...

  // NEW: Index for actorType queries
  @@index([actorType])
}
```

### AC8: Migration Succeeds

**Given** the schema changes are complete
**When** the developer runs `pnpm db:migrate:dev`
**Then**:
- Migration creates successfully
- Existing data is preserved with default values
- No data loss occurs
- Migration is named descriptively (e.g., `add_adr_foundation_enums`)

### AC9: Prisma Client Regenerated

**Given** the migration is complete
**When** the developer runs `pnpm db:generate`
**Then**:
- Prisma client regenerates successfully
- New enums are available in TypeScript
- New fields are typed on Registration and Role models

### AC10: Existing Tests Pass

**Given** all schema changes are complete
**When** the developer runs `pnpm test`
**Then**:
- All existing tests pass
- No type errors in API or frontend code
- Registration and Role CRUD operations work unchanged

---

## Technical Notes

### Schema Change Summary

| Model | New Fields | Default | Breaking? |
|-------|------------|---------|-----------|
| Registration | `procedureType` | AUTHORIZATION | No |
| Registration | `triggerType` | USER_INITIATED | No |
| Registration | `outputConfig` | null | No |
| Role | `actorType` | OPERATOR | No |
| Role | `isEntryPoint` | false | No |

### New Enums Summary

| Enum | Values | ADR |
|------|--------|-----|
| ProcedureType | AUTHORIZATION, INQUIRY, OBLIGATION, NOTIFICATION | 002 |
| TriggerType | USER_INITIATED, SCHEDULED, INSTITUTION, EVENT | 002 |
| ActorType | APPLICANT, OPERATOR, SYSTEM | 003 |
| ElementType | QUALIFIER, DATA, EVIDENCE, PAYMENT, DECLARATION, SUBMISSION | 003 |
| RelationType | SHOWS, HIDES, REQUIRES, CALCULATES, VALIDATES, ROUTES_TO | 003 |

### Migration SQL Preview

```sql
-- Create new enums
CREATE TYPE "ProcedureType" AS ENUM ('AUTHORIZATION', 'INQUIRY', 'OBLIGATION', 'NOTIFICATION');
CREATE TYPE "TriggerType" AS ENUM ('USER_INITIATED', 'SCHEDULED', 'INSTITUTION', 'EVENT');
CREATE TYPE "ActorType" AS ENUM ('APPLICANT', 'OPERATOR', 'SYSTEM');
CREATE TYPE "ElementType" AS ENUM ('QUALIFIER', 'DATA', 'EVIDENCE', 'PAYMENT', 'DECLARATION', 'SUBMISSION');
CREATE TYPE "RelationType" AS ENUM ('SHOWS', 'HIDES', 'REQUIRES', 'CALCULATES', 'VALIDATES', 'ROUTES_TO');

-- Add columns to registrations
ALTER TABLE "registrations" ADD COLUMN "procedure_type" "ProcedureType" NOT NULL DEFAULT 'AUTHORIZATION';
ALTER TABLE "registrations" ADD COLUMN "trigger_type" "TriggerType" NOT NULL DEFAULT 'USER_INITIATED';
ALTER TABLE "registrations" ADD COLUMN "output_config" JSONB;

-- Add columns to roles
ALTER TABLE "roles" ADD COLUMN "actor_type" "ActorType" NOT NULL DEFAULT 'OPERATOR';
ALTER TABLE "roles" ADD COLUMN "is_entry_point" BOOLEAN NOT NULL DEFAULT false;

-- Add indexes
CREATE INDEX "registrations_procedure_type_idx" ON "registrations"("procedure_type");
CREATE INDEX "registrations_trigger_type_idx" ON "registrations"("trigger_type");
CREATE INDEX "roles_actor_type_idx" ON "roles"("actor_type");
```

---

## Out of Scope

The following are explicitly **NOT** in this story (deferred to later phases):

| Item | Phase | Reason |
|------|-------|--------|
| Registration → Procedure rename | Phase 3 | Breaking change |
| ApplicationElement model | Phase 2 | Depends on Procedure |
| ElementRelation model | Phase 2 | Depends on ApplicationElement |
| API changes for new fields | Phase 2 | Not needed yet |
| UI changes for new fields | Phase 2 | Not needed yet |
| FormType deprecation | Phase 3 | Breaking change |
| ADR-004 entities | Phase 2 | Depends on ApplicationElement |

---

## Definition of Done

- [ ] All 5 new enums added to schema.prisma
- [ ] Registration model has 3 new fields with defaults
- [ ] Role model has 2 new fields with defaults
- [ ] Migration created and applies successfully
- [ ] Prisma client regenerated with new types
- [ ] All existing tests pass
- [ ] No TypeScript errors in API or web packages
- [ ] Schema comments document ADR references

---

## Implementation Steps

1. **Add enums to schema.prisma** (after existing enums, ~line 67)
2. **Add fields to Registration model** (~line 166)
3. **Add fields to Role model** (~line 375)
4. **Add indexes to both models**
5. **Run `pnpm db:migrate:dev --name add_adr_foundation_enums`**
6. **Run `pnpm db:generate`**
7. **Run `pnpm test` to verify no regressions**
8. **Run `pnpm build` to verify no type errors**

---

## References

- [ADR-002: Procedure Type Architecture](../adrs/002-procedure-type-architecture.md)
- [ADR-003: Unified Application Experience](../adrs/003-unified-application-experience.md)
- [ADR Impact Analysis](./adr-impact-analysis-2026-01-01.md)
- [Current Schema](../../packages/db/prisma/schema.prisma)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-01 | Story created |

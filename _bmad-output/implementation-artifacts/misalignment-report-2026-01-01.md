# Misalignment Report

**Date**: 2026-01-01
**Scope**: Full codebase and epics exploration
**Status**: Pre-Epic 4 implementation review

---

## Executive Summary

| Category | Count | Severity |
|----------|-------|----------|
| Missing Entities | 8 | CRITICAL |
| Incorrect Relationships | 6 | CRITICAL |
| Incomplete/Missing Enums | 6 | HIGH |
| Code Pattern Violations | 10+ files | MEDIUM |
| Cross-Epic Conflicts | 3 | MEDIUM |
| **TOTAL ISSUES** | **42+** | — |

---

## Critical Blockers (Must Fix Before Continuing)

| # | Issue | Impact | Location |
|---|-------|--------|----------|
| **1** | **ADR-001 Not Implemented** - `fieldId` missing from FormField, `FieldReference` table missing | Formulas/conditions will break on field rename; cannot track/prevent deletion of referenced fields | `schema.prisma:309-338` |
| **2** | **Service-Registration OneToMany** (should be ManyToMany) | Cannot model multiple registrations per service properly | `schema.prisma:167-188` |
| **3** | **FormType Incomplete** - Only APPLICANT, GUIDE | Missing DOCUMENT, PAYMENT, SEND_FILE (5-form workflow blocked) | `schema.prisma:48-51` |

---

## High Priority - Missing Entities (8 total)

| Entity | Required By | Status |
|--------|-------------|--------|
| `Workflow` | architecture.md:1944 | MISSING - roles are orphaned |
| `Bot` | architecture.md:1860 | MISSING - Phase 2 blocked |
| `InputMapping` / `OutputMapping` | architecture.md:1908-1936 | MISSING - contract I/O broken |
| `RoleRegistration` | spike 4-0:364-381 | MISSING (deferred to 4-10) |
| `RoleInstitution` | spike 4-0:383-400 | MISSING (deferred to 4-11) |
| `CertificateTemplate` | prd.md:57, 356 | MISSING |
| `Catalog/CatalogItem/CatalogGroup` | architecture.md:1643-1678 | MISSING (Phase 2) |

---

## High Priority - Missing Enums (6 total)

| Enum | Values | Required By |
|------|--------|-------------|
| `BotType` | DATA, DOCUMENT, SYSTEM, EXTERNAL, INTERNAL, MESSAGE, LINK | spike 4-0:257-265 |
| `BotCategory` | DOCUMENT_DISPLAY, DOCUMENT_UPLOAD, CREATE, READ, UPDATE, etc. | spike 4-0:268-278 |
| `AuthType` | NONE, BASIC, OAUTH2, API_KEY, CERTIFICATE | architecture.md:1900-1906 |
| `CatalogScope` | INSTANCE, CROSS_SERVICE, SERVICE | architecture.md:1655-1659 |
| `VisibilityPredicate` | EQUALS, NOT_EQUALS, GREATER_THAN, etc. | architecture.md:2051-2058 |
| `RoleCategory` | REVISION, APPROVAL, COLLECTION, VALIDATION, PAYMENT | architecture.md:1985-1991 |

---

## Medium Priority - Code Pattern Violations

| Issue | Count | Files |
|-------|-------|-------|
| **Barrel Export Violations** (`export * from`) | 8 files | `common/index.ts`, `auth/index.ts`, `roles/dto/index.ts`, etc. |
| **Duplicate Enum Definitions** | 2 enums | RoleStatusCode, CostType (should import from Prisma) |
| **Promise Chain Pattern** (`.catch()` instead of try/catch) | 7+ locations | `apps/web/src/lib/api/services.ts` |
| **Missing updatedBy audit field** | All entities | Service, Form, Role models |

### Barrel Export Violations Detail

| File | Pattern | Status |
|------|---------|--------|
| `/apps/api/src/common/index.ts` | `export * from './filters/...'` | VIOLATES explicit export rule |
| `/apps/api/src/auth/index.ts` | `export * from './decorators'` | VIOLATES explicit export rule |
| `/apps/api/src/health/index.ts` | `export * from './health.module'` | VIOLATES explicit export rule |
| `/apps/api/src/transitions/index.ts` | `export * from './transitions.module'` | VIOLATES explicit export rule |
| `/apps/api/src/role-statuses/index.ts` | `export * from './role-statuses.module'` | VIOLATES explicit export rule |
| `/apps/api/src/templates/index.ts` | `export * from './dto'` | VIOLATES explicit export rule |
| `/apps/api/src/registrations/index.ts` | Multiple `export * from` | VIOLATES explicit export rule |
| `/apps/api/src/roles/dto/index.ts` | `export * from './create-role.dto'` | VIOLATES explicit export rule |

---

## Cross-Epic Conflicts

| Conflict | Epics | Status |
|----------|-------|--------|
| **4-Status Model Naming** - RoleStatusCode (schema) vs ApplicationStatus (architecture) | 4, 6 | Naming mismatch |
| **Form-Role Assignment** - No validation that USER roles ≠ APPLICANT forms | 3, 4 | No enforcement |
| **Determinant Split** - Different JSON structures for FormField.properties vs Role.conditions | 3, 4, 5, 6 | Inconsistent |

---

## Schema vs PRD/Architecture Misalignments

### Missing Relationships

| Relationship | Current | Required | Evidence |
|--------------|---------|----------|----------|
| Service-Registration | OneToMany | ManyToMany | architecture.md:1725, bpa-analysis:15 |
| Service-Cost | Missing | OneToMany | architecture.md:1704 |
| Service-Bot | Missing | OneToMany | architecture.md:1876 |
| Role-Workflow | Missing | ManyToOne | architecture.md:1972 |
| Role-Institution | Missing | ManyToMany via join | architecture.md:2024-2033 |

### Audit Trail Gaps

| Issue | Current | Required |
|-------|---------|----------|
| Service.createdBy | String (no FK) | String with User relation |
| All entities | No updatedBy | Should track last modifier |

---

## ADR-001 Implementation Gap

ADR-001 (Field Reference Consistency) was accepted but NOT implemented in schema:

| Requirement | Status |
|-------------|--------|
| `fieldId` column on FormField | MISSING |
| `FieldReference` table | MISSING |
| Database triggers for sync | MISSING |
| FK constraint with RESTRICT | MISSING |
| Expression validation | MISSING |

**Impact**: All formula/condition work will be vulnerable to field rename/delete issues.

---

## Priority Actions

### Before Story 4-1 Implementation

1. Add `fieldId` to FormField + `FieldReference` table (ADR-001 prerequisite)
2. Decide: Fix Service-Registration cardinality now or Phase 2?

### Before Epic 4 Completion

3. Add RoleRegistration model (4-10)
4. Add RoleInstitution model (4-11)
5. Add Bot + BotType/BotCategory enums (4-4)

### Code Quality (Can Batch)

6. Fix barrel exports → explicit named exports
7. Consolidate enum definitions to Prisma imports
8. Refactor `.catch()` patterns to try/catch

---

## Deferred Items (Phase 2)

| Item | Story | Reason |
|------|-------|--------|
| Bot/BotMapping models | 4-4 | Phase 2 integrations |
| Catalog entities | N/A | Phase 2 classifications |
| CertificateTemplate | N/A | Phase 2 document generation |
| Multi-institution support | 4-11 | MVP is single-institution |

---

## Next Steps

1. Review this report with team
2. Prioritize critical blockers for immediate fix
3. Update sprint-status.yaml with decisions
4. Create follow-up stories for deferred items

---

## References

- `_bmad-output/prd.md` - Product requirements
- `_bmad-output/architecture.md` - Architecture decisions
- `_bmad-output/adrs/001-field-reference-consistency.md` - ADR-001
- `_bmad-output/implementation-artifacts/4-0-spike-findings.md` - Epic 4 spike
- `_bmad-output/project-context.md` - Implementation rules
- `packages/db/prisma/schema.prisma` - Current schema

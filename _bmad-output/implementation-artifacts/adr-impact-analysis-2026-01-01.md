# ADR Implementation Impact Analysis

**Date**: 2026-01-01
**Status**: Analysis Complete
**Scope**: ADR-002, ADR-003, ADR-004

## Executive Summary

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                           IMPLEMENTATION IMPACT                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ADR-002 (Procedure Type)      │  HIGH complexity   │  20-30 hours  │ ~54 files ║
║  ADR-003 (Unified Experience)  │  HIGH complexity   │  20-30 days   │ ~40 files ║
║  ADR-004 (Shared Data)         │  MEDIUM-HIGH       │  10-15 days   │ ~30 files ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  TOTAL ESTIMATED EFFORT        │  6-10 weeks for full implementation         ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## Dependency Chain (Critical Path)

```
ADR-001 (Accepted) ─── Foundation ───────────────────────────────────────┐
    │                                                                     │
    ▼                                                                     │
ADR-002 ─── Procedure model ───► ADR-003 ─── ApplicationElement ───► ADR-004
    │           │                    │                                    │
    │           └──► procedureId FK ─┘                                    │
    │                                └──► elementId FK ───────────────────┘
```

**Must implement in strict order**: ADR-002 → ADR-003 → ADR-004

---

## ADR-002: Procedure Type Architecture

### Impact Summary

| Metric | Value |
|--------|-------|
| **Breaking Changes** | Table rename, FK renames, API route changes |
| **New Enums** | `ProcedureType`, `TriggerType` |
| **Files Affected** | ~54 (schema + 35 API + 18 frontend) |
| **Completed Epics Impacted** | Epic 2 (Story 2-9, 2-10, 2-11) |
| **Migration Risk** | MEDIUM (phased approach mitigates) |

### Phase Breakdown

| Phase | Description | Effort |
|-------|-------------|--------|
| Phase 1 | Add enums + columns (non-breaking) | 2-3 hours |
| Phase 2 | API backward compatibility layer | 4-6 hours |
| Phase 3 | Full rename (Registration → Procedure) | 8-12 hours |
| Phase 4 | Cleanup + testing | 4-6 hours |

### Schema Changes

```prisma
enum ProcedureType {
  AUTHORIZATION  // Issues document (license, permit, certificate)
  INQUIRY        // Returns information (no document issued)
  OBLIGATION     // Collects required data (compliance, tax filing)
  NOTIFICATION   // Acknowledges receipt (no approval workflow)
}

enum TriggerType {
  USER_INITIATED  // Applicant decides to apply
  SCHEDULED       // Time-based trigger (annual renewal)
  INSTITUTION     // Government requires submission
  EVENT           // External trigger (ownership change, relocation)
}

model Procedure {  // Renamed from Registration
  // ... existing fields ...
  procedureType   ProcedureType  @default(AUTHORIZATION)
  triggerType     TriggerType    @default(USER_INITIATED)
  outputConfig    Json?
}
```

### API Route Changes

| Current | New |
|---------|-----|
| `POST /api/v1/services/:serviceId/registrations` | `/api/v1/services/:serviceId/procedures` |
| `GET /api/v1/services/:serviceId/registrations` | `/api/v1/services/:serviceId/procedures` |
| `GET /api/v1/registrations/:id` | `/api/v1/procedures/:id` |
| `PATCH /api/v1/registrations/:id` | `/api/v1/procedures/:id` |
| `DELETE /api/v1/registrations/:id` | `/api/v1/procedures/:id` |
| `POST /api/v1/registrations/:registrationId/documents` | `/api/v1/procedures/:procedureId/documents` |
| `POST /api/v1/registrations/:registrationId/costs` | `/api/v1/procedures/:procedureId/costs` |

### Files to Modify

**Backend (apps/api/src)**:
- `registrations/` → `procedures/` (7 files to rename)
- `document-requirements/` (update FK references)
- `costs/` (update FK references)
- `app.module.ts` (update imports)

**Frontend (apps/web/src)**:
- `components/registrations/` → `components/procedures/`
- `lib/api/registrations.ts` → `procedures.ts`
- `hooks/use-registrations.ts` → `use-procedures.ts`
- `app/services/[serviceId]/page.tsx`

---

## ADR-003: Unified Application Experience

### Impact Summary

| Metric | Value |
|--------|-------|
| **Breaking Changes** | `FormType` deprecation, new FK on FormField |
| **New Enums** | `ActorType`, `ElementType`, `RelationType` |
| **New Models** | `ApplicationElement`, `ElementRelation` |
| **Modified Models** | `Role` (+2 fields), `FormField` (+1 field) |
| **Completed Epics Impacted** | Epic 3 (HIGH), Epic 4 (MEDIUM) |

### Schema Changes

```prisma
enum ActorType {
  APPLICANT  // The person/entity applying
  OPERATOR   // Government staff processing
  SYSTEM     // Automated bot processing
}

enum ElementType {
  QUALIFIER    // Questions determining other elements (was GUIDE)
  DATA         // Information collection (was APPLICANT form)
  EVIDENCE     // Document uploads
  PAYMENT      // Fee items
  DECLARATION  // Sworn statements, terms
  SUBMISSION   // Final submit action
}

enum RelationType {
  SHOWS       // Answer shows another element
  HIDES       // Answer hides another element
  REQUIRES    // Element requires another
  CALCULATES  // Element calculates value
  VALIDATES   // Element validates another
  ROUTES_TO   // Element routes to workflow step
}

model ApplicationElement {
  id            String        @id @default(cuid())
  procedureId   String        @map("procedure_id")
  type          ElementType
  name          String        @db.VarChar(255)
  description   String?       @db.Text
  config        Json          @default("{}")
  sortOrder     Int           @default(0)
  isActive      Boolean       @default(true)

  procedure       Procedure         @relation(...)
  fields          FormField[]
  outgoingLinks   ElementRelation[] @relation("RelationSource")
  incomingLinks   ElementRelation[] @relation("RelationTarget")

  @@map("application_elements")
}

model ElementRelation {
  id            String        @id @default(cuid())
  sourceId      String        @map("source_id")
  targetId      String        @map("target_id")
  relationType  RelationType
  condition     Json?
  effect        Json          @default("{}")
  description   String?

  source        ApplicationElement @relation("RelationSource", ...)
  target        ApplicationElement @relation("RelationTarget", ...)

  @@unique([sourceId, targetId, relationType])
  @@map("element_relations")
}

// Modified models
model Role {
  // ... existing fields ...
  actorType     ActorType  @default(OPERATOR)
  isEntryPoint  Boolean    @default(false)
}

model FormField {
  // ... existing fields ...
  elementId     String?    @map("element_id")
  element       ApplicationElement? @relation(...)
}
```

### Story Impact Matrix

| Story | Impact | Required Changes |
|-------|--------|------------------|
| **3-1 Form Database** | HIGH | Add ElementType, migrate Form→ApplicationElement |
| **3-2 Create Applicant Form** | MEDIUM | Map APPLICANT → DATA ElementType |
| **3-3 Create Guide Form** | MEDIUM | Map GUIDE → QUALIFIER ElementType |
| **3-7 Visibility Rules** | HIGH | Extract to ElementRelation records |
| **3-10 JSON Schema Generation** | MEDIUM | Update to use ApplicationElement |
| **4-1 Workflow Database** | MEDIUM | Add actorType/isEntryPoint to Role |
| **4-5 Assign Forms** | MEDIUM | May reference ApplicationElement |

### Migration Strategy

1. **Phase 1 (Non-Breaking)**: Add new enums and models alongside existing
2. **Phase 2 (Data Migration)**: Create scripts to populate ApplicationElements from Forms
3. **Phase 3 (API Updates)**: Add new endpoints, deprecate old ones
4. **Phase 4 (UI Migration)**: Build unified application view
5. **Phase 5 (Cleanup)**: Remove deprecated FormType

---

## ADR-004: Shared Data Entities

### Impact Summary

| Metric | Value |
|--------|-------|
| **Breaking Changes** | None (purely additive) |
| **New Enums** | `EntityCategory`, `VerificationStatus`, `FieldDataType`, `LinkType` |
| **New Models** | 6 models (DataEntityType, EntityFieldDef, DataEntityInstance, EntityLink, EntityRequirement, EntityUsage) |
| **Modified Models** | `User` (+1 relation) |
| **Dependency** | Requires ADR-003 `ApplicationElement` |

### Schema Changes

```prisma
enum EntityCategory {
  PERSON
  ORGANIZATION
  LOCATION
  CONTACT
  FINANCIAL
  DOCUMENT
  CUSTOM
}

enum VerificationStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  EXPIRED
  REJECTED
}

enum FieldDataType {
  STRING
  TEXT
  NUMBER
  DECIMAL
  BOOLEAN
  DATE
  DATETIME
  EMAIL
  PHONE
  URL
  ENUM
  COUNTRY
  CURRENCY
  FILE
  JSON
}

enum LinkType {
  BELONGS_TO
  REPRESENTS
  OWNS
  EMPLOYED_BY
  RESIDES_AT
  OPERATES_AT
}

model DataEntityType {
  id          String          @id @default(cuid())
  category    EntityCategory
  name        String          @unique
  description String?
  isSystem    Boolean         @default(false)

  fields      EntityFieldDef[]
  instances   DataEntityInstance[]
  requirements EntityRequirement[]

  @@map("data_entity_types")
}

model EntityFieldDef {
  id            String        @id @default(cuid())
  entityTypeId  String
  name          String
  dataType      FieldDataType
  isRequired    Boolean       @default(false)
  constraints   Json?

  entityType    DataEntityType @relation(...)

  @@unique([entityTypeId, name])
  @@map("entity_field_defs")
}

model DataEntityInstance {
  id                  String             @id @default(cuid())
  entityTypeId        String
  ownerId             String
  label               String
  data                Json
  verificationStatus  VerificationStatus @default(UNVERIFIED)
  verifiedAt          DateTime?
  verifiedBy          String?
  expiresAt           DateTime?

  entityType    DataEntityType   @relation(...)
  owner         User             @relation(...)
  usages        EntityUsage[]
  linksFrom     EntityLink[]     @relation("LinkFrom")
  linksTo       EntityLink[]     @relation("LinkTo")

  @@map("data_entity_instances")
}

model EntityLink {
  id          String     @id @default(cuid())
  fromId      String
  toId        String
  linkType    LinkType
  validFrom   DateTime?
  validTo     DateTime?

  fromEntity  DataEntityInstance @relation("LinkFrom", ...)
  toEntity    DataEntityInstance @relation("LinkTo", ...)

  @@unique([fromId, toId, linkType])
  @@map("entity_links")
}

model EntityRequirement {
  id            String          @id @default(cuid())
  elementId     String          // FK to ApplicationElement (ADR-003)
  entityTypeId  String
  role          String
  fieldsNeeded  String[]
  isRequired    Boolean         @default(true)
  condition     Json?

  element       ApplicationElement @relation(...)
  entityType    DataEntityType     @relation(...)
  usages        EntityUsage[]

  @@map("entity_requirements")
}

model EntityUsage {
  id              String   @id @default(cuid())
  requirementId   String
  instanceId      String
  applicationId   String?  // Future: link to application record
  snapshotData    Json
  usedAt          DateTime @default(now())

  requirement     EntityRequirement  @relation(...)
  instance        DataEntityInstance @relation(...)

  @@map("entity_usages")
}

// Modified model
model User {
  // ... existing fields ...
  dataEntities  DataEntityInstance[]
}
```

### New Epic Required

**Proposed Epic 12: Data Wallet & Shared Entities**

| Story | Description | Priority |
|-------|-------------|----------|
| 12.1 | DataEntityType schema and seed data | HIGH |
| 12.2 | EntityFieldDef CRUD API | HIGH |
| 12.3 | DataEntityInstance CRUD (user wallet) | HIGH |
| 12.4 | EntityLink management | MEDIUM |
| 12.5 | EntityRequirement integration with elements | HIGH |
| 12.6 | EntityUsage and snapshot mechanism | MEDIUM |
| 12.7 | Verification status management | MEDIUM |
| 12.8 | Data wallet UI | HIGH |
| 12.9 | Application pre-fill from wallet | HIGH |
| 12.10 | Verification provider integration | LOW (Phase 2) |

### Seed Data Required

System entity types to seed on deployment:
- Person (firstName, lastName, dateOfBirth, nationality, idNumber, idType)
- Organization (legalName, tradeName, registrationNumber, incorporationDate, legalForm)
- Address (street, city, state, postalCode, country, addressType)
- Contact (email, phone, mobile, fax, website)
- BankAccount (bankName, accountNumber, routingNumber, accountType, currency)

---

## Cross-ADR Dependencies

### Dependency Graph

```
                    ┌─────────────────────────┐
                    │   ADR-001 (Accepted)    │
                    │ Field Reference         │
                    │ Consistency             │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
    │    ADR-002      │ │    ADR-003      │ │    ADR-004      │
    │   Procedure     │ │   Unified App   │ │  Shared Data    │
    │   Type Arch     │ │   Experience    │ │   Entities      │
    └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
             │                   │                   │
             │                   ▼                   │
             │         ┌─────────────────────┐       │
             └────────►│  ApplicationElement │◄──────┘
                       │  (central model)    │
                       └─────────────────────┘
```

### Key Foreign Key Dependencies

| Source Model | Target Model | ADR Dependency |
|--------------|--------------|----------------|
| `ApplicationElement.procedureId` | `Procedure` | ADR-003 → ADR-002 |
| `EntityRequirement.elementId` | `ApplicationElement` | ADR-004 → ADR-003 |
| `ElementRelation.condition` | Uses `$field.xxx` syntax | ADR-003 → ADR-001 |

### Coordination Points

1. **Procedure ↔ ApplicationElement**: Lock Procedure schema before implementing ApplicationElement
2. **ApplicationElement ↔ EntityRequirement**: Complete ADR-003 Phase 1 before ADR-004 EntityRequirement
3. **Field Reference Syntax**: All ADRs use `$field.xxx` pattern from ADR-001

---

## Schema Impact Summary

### New Enums (10 total)

| Enum | ADR | Values |
|------|-----|--------|
| `ProcedureType` | 002 | AUTHORIZATION, INQUIRY, OBLIGATION, NOTIFICATION |
| `TriggerType` | 002 | USER_INITIATED, SCHEDULED, INSTITUTION, EVENT |
| `ActorType` | 003 | APPLICANT, OPERATOR, SYSTEM |
| `ElementType` | 003 | QUALIFIER, DATA, EVIDENCE, PAYMENT, DECLARATION, SUBMISSION |
| `RelationType` | 003 | SHOWS, HIDES, REQUIRES, CALCULATES, VALIDATES, ROUTES_TO |
| `EntityCategory` | 004 | PERSON, ORGANIZATION, LOCATION, CONTACT, FINANCIAL, DOCUMENT, CUSTOM |
| `VerificationStatus` | 004 | UNVERIFIED, PENDING, VERIFIED, EXPIRED, REJECTED |
| `FieldDataType` | 004 | STRING, TEXT, NUMBER, DECIMAL, BOOLEAN, DATE, DATETIME, EMAIL, PHONE, URL, ENUM, COUNTRY, CURRENCY, FILE, JSON |
| `LinkType` | 004 | BELONGS_TO, REPRESENTS, OWNS, EMPLOYED_BY, RESIDES_AT, OPERATES_AT |

### New Models (8 total)

| Model | ADR | Purpose |
|-------|-----|---------|
| `ApplicationElement` | 003 | Central unified element |
| `ElementRelation` | 003 | Explicit relationships |
| `DataEntityType` | 004 | System entity definitions |
| `EntityFieldDef` | 004 | Entity field schema |
| `DataEntityInstance` | 004 | User's data wallet |
| `EntityLink` | 004 | Instance relationships |
| `EntityRequirement` | 004 | Service entity needs |
| `EntityUsage` | 004 | Application entity usage |

### Modified Models (4 total)

| Model | ADR | Changes |
|-------|-----|---------|
| `Registration` → `Procedure` | 002 | Rename + 3 new fields |
| `Role` | 003 | +2 fields (actorType, isEntryPoint) |
| `FormField` | 003 | +1 field (elementId) |
| `User` | 004 | +1 relation (dataEntities) |

### Deprecated

| Item | ADR | Replacement |
|------|-----|-------------|
| `FormType` enum | 003 | `ElementType` |

---

## Implementation Timeline

```
CURRENT STATE: Epic 4 done, Epic 6 backlog
                    │
╔═══════════════════╧═══════════════════════════════════════════════════════╗
║ PHASE 1: ADR-002 Schema (Week 1)                                          ║
║ ├─ Add ProcedureType, TriggerType enums                                   ║
║ ├─ Add columns to Registration (keep name)                                ║
║ └─ Create Procedure type alias                                            ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ PHASE 2: ADR-003 Foundation (Weeks 2-3)                                   ║
║ ├─ Add ActorType, ElementType, RelationType enums                         ║
║ ├─ Create ApplicationElement model                                        ║
║ ├─ Create ElementRelation model                                           ║
║ └─ Add actorType/isEntryPoint to Role                                     ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ PHASE 3: ADR-004 Foundation (Weeks 4-5)                                   ║
║ ├─ Add entity enums (4 total)                                             ║
║ ├─ Create DataEntityType, EntityFieldDef                                  ║
║ ├─ Seed system entity types                                               ║
║ └─ Create EntityRequirement → ApplicationElement FK                       ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ PHASE 4: Migration & UI (Weeks 6-10)                                      ║
║ ├─ Complete Registration → Procedure rename                               ║
║ ├─ Migrate Forms → ApplicationElements                                    ║
║ ├─ Build unified application view                                         ║
║ └─ Build data wallet UI                                                   ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ADR-003 before ADR-002 | HIGH | **BLOCKER** | Strict sequencing |
| ADR-004 before ADR-003 | HIGH | **BLOCKER** | ApplicationElement FK |
| Epic 3/4 rework | MEDIUM | HIGH | Deprecation path, not breaking |
| API consumers break | MEDIUM | MEDIUM | Backward-compat routes |
| Form data migration | LOW | HIGH | Automated scripts, testing |
| Seed data inconsistency | MEDIUM | MEDIUM | Version-control seed data |
| Field reference triggers | MEDIUM | HIGH | Update ADR-001 for new models |

---

## Recommendations

### Option A: Full Implementation (6-10 weeks)

**Best for**: Greenfield or major release

| Pro | Con |
|-----|-----|
| Maximum architectural benefit | Highest risk/effort |
| Clean implementation | Delays Epic 6 (AI Agent) |
| No technical debt | Requires full team focus |

### Option B: Phased MVP (2-3 weeks per phase)

**Best for**: Incremental delivery

| Phase | Scope | Risk |
|-------|-------|------|
| 1 | ADR-002: Add enums only (minimal disruption) | LOW |
| 2 | ADR-003: Add models (keep FormType) | MEDIUM |
| 3 | ADR-004: Schema only (defer UI) | LOW |
| 4 | Full migration and UI | HIGH |

### Option C: Defer to Phase 2

**Best for**: MVP-first approach

| Pro | Con |
|-----|-----|
| Complete Epic 6 (AI) with current schema | Compounds technical debt |
| Lower immediate risk | Harder migration later |
| Faster MVP delivery | Rework when ADRs implemented |

---

## Next Steps

1. **Decide implementation option** (A, B, or C)
2. **If Option A/B**: Create implementation stories for each phase
3. **Update sprint-status.yaml** with ADR implementation phase
4. **Lock ADR-002 Procedure schema** before starting ADR-003
5. **Schedule checkpoint reviews** after each ADR phase

---

## References

- [ADR-001: Field Reference Consistency](../adrs/001-field-reference-consistency.md)
- [ADR-002: Procedure Type Architecture](../adrs/002-procedure-type-architecture.md)
- [ADR-003: Unified Application Experience](../adrs/003-unified-application-experience.md)
- [ADR-004: Shared Data Entities](../adrs/004-shared-data-entities.md)
- [Sprint Status](./sprint-status.yaml)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-01 | Initial analysis complete |

# ADR-002: Procedure Type Architecture

**Status**: Proposed
**Date**: 2026-01-01
**Decision Makers**: Architecture Team
**Supersedes**: N/A
**Related**: ADR-001 (Field Reference Consistency)

## Context

The legacy BPA system uses "Registration" to represent what applicants apply for within a Service. However, this naming is biased toward authorization workflows (licenses, permits, certificates).

As we extend the platform to support additional government service types, we face a design question:

> If a Service can contain multiple Registrations, and not all government services produce authorizations, where should "type" live?

### Real-World Example

A "Business Licensing Service" might offer:

| What Applicant Does | What They Receive | Current Fit |
|---------------------|-------------------|-------------|
| Apply for Business License | License document | Registration works |
| Submit Environmental Inquiry | Information report | "Registration" is awkward |
| File Annual Compliance Report | Acknowledgment | "Registration" is wrong |
| Notify Address Change | Confirmation | "Registration" misleading |

### The Question

Should we add `ServiceType` to the Service entity, or handle type polymorphism at a different level?

## Decision

### 1. Service Remains a Container (No ServiceType)

Service is a **grouping mechanism**, not a workflow type. It has:
- `category: String` - Domain classification (Business, Tax, Environment)
- `status: ServiceStatus` - Lifecycle state (DRAFT, PUBLISHED, ARCHIVED)

There is **no ServiceType enum** on Service.

### 2. Registration Renamed to Procedure

The entity is renamed from `Registration` to `Procedure` because:
- "Registration" implies authorization-only semantics
- "Procedure" is neutral and accurate for all workflow types
- Domain experts understand "administrative procedure" universally

### 3. ProcedureType Enum on Procedure

Each Procedure declares its output type:

```prisma
enum ProcedureType {
  AUTHORIZATION  // Issues document (license, permit, certificate)
  INQUIRY        // Returns information (no document issued)
  OBLIGATION     // Collects required data (compliance, tax filing)
  NOTIFICATION   // Acknowledges receipt (no approval workflow)
}
```

### 4. TriggerType Enum on Procedure

Each Procedure declares who/what initiates it:

```prisma
enum TriggerType {
  USER_INITIATED  // Applicant decides to apply
  SCHEDULED       // Time-based trigger (annual renewal)
  INSTITUTION     // Government requires submission
  EVENT           // External trigger (ownership change, relocation)
}
```

### 5. Workflow Engine Remains Universal

The 4-Status Model (PENDING, PASSED, RETURNED, REJECTED) applies to **all** procedure types. The workflow engine is procedureType-agnostic.

What differs by procedureType:
- **Output Handler**: Strategy pattern implementation
- **AUTHORIZATION** → Generate certificate, update registry
- **INQUIRY** → Return information package
- **OBLIGATION** → Log compliance record
- **NOTIFICATION** → Confirm receipt

## Schema Changes

```prisma
// New enums
enum ProcedureType {
  AUTHORIZATION
  INQUIRY
  OBLIGATION
  NOTIFICATION
}

enum TriggerType {
  USER_INITIATED
  SCHEDULED
  INSTITUTION
  EVENT
}

// Renamed from Registration
model Procedure {
  id              String         @id @default(cuid())
  serviceId       String         @map("service_id")
  name            String         @db.VarChar(100)
  shortName       String         @db.VarChar(20) @map("short_name")
  key             String         @db.VarChar(50)
  description     String?        @db.Text

  // NEW: Type fields with backward-compatible defaults
  procedureType   ProcedureType  @default(AUTHORIZATION) @map("procedure_type")
  triggerType     TriggerType    @default(USER_INITIATED) @map("trigger_type")
  outputConfig    Json?          @map("output_config")  // Type-specific config

  isActive        Boolean        @default(true) @map("is_active")
  sortOrder       Int            @default(0) @map("sort_order")
  createdAt       DateTime       @default(now()) @map("created_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  // Relations
  service              Service               @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  documentRequirements DocumentRequirement[]
  costs                Cost[]

  @@unique([serviceId, key])
  @@index([serviceId])
  @@index([procedureType])
  @@index([triggerType])
  @@index([isActive])
  @@map("procedures")  // Table name change
}
```

## Migration Path

### Phase 1: Schema Evolution (Non-Breaking)
1. Add `ProcedureType` and `TriggerType` enums
2. Add columns to `registrations` table with defaults
3. Keep table name `registrations` temporarily

### Phase 2: Code Migration
1. Create type alias: `type Registration = Procedure`
2. Update imports progressively
3. Update API endpoints (maintain old routes as aliases)

### Phase 3: Table Rename
1. Rename `registrations` → `procedures` via migration
2. Update all @@map references
3. Remove type alias

### Backward Compatibility

| Aspect | Compatibility |
|--------|---------------|
| Existing data | Defaults to AUTHORIZATION + USER_INITIATED |
| Workflow engine | No changes required |
| API contracts | Add procedureType filter, keep defaults |
| Frontend | Progressive enhancement |

## Consequences

### Positive
- **Semantic clarity**: "Procedure" accurately describes all workflow types
- **Extensibility**: New procedure types require only enum addition
- **Universal workflow**: 4-Status Model applies to all types
- **Output polymorphism**: Strategy pattern for type-specific handlers
- **Trigger flexibility**: Support for scheduled, obligation, and event triggers

### Negative
- **Rename migration**: Code changes across codebase
- **Learning curve**: Team must update mental model
- **Documentation**: Legacy docs become outdated
- **API versioning**: May need v2 endpoints

### Neutral
- Service entity unchanged (still a container)
- DocumentRequirement/Cost relations unchanged
- Determinant/Form relations unchanged

## Alternatives Considered

### A. ServiceType on Service
**Rejected**: If Service has N Procedures, all would share the same type. Too limiting.

### B. Keep "Registration" Name, Add outputType
**Rejected**: Semantic friction ("Inquiry Registration" sounds wrong). Technical debt.

### C. Create Separate Entities (Authorization, Inquiry, etc.)
**Rejected**: Violates DRY. Duplicates schema. Complicates joins.

### D. Polymorphic Inheritance (STI)
**Rejected**: Prisma doesn't support STI well. Enum + JSON config is simpler.

## Implementation Sequence

1. **Epic 4 Continuation**: Add enums to schema, keep Registration name temporarily
2. **Post-Epic 4**: Progressive rename Registration → Procedure
3. **Phase 2**: Implement output handlers per procedureType

## Examples

### Authorization Procedure (Default)
```json
{
  "name": "Business License",
  "procedureType": "AUTHORIZATION",
  "triggerType": "USER_INITIATED",
  "outputConfig": {
    "template": "business-license-template",
    "validityPeriod": "P1Y",
    "renewalReminder": 30
  }
}
```

### Inquiry Procedure
```json
{
  "name": "Tax Liability Check",
  "procedureType": "INQUIRY",
  "triggerType": "USER_INITIATED",
  "outputConfig": {
    "responseFormat": "PDF",
    "includeBreakdown": true
  }
}
```

### Obligation Procedure
```json
{
  "name": "Annual Compliance Filing",
  "procedureType": "OBLIGATION",
  "triggerType": "SCHEDULED",
  "outputConfig": {
    "deadline": "03-31",
    "penaltyAfterDays": 30,
    "reminderDays": [60, 30, 7]
  }
}
```

### Notification Procedure
```json
{
  "name": "Address Change Notification",
  "procedureType": "NOTIFICATION",
  "triggerType": "EVENT",
  "outputConfig": {
    "acknowledgmentTemplate": "address-change-ack",
    "notifyInstitutions": ["tax", "business-registry"]
  }
}
```

## Decision Rationale Summary

| Question | Answer |
|----------|--------|
| Does Service need a type? | **No** - it's a container with category |
| Where does "type" live? | **On Procedure** (formerly Registration) |
| Why rename Registration? | Semantic accuracy for all procedure types |
| Is workflow engine affected? | **No** - 4-Status Model is universal |
| What changes per type? | Only output handler (strategy pattern) |

## References

- `_bmad-output/architecture.md` - Overall system architecture
- `_bmad-output/prd.md` - Product requirements
- `_bmad-output/analysis/bpa-api-mental-model-analysis.md` - Legacy BPA analysis
- `_bmad-output/implementation-artifacts/misalignment-report-2026-01-01.md` - Pre-Epic 4 review

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-01 | Initial draft - Proposed |

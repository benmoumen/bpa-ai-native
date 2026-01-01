# Epic 4: Workflow Domain Research Spike - Findings

> **Story ID**: 4-0
> **Status**: Complete
> **Date**: 2026-01-01

## Executive Summary

This spike researched the legacy BPA workflow domain model to inform Epic 4 implementation. The research covered:
1. Role entity hierarchy and polymorphism
2. 4-Status Model implementation
3. BOT Contract Architecture
4. Workflow step and transition patterns
5. Prisma schema recommendations

**Key Finding**: The legacy BPA system uses a sophisticated role-based workflow engine with contract-based bot integration. The 4-Status Model is universal and non-negotiable.

---

## 1. Role Entity Hierarchy

### Base Role Structure

Roles are the core workflow steps. They use **Single Table Inheritance** with a discriminator column.

```
Role (base)
├── UserRole (human decision points)
│   ├── assignedTo (who processes)
│   ├── formSchema (JSON Forms schema)
│   ├── allowAccessToFinancialReports
│   └── allowToConfirmPayments
│
└── BotRole (automated processing)
    ├── repeatUntilSuccessful (retry flag)
    ├── repeatInMinutes/Hours/Days (retry interval)
    ├── durationInMinutes/Hours/Days (timeout)
    └── botRoleBots (bot execution config)
```

### Role Properties (Common)

| Property | Type | Purpose |
|----------|------|---------|
| `name` | string | Unique within service |
| `shortName` | string | Display abbreviation |
| `description` | text | Documentation |
| `camundaName` | string | Camunda process ID (generated at publish) |
| `businessKey` | string | External identifier |
| `jsonDeterminants` | json | Conditional logic |
| `startRole` | boolean | Entry point marker |
| `sortOrderNumber` | int | Execution sequence |
| `visibleForApplicant` | boolean | UI visibility |

### Role Relationships

- `Role → Service` (many-to-one)
- `Role → RoleRegistration` (one-to-many, junction table)
- `Role → RoleInstitution` (one-to-many)
- `Role → RoleStatus` (one-to-many, polymorphic)
- `Role → Notification` (many-to-many via Map)

---

## 2. 4-Status Model (RoleStatusType)

### Universal Workflow Grammar

Every role produces **exactly one** of these four outcomes:

| Code | Legacy Name | AI-Native Name | Description |
|------|-------------|----------------|-------------|
| 0 | `FilePendingStatus` | `PENDING` | Waiting for decision |
| 1 | `FileValidatedStatus` | `PASSED` | Approved, moves forward |
| 2 | `FileDeclineStatus` | `RETURNED` | Sent back for fixes (can retry) |
| 3 | `FileRejectStatus` | `REJECTED` | Permanently rejected (terminal) |
| 4 | `UserDefinedStatus` | `CUSTOM` | Custom status (deferred) |

### Status Hierarchy (Legacy)

```java
RoleStatusBase (abstract)
├── FilePendingStatus
│   └── Weight: 0, Sort: 0
│
└── DestinationBaseStatus (MappedSuperclass)
    ├── FileValidatedStatus
    │   └── Weight: 3, Sort: 1
    │
    ├── FileDeclineStatus
    │   ├── Weight: 2, Sort: 2
    │   └── rejectionCatalog (reason codes)
    │
    └── FileRejectStatus
        └── Weight: 1, Sort: 3
```

### Status Flow Pattern

```
Role → produces RoleStatus (outcome)
  ↓
RoleStatus → has RoleStatusDestination(s)
  ↓
RoleStatusDestination → routes to next Role
```

**Critical**: Each status can route to multiple destination roles (sorted by `sortOrder`).

---

## 3. BOT Contract Architecture

### Contract-Based I/O Pattern

Bots use **contract mappings** instead of type-based implementations. This enables plug & play:

```
Bot
├── InputMapping (form field → service request field)
└── OutputMapping (service response field → form field)
```

### Bot Properties

| Property | Type | Purpose |
|----------|------|---------|
| `botType` | enum | data, document, system, external, internal, message, link |
| `category` | enum | CRUD operations + document operations |
| `botServiceId` | string | External service identifier |
| `authenticationType` | enum | Auth method |
| `inputFieldsMapping` | Set<InputMapping> | Form → Service contract |
| `outputFieldsMapping` | Set<OutputMapping> | Service → Form contract |
| `inputFieldsFilter` | json | Execution conditions |
| `outputFieldsFilter` | json | Result filtering |

### BotType Enum (from legacy)

```typescript
type BotType =
  | 'data'      // Data lookup/validation
  | 'document'  // Document operations
  | 'system'    // System integrations
  | 'external'  // External API calls
  | 'internal'  // Internal service calls
  | 'message'   // Messaging service
  | 'link'      // Redirect/hyperlink
```

### BotCategoryType Enum (from legacy)

```typescript
type BotCategoryType =
  // Document operations
  | 'document_display'
  | 'document_upload'
  | 'document_generate'
  | 'document_generate_and_display'
  | 'document_generate_and_upload'
  | 'document_generate_upload_display'
  // CRUD operations
  | 'create' | 'exist' | 'list' | 'pull' | 'read' | 'update'
  // Special types
  | 'log' | 'listener' | 'other' | 'message'
```

### Mapping Contract Structure

```typescript
interface BaseMapping {
  sourceField: string;          // From which field?
  sourceType: string;           // Field type
  sourceFieldIsMultiple: boolean;
  targetField: string;          // To which field?
  targetType: string;           // Field type
  targetFieldIsMultiple: boolean;
  jsonDeterminant?: string;     // Conditional mapping
  format?: string;              // Data transformer
  externalId?: string;          // External system reference
}
```

---

## 4. Workflow Step Patterns

### Workflow Container: Service

Service is the root configuration container that owns:
- Roles (workflow steps)
- Registrations (authorization types)
- Bots (integrations)
- Forms (data collection)

### Step Execution Flow

```
Form Submission
  ↓
Determinants Evaluate (check conditions)
  ↓
Role Processing
  ├─ UserRole: Display form, wait for human decision
  └─ BotRole: Execute bot sequence (with retry/timeout)
  ↓
RoleStatus Update (PENDING → PASSED/RETURNED/REJECTED)
  ↓
Next Role(s) via RoleStatusDestination
```

### Institution-Specific Routing

`RoleInstitution` enables conditional role activation:

```typescript
interface RoleInstitution {
  roleId: string;
  institutionId: string;       // Which institution?
  unitId?: string;             // Which department?
  jsonDeterminants?: string;   // Institution-specific conditions
}
```

### Registration Binding

`RoleRegistration` tracks which roles apply to which registration types:

```typescript
interface RoleRegistration {
  roleId: string;
  registrationId: string;
  finalResultIssued?: boolean;  // Workflow completion flag
}
```

---

## 5. Prisma Schema Recommendations

### New Enums

```prisma
/// RoleType - discriminator for Role polymorphism
enum RoleType {
  USER  // Human decision point
  BOT   // Automated processing
}

/// RoleStatusCode - fixed 4-Status Model codes
enum RoleStatusCode {
  PENDING   @map("0")  // Waiting for decision
  PASSED    @map("1")  // Approved, moves forward
  RETURNED  @map("2")  // Sent back for fixes
  REJECTED  @map("3")  // Permanently rejected
}

/// BotType - integration categories
enum BotType {
  DATA
  DOCUMENT
  SYSTEM
  EXTERNAL
  INTERNAL
  MESSAGE
  LINK
}

/// BotCategory - operational patterns
enum BotCategory {
  DOCUMENT_DISPLAY
  DOCUMENT_UPLOAD
  DOCUMENT_GENERATE
  CREATE
  READ
  UPDATE
  LIST
  OTHER
}
```

### Core Workflow Models

```prisma
/// Role - workflow step (polymorphic via roleType)
model Role {
  id              String    @id @default(cuid())
  serviceId       String    @map("service_id")
  roleType        RoleType  @map("role_type")
  name            String    @db.VarChar(255)
  shortName       String?   @map("short_name") @db.VarChar(50)
  description     String?   @db.Text
  isStartRole     Boolean   @default(false) @map("is_start_role")
  sortOrder       Int       @default(100) @map("sort_order")
  isActive        Boolean   @default(true) @map("is_active")
  conditions      Json?     // Determinant conditions (replaces jsonDeterminants)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // UserRole-specific fields (nullable, applies only when roleType = USER)
  assignedTo      String?   @map("assigned_to") @db.VarChar(255)
  formId          String?   @map("form_id")

  // BotRole-specific fields (nullable, applies only when roleType = BOT)
  retryEnabled    Boolean?  @default(false) @map("retry_enabled")
  retryInterval   Int?      @map("retry_interval_minutes")
  timeoutMinutes  Int?      @map("timeout_minutes")

  // Relations
  service         Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  form            Form?     @relation(fields: [formId], references: [id], onDelete: SetNull)
  statuses        RoleStatus[]
  registrations   RoleRegistration[]
  institutions    RoleInstitution[]
  bots            Bot[]     // For BotRole: linked bots

  @@unique([serviceId, name])
  @@index([serviceId])
  @@index([roleType])
  @@index([isActive])
  @@map("roles")
}

/// RoleStatus - workflow outcomes (4-Status Model)
model RoleStatus {
  id              String          @id @default(cuid())
  roleId          String          @map("role_id")
  code            RoleStatusCode
  name            String          @db.VarChar(100)
  isDefault       Boolean         @default(false) @map("is_default")
  sortOrder       Int             @default(0) @map("sort_order")
  conditions      Json?           // When to show this status option
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  // Relations
  role            Role            @relation(fields: [roleId], references: [id], onDelete: Cascade)
  destinations    WorkflowTransition[] @relation("FromStatus")

  @@index([roleId])
  @@index([code])
  @@map("role_statuses")
}

/// WorkflowTransition - status outcome routing
model WorkflowTransition {
  id              String      @id @default(cuid())
  fromStatusId    String      @map("from_status_id")
  toRoleId        String      @map("to_role_id")
  sortOrder       Int         @default(0) @map("sort_order")
  conditions      Json?       // Transition conditions
  createdAt       DateTime    @default(now()) @map("created_at")
  updatedAt       DateTime    @updatedAt @map("updated_at")

  // Relations
  fromStatus      RoleStatus  @relation("FromStatus", fields: [fromStatusId], references: [id], onDelete: Cascade)
  toRole          Role        @relation("TransitionTarget", fields: [toRoleId], references: [id], onDelete: Cascade)

  @@unique([fromStatusId, toRoleId])
  @@index([fromStatusId])
  @@index([toRoleId])
  @@map("workflow_transitions")
}

/// RoleRegistration - Role to Registration binding
model RoleRegistration {
  id              String       @id @default(cuid())
  roleId          String       @map("role_id")
  registrationId  String       @map("registration_id")
  isComplete      Boolean      @default(false) @map("is_complete")
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  // Relations
  role            Role         @relation(fields: [roleId], references: [id], onDelete: Cascade)
  registration    Registration @relation(fields: [registrationId], references: [id], onDelete: Cascade)

  @@unique([roleId, registrationId])
  @@index([roleId])
  @@index([registrationId])
  @@map("role_registrations")
}

/// RoleInstitution - Institution-specific role configuration
model RoleInstitution {
  id              String    @id @default(cuid())
  roleId          String    @map("role_id")
  institutionId   String    @map("institution_id")
  unitId          String?   @map("unit_id")
  conditions      Json?     // Institution-specific conditions
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  role            Role      @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([roleId, institutionId, unitId])
  @@index([roleId])
  @@index([institutionId])
  @@map("role_institutions")
}
```

### Bot Models

```prisma
/// Bot - external service integration
model Bot {
  id                String      @id @default(cuid())
  serviceId         String      @map("service_id")
  roleId            String?     @map("role_id")  // If assigned to specific BotRole
  name              String      @db.VarChar(255)
  shortName         String?     @map("short_name") @db.VarChar(50)
  description       String?     @db.Text
  botType           BotType     @map("bot_type")
  category          BotCategory
  externalServiceId String?     @map("external_service_id")
  sortOrder         Int         @default(0) @map("sort_order")
  isActive          Boolean     @default(true) @map("is_active")
  config            Json?       // Auth config, filtering, etc.
  createdAt         DateTime    @default(now()) @map("created_at")
  updatedAt         DateTime    @updatedAt @map("updated_at")

  // Relations
  service           Service     @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  role              Role?       @relation(fields: [roleId], references: [id], onDelete: SetNull)
  inputMappings     BotMapping[] @relation("InputMappings")
  outputMappings    BotMapping[] @relation("OutputMappings")

  @@unique([serviceId, name])
  @@index([serviceId])
  @@index([roleId])
  @@index([botType])
  @@map("bots")
}

/// BotMapping - field mapping contracts
model BotMapping {
  id                String    @id @default(cuid())
  botId             String    @map("bot_id")
  direction         String    @db.VarChar(10)  // 'INPUT' or 'OUTPUT'
  sourceField       String    @map("source_field") @db.VarChar(255)
  sourceType        String    @map("source_type") @db.VarChar(50)
  targetField       String    @map("target_field") @db.VarChar(255)
  targetType        String    @map("target_type") @db.VarChar(50)
  isMultiple        Boolean   @default(false) @map("is_multiple")
  conditions        Json?     // Conditional mapping
  format            String?   @db.VarChar(100)  // Data transformer
  externalId        String?   @map("external_id") @db.VarChar(255)
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  // Relations (dual relationship for input/output)
  inputBot          Bot?      @relation("InputMappings", fields: [botId], references: [id], onDelete: Cascade)
  outputBot         Bot?      @relation("OutputMappings", fields: [botId], references: [id], onDelete: Cascade)

  @@index([botId])
  @@index([direction])
  @@map("bot_mappings")
}
```

---

## 6. Implementation Constraints

### Non-Negotiable Rules

1. **4-Status Codes are FIXED**: `PENDING=0, PASSED=1, RETURNED=2, REJECTED=3`
2. **Role polymorphism**: Use discriminator pattern (`roleType: USER | BOT`)
3. **Contract-based BOT I/O**: Input/Output mappings, not type-based implementations
4. **Service owns everything**: Roles, Forms, Bots, Registrations all belong to Service
5. **Audit trail required**: `createdAt`, `updatedAt` on all entities
6. **Data storage strategy** (JSON vs Relational):
   - **USE JSON FOR**: Configuration expressions (conditions, visibility rules, form schemas, field properties)
   - **USE RELATIONAL FOR**: Entity relationships (bot mappings, role-registration bindings, role-institution assignments)
   - See `_bmad-output/project-context.md` → "Domain Implementation Rules" for full details

### What NOT to Reinvent

- 4-Status Model (use as-is)
- Service/Registration separation (keep distinction)
- Role inheritance (UserRole/BotRole pattern)
- Contract-based BOT I/O (enables extensibility)
- Status destination routing (proven pattern)

### What TO Transform

- `jsonDeterminants` → `conditions` (structured JSON, not string)
- Camunda integration → defer (not needed for MVP)
- Complex institution routing → simplified for MVP
- UserDefinedStatus → defer (not needed for MVP)

---

## 7. API Module Recommendations

### WorkflowModule
- `POST /services/:serviceId/roles` - Create role
- `GET /services/:serviceId/roles` - List roles
- `PUT /roles/:roleId` - Update role
- `DELETE /roles/:roleId` - Delete role

### RoleStatusModule
- `POST /roles/:roleId/statuses` - Create status
- `GET /roles/:roleId/statuses` - List statuses
- `PUT /statuses/:statusId` - Update status
- `DELETE /statuses/:statusId` - Delete status

### WorkflowTransitionModule
- `POST /statuses/:statusId/transitions` - Create transition
- `GET /statuses/:statusId/transitions` - List transitions
- `DELETE /transitions/:transitionId` - Delete transition

### BotModule (deferred to later story)
- `POST /services/:serviceId/bots` - Create bot
- `GET /services/:serviceId/bots` - List bots
- `PUT /bots/:botId` - Update bot
- `DELETE /bots/:botId` - Delete bot
- `POST /bots/:botId/mappings` - Create mapping
- `GET /bots/:botId/mappings` - List mappings

---

## 8. Next Steps

1. **Story 4-1**: Implement Role, RoleStatus, WorkflowTransition Prisma models
2. **Story 4-2**: Implement Role CRUD API with step ordering
3. **Story 4-3**: Implement WorkflowTransition API for status routing
4. **Story 4-4**: Implement step actions (placeholder for BOT integration points)
5. **Story 4-5**: Implement form assignment to roles (link Role → Form)
6. **Story 4-5a**: Implement conditions field for workflow routing
7. **Story 4-6**: Implement linear approval chain UI
8. **Story 4-9**: Implement 4-Status Model CRUD

---

## References

- Legacy BPA Backend: `../BPA-backend/src/main/java/org/unctad/ereg/bpa/model/`
- Domain Analysis: `_bmad-output/analysis/bpa-api-mental-model-analysis.md`
- Architecture: `_bmad-output/architecture.md`

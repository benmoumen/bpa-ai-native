# BPA API Mental Model Analysis

**Date:** 2025-12-29
**Source:** API docs at bpa.dev.els.eregistrations.org + BPA-backend codebase
**Purpose:** Extract knowledge for AI-Native BPA rebuild

---

## 1. Service & Registration Structure

### Service = Configuration Container
- **Properties**: name, description, active status, sort order, publish state
- **Role**: Owns the entire configuration landscape (registrations, roles, forms, bots, determinants, costs)
- **Key Relationships**:
  - Service --[1:N]--> Registration (ManyToMany via `service_registration` join table)
  - Service --[1:N]--> Role (OneToMany)
  - Service --[1:N]--> Form (OneToMany)
  - Service --[1:N]--> Bot (OneToMany)
  - Service --[1:N]--> Determinant (OneToMany)
  - Service --[1:N]--> Classification (OneToMany)
  - Service --[1:N]--> Cost (OneToMany)

### Registration = Authorization Container
- **Properties**: name, shortName (localized), key (unique identifier), active status, sort order
- **Metadata Stored**:
  - `mandatoryJsonDeterminants` - JSON definition of mandatory determinants
  - `optionalJsonDeterminants` - JSON definition of optional determinants
  - `businessKey` - External system reference
- **Key Relationships**:
  - Registration <--[N:N]--> Service (via join table)
  - Registration --[1:1]--> Ownership (tracks who owns this registration in larger hierarchies)
  - Registration --[1:N]--> DocumentRequirement (documents/files needed)
  - Registration --[1:N]--> Cost (fees associated)
  - Registration --[N:1]--> RoleRegistration (links to roles that handle this)

### Metadata Architecture
- Services, Registrations, and Roles all track: `createdBy`, `createdWhen`, `lastChangedBy`, `lastChangedWhen`
- Hibernate Envers auditing enabled on all core entities
- Translation system captures localized names/descriptions for multi-language support

---

## 2. Workflow & Roles

### Role = Processing State Executor

**Role Inheritance Hierarchy** (Single-table with discriminator):
```
Role (base, @DiscriminatorColumn("type"))
├── UserRole (@DiscriminatorValue("UserRole"))
│   └── Properties: assignedTo (role pool), formSchema (JSON),
│       allowAccessToFinancialReports, allowToConfirmPayments
│   └── Purpose: Human executor with UI form configuration
│
└── BotRole (@DiscriminatorValue("BotRole"))
    └── Properties: repeatUntilSuccessful, repeatInMinutes/Hours/Days,
        durationInMinutes/Hours/Days
    └── Purpose: Automated executor with retry logic
    └── Relationship: --[1:1]--> BotRoleBots (configures which bots execute)
```

### Role Configuration
- `name`, `shortName`, `description` (all localized)
- `jsonDeterminants` - conditional logic for role visibility/execution
- `startRole` - marks entry point into workflow
- `sortOrderNumber` - defines sequence
- `visibleForApplicant` - controls applicant visibility
- `camundaName` - generated when published (integration point)

### 4-Status Model Implementation (RoleStatusType enum)
```
FilePendingStatus (0)      → Waiting for document submission
FileValidatedStatus (1)    → Document passed validation
FileDeclineStatus (2)      → Document rejected for fixes (can retry)
FileRejectStatus (3)       → Document permanently rejected
UserDefinedStatus (4)      → Custom statuses defined per role
```

### Status Architecture (RoleStatusBase hierarchy)
- Each role can have multiple statuses
- Status messages associated with each status (for notifications)
- Statuses have `weight` (priority) and `sortNumber` (ordering)
- Status messages link to notification templates

### Role-Registration Binding (RoleRegistration cross-table)
- Links Role → Registration
- `finalResultIssued` flag tracks if role has produced outcome
- Enables: Role can handle multiple registrations; Registration can have multiple roles

### Role-Institution Binding (RoleInstitution cross-table)
- Each role must be assigned to institution(s) for publishing
- Supports: Different institutions handling same service role

---

## 3. BOTs & Automation

### Bot Entity Structure
- `name`, `shortName`, `description`
- `botType` (enum: various automation types)
- `botCategoryType` (categorization)
- `botServiceId` - external service endpoint
- `authenticationType` - how bot authenticates (OAuth, basic, etc.)
- `enabled` flag

### Contract-Based I/O Architecture
```
Bot
├── InputMapping (1:N)
│   └── Maps: form field → service request field
│   └── Schema: source field, target field, transformation rules
│
└── OutputMapping (1:N)
    └── Maps: service response field → form field
    └── Schema: source field, target field, transformation rules
```

### Bot Filtering & Hidden Fields
- `inputFieldsFilter` - JSON: which input fields to expose/hide
- `outputFieldsFilter` - JSON: which output fields to expose/hide
- `hiddenInputServiceFields` - JSON: mark fields hidden from service
- `hiddenOutputServiceFields` - JSON: mark fields hidden from output
- `hiddenInputFormFields` - JSON: hide in form UI
- `hiddenOutputFormFields` - JSON: hide in form UI

### BotRole Execution
- BotRole --[1:1]--> BotRoleBots (defines which bots execute)
- Configurable retry: `repeatUntilSuccessful` with time intervals
- Configurable timeout: `durationIn[Minutes/Hours/Days]`
- Success/Failure messages: `botSuccessMessage`, `botFailMessage`

### Bot Attachment Points
1. **Component Actions**: Bots attached to form components via FormComponentActions
2. **Role Execution**: BotRole directly orchestrates bot sequence
3. **Field Validation**: Bots can validate form fields

---

## 4. Forms & Fields

### Form Types (discriminated by `type` field)
```
GUIDEFORM (1)    → Info/instructions page (sorted 1st)
FORM (2)         → Main applicant data form (sorted 2nd)
DOCUMENT (3)     → Document submission form (sorted 3rd, cached)
PAYMENT (4)      → Fee payment form (sorted 4th)
SENDPAGE (5)     → File send/submission form (sorted 5th)
```

### Form Schema Model
- Each Form has `formSchema` (TEXT column) - JSON Schema format
- UserRole has enhanced `formSchema` with role-specific field configuration
- Forms support JSON Form.io components

### Field Organization
- Fields organized via `FormBase` parent
- Each field has: `key` (unique), `name`, `label`, `type`, `required` flag
- Fields support validation rules, defaults, conditional visibility

### Determinant System (Conditional Logic)

**Determinant Hierarchy** (Inheritance strategy JOINED with discriminator):
```
Determinant (base)
├── TextDeterminant      → Text field conditions (equals, contains, startsWith, etc.)
├── SelectDeterminant    → Select/dropdown field conditions
├── DateDeterminant      → Date field conditions
├── NumericDeterminant   → Numeric field conditions
├── BooleanDeterminant   → Boolean field conditions
├── ClassificationDeterminant → Catalog/classification conditions
├── GridDeterminant      → Grid/table conditions
├── RadioDeterminant     → Radio button conditions
├── FileUploadDeterminant → File upload conditions
└── ... (specialized for each field type)
```

### Determinant Properties
- `name` - human-readable condition name
- `targetFormFieldKey` - which form field this targets
- `sourceFormFieldKey` - which form field triggers this
- `determinantType` - QUESTION or other types
- `jsonDeterminants` - JSON condition definition
- `isDeterminantInsideGrid` - whether condition is inside grid component

### Determinant Relationships
- Determinant --[1:1]--> Service (each service has own determinants)
- FormFieldDeterminantRelationship --[N:N]--> Field ↔ Determinant mapping
- DeterminantRegistrationRelation --[N:N]--> Registration-specific determinant logic

---

## 5. Key Architectural Patterns

### Pattern 1: Discriminator-Based Polymorphism
- Role, Cost, Determinant, RoleStatus use single-table inheritance with discriminator column
- Enables: Type-safe queries, unified storage, efficient polymorphic relationships

### Pattern 2: Dual Metadata Model
- Global Requirements (reusable templates)
- DocumentRequirement (links Requirement → Registration with registration-specific settings)
- **Pattern**: Template + Link allows reuse + customization

### Pattern 3: JSON as Schema Carrier
- Determinants stored as JSON conditions
- Forms stored as JSON schemas (Form.io compatible)
- Bot I/O mappings as JSON
- Role assignments stored as JSON
- **Implication**: Config is data-driven, not code-driven

### Pattern 4: Service-Centric Auditing
- Creation tracking via `createdBy`/`createdWhen`
- Modification tracking via `lastChangedBy`/`lastChangedWhen`
- Hibernate Envers provides full history

### Pattern 5: Cross-Cutting Relationships via Join Tables
- service_registration (many-to-many)
- role_registration (role → registration)
- role_institution (role → institution)
- form_field_determinant_relationship

### Pattern 6: Business Key Strategy
- Every configurable entity has optional `businessKey` field
- Enables integration with external systems (Camunda, legacy APIs)

---

## 6. Hidden Gems Worth Preserving

1. **Classification System** — Dynamic catalogs/lookups for reference data
2. **Translation Listener Architecture** — Decoupled i18n from entity storage
3. **Service Publishing Flow** — Separates design-time (draft) from runtime (published)
4. **Ownership Model** — Hierarchical delegation support
5. **Message/Notification System** — Decoupled multi-channel notifications
6. **GridComponentDeterminant** — Row-level conditional logic in tables
7. **Soft Delete via Archive** — Compliance-friendly data retention

---

## 7. Data Flow & Execution Model

```
USER INTERACTION:
  ↓
Form (e.g., APPLICANT form)
  ├─ FormComponents (fields)
  └─ Components trigger: FormComponentActions
       ├─ Bot execution
       ├─ Validation
       └─ Determinant evaluation
  ↓
Determinants evaluate
  ├─ Check targetFormFieldKey value
  ├─ Apply visibility/enable/validation rules
  └─ Trigger cascading updates
  ↓
Role processes Registration
  ├─ UserRole: Displays form, waits for human decision
  ├─ BotRole: Executes Bot sequence (with retry/timeout)
  └─ Outcome: Updates RoleStatus
  ↓
RoleStatus transitions
  ├─ FilePending → FileValidated (auto-approve)
  ├─ FileValidated → FileDecline (manual return)
  ├─ FileDecline → FilePending (resubmit)
  └─ FileReject (terminal)
  ↓
Outcome: Authorization decision (Registration approved/rejected)
```

---

## 8. First Principles Validation

| First Principle | API Validation |
|-----------------|----------------|
| Registration = Authorization Container | ✓ Confirmed |
| Role = Processing State Executor | ✓ Confirmed with UserRole/BotRole split |
| 4-Status Model = Universal Grammar | ✓ Confirmed + UserDefinedStatus extension |
| BOTs = Contract-Based I/O | ✓ Confirmed via InputMapping/OutputMapping |
| Forms as Data Structure | ✓ JSON Schema, Form.io compatible |

---

## 9. AI-Native Transformation Guide

### Ready to Port (keep structure)
- Service/Registration/Role/Form/Determinant hierarchy
- 4-Status model (implement as state machine)
- Bot I/O contract model
- Translation/localization architecture
- Audit trail

### Requires Transformation
- **Determinants**: From field-based JSON → LLM-evaluable expressions
- **Forms**: From JSON Schema → Conversational interface
- **BOTs**: From fixed integrations → LLM-as-bot (flexible prompt-based)
- **Classifications**: From static catalogs → Dynamic AI-generated lookups

### New Abstractions Needed
- Conversation State Machine (for chat-based forms)
- LLM Instruction Schema (for determinant rules as natural language)
- Plugin Architecture (for extensible bot types)
- Form Generation Pipeline (from NL description → JSON Schema)

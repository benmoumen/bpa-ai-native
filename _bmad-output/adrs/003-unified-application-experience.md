# ADR-003: Unified Application Experience Architecture

**Status**: Proposed
**Date**: 2026-01-01
**Decision Makers**: Architecture Team
**Supersedes**: N/A
**Related**: ADR-001 (Field References), ADR-002 (Procedure Types)

## Context

### Legacy BPA Architecture

The legacy BPA system uses a **linear wizard paradigm** with 7 distinct form types:

```
GUIDE → APPLICANT → DOCUMENTS → PAYMENT → SEND → [ROLE] → [PRINT]
```

| Form Type | Purpose |
|-----------|---------|
| Guide | Qualification questions, contextual info |
| Applicant | Data collection forms |
| Documents | File upload requirements |
| Payment | Fee calculation and payment |
| Send | Declaration and submission |
| Role | Operator review forms |
| Print/Cert | Certificate generation |

### Problems with Linear Wizard

1. **Hidden Relationships**: Conditions connecting elements are buried in JSONLogic
2. **No Impact Visibility**: User doesn't see how answers affect docs, fees, workflow
3. **Siloed Stages**: Each stage feels disconnected from others
4. **Progress Opacity**: "Step 2 of 5" doesn't show completion percentage
5. **Return Confusion**: When returned, user doesn't know what needs fixing

### The Guide's Historical Role

The Guide form served as a **qualification engine**:
- Questions create determinants
- Determinants control: visible sections, required documents, applicable fees, workflow routing
- Contextual information helps user understand requirements

This qualification logic should be **visible and interactive**, not hidden.

### AI-Native Vision

Transform from linear wizard to **unified application experience**:
- See all elements in one view
- Visualize relationships between elements
- Watch application update live as answers change
- Understand why each document/fee is required
- Track progress as percentage across all elements

## Decision

### 1. ActorType Enum (Who Performs)

Replace implicit actor assumptions with explicit ActorType:

```prisma
enum ActorType {
  APPLICANT    // External party (citizen, business, entity)
  OPERATOR     // Institution staff (reviewer, approver)
  SYSTEM       // Automated processing (bots, scheduled tasks)
}
```

### 2. ElementType Enum (What They Work With)

Replace FormType with ElementType representing application components:

```prisma
enum ElementType {
  QUALIFIER    // Questions that determine other elements (legacy: Guide)
  DATA         // Information collection fields/sections (legacy: Applicant)
  EVIDENCE     // Document upload requirements (legacy: Documents)
  PAYMENT      // Fee items and payment (legacy: Payment)
  DECLARATION  // Sworn statements, terms acceptance (legacy: part of Send)
  SUBMISSION   // Final submit action (legacy: Send button)
}
```

### 3. ApplicationElement Model

Each element in the application experience:

```prisma
model ApplicationElement {
  id            String        @id @default(cuid())
  procedureId   String        @map("procedure_id")
  type          ElementType
  name          String        @db.VarChar(255)
  description   String?       @db.Text
  config        Json          @default("{}")  // Type-specific configuration
  sortOrder     Int           @default(0) @map("sort_order")
  isActive      Boolean       @default(true) @map("is_active")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  // Relations
  procedure       Procedure         @relation(fields: [procedureId], references: [id], onDelete: Cascade)
  fields          FormField[]       // Fields within this element
  outgoingLinks   ElementRelation[] @relation("RelationSource")
  incomingLinks   ElementRelation[] @relation("RelationTarget")

  @@index([procedureId])
  @@index([type])
  @@map("application_elements")
}
```

### 4. ElementRelation Model (Explicit Relationships)

Make relationships between elements **first-class queryable entities**:

```prisma
enum RelationType {
  SHOWS         // Source value shows target element
  HIDES         // Source value hides target element
  REQUIRES      // Source element requires target evidence
  CALCULATES    // Source value calculates target amount
  VALIDATES     // Source evidence validates target data
  ROUTES_TO     // Source outcome routes to target role
}

model ElementRelation {
  id            String        @id @default(cuid())
  sourceId      String        @map("source_id")
  targetId      String        @map("target_id")
  relationType  RelationType  @map("relation_type")
  condition     Json?         // When this relationship applies
  effect        Json          @default("{}")  // What happens when triggered
  description   String?       @db.Text  // Human-readable explanation
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  // Relations
  source        ApplicationElement @relation("RelationSource", fields: [sourceId], references: [id], onDelete: Cascade)
  target        ApplicationElement @relation("RelationTarget", fields: [targetId], references: [id], onDelete: Cascade)

  @@unique([sourceId, targetId, relationType])
  @@index([sourceId])
  @@index([targetId])
  @@index([relationType])
  @@map("element_relations")
}
```

### 5. Role Model Updates

Add ActorType and entry point designation:

```prisma
model Role {
  // ... existing fields

  actorType      ActorType    @default(OPERATOR) @map("actor_type")
  isEntryPoint   Boolean      @default(false) @map("is_entry_point")

  // For APPLICANT roles: reference to the unified experience
  // For OPERATOR roles: reference to the review form
  // For SYSTEM roles: no UI, automated execution
}
```

### 6. Unified Experience for Applicant Role

The Applicant role's "form" is the **unified application experience**:

```
Applicant Role (isEntryPoint: true, actorType: APPLICANT)
└── Unified Application Experience
    ├── Elements: [QUALIFIER, DATA, EVIDENCE, PAYMENT, DECLARATION, SUBMISSION]
    ├── Relationships: [All ElementRelations for this procedure]
    ├── Progress: Calculated from element completion states
    └── Impact Feedback: Real-time updates when values change
```

### 7. Progress Model

Application progress is calculated across all elements:

```typescript
interface ApplicationProgress {
  overallPercent: number;          // 0-100
  elementProgress: {
    elementId: string;
    type: ElementType;
    name: string;
    status: 'not_started' | 'in_progress' | 'complete' | 'blocked';
    percent: number;
    blockedBy?: string[];          // Element IDs blocking this
  }[];

  // Completion criteria
  qualifierComplete: boolean;
  dataComplete: boolean;
  evidenceComplete: boolean;
  paymentComplete: boolean;
  declarationComplete: boolean;
  canSubmit: boolean;
}
```

### 8. Impact Feedback Model

When a value changes, show the user what was affected:

```typescript
interface ImpactFeedback {
  trigger: {
    elementId: string;
    fieldId: string;
    oldValue: any;
    newValue: any;
  };
  impacts: {
    type: 'added' | 'removed' | 'updated';
    targetElement: {
      id: string;
      type: ElementType;
      name: string;
    };
    description: string;  // "Added Food Safety Certificate requirement"
    reason: string;       // "Because Business Type = Restaurant"
  }[];
}
```

## Schema Changes Summary

### New Enums

```prisma
enum ActorType {
  APPLICANT
  OPERATOR
  SYSTEM
}

enum ElementType {
  QUALIFIER
  DATA
  EVIDENCE
  PAYMENT
  DECLARATION
  SUBMISSION
}

enum RelationType {
  SHOWS
  HIDES
  REQUIRES
  CALCULATES
  VALIDATES
  ROUTES_TO
}
```

### New Models

```prisma
model ApplicationElement {
  id            String        @id @default(cuid())
  procedureId   String        @map("procedure_id")
  type          ElementType
  name          String        @db.VarChar(255)
  description   String?       @db.Text
  config        Json          @default("{}")
  sortOrder     Int           @default(0) @map("sort_order")
  isActive      Boolean       @default(true) @map("is_active")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  procedure       Procedure         @relation(fields: [procedureId], references: [id], onDelete: Cascade)
  fields          FormField[]
  outgoingLinks   ElementRelation[] @relation("RelationSource")
  incomingLinks   ElementRelation[] @relation("RelationTarget")

  @@index([procedureId])
  @@index([type])
  @@map("application_elements")
}

model ElementRelation {
  id            String        @id @default(cuid())
  sourceId      String        @map("source_id")
  targetId      String        @map("target_id")
  relationType  RelationType  @map("relation_type")
  condition     Json?
  effect        Json          @default("{}")
  description   String?       @db.Text
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  source        ApplicationElement @relation("RelationSource", fields: [sourceId], references: [id], onDelete: Cascade)
  target        ApplicationElement @relation("RelationTarget", fields: [targetId], references: [id], onDelete: Cascade)

  @@unique([sourceId, targetId, relationType])
  @@index([sourceId])
  @@index([targetId])
  @@index([relationType])
  @@map("element_relations")
}
```

### Modified Models

```prisma
model Role {
  // Add to existing fields:
  actorType      ActorType    @default(OPERATOR) @map("actor_type")
  isEntryPoint   Boolean      @default(false) @map("is_entry_point")
}

model FormField {
  // Add relation to ApplicationElement:
  elementId      String?      @map("element_id")
  element        ApplicationElement? @relation(fields: [elementId], references: [id], onDelete: SetNull)
}
```

### Deprecated

```prisma
// FormType enum becomes obsolete
// enum FormType { APPLICANT, GUIDE } -- DEPRECATED, use ElementType
```

## User Experience

### Unified View Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ BUSINESS LICENSE APPLICATION                      [Save Draft]  │
├─────────────────────────────────────────────────────────────────┤
│ Progress: ████████████░░░░░░░░░░░░░░░░░░ 42%                    │
│ ✅ Qualified  🔄 Details (3/7)  ⏳ Documents (0/2)  ⏳ Payment   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│ │ QUALIFICATION   │───►│ BUSINESS INFO   │───►│ DOCUMENTS    │ │
│ │ ✅ Complete     │    │ 🔄 In Progress  │    │ ⏳ 0/2       │ │
│ │                 │    │                 │    │              │ │
│ │ Type: Restaurant│    │ Name: [____]    │    │ • License ⬜ │ │
│ │ Employees: 5-20 │    │ Address: [____] │    │ • Health  ⬜ │ │
│ │                 │    │ Revenue: [____] │    │              │ │
│ └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
│ ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│ │ FEES            │    │ DECLARATION     │    │ SUBMIT       │ │
│ │ ⏳ $350 total   │    │ ⏳ Pending      │    │ 🔒 Locked    │ │
│ │                 │    │                 │    │              │ │
│ │ • License: $200 │    │ ☐ I declare... │    │ [Submit]     │ │
│ │ • Health:  $150 │    │                 │    │              │ │
│ └─────────────────┘    └─────────────────┘    └──────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Impact Feedback Example

When user changes "Business Type" from "Office" to "Restaurant":

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔔 Your application was updated:                                │
│                                                                 │
│ Because you selected "Restaurant":                              │
│                                                                 │
│ ✅ ADDED                                                        │
│    • Health Safety Certificate (required document)              │
│    • Food Handler's License (required document)                 │
│    • Health Department Review (workflow step)                   │
│    • Health Inspection Fee: $150                                │
│                                                                 │
│ ❌ REMOVED                                                       │
│    • Home Office Declaration (no longer applicable)             │
│                                                                 │
│ 📊 UPDATED                                                       │
│    • Total fees: $200 → $350                                    │
│    • Required documents: 1 → 3                                  │
│    • Estimated processing: 5 days → 10 days                     │
│                                                                 │
│                                        [Got it] [Show Details]  │
└─────────────────────────────────────────────────────────────────┘
```

### Relationship Hover

When user hovers on "Health Safety Certificate" document requirement:

```
┌─────────────────────────────────────────────────────────────────┐
│ 📎 Health Safety Certificate                                    │
├─────────────────────────────────────────────────────────────────┤
│ Required because:                                               │
│   • Business Type = "Restaurant"                                │
│   • Employee Count > 0                                          │
│                                                                 │
│ Validates:                                                      │
│   • Food handling staff qualifications                          │
│                                                                 │
│ Affects workflow:                                               │
│   • Enables "Health Inspector" review step                      │
└─────────────────────────────────────────────────────────────────┘
```

## Migration Path

### Phase 1: Schema Addition (Non-Breaking)
1. Add new enums (ActorType, ElementType, RelationType)
2. Add ApplicationElement and ElementRelation models
3. Add actorType and isEntryPoint to Role
4. Keep FormType for backward compatibility

### Phase 2: Data Migration
1. Create ApplicationElements from existing Forms
2. Map FormType to ElementType:
   - GUIDE → QUALIFIER
   - APPLICANT → DATA
3. Extract relationships from visibilityRule JSON into ElementRelation records
4. Set isEntryPoint on first applicant-facing role

### Phase 3: UI Migration
1. Build unified application view component
2. Implement progress calculation
3. Implement impact feedback system
4. Replace wizard navigation with unified view

### Phase 4: Deprecation
1. Deprecate FormType enum
2. Remove wizard-based navigation
3. Update all documentation

## Consequences

### Positive

1. **Transparency**: Users understand why each element exists
2. **Relationships Queryable**: Can answer "what affects this?" and "what does this affect?"
3. **Progress Clarity**: Percentage-based progress across all elements
4. **Impact Visibility**: Real-time feedback when answers change
5. **Unified Experience**: No disjointed wizard steps
6. **Return Handling**: Clear indication of what needs fixing
7. **AI-Friendly**: Explicit relationships are LLM-parseable

### Negative

1. **Complexity Increase**: More models and relationships to manage
2. **Migration Effort**: Existing Forms must be converted
3. **UI Overhaul**: Wizard UI must be replaced
4. **Relationship Maintenance**: Must keep ElementRelations in sync

### Neutral

1. **4-Status Model**: Unchanged, applies to applicant role
2. **Workflow Engine**: Unchanged, still processes roles
3. **Determinants**: Remain, but drive ElementRelations

## Alternatives Considered

### A. Keep FormType, Add visibilityGraph
**Rejected**: Still hides relationships in JSON, not queryable.

### B. Expand FormType Enum to 7 Values
**Rejected**: Doesn't address relationship visibility or unified experience.

### C. Keep Wizard, Add Progress Bar
**Rejected**: Still linear, doesn't show element connections.

### D. Graph Database for Relationships
**Rejected**: Over-engineering for this use case. Relational model with ElementRelation table is sufficient.

## Examples

### Qualifier Element

```json
{
  "id": "elem_qualifier_1",
  "type": "QUALIFIER",
  "name": "Business Qualification",
  "config": {
    "questions": [
      {
        "fieldId": "business_type",
        "label": "What type of business?",
        "options": ["Office", "Restaurant", "Retail", "Manufacturing"]
      },
      {
        "fieldId": "employee_count",
        "label": "How many employees?",
        "options": ["0", "1-5", "5-20", "20+"]
      }
    ]
  }
}
```

### Element Relation

```json
{
  "id": "rel_1",
  "sourceId": "elem_qualifier_1",
  "targetId": "elem_evidence_health",
  "relationType": "REQUIRES",
  "condition": {
    "and": [
      {"==": [{"var": "business_type"}, "Restaurant"]},
      {">": [{"var": "employee_count"}, 0]}
    ]
  },
  "effect": {
    "action": "add_requirement",
    "required": true
  },
  "description": "Restaurant businesses with employees require Health Safety Certificate"
}
```

### Progress Calculation

```typescript
function calculateProgress(applicationId: string): ApplicationProgress {
  const elements = await getApplicationElements(applicationId);

  let totalWeight = 0;
  let completedWeight = 0;

  const elementProgress = elements.map(element => {
    const weight = ELEMENT_WEIGHTS[element.type]; // QUALIFIER: 10, DATA: 40, etc.
    totalWeight += weight;

    const status = calculateElementStatus(element);
    const percent = calculateElementPercent(element);

    if (status === 'complete') {
      completedWeight += weight;
    } else if (status === 'in_progress') {
      completedWeight += weight * (percent / 100);
    }

    return { elementId: element.id, type: element.type, status, percent };
  });

  return {
    overallPercent: Math.round((completedWeight / totalWeight) * 100),
    elementProgress,
    canSubmit: elementProgress.every(e =>
      e.type === 'SUBMISSION' || e.status === 'complete'
    )
  };
}
```

## References

- `_bmad-output/architecture.md` - Overall system architecture
- `_bmad-output/prd.md` - Product requirements
- `_bmad-output/adrs/002-procedure-type-architecture.md` - Procedure types
- Legacy BPA FormType: `../BPA-backend/src/main/java/org/unctad/ereg/bpa/formio/generator/FormType.java`
- Legacy ApplicantForms: `../BPA-backend/src/main/java/org/unctad/ereg/bpa/formio/model/ApplicantForms.java`

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-01 | Initial draft - Proposed |

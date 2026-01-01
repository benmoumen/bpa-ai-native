# ADR-004: Shared Data Entities Architecture

**Status**: Proposed
**Date**: 2026-01-01
**Decision Makers**: Architecture Team
**Supersedes**: N/A
**Related**: ADR-003 (Unified Application Experience)

## Context

### The Problem: Field-by-Field Redundancy

In legacy BPA, every service defines its own fields for common concepts:

**Service A: Business License**
```
applicant_first_name, applicant_last_name, applicant_email, applicant_phone
business_name, business_registration, business_address_line1, business_address_city
```

**Service B: Tax Registration**
```
contact_firstname, contact_lastname, contact_email, contact_phone
company_name, company_taxid, address_street, address_city
```

**Service C: Import Permit**
```
user_fname, user_lname, user_mail, user_tel
org_name, org_regno, loc_addr1, loc_city
```

### Problems with Current Approach

| Problem | Impact |
|---------|--------|
| **Inconsistency** | Same concept has different names, types, validation |
| **No Reuse** | Can't share "Person" definition across services |
| **No Linking** | Same person in multiple services = no connection |
| **Maintenance Burden** | Update phone validation = update N services |
| **No Verification Reuse** | ID verified in app 1, must re-verify in app 2 |
| **AI Confusion** | LLM sees different patterns for same concept |
| **User Burden** | Re-enter same data for every application |

### The Vision

Define semantic data entities ONCE at system level. Users own their data in a "wallet". Services declare what entities they need. Verification applies across all uses.

## Decision

### 1. Three-Layer Entity Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ LAYER 1: DataEntityType (System-Level Definitions)         │
│ Defined once, used everywhere                               │
│ Person, Organization, Address, Contact, BankAccount         │
├─────────────────────────────────────────────────────────────┤
│ LAYER 2: EntityRequirement (Service-Level Needs)           │
│ Service declares what entities it needs with roles          │
│ "Need Person as APPLICANT", "Need Address as BUSINESS_ADDR" │
├─────────────────────────────────────────────────────────────┤
│ LAYER 3: DataEntityInstance (User's Data Wallet)           │
│ User owns instances of entity types                         │
│ "John Doe" Person instance, "Acme Corp" Organization        │
└─────────────────────────────────────────────────────────────┘
```

### 2. System Entity Types (Built-in)

The following entity types are built into the system:

| Entity | Category | Key Fields | Common Roles |
|--------|----------|------------|--------------|
| **Person** | PERSON | firstName, lastName, dateOfBirth, nationalId, gender | APPLICANT, OWNER, REPRESENTATIVE, WITNESS |
| **Organization** | ORGANIZATION | name, registrationNumber, taxId, type, foundedDate | BUSINESS, EMPLOYER, PARTNER, BENEFICIARY |
| **Address** | LOCATION | line1, line2, city, state, postalCode, country, geoCoords | HOME, BUSINESS, MAILING, REGISTERED |
| **Contact** | CONTACT | email, phone, mobile, fax, website, preferredMethod | PRIMARY, SECONDARY, EMERGENCY |
| **BankAccount** | FINANCIAL | bankName, accountNumber, routingNumber, iban, swift, currency | PAYMENT, REFUND, SALARY |
| **Representative** | PERSON | personRef, role, authorizationType, validFrom, validTo | LEGAL_REP, SIGNATORY, PROXY |

### 3. DataEntityType Model (Design-Time)

```prisma
enum EntityCategory {
  PERSON        // Human individuals
  ORGANIZATION  // Companies, businesses, institutions
  LOCATION      // Physical addresses, coordinates
  CONTACT       // Communication channels
  FINANCIAL     // Bank accounts, payment methods
  DOCUMENT      // ID documents, certificates
  CUSTOM        // Instance-specific entities
}

model DataEntityType {
  id            String          @id @default(cuid())
  category      EntityCategory
  name          String          @unique @db.VarChar(100)
  label         String          @db.VarChar(255)
  description   String?         @db.Text
  icon          String?         @db.VarChar(50)   // UI icon identifier
  isSystem      Boolean         @default(false)   // Built-in vs custom
  isActive      Boolean         @default(true)
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")

  // Relations
  fields        EntityFieldDef[]
  requirements  EntityRequirement[]
  instances     DataEntityInstance[]

  @@index([category])
  @@index([isSystem])
  @@map("data_entity_types")
}
```

### 4. EntityFieldDef Model (Field Definitions)

```prisma
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

model EntityFieldDef {
  id            String          @id @default(cuid())
  entityTypeId  String          @map("entity_type_id")
  name          String          @db.VarChar(100)   // camelCase identifier
  label         String          @db.VarChar(255)   // Human label
  dataType      FieldDataType   @map("data_type")
  required      Boolean         @default(false)
  unique        Boolean         @default(false)    // Unique within entity type
  searchable    Boolean         @default(false)    // Indexed for search
  validation    Json?                              // Validation rules
  options       Json?                              // For ENUM type
  defaultValue  Json?           @map("default_value")
  placeholder   String?         @db.VarChar(255)
  helpText      String?         @db.Text @map("help_text")
  sortOrder     Int             @default(0) @map("sort_order")
  isActive      Boolean         @default(true) @map("is_active")
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")

  // Relations
  entityType    DataEntityType  @relation(fields: [entityTypeId], references: [id], onDelete: Cascade)

  @@unique([entityTypeId, name])
  @@index([entityTypeId])
  @@map("entity_field_defs")
}
```

### 5. DataEntityInstance Model (User's Data)

```prisma
enum VerificationStatus {
  UNVERIFIED    // Never verified
  PENDING       // Verification in progress
  VERIFIED      // Successfully verified
  EXPIRED       // Verification expired
  REJECTED      // Verification failed
}

model DataEntityInstance {
  id                  String             @id @default(cuid())
  entityTypeId        String             @map("entity_type_id")
  ownerId             String             @map("owner_id")
  label               String?            @db.VarChar(255)  // User-friendly label
  data                Json                                  // Actual field values
  verificationStatus  VerificationStatus @default(UNVERIFIED) @map("verification_status")
  verifiedAt          DateTime?          @map("verified_at")
  verifiedBy          String?            @map("verified_by")  // User or system that verified
  verificationMethod  String?            @db.VarChar(100) @map("verification_method")
  verificationExpiry  DateTime?          @map("verification_expiry")
  isArchived          Boolean            @default(false) @map("is_archived")
  createdAt           DateTime           @default(now()) @map("created_at")
  updatedAt           DateTime           @updatedAt @map("updated_at")

  // Relations
  entityType          DataEntityType     @relation(fields: [entityTypeId], references: [id])
  owner               User               @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  usages              EntityUsage[]
  linkedFrom          EntityLink[]       @relation("LinkSource")
  linkedTo            EntityLink[]       @relation("LinkTarget")

  @@index([ownerId])
  @@index([entityTypeId])
  @@index([verificationStatus])
  @@map("data_entity_instances")
}
```

### 6. EntityLink Model (Relationships Between Instances)

```prisma
enum LinkType {
  BELONGS_TO    // Address belongs to Organization
  REPRESENTS    // Person represents Organization
  OWNS          // Person owns Organization
  EMPLOYED_BY   // Person employed by Organization
  RESIDES_AT    // Person resides at Address
  OPERATES_AT   // Organization operates at Address
}

model EntityLink {
  id            String             @id @default(cuid())
  sourceId      String             @map("source_id")
  targetId      String             @map("target_id")
  linkType      LinkType           @map("link_type")
  role          String?            @db.VarChar(100)  // Additional role context
  validFrom     DateTime?          @map("valid_from")
  validTo       DateTime?          @map("valid_to")
  isActive      Boolean            @default(true) @map("is_active")
  createdAt     DateTime           @default(now()) @map("created_at")
  updatedAt     DateTime           @updatedAt @map("updated_at")

  // Relations
  source        DataEntityInstance @relation("LinkSource", fields: [sourceId], references: [id], onDelete: Cascade)
  target        DataEntityInstance @relation("LinkTarget", fields: [targetId], references: [id], onDelete: Cascade)

  @@unique([sourceId, targetId, linkType])
  @@index([sourceId])
  @@index([targetId])
  @@map("entity_links")
}
```

### 7. EntityRequirement Model (Service Needs)

```prisma
model EntityRequirement {
  id              String             @id @default(cuid())
  elementId       String             @map("element_id")
  entityTypeId    String             @map("entity_type_id")
  role            String             @db.VarChar(100)  // "APPLICANT", "BUSINESS"
  label           String?            @db.VarChar(255)  // Display label override
  description     String?            @db.Text
  required        Boolean            @default(true)
  allowMultiple   Boolean            @default(false) @map("allow_multiple")
  maxCount        Int?               @map("max_count")
  fieldsNeeded    String[]           @map("fields_needed")  // Which fields required
  fieldsOptional  String[]           @map("fields_optional") // Which fields optional
  condition       Json?                                      // When required
  linkedToRole    String?            @db.VarChar(100) @map("linked_to_role")  // Relationship
  sortOrder       Int                @default(0) @map("sort_order")
  createdAt       DateTime           @default(now()) @map("created_at")
  updatedAt       DateTime           @updatedAt @map("updated_at")

  // Relations
  element         ApplicationElement @relation(fields: [elementId], references: [id], onDelete: Cascade)
  entityType      DataEntityType     @relation(fields: [entityTypeId], references: [id])
  usages          EntityUsage[]

  @@unique([elementId, entityTypeId, role])
  @@index([elementId])
  @@index([entityTypeId])
  @@map("entity_requirements")
}
```

### 8. EntityUsage Model (Application Data Reference)

```prisma
model EntityUsage {
  id              String             @id @default(cuid())
  applicationId   String             @map("application_id")  // Runtime application
  requirementId   String             @map("requirement_id")
  instanceId      String             @map("instance_id")
  snapshotData    Json?              @map("snapshot_data")   // Data at time of use
  snapshotAt      DateTime?          @map("snapshot_at")
  createdAt       DateTime           @default(now()) @map("created_at")
  updatedAt       DateTime           @updatedAt @map("updated_at")

  // Relations
  requirement     EntityRequirement  @relation(fields: [requirementId], references: [id])
  instance        DataEntityInstance @relation(fields: [instanceId], references: [id])

  @@unique([applicationId, requirementId])
  @@index([applicationId])
  @@index([instanceId])
  @@map("entity_usages")
}
```

### 9. Integration with ApplicationElement (ADR-003)

```prisma
model ApplicationElement {
  // ... existing fields from ADR-003

  // Add relation to entity requirements
  entityRequirements  EntityRequirement[]
}
```

## User Experience

### Data Wallet View

```
┌─────────────────────────────────────────────────────────────────┐
│ 👤 MY DATA WALLET                                    [+ Add New]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ PEOPLE ─────────────────────────────────────────────────────── │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👤 John Doe                                    ✅ Verified  │ │
│ │    National ID: ***-**-6789 | DOB: 1985-03-15              │ │
│ │    📊 Used in: 3 applications                               │ │
│ │                                    [Edit] [View History]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 👤 Jane Doe                                    ⏳ Unverified │ │
│ │    Spouse | Added: 2025-12-01                               │ │
│ │    📊 Used in: 1 application                                │ │
│ │                                    [Edit] [Verify] [Delete] │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ORGANIZATIONS ──────────────────────────────────────────────── │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🏢 Acme Corporation                            ✅ Verified  │ │
│ │    Reg: ABC-12345 | Tax ID: 98-7654321                     │ │
│ │    📊 Used in: 2 applications                               │ │
│ │    📍 Linked: 456 Business Ave (Business Address)           │ │
│ │                                    [Edit] [View History]    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ADDRESSES ──────────────────────────────────────────────────── │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📍 123 Main Street, City, Country              🏠 Home      │ │
│ │    Linked to: John Doe (Residence)                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📍 456 Business Ave, City, Country             🏢 Business  │ │
│ │    Linked to: Acme Corporation (Registered Office)          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ BANK ACCOUNTS ─────────────────────────────────────────────── │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🏦 First National Bank                         ****4567     │ │
│ │    Linked to: Acme Corporation (Business Account)           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Application Pre-fill Experience

```
┌─────────────────────────────────────────────────────────────────┐
│ 📝 BUSINESS LICENSE APPLICATION                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🔍 We found matching data in your wallet:                       │
│                                                                 │
│ APPLICANT (required) ─────────────────────────────────────────  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ○ 👤 John Doe ✅ Verified                                   │ │
│ │      ID: ***-**-6789 | Last used: Tax Registration          │ │
│ │                                                             │ │
│ │ ○ 👤 Jane Doe ⏳ Unverified                                  │ │
│ │      Last used: Import Permit                               │ │
│ │                                                             │ │
│ │ ○ ➕ Add new person                                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ BUSINESS (required) ──────────────────────────────────────────  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ● 🏢 Acme Corporation ✅ Verified                           │ │
│ │      Reg: ABC-12345 | Includes: Business Address            │ │
│ │                                                             │ │
│ │ ○ ➕ Add new organization                                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ⚡ TIP: Using verified data = faster processing!            │ │
│ │    Verified entities skip manual review steps.              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [Continue with Selected Data →]    │
└─────────────────────────────────────────────────────────────────┘
```

### Verification Status Impact

```
┌─────────────────────────────────────────────────────────────────┐
│ 📋 APPLICATION STATUS                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Data Verification Status:                                       │
│                                                                 │
│ ✅ John Doe (Applicant)           Verified 2025-11-15          │
│    → Skips: Identity Verification step                          │
│                                                                 │
│ ✅ Acme Corporation (Business)    Verified 2025-10-20          │
│    → Skips: Business Registry check                             │
│                                                                 │
│ ⏳ 456 Business Ave (Address)     Unverified                    │
│    → Requires: Address verification step                        │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🚀 Estimated Processing Time                                │ │
│ │                                                             │ │
│ │ Standard (all unverified):     10-15 business days          │ │
│ │ Your application:              3-5 business days ⚡          │ │
│ │                                                             │ │
│ │ You save ~7 days because 2 of 3 entities are verified!      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## System Entity Definitions

### Person Entity

```json
{
  "name": "Person",
  "category": "PERSON",
  "label": "Individual Person",
  "icon": "user",
  "fields": [
    {"name": "firstName", "label": "First Name", "dataType": "STRING", "required": true},
    {"name": "middleName", "label": "Middle Name", "dataType": "STRING"},
    {"name": "lastName", "label": "Last Name", "dataType": "STRING", "required": true},
    {"name": "dateOfBirth", "label": "Date of Birth", "dataType": "DATE"},
    {"name": "gender", "label": "Gender", "dataType": "ENUM", "options": ["M", "F", "Other", "Prefer not to say"]},
    {"name": "nationalId", "label": "National ID", "dataType": "STRING", "unique": true},
    {"name": "nationalIdType", "label": "ID Type", "dataType": "ENUM", "options": ["Passport", "National ID", "Driver License"]},
    {"name": "nationality", "label": "Nationality", "dataType": "COUNTRY"},
    {"name": "placeOfBirth", "label": "Place of Birth", "dataType": "STRING"},
    {"name": "maritalStatus", "label": "Marital Status", "dataType": "ENUM", "options": ["Single", "Married", "Divorced", "Widowed"]}
  ]
}
```

### Organization Entity

```json
{
  "name": "Organization",
  "category": "ORGANIZATION",
  "label": "Business or Organization",
  "icon": "building",
  "fields": [
    {"name": "name", "label": "Organization Name", "dataType": "STRING", "required": true},
    {"name": "tradeName", "label": "Trade Name / DBA", "dataType": "STRING"},
    {"name": "registrationNumber", "label": "Registration Number", "dataType": "STRING", "unique": true},
    {"name": "taxId", "label": "Tax ID", "dataType": "STRING"},
    {"name": "type", "label": "Organization Type", "dataType": "ENUM", "options": ["Sole Proprietorship", "Partnership", "LLC", "Corporation", "Non-Profit", "Government"]},
    {"name": "industry", "label": "Industry", "dataType": "STRING"},
    {"name": "foundedDate", "label": "Date Founded", "dataType": "DATE"},
    {"name": "employeeCount", "label": "Number of Employees", "dataType": "NUMBER"},
    {"name": "annualRevenue", "label": "Annual Revenue", "dataType": "DECIMAL"},
    {"name": "website", "label": "Website", "dataType": "URL"}
  ]
}
```

### Address Entity

```json
{
  "name": "Address",
  "category": "LOCATION",
  "label": "Physical Address",
  "icon": "map-pin",
  "fields": [
    {"name": "line1", "label": "Address Line 1", "dataType": "STRING", "required": true},
    {"name": "line2", "label": "Address Line 2", "dataType": "STRING"},
    {"name": "city", "label": "City", "dataType": "STRING", "required": true},
    {"name": "state", "label": "State/Province", "dataType": "STRING"},
    {"name": "postalCode", "label": "Postal Code", "dataType": "STRING"},
    {"name": "country", "label": "Country", "dataType": "COUNTRY", "required": true},
    {"name": "latitude", "label": "Latitude", "dataType": "DECIMAL"},
    {"name": "longitude", "label": "Longitude", "dataType": "DECIMAL"},
    {"name": "addressType", "label": "Address Type", "dataType": "ENUM", "options": ["Residential", "Commercial", "Industrial", "PO Box"]}
  ]
}
```

### Contact Entity

```json
{
  "name": "Contact",
  "category": "CONTACT",
  "label": "Contact Information",
  "icon": "phone",
  "fields": [
    {"name": "email", "label": "Email Address", "dataType": "EMAIL"},
    {"name": "phone", "label": "Phone Number", "dataType": "PHONE"},
    {"name": "mobile", "label": "Mobile Number", "dataType": "PHONE"},
    {"name": "fax", "label": "Fax Number", "dataType": "PHONE"},
    {"name": "website", "label": "Website", "dataType": "URL"},
    {"name": "preferredMethod", "label": "Preferred Contact Method", "dataType": "ENUM", "options": ["Email", "Phone", "Mobile", "Mail"]}
  ]
}
```

### BankAccount Entity

```json
{
  "name": "BankAccount",
  "category": "FINANCIAL",
  "label": "Bank Account",
  "icon": "credit-card",
  "fields": [
    {"name": "bankName", "label": "Bank Name", "dataType": "STRING", "required": true},
    {"name": "accountName", "label": "Account Holder Name", "dataType": "STRING", "required": true},
    {"name": "accountNumber", "label": "Account Number", "dataType": "STRING", "required": true},
    {"name": "routingNumber", "label": "Routing Number", "dataType": "STRING"},
    {"name": "iban", "label": "IBAN", "dataType": "STRING"},
    {"name": "swift", "label": "SWIFT/BIC Code", "dataType": "STRING"},
    {"name": "currency", "label": "Currency", "dataType": "CURRENCY", "required": true},
    {"name": "accountType", "label": "Account Type", "dataType": "ENUM", "options": ["Checking", "Savings", "Business"]}
  ]
}
```

## Migration Path

### Phase 1: Schema Addition
1. Add all new enums and models
2. Create system entity types via seed data
3. Add EntityRequirement relation to ApplicationElement

### Phase 2: Data Wallet UI
1. Build "My Data" wallet view
2. Implement entity instance CRUD
3. Build verification status display

### Phase 3: Application Integration
1. Build entity selection UI for applications
2. Implement pre-fill from wallet
3. Build snapshot mechanism for EntityUsage

### Phase 4: Verification System
1. Integrate verification providers
2. Implement verification status propagation
3. Build "fast-track" processing for verified entities

## Consequences

### Positive

1. **Consistency**: Same Person structure everywhere
2. **Reuse**: Pre-fill from previous applications
3. **Verify Once**: ID verification applies to all uses
4. **Update Once**: Change address → reflected everywhere
5. **User Control**: Users own and manage their data
6. **AI-Friendly**: Standard schemas for LLM understanding
7. **Fast-Track**: Verified data = faster processing
8. **Audit Trail**: Track data usage across applications
9. **Privacy**: Clear data ownership and consent

### Negative

1. **Complexity**: More models and relationships
2. **Migration**: Existing services need requirements defined
3. **Privacy Considerations**: Must handle data carefully
4. **Sync Issues**: Instance updates vs snapshot consistency

### Neutral

1. **Determinants**: Still drive conditions, can reference entity fields
2. **Forms**: Still exist, but render entity requirements
3. **Workflow**: Unchanged, can skip steps for verified data

## Alternatives Considered

### A. Keep Field-by-Field Definition
**Rejected**: Perpetuates inconsistency, no reuse, no verification benefits.

### B. Shared Field Library (No Instances)
**Rejected**: Enables reuse of definitions but not of actual data.

### C. External Data Provider Integration Only
**Rejected**: Depends on external systems, no user control.

### D. Copy Data Between Applications
**Rejected**: Creates duplicates, no single source of truth.

## References

- `_bmad-output/adrs/003-unified-application-experience.md` - Element model
- ISO 3166 - Country codes
- ISO 4217 - Currency codes
- E.164 - Phone number format

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-01 | Initial draft - Proposed |

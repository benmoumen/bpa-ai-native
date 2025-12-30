# BPA Mental Model Extraction

## Purpose
Essential concepts extracted from legacy eRegistrations BPA for AI-Native rebuild.
Source: API docs + BPA-backend codebase analysis (2025-12-29)

---

## Core First Principles

### 1. BPA is Meta-Infrastructure
- Design-time configuration tool, NOT runtime processing
- Creates rules that others (applicants, institutional staff) play by
- Used by service designers to configure how services are delivered

### 2. Entity Hierarchy
```
Service (Configuration Container)
  ├── Registration (Authorization Container)
  ├── Role (UserRole | BotRole)
  ├── Form (Guide → Form → Document → Payment → Send)
  ├── Bot (with I/O contract mappings)
  └── Determinant (conditional logic)
```

### 3. Universal 4-Status Model
- `0` = FilePending (waiting for submission)
- `1` = FileValidated (passed validation)
- `2` = FileDecline (returned for fixes, can retry)
- `3` = FileReject (permanently rejected)
- `4` = UserDefined (custom statuses)

### 4. Contract > Implementation Pattern
- BOTs use InputMapping/OutputMapping contracts
- Same contract interface for: AI agents, payment processors, legacy APIs
- Enables plug & play architecture

---

## Key Patterns to Preserve

1. **Discriminator-Based Polymorphism**: Role, Cost, Determinant inheritance
2. **Dual Metadata**: Global template + Instance link (Requirement → DocumentRequirement)
3. **JSON as Schema**: Config is data-driven (forms, determinants, mappings)
4. **Draft → Published**: Design-time vs runtime separation
5. **Translation Listener**: Decoupled i18n architecture
6. **Soft Delete via Archive**: Compliance-friendly data retention

---

## AI-Native Transformations

| Legacy Pattern | AI-Native Evolution |
|----------------|---------------------|
| Forms (JSON Schema) | Conversational interface |
| Linear role sequences | Dynamic context-based routing |
| Type-based BOTs | Contract-based processors |
| Field-based determinants | LLM-evaluable rules |
| Static catalogs | Dynamic AI-generated lookups |

---

## Key Insight
> From "follow this sequence" → "achieve this outcome, route intelligently"

---

## Reference Documents
- Full analysis: `_bmad-output/analysis/bpa-api-mental-model-analysis.md`
- Brainstorming session: `_bmad-output/analysis/brainstorming-session-2025-12-29.md`

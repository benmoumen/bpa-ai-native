# Epic 2 Retrospective: Service Lifecycle Management

**Date**: 2025-12-30
**Epic Duration**: ~2 days
**Stories Completed**: 11/11 (100%)
**Total Tests**: 274 (203 API + 71 Web)

---

## 🎭 Retrospective Summary (Party Mode)

**Bob (SM)**: *opens the virtual retrospective board*

Alright team, Epic 2 is complete! All 11 stories from Service Lifecycle Management are done. Let's reflect on what we learned.

**Dev**: We established the core patterns for the entire project. The Service CRUD implementation became the template for Registrations, Document Requirements, and Costs. The NestJS module structure with DTOs, services, and controllers is now battle-tested.

**Tessa (TEA)**: From a testing perspective, we went from 0 to 274 tests. The API has comprehensive unit test coverage with mocked Prisma. The frontend has component tests using Vitest and React Testing Library.

---

## What Went Well ✅

### 1. **Pattern Establishment**
The ServicesModule implementation in Stories 2.1-2.3 became the reference architecture for all subsequent modules:
- NestJS module structure (module → service → controller)
- DTO validation with class-validator
- Response DTOs with static `fromEntity()` methods
- Soft delete pattern with `isActive` flag
- Ownership checks through parent entity relations

### 2. **Domain Model Alignment**
The legacy BPA mental model analysis (`bpa-api-mental-model-analysis.md`) provided critical guidance:
- Service → Registration hierarchy properly modeled
- Costs and DocumentRequirements linked to Registrations (not Services)
- 4-Status Model documented for future workflow implementation

### 3. **Incremental Delivery**
Each story built cleanly on the previous:
- Story 2.1: Database + API foundation
- Stories 2.2-2.7: Service CRUD operations
- Story 2.8: Template Gallery (pattern for seeded data)
- Stories 2.9-2.10: Registration CRUD (same patterns)
- Story 2.11: Document Requirements + Costs (nested entity pattern)

### 4. **Code Review Process**
Formal code reviews on Stories 2.10 and 2.11 caught real issues:
- Key validation regex improvements (require starting with letter)
- Missing GET by ID endpoints
- Currency validation (added full ISO 4217 list)
- JSONata formula syntax validation

### 5. **Test Coverage Growth**
- Started: 0 tests
- Ended: 274 tests
- API tests use Jest mocks with comprehensive edge cases
- Frontend tests cover loading, error, empty states, and user interactions

---

## What Could Be Improved 🔧

### 1. **Audit Trail Deferred**
AC5 in Story 2.11 specifies "audit trail records modifications" but implementation was deferred. This should be addressed as cross-cutting infrastructure in Epic 9 (Story 9.1).

**Action Item**: AUDIT-001 - Create audit logging interceptor that applies to all mutation operations.

### 2. **Controller Tests Sometimes Skipped**
Some stories had controller tests skipped with justification that service tests provide adequate coverage. While pragmatic, controllers should have at least smoke tests.

### 3. **Mixed Git Commits**
Stories 2.8, 2.10, 2.11 had intermingled changes in shared files (schema.prisma, app.module.ts). Future stories should aim for smaller, focused commits per story.

### 4. **Frontend State Management**
React Query works well, but there's no global state solution yet. As complexity grows (Epic 3: Form Building), we may need Zustand or similar.

---

## Key Technical Decisions 📋

| Decision | Rationale |
|----------|-----------|
| Soft delete (isActive) vs hard delete | Data preservation for audit; matches legacy BPA pattern |
| DTOs with class-validator | Runtime validation; Swagger documentation auto-generated |
| Response DTOs with fromEntity() | Type-safe API contracts; consistent transformation |
| Registration → Service ownership check | Parent entity determines authorization |
| JSONata for cost formulas | Industry standard; legacy BPA compatibility |
| ISO 4217 currency validation | Explicit allowlist over format regex |

---

## Patterns to Carry Forward 🔄

### Backend (NestJS)

```typescript
// Module structure
apps/api/src/{entity}/
├── {entity}.module.ts
├── {entity}.service.ts
├── {entity}.service.spec.ts
├── {entity}.controller.ts
├── index.ts
└── dto/
    ├── create-{entity}.dto.ts
    ├── update-{entity}.dto.ts
    ├── {entity}-response.dto.ts
    └── list-{entity}-query.dto.ts

// Ownership check pattern (for nested entities)
const parent = await this.prisma.parent.findUnique({
  where: { id: parentId },
  include: { owner: { select: { id: true } } }
});
if (parent.owner.id !== userId) throw new ForbiddenException();
```

### Frontend (React/Next.js)

```typescript
// Query key factory
export const entityKeys = {
  all: ['entities'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: (filters: Filters) => [...entityKeys.lists(), filters] as const,
  details: () => [...entityKeys.all, 'detail'] as const,
  detail: (id: string) => [...entityKeys.details(), id] as const,
};

// Component structure
apps/web/src/components/{entity}/
├── index.ts
├── {Entity}List.tsx
├── {Entity}Form.tsx
├── {Entity}Dialog.tsx
└── *.test.tsx
```

---

## Metrics 📊

| Metric | Value |
|--------|-------|
| Stories | 11 |
| Files Created | ~80 |
| Lines of Code | ~8,300+ |
| API Tests | 203 |
| Web Tests | 71 |
| Build Status | ✅ Passing |
| Lint Status | ✅ Clean (new modules) |

---

## Recommendations for Epic 3 📝

1. **Form Building Complexity**: Epic 3 introduces JSON Schema forms. Consider:
   - Separate form schema validation service
   - Field type registry pattern
   - Form preview component early in the epic

2. **Audit Trail Infrastructure**: Implement AUDIT-001 before or early in Epic 3 to capture form modifications.

3. **E2E Tests**: Epic 3 may benefit from Playwright/Cypress E2E tests for form builder interactions.

4. **Consider Form Builder UI Library**: Evaluate React JSON Schema Form (RJSF) or similar before building custom.

---

## Epic Status Update

```yaml
epic-2-retrospective: done
```

---

**Bob (SM)**: Great retrospective! The team has built a solid foundation. Epic 2 patterns will serve us well through the remaining 9 epics. Let's move forward to Epic 3: Form Building & Configuration.

*closes the retrospective board*

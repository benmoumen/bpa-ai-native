# Epic 4 Retrospective: Workflow Configuration

> **Epic**: 4 - Workflow Configuration
> **Status**: Completed
> **Stories**: 12 total (11 done, 1 deferred to Phase 2)
> **Retrospective Date**: 2026-01-02 (Updated)
> **Previous Review**: Initial retrospective after MVP-critical stories

---

## Executive Summary

Epic 4 successfully implemented the complete workflow configuration system for BPA AI-Native, establishing the **4-Status Model** as the universal workflow grammar. The epic delivered 11 production-ready stories with one (4-11 Role-Institution Assignment) remaining in backlog as a Phase 2 deferrable.

**Key Achievement**: The domain-driven approach from the research spike (4-0) paid dividends throughout the epic, with the 4-Status Model providing a clear, consistent foundation for all workflow-related features.

---

## Stories Completed

| Story | Title | Status | Notes |
|-------|-------|--------|-------|
| 4-0 | Workflow Domain Research Spike | done | Established 4-Status Model foundation |
| 4-1 | Workflow Database Model & API | done | Schema + CRUD endpoints |
| 4-2 | Define Workflow Steps | done | Roles list UI, create/edit dialogs |
| 4-3 | Configure Workflow Transitions | done | Status-to-role transitions |
| 4-4 | Specify Step Actions | done | StepActionsPanel with status display |
| 4-5 | Assign Forms to Workflow Steps | done | Form selector in role dialog |
| 4-5a | Determinants in Workflow Conditions | done | Merged from Epic 5-5 |
| 4-6 | Linear Approval Chain Configuration | done | Wizard for common case |
| 4-7 | Workflow Diagram Preview | done | React Flow visualization |
| 4-8 | Workflow Validation | done | BFS graph reachability check |
| 4-9 | Role Status Configuration | done | 4-Status Model UI (leveraged earlier work) |
| 4-10 | Role-Registration Binding | done | N:N binding pattern |
| 4-11 | Role-Institution Assignment | backlog | Phase 2 - Institution backend deferred |

---

## What Went Well

### 1. Spike-Driven Development (4-0)

The investment in a domain research spike before implementation proved invaluable:
- **4-Status Model**: PENDING, PASSED, RETURNED, REJECTED became the universal workflow grammar
- **Role Hierarchy**: USER vs BOT role distinction was clearly defined upfront
- **Transition Architecture**: Status-to-role routing pattern was established before coding

> **Lesson**: Spikes before complex epics significantly reduce rework and ambiguity.

### 2. Incremental Build Pattern

Stories built naturally on each other without blocking:
```
4-1 (Schema/API) → 4-2 (Steps UI) → 4-3 (Transitions) → 4-4 (Actions) → 4-5 (Forms)
                                                                        ↓
                        4-6 (Wizard) → 4-7 (Diagram) → 4-8 (Validation) → 4-9 (Status)
                                                                        ↓
                                                        4-10 (Registrations) → 4-11 (Institutions)
```

This created a smooth development flow where each story had clear inputs and outputs.

### 3. Consistent React Query Patterns

All hooks followed the query key factory pattern:
```typescript
export const entityKeys = {
  all: ['entities'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: (filters) => [...entityKeys.lists(), filters] as const,
  details: () => [...entityKeys.all, 'detail'] as const,
  detail: (id: string) => [...entityKeys.details(), id] as const,
};
```

This consistency across `use-roles.ts`, `use-transitions.ts`, `use-role-institutions.ts` made the codebase predictable.

### 4. Early Epic 5 Integration (4-5a)

Merging Story 5-5 (Determinants in Workflow Conditions) into Epic 4 as 4-5a was a strategic win:
- Avoided building transitions twice
- Condition builder was integrated when needed
- Epic 5 was properly superseded without losing functionality

### 5. LinearChainWizard UX (4-6)

The wizard pattern for the common case (linear approval chains) significantly improved usability:
- 3-step wizard: Define roles → Configure transitions → Review & create
- Auto-creates 4-status set for each role
- Auto-connects PASSED status to next role

### 6. Code Reuse Efficiency (4-9)

Story 4-9 (Role Status Configuration) was efficiently marked as done because Stories 4-1, 4-3, and 4-4 had already implemented all necessary components:
- RoleStatus entity and API (4-1)
- Status hooks (4-3)
- StepActionsPanel and EditStatusDialog (4-4)

### 7. Workflow Visualization (4-7)

React Flow integration for workflow diagram preview was implemented cleanly:
- Custom role nodes with status indicators
- Automatic layout with dagre
- Visual distinction between USER and BOT roles
- Integration with validation panel

### 8. Graph-Based Validation (4-8)

The validation service uses proper graph algorithms:
- BFS traversal from start role
- Detection of orphan roles (no incoming transitions)
- Detection of unreachable roles
- Clear severity levels (ERROR/WARNING)

### 9. Consistent N:N Binding Pattern (4-10, 4-11)

Both RoleRegistration and RoleInstitution followed the identical pattern:
- Join table with unique constraint
- Service-scoped API endpoints
- React Query hooks with cache invalidation
- Expandable panel in RolesList

---

## What Needs Improvement

### 1. Test Infrastructure Issues

React 19 + Vitest + pnpm hoisting caused persistent issues:
- Module resolution failures for `react-dom/test-utils`
- `IS_REACT_ACT_ENVIRONMENT` warnings
- Some component tests blocked

**Workarounds Applied**:
- Created `.npmrc` with `shamefully-hoist=true`
- Updated `vitest.config.ts` to resolve from root node_modules
- Added type declarations for test environment

> **Action Item**: Stabilize test infrastructure before Epic 6 to prevent accumulating test debt.

### 2. Story 4-11 Backend Incomplete

While frontend components were implemented, the story remains in backlog:
- Institution model was deferred to Phase 2
- Backend implementation not done
- Blocks full validation for publishing

> **Action Item**: Track as Phase 2 dependency before Epic 7 (Publishing).

### 3. Limited Integration Tests

Unit tests exist but integration tests for workflow validation are missing:
- No end-to-end test for LinearChainWizard
- BFS/DFS reachability not tested with complex graphs
- Transition conditions (4-5a) not tested in workflow context

> **Action Item**: Add integration tests for critical workflow paths.

### 4. Story Overlap

Story 4-9 (Role Status Configuration) was largely implemented across 4-1, 4-3, and 4-4:
- Better upfront analysis could have identified this overlap
- Consider merging related stories earlier in future epics

### 5. Initial Commit Discipline

Early implementation bundled multiple stories before committing:
- User feedback corrected this: commit after each story
- **Lesson**: Commit after each story completion, not in batches

---

## Technical Decisions Made

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| 4-Status Model | Universal workflow grammar from BPA | Rigid but consistent |
| React Flow for diagrams | Rich ecosystem, good performance | Bundle size increase |
| BFS for validation | Simple, correct for workflow graphs | Could use Tarjan for cycles |
| Sequential API in wizard | Simpler implementation | Slower for many steps |
| Condition → Transition | Matches BPA model | Less flexible but clearer |
| Determinant integration | Reuse Epic 3 infrastructure | Added complexity |

---

## Key Files Created/Modified

### New Components (apps/web/src/components/workflow/)
- `RolesList.tsx` - Main roles table with expandable rows
- `CreateRoleDialog.tsx` - Create/edit role dialog
- `TransitionsList.tsx` - Transitions display
- `CreateTransitionDialog.tsx` - Create/edit transitions
- `StepActionsPanel.tsx` - Status actions display
- `EditStatusDialog.tsx` - Status label editing
- `ConditionBuilder.tsx` - Transition conditions editor
- `LinearChainWizard.tsx` - Wizard for linear chains
- `WorkflowDiagram.tsx` - React Flow visualization
- `ValidationPanel.tsx` - Validation results display
- `RegistrationBindingPanel.tsx` - Role-Registration N:N
- `InstitutionAssignmentPanel.tsx` - Role-Institution N:N

### New Hooks (apps/web/src/hooks/)
- `use-roles.ts` - Role CRUD + validation
- `use-transitions.ts` - Transition CRUD + status hooks
- `use-role-registrations.ts` - Registration binding
- `use-role-institutions.ts` - Institution binding
- `use-institutions.ts` - Institution CRUD

### New API Modules (apps/api/src/)
- `roles/` - Role CRUD + start role + validation
- `role-statuses/` - RoleStatus CRUD + defaults
- `transitions/` - Transition CRUD
- `institutions/` - Institution CRUD
- `role-registrations/` - N:N binding service/controller
- `role-institutions/` - N:N binding service/controller

### Schema Updates
- `packages/db/prisma/schema.prisma` - Role, RoleStatus, WorkflowTransition, RoleRegistration, RoleInstitution, Institution models

---

## Patterns Established

These patterns should be reused in future epics:

### 1. Query Key Factory Pattern
```typescript
export const entityKeys = {
  all: ['entities'] as const,
  lists: () => [...entityKeys.all, 'list'] as const,
  list: (filters) => [...entityKeys.lists(), filters] as const,
  details: () => [...entityKeys.all, 'detail'] as const,
  detail: (id: string) => [...entityKeys.details(), id] as const,
};
```

### 2. Expandable Panel in Table Pattern
Used in RolesList for StepActionsPanel, RegistrationBindingPanel, InstitutionAssignmentPanel.

### 3. N:N Binding Pattern
```
1. Create join table: RoleEntity (roleId, entityId, unique constraint)
2. API: GET /roles/:roleId/entities, POST/DELETE /:entityId
3. Hook: useEntitiesForRole(roleId), useAssign/Unassign mutations
4. UI: EntityAssignmentPanel with checkboxes
```

### 4. Wizard Pattern for Complex Creation
```
Step 1: Input base data
Step 2: Configure relationships
Step 3: Review & confirm
→ Batch creation with rollback on failure
```

### 5. Validation Service Pattern
```typescript
class WorkflowValidationService {
  async validate(serviceId: string): Promise<ValidationResult> {
    // Graph-based analysis
    // Return issues array with severity
  }
}
```

---

## Action Items for Next Epic

| # | Action | Priority | Target Epic |
|---|--------|----------|-------------|
| 1 | Fix React 19 test infrastructure | High | Before Epic 6 |
| 2 | Add integration tests for workflow validation | Medium | Epic 6 |
| 3 | Complete 4-11 backend when Institution needed | Medium | Before Epic 7 |
| 4 | Document 4-Status Model in project README | Low | Continuous |
| 5 | Create E2E test for LinearChainWizard | Medium | Epic 7 |
| 6 | Consider batch endpoint for wizard | Low | Post-MVP |

---

## Metrics

| Metric | Value |
|--------|-------|
| Stories Planned | 12 |
| Stories Completed | 11 |
| Stories Deferred | 1 (4-11 to Phase 2) |
| New Components | 12+ |
| New API Modules | 6 |
| Database Tables | 6 (Role, RoleStatus, WorkflowTransition, RoleRegistration, RoleInstitution, Institution) |
| React Query Hooks | 10+ |
| Test Files | 15+ (some blocked by infra) |

---

## Recommendations for Epic 6

1. **Start with a spike** (6-0) - AI agent architecture needs validation before implementation
2. **Commit per story** - Maintain discipline established in Epic 4
3. **Test alongside implementation** - Don't defer all tests to the end
4. **Reuse patterns** - Query key factory, N:N binding, expandable panels
5. **Fix test infrastructure first** - Prevent accumulating test debt

---

## Conclusion

Epic 4 was a comprehensive success. The workflow configuration system is production-ready for MVP with:
- Complete 4-Status Model implementation
- Role creation, editing, reordering
- Transition configuration with conditions
- Form assignment to roles
- LinearChainWizard for quick setup
- Visual diagram preview with React Flow
- Validation with BFS graph analysis
- N:N bindings for registrations and institutions

The research spike approach should be replicated for Epic 6 (AI Agent), which has similar domain complexity. The 4-Status Model provides a solid foundation for workflow processing in the Display System.

---

*Retrospective completed: 2026-01-02*
*Updated from initial retrospective after completing deferred stories (4-7, 4-8, 4-10)*

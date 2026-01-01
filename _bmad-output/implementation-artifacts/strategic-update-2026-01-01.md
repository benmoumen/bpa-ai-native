# Strategic Project Update - 2026-01-01

## Context

After completing Epic 3 (Form Building & Configuration) with 10 stories and 311 passing tests, a strategic review was conducted to evaluate project alignment with MVP goals and optimize the remaining work.

## Key Findings

### 1. Epic 5 Redundancy

Epic 5 (Determinants & Business Rules) was found to be ~70% complete through Epic 3 implementation:

| Story | Status | Completed Via |
|-------|--------|---------------|
| 5-1 Determinant Database Model API | Done | Story 3-9 |
| 5-2 Define Determinants from Form Fields | Done | Story 3-9 |
| 5-3 Configure Calculation Formulas | Deferred | Phase 2 (JSONata not needed for MVP linear workflows) |
| 5-4 Determinants in Visibility Rules | Done | Story 3-7 |
| 5-5 Determinants in Workflow Conditions | Merged | Epic 4 as 4-5a |
| 5-6 Reference Validation | Deferred | Phase 2 (not enough complexity yet) |

**Decision**: Epic 5 marked as `superseded`.

### 2. Spike Stories Added

Research spikes were added before complex epics to reduce risk:

- **4-0-workflow-domain-research-spike**: Analyze legacy BPA workflow patterns before implementing workflow configuration
- **6-0-llm-prompt-engineering-spike**: Research LLM integration patterns before AI-powered service configuration

### 3. MVP Path Optimization

**Original path**: Epic 4 → Epic 5 → Epic 6 → Epic 7

**Optimized path**: Epic 4 (Core) → Epic 6 (Core) → Epic 7 → Epic 6 (Advanced)

This compresses the MVP timeline by:
- Skipping redundant Epic 5 stories
- Prioritizing core AI features over advanced ones
- Delivering publishable services earlier

### 4. Epic 4 Story Prioritization

MVP-critical stories (8 stories):
- 4-0, 4-1, 4-2, 4-3, 4-4, 4-5, 4-5a, 4-6, 4-9

Deferrable stories (4 stories):
- 4-7 (Workflow Diagram Preview)
- 4-8 (Workflow Validation)
- 4-10 (Role Registration Binding)
- 4-11 (Role Institution Assignment - Phase 2)

### 5. Epic 6 Split

Core MVP (8 stories): 6-0 through 6-7
Advanced (5 stories): 6-8 through 6-12

## Technical Fixes

### Types Package Duplicate Interface

Fixed duplicate `VisibilityCondition` interface in `packages/types/src/index.ts`:

- Line 711-718: `VisibilityCondition` for form visibility (kept as-is)
- Line 887-891: Renamed to `RuleEngineCondition` for JSON Rules Engine
- Updated `JsonRulesEngineRule` interface to reference `RuleEngineCondition`

## Progress Summary

| Epic | Status | Stories |
|------|--------|---------|
| Epic 1 | Done | 7/7 |
| Epic 2 | Done | 11/11 |
| Epic 3 | Done | 10/10 |
| Epic 4 | Backlog | 0/12 |
| Epic 5 | Superseded | N/A |
| Epic 6 | Backlog | 0/13 |
| Epic 7 | Backlog | 0/8 |
| Epics 8-11 | Backlog | Post-MVP |

**Total completed**: 28 stories
**Remaining for MVP**: ~22 stories (8 from Epic 4 + 8 from Epic 6-core + ~6 from Epic 7)

## Recommendations

1. **Start with 4-0 spike** to deeply understand legacy workflow patterns before coding
2. **Consult BPA mental model analysis** for 4-Status Model implementation
3. **Use contract-based BOT architecture** from legacy patterns
4. **Prepare LLM prompts early** with 6-0 spike to de-risk AI integration

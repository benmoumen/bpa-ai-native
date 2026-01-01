# Epic 4 Autonomous Implementation Plan

## Mission
Complete Epic 4 (Workflow Configuration) using BMAD workflows with multi-agent orchestration.

## Knowledge Sources
| Source | Purpose |
|--------|---------|
| `sprint-status.yaml` | State tracking, story status |
| `bpa-api-mental-model-analysis.md` | 4-Status Model, Role patterns |
| `../BPA-backend/model/role/` | Legacy Role/Status enums |
| `../BPA-backend/model/workflow/` | Workflow entity patterns |

## MVP Story Order (9 stories)
```
4-0 (spike) → 4-1 → 4-2 → 4-3 → 4-4 → 4-5 → 4-5a → 4-6 → 4-9
```

## Execution Phases

### PHASE 1: Research Spike (4-0)
**Objective**: Deep understanding before coding

1. **Explore Legacy Patterns**
   - Analyze `../BPA-backend/src/main/java/org/unctad/ereg/bpa/model/role/`
   - Study RoleStatusType, RoleType enums
   - Document workflow step patterns

2. **Study 4-Status Model**
   - PENDING (0) → Waiting for decision
   - PASSED (1) → Approved, moves forward
   - RETURNED (2) → Sent back for fixes (can retry)
   - REJECTED (3) → Permanently rejected (terminal)

3. **Analyze BOT Contract Architecture**
   - InputMapping: form field → service request
   - OutputMapping: service response → form field

4. **Document Findings**
   - Create spike output file
   - Define Prisma schema approach
   - Identify API endpoints needed

### PHASE 2: Implementation Loop (4-1 to 4-9)

For each story:
```
1. CHECK STATUS
   - Read sprint-status.yaml
   - If 'backlog' → create story file
   - If 'done' → skip to next

2. CREATE STORY (if needed)
   /create-story
   - Generates implementation-ready story file
   - Updates status to 'ready-for-dev'

3. IMPLEMENT
   /dev-story {story-file-path}
   - Follows acceptance criteria
   - Writes tests
   - Updates status to 'in-progress' → 'review'

4. CODE REVIEW (fresh agent)
   /code-review {story-file-path}
   - ADVERSARIAL review (finds 3-10 issues)
   - If critical issues → /correct-course
   - Else → fix minor issues

5. QUALITY GATE
   - pnpm test (all tests pass)
   - pnpm lint (no errors)
   - pnpm build (compiles)

6. COMMIT
   - Conventional commit message
   - feat(api): or feat(web): prefix
   - Reference story number

7. UPDATE STATUS
   - Mark story as 'done' in sprint-status.yaml
   - Proceed to next story
```

### PHASE 3: Completion
```
1. Verify all MVP stories 'done'
2. Run full test suite
3. /retrospective epic-4
4. Update epic status to 'done'
```

## Quality Gates

| Gate | Requirement |
|------|-------------|
| Tests | `pnpm test` all pass |
| Lint | `pnpm lint` no errors |
| Build | `pnpm build` succeeds |
| Review | < 3 critical issues |
| Status | Updated after each story |

## Constraints (Non-Negotiable)

1. **4-Status Model** - Use exactly: PENDING=0, PASSED=1, RETURNED=2, REJECTED=3
2. **Fresh context for code review** - Spawn new agent for objectivity
3. **Sequential stories** - Dependencies must be respected
4. **Test before commit** - No broken tests in commits
5. **Sprint status as truth** - Always update after changes

## Recovery Strategies

| Issue | Action |
|-------|--------|
| Tests fail | Fix before proceeding |
| Review finds architecture issues | `/correct-course` |
| Story blocked | Note in status, try next if independent |
| Context exhausted | Save state, provide resume instructions |

## Story Details

| Story | Focus | Key Deliverables |
|-------|-------|------------------|
| 4-0 | Research | Spike output, schema design |
| 4-1 | Database | Workflow, Step, Transition models |
| 4-2 | Steps | Step CRUD API, step ordering |
| 4-3 | Transitions | Transition rules, conditions |
| 4-4 | Actions | Step actions, BOT integration |
| 4-5 | Forms | Form-to-step assignment |
| 4-5a | Determinants | Conditional workflow routing |
| 4-6 | Chains | Linear approval configuration |
| 4-9 | 4-Status | Role status CRUD, status model |

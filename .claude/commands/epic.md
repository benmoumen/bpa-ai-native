# Epic Implementation Command

Autonomously implement an epic using BMAD workflows.

**Usage**: `/epic {number}` (e.g., `/epic 4`)

---

## PHASE 0: Context Setup

### Step 0.1: Load or Generate Epic Context

Check if `_bmad-output/epic-contexts/epic-$ARGUMENTS.yaml` exists.

**If NOT exists** — think carefully about epic scope and dependencies:

1. **Read source files**:
   - `_bmad-output/project-planning-artifacts/epics.md` → story list
   - `_bmad-output/implementation-artifacts/sprint-status.yaml` → states
   - `_bmad-output/analysis/bpa-api-mental-model-analysis.md` → domain model
   - `_bmad-output/architecture.md` → technical constraints

2. **Analyze and extract** (consider dependencies, MVP criticality):
   - Epic name, description, status
   - Stories: IDs, titles, current states
   - MVP-critical vs deferrable classification
   - Spike story (X-0) if exists
   - Domain constraints relevant to this epic
   - Prerequisites (epics that must be done first)

3. **Generate context file**:
   ```yaml
   epic: {number}
   name: {epic name}
   description: |
     {description}
   status: {backlog|in-progress|done|superseded}

   spike:
     required: {true|false}
     story_id: "{N}-0"
     research_targets:
       - {paths}

   stories:
     mvp_critical:
       - id: "{N}-1"
         title: "{title}"
         status: {status}
     deferrable:
       - id: "{N}-X"
         title: "{title}"
         status: backlog

   constraints:
     - "{constraint}"

   prerequisites:
     - epic: {N}
       required_status: done
   ```

4. **Save to** `_bmad-output/epic-contexts/epic-$ARGUMENTS.yaml`

### Step 0.2: Load Context

Parse context file. Extract story order, constraints, prerequisites.

---

## PHASE 1: Validation

### Step 1.1: Check Epic Status

| Status | Action |
|--------|--------|
| `done` | Report complete, EXIT |
| `superseded` | Report superseded, EXIT |
| `backlog` | Set to `in-progress`, continue |
| `in-progress` | Resume from first non-done story |

### Step 1.2: Check Prerequisites

If prerequisites not met → report and EXIT.

### Step 1.3: Find Resume Point

First story in `mvp_critical` where status != `done`.
If all done → skip to PHASE 4.

---

## PHASE 2: Spike (if required)

If `spike.required == true` AND spike not done:

### Step 2.1: Research (Subagent)

For each research target, delegate:
```
Task(subagent_type="Explore", prompt="
  Research {target} for Epic $ARGUMENTS.
  Extract: entity models, relationships, API patterns, constraints.
  Return structured findings.
")
```

### Step 2.2: Synthesize Findings

Think carefully about patterns discovered. Create:
`_bmad-output/implementation-artifacts/$ARGUMENTS-0-spike-findings.md`

Contents:
- Entity models and relationships
- API patterns to follow
- Prisma schema approach
- Constraints to enforce
- Implementation recommendations

### Step 2.3: Complete Spike

1. Update sprint-status: `$ARGUMENTS-0-*: done`
2. Commit: `docs(epic-$ARGUMENTS): complete research spike`

---

## PHASE 3: Story Loop

For each story in `mvp_critical` where status != `done`:

### Step 3.1: Create Story (if backlog)

If status == `backlog`:
```
/create-story
```
Update status → `ready-for-dev`

### Step 3.2: Implement Story

```
/dev-story _bmad-output/implementation-artifacts/{story-file}.md
```
Update status → `in-progress` → `review`

### Step 3.3: Code Review (Subagent - Fresh Context)

```
Task(subagent_type="general-purpose", prompt="
  Run /code-review _bmad-output/implementation-artifacts/{story-file}.md

  ADVERSARIAL review. Find 3-10 issues.
  Check: code quality, tests, architecture, security, performance.

  Return: issues with severity + fix recommendations.
")
```

### Step 3.4: Handle Review

| Result | Action |
|--------|--------|
| 0-2 critical | Fix issues |
| 3+ critical | Think carefully: `/correct-course` or fix? |
| Architecture issue | `/correct-course` |

### Step 3.5: Quality Gate (Subagent)

```
Task(subagent_type="general-purpose", prompt="
  Run these commands and report results:
  1. pnpm test
  2. pnpm lint
  3. pnpm build

  Return: pass/fail for each, error details if any.
")
```

All must pass before commit. Fix if needed.

### Step 3.6: Commit

```bash
git add .
git commit -m "feat(api|web): {story title}

- {change 1}
- {change 2}

Story: {story-id}"
```

### Step 3.7: Update & Continue

Update status → `done`. Proceed to next story.

---

## PHASE 4: Completion

### Step 4.1: Final Verification (Subagent)

```
Task(subagent_type="general-purpose", prompt="
  Run full verification:
  1. pnpm test
  2. pnpm build
  Return: summary of results.
")
```

### Step 4.2: Retrospective

```
/retrospective epic-$ARGUMENTS
```

### Step 4.3: Finalize

1. Update sprint-status: `epic-$ARGUMENTS: done`
2. Commit: `chore: complete Epic $ARGUMENTS`
3. Report summary

---

## EXECUTION MODEL

### Main Context (Interactive)
| Operation | Why Main Context |
|-----------|------------------|
| /create-story | May need user input |
| /dev-story | Complex, needs full context |
| /correct-course | Requires discussion |
| /retrospective | Interactive reflection |

### Subagent Delegation (Context Preservation)
| Operation | Subagent |
|-----------|----------|
| Research | Explore |
| Code review | general-purpose |
| Test/Build/Lint | general-purpose |

All subagents use Opus 4.5 (default model).

---

## CONSTRAINTS

### Universal
- Tests pass before commit
- Sprint-status is source of truth
- Fresh context for code review
- Conventional commits (no AI mentions)

### Epic-Specific
Loaded from context file.

---

## ERROR RECOVERY

| Error | Action |
|-------|--------|
| Tests fail | Fix before commit |
| 3+ critical review issues | Consider /correct-course |
| Story blocked | Note, try next if independent |
| Build fails | Fix compilation errors |
| Context exhausted | Save state, provide resume instructions |

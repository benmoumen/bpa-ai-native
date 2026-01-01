# Epic Implementation Command

Autonomously implement an epic using BMAD workflows with multi-agent orchestration.

**Usage**: `/epic {number}` (e.g., `/epic 4`)

---

## PHASE 0: Context Setup

### Step 0.1: Load or Generate Epic Context

Check if `_bmad-output/epic-contexts/epic-$ARGUMENTS.yaml` exists.

**If NOT exists**, generate it by:

1. **Read source files**:
   - `_bmad-output/project-planning-artifacts/epics.md` → story list, descriptions
   - `_bmad-output/implementation-artifacts/sprint-status.yaml` → story states
   - `_bmad-output/analysis/bpa-api-mental-model-analysis.md` → domain constraints
   - `_bmad-output/architecture.md` → technical constraints

2. **Extract for Epic $ARGUMENTS**:
   - Epic name and description
   - All stories with IDs and titles
   - Current status of each story
   - MVP-critical vs deferrable classification
   - Whether spike (story X-0) exists
   - Domain-specific constraints
   - Prerequisites (which epics must be done first)

3. **Generate context file** with this structure:
   ```yaml
   epic: {number}
   name: {epic name}
   description: |
     {epic description}
   status: {backlog|in-progress|done|superseded}

   spike:
     required: {true|false}
     story_id: "{N}-0"
     research_targets:
       - {paths to research}

   stories:
     mvp_critical:
       - id: "{N}-1"
         title: "{story title}"
         status: {backlog|ready-for-dev|in-progress|review|done}
     deferrable:
       - id: "{N}-X"
         title: "{story title}"
         status: backlog

   constraints:
     - "{domain constraint 1}"
     - "{domain constraint 2}"

   prerequisites:
     - epic: {N}
       required_status: done
   ```

4. **Save to** `_bmad-output/epic-contexts/epic-$ARGUMENTS.yaml`

### Step 0.2: Load Context

Read and parse the context file. Extract:
- `stories.mvp_critical` → ordered list of stories to implement
- `spike` → whether research phase needed
- `constraints` → rules to enforce during implementation
- `prerequisites` → what must be done first

---

## PHASE 1: Validation

### Step 1.1: Check Epic Status

Read `sprint-status.yaml` for `epic-$ARGUMENTS` status.

| Status | Action |
|--------|--------|
| `done` | Report "Epic $ARGUMENTS already complete" and EXIT |
| `superseded` | Report "Epic $ARGUMENTS was superseded" and EXIT |
| `backlog` | Update to `in-progress`, continue |
| `in-progress` | Continue from where we left off |

### Step 1.2: Check Prerequisites

For each prerequisite in context file:
- Check if prerequisite epic is `done` in sprint-status.yaml
- If NOT done: Report "Epic {N} requires Epic {X} to be done first" and EXIT

### Step 1.3: Identify Resume Point

Find the first story in `mvp_critical` that is NOT `done`:
- This is where we start/resume
- If all `done` → go to PHASE 4 (Completion)

---

## PHASE 2: Spike Execution (if required)

If `spike.required == true` AND spike story status != `done`:

### Step 2.1: Research

Use Task(Explore) agents to research each target in `spike.research_targets`:
```
Task(subagent_type="Explore", prompt="Research {target} for Epic $ARGUMENTS workflow patterns. Extract: entity models, relationships, API patterns, constraints.")
```

### Step 2.2: Document Findings

Create spike output file: `_bmad-output/implementation-artifacts/$ARGUMENTS-0-spike-findings.md`

Include:
- Entity models discovered
- Relationship patterns
- API endpoint patterns
- Constraints identified
- Recommended Prisma schema approach
- Implementation notes

### Step 2.3: Complete Spike

1. Update sprint-status.yaml: `$ARGUMENTS-0-*: done`
2. Commit: `docs(epic-$ARGUMENTS): complete workflow research spike`

---

## PHASE 3: Story Implementation Loop

For each story in `mvp_critical` where status != `done`:

### Step 3.1: Create Story (if needed)

If story status == `backlog`:
```
/create-story
```
- Follow prompts to generate story file
- Story file created at: `_bmad-output/implementation-artifacts/{story-id}-*.md`
- Update sprint-status.yaml: `{story-id}: ready-for-dev`

### Step 3.2: Implement Story

```
/dev-story _bmad-output/implementation-artifacts/{story-file}.md
```
- Follow acceptance criteria
- Write tests
- Update sprint-status.yaml: `{story-id}: in-progress`
- When complete: `{story-id}: review`

### Step 3.3: Code Review (Fresh Context)

Spawn a NEW agent for objectivity:
```
Task(subagent_type="general-purpose", prompt="
  Execute /code-review _bmad-output/implementation-artifacts/{story-file}.md

  This is an ADVERSARIAL review. Find 3-10 specific issues.
  Categories: code quality, test coverage, architecture compliance, security, performance.

  Return: List of issues with severity (critical/major/minor) and fix recommendations.
")
```

### Step 3.4: Handle Review Results

| Review Outcome | Action |
|----------------|--------|
| 0-2 critical issues | Fix issues, continue |
| 3+ critical issues | Run `/correct-course`, reassess approach |
| Architecture violation | Run `/correct-course` |

### Step 3.5: Quality Gate

Run ALL checks - must pass before commit:
```bash
pnpm test          # All tests pass
pnpm lint          # No lint errors
pnpm build         # Compiles successfully
```

If any fail → fix issues → re-run checks

### Step 3.6: Commit

```bash
git add .
git commit -m "feat(api|web): {story title}

- {key change 1}
- {key change 2}

Story: {story-id}"
```

### Step 3.7: Update Status

Update sprint-status.yaml: `{story-id}: done`

### Step 3.8: Continue Loop

Proceed to next story in `mvp_critical`

---

## PHASE 4: Completion

### Step 4.1: Final Verification

```bash
pnpm test   # Full test suite
pnpm build  # Full build
```

### Step 4.2: Retrospective

```
/retrospective epic-$ARGUMENTS
```

### Step 4.3: Update Epic Status

Update sprint-status.yaml: `epic-$ARGUMENTS: done`

### Step 4.4: Commit Status

```bash
git add _bmad-output/implementation-artifacts/sprint-status.yaml
git commit -m "chore: mark Epic $ARGUMENTS complete"
```

### Step 4.5: Report

Output summary:
- Stories completed
- Tests passing
- Key learnings from retrospective

---

## CONSTRAINTS (Enforced Throughout)

Load constraints from context file and enforce during all phases:

### Universal Constraints
- All tests must pass before any commit
- Sprint-status.yaml is source of truth
- Fresh agent context for code reviews
- Conventional commit messages (no AI mentions)

### Epic-Specific Constraints
Loaded from `_bmad-output/epic-contexts/epic-$ARGUMENTS.yaml`

---

## ERROR RECOVERY

| Error | Recovery |
|-------|----------|
| Tests fail | Fix before proceeding, do not commit broken code |
| Code review finds architecture issues | `/correct-course` to reassess |
| Story blocked by external dependency | Note in status, try next independent story |
| Context exhausted | Save state to sprint-status, provide resume instructions |
| Build fails | Fix TypeScript/compilation errors before proceeding |

---

## SUBAGENT DELEGATION

Use Task tool for these operations to preserve context:

| Operation | Subagent |
|-----------|----------|
| Research/exploration | `Task(subagent_type="Explore")` |
| Code review | `Task(subagent_type="general-purpose")` |
| Test running | `Task(subagent_type="general-purpose")` |
| Build verification | `Task(subagent_type="general-purpose")` |

---

## DEFERRABLE STORIES

Stories in `stories.deferrable` are NOT implemented in this run.
They will be addressed in a future iteration or phase.

To include deferrable stories, modify context file or run:
`/epic $ARGUMENTS --include-deferrable`

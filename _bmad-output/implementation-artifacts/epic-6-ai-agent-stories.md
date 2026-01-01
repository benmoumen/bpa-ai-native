# Epic 6: AI Agent for Service Configuration

**Epic ID:** E6
**Status:** Backlog
**Architecture:** Vercel AI SDK (revised from CopilotKit)
**Dependencies:** Epic 4 (Workflow), Epic 3 (Forms)

---

## Epic Overview

Transform the service designer experience through an intelligent AI Agent that operates as a "junior engineer" - understanding backend state, executing complex multi-step operations, respecting constraints, and auto-healing when possible.

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Framework** | Vercel AI SDK | Unlimited tools, full control, Apache 2.0, no paywall |
| **Tool Generation** | Dynamic from OpenAPI | Auto-sync with backend, no manual maintenance |
| **Constraints** | YAML rule engine | Declarative, auditable, hot-reloadable |
| **State Sync** | WebSocket events | Real-time backend awareness |
| **Error Handling** | Self-healing classifier | Categorize and auto-recover where possible |

---

## Story Breakdown

### 6-0: AI Agent Architecture Spike
**Priority:** MVP Critical | **Points:** 5 | **Type:** Research

**Objective:** Validate Vercel AI SDK architecture with minimal end-to-end implementation.

**Acceptance Criteria:**
- [ ] Vercel AI SDK integrated with Groq provider
- [ ] Single tool (createService) generated from OpenAPI spec
- [ ] Basic chat UI with streaming response
- [ ] Confirm tool execution works end-to-end
- [ ] Document learnings and any architecture adjustments

**Technical Notes:**
- Use `/api/v1/openapi.json` endpoint (create if needed)
- Test with llama-3.3-70b-versatile model
- Validate streaming works with Next.js App Router

---

### 6-1: AI Agent Core Runtime
**Priority:** MVP Critical | **Points:** 8 | **Type:** Implementation

**Objective:** Implement the `packages/ai-agent` package with core BPAAgent class.

**Acceptance Criteria:**
- [ ] `packages/ai-agent` package scaffolded with TypeScript
- [ ] `BPAAgent` class with `chat()` method returning streaming response
- [ ] System prompt builder with service context injection
- [ ] Multi-step reasoning enabled (`maxSteps: 10`)
- [ ] Step completion hooks for tool result handling
- [ ] Fallback to Claude when Groq fails (via LiteLLM)
- [ ] Unit tests for agent initialization and message handling

**Package Structure:**
```
packages/ai-agent/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── runtime/
    │   ├── agent.ts          # BPAAgent class
    │   └── stream.ts         # Streaming utilities
    └── types.ts              # Agent types
```

**Dependencies:** 6-0 spike findings

---

### 6-1a: Dynamic Tool Registry
**Priority:** MVP Critical | **Points:** 8 | **Type:** Implementation

**Objective:** Auto-generate Vercel AI SDK tools from OpenAPI specification.

**Acceptance Criteria:**
- [ ] OpenAPI → Zod schema transformer
- [ ] Tool generator creates tools from all CRUD endpoints
- [ ] Tool metadata includes: mutates, scope, requiresConfirmation
- [ ] Runtime tool filtering by service context
- [ ] Tools refresh when OpenAPI spec changes
- [ ] Integration tests with real API endpoints

**Key Files:**
```
packages/ai-agent/src/tools/
├── generator.ts      # OpenAPI → Tool conversion
├── registry.ts       # Tool storage and retrieval
├── schemas.ts        # Zod schema helpers
└── executor.ts       # HTTP execution wrapper
```

**Endpoints to Cover (MVP):**
| Endpoint | Tool Name | Mutates |
|----------|-----------|---------|
| POST /services | createService | Yes |
| PATCH /services/:id | updateService | Yes |
| DELETE /services/:id | deleteService | Yes |
| POST /services/:id/forms | addFormField | Yes |
| PATCH /services/:id/forms | updateFormField | Yes |
| PUT /services/:id/workflow | configureWorkflow | Yes |
| POST /services/:id/workflow/steps | addWorkflowStep | Yes |
| GET /services/:id | getService | No |
| GET /services/:id/preview | previewService | No |

---

### 6-1b: Constraint Engine
**Priority:** MVP Critical | **Points:** 5 | **Type:** Implementation

**Objective:** Implement YAML-based rule engine for action constraints.

**Acceptance Criteria:**
- [ ] YAML rule format defined and documented
- [ ] Constraint evaluator with condition parsing
- [ ] Action types: `require_confirmation`, `block`, `warn`, `transform`
- [ ] Context variables accessible in conditions
- [ ] Rules hot-reloadable without restart
- [ ] Default rules for destructive operations

**Key Files:**
```
packages/ai-agent/src/constraints/
├── rules.yaml        # Default constraint rules
├── engine.ts         # Rule evaluation engine
├── parser.ts         # YAML parser with validation
└── types.ts          # Rule types
```

**Default Rules (MVP):**
```yaml
rules:
  - name: confirm_delete
    condition: "tool.name.match(/delete|remove/)"
    action: require_confirmation
    message: "This will permanently delete. Confirm?"

  - name: cost_guard
    condition: "context.sessionCost > 1.00"
    action: block
    message: "Session cost limit reached ($1.00)"

  - name: publish_requires_validation
    condition: "tool.name === 'publishService'"
    action: require_confirmation
    message: "Publishing will make this service live. Proceed?"
```

---

### 6-1c: Self-Healing Layer
**Priority:** MVP Critical | **Points:** 5 | **Type:** Implementation

**Objective:** Implement error classification and automatic recovery.

**Acceptance Criteria:**
- [ ] Error classifier with 4 categories: retryable, user_fixable, conflict, fatal
- [ ] Auto-retry with exponential backoff for rate limits
- [ ] Optimistic lock handling (refresh + retry for 409)
- [ ] User-friendly error messages for validation failures
- [ ] Healing attempts logged for observability
- [ ] Maximum healing attempts configurable

**Key Files:**
```
packages/ai-agent/src/healing/
├── classifier.ts     # Error category detection
├── handler.ts        # Recovery strategy execution
└── types.ts          # Healing types
```

**Error Categories:**
| Category | Status Codes | Strategy |
|----------|-------------|----------|
| retryable | 429, 503, 504 | Exponential backoff |
| conflict | 409 | Refresh context, retry |
| user_fixable | 400, 422 | Show guidance, await user fix |
| fatal | 401, 403, 500 | Report, no auto-heal |

---

### 6-1d: Backend Event Stream
**Priority:** MVP Critical | **Points:** 5 | **Type:** Implementation

**Objective:** Real-time backend state awareness via WebSocket.

**Acceptance Criteria:**
- [ ] WebSocket connection to backend event stream
- [ ] Events: entity.created, entity.updated, entity.deleted
- [ ] Context store (Zustand) updated on events
- [ ] Reconnection with exponential backoff
- [ ] Event deduplication for multi-tab scenarios
- [ ] Agent notified of relevant context changes

**Key Files:**
```
packages/ai-agent/src/context/
├── provider.tsx      # React context provider
├── store.ts          # Zustand store
├── events.ts         # WebSocket handler
└── types.ts          # Context types
```

**Backend Requirements:**
- NestJS WebSocket gateway at `/ws/events`
- Events scoped by service ID
- JWT authentication for WebSocket

---

### 6-1e: Observability Layer
**Priority:** MVP Critical | **Points:** 3 | **Type:** Implementation

**Objective:** Audit logging and LLM cost tracking.

**Acceptance Criteria:**
- [ ] Every tool execution logged with: tool, params, result, duration, user
- [ ] LLM token usage tracked per request
- [ ] Session cost calculated and exposed
- [ ] Cost per service configuration tracked
- [ ] Audit log queryable via API
- [ ] Dashboard metrics for agent usage

**Key Files:**
```
packages/ai-agent/src/observability/
├── audit.ts          # Action audit logging
├── cost.ts           # LLM cost calculator
└── metrics.ts        # Prometheus metrics
```

**Cost Tracking (NFR32: < $1.00 per service):**
```typescript
const GROQ_PRICING = {
  "llama-3.3-70b-versatile": { input: 0.0008, output: 0.0008 } // per 1K tokens
};
```

---

### 6-2: Chat Interface Foundation
**Priority:** MVP Critical | **Points:** 5 | **Type:** Implementation

**Objective:** Basic chat UI with streaming responses.

**Acceptance Criteria:**
- [ ] Chat sidebar component in service builder
- [ ] Message input with send button
- [ ] Streaming response display with typing indicator
- [ ] Message history with user/agent distinction
- [ ] Scroll to bottom on new messages
- [ ] Mobile-responsive design

**Component Location:**
```
apps/web/src/components/ai-agent/
├── ChatSidebar.tsx
├── MessageList.tsx
├── MessageInput.tsx
└── StreamingMessage.tsx
```

---

### 6-3: Confirmation Flow UI
**Priority:** MVP Critical | **Points:** 3 | **Type:** Implementation

**Objective:** User confirmation for constrained actions.

**Acceptance Criteria:**
- [ ] Confirmation dialog component
- [ ] Action preview showing what will change
- [ ] Accept/Reject buttons
- [ ] Timeout for stale confirmations (60s)
- [ ] Keyboard shortcuts (Enter=confirm, Esc=cancel)
- [ ] Confirmation state persisted across re-renders

**API Route:**
```
apps/web/src/app/api/agent/confirm/route.ts
```

---

### 6-4: Service Generation Flow
**Priority:** MVP Critical | **Points:** 8 | **Type:** Implementation

**Objective:** Multi-step service generation from natural language.

**Acceptance Criteria:**
- [ ] "Create a business registration service" → complete config
- [ ] Progress indicator showing current step
- [ ] Step breakdown: metadata → form → workflow → review
- [ ] Partial results shown as they complete
- [ ] Cancel generation at any step
- [ ] Resume from interruption point

**User Flow:**
1. User describes service in natural language
2. Agent analyzes requirements
3. Agent generates metadata (name, description)
4. Agent generates form fields
5. Agent generates workflow steps
6. Agent shows summary for review
7. User approves or requests changes

---

### 6-5: Iterative Refinement
**Priority:** MVP Critical | **Points:** 5 | **Type:** Implementation

**Objective:** Conversational editing of generated configurations.

**Acceptance Criteria:**
- [ ] "Add a phone number field" → field added
- [ ] "Remove the address section" → section removed
- [ ] "Make email required" → validation updated
- [ ] Undo support for recent changes
- [ ] Change preview before application
- [ ] Batch changes with single confirmation

---

### 6-6: Gap Detection
**Priority:** Post-MVP | **Points:** 5 | **Type:** Implementation

**Objective:** Proactive identification of incomplete configurations.

**Acceptance Criteria:**
- [ ] Detect missing required fields (e.g., no applicant name)
- [ ] Detect workflow gaps (orphan steps, missing transitions)
- [ ] Detect validation gaps (no format constraints)
- [ ] Suggestions surfaced proactively
- [ ] "Would you like me to fix these?" prompt
- [ ] Batch fix with single confirmation

---

### 6-7: Agent Settings & Preferences
**Priority:** Post-MVP | **Points:** 3 | **Type:** Implementation

**Objective:** User control over agent behavior.

**Acceptance Criteria:**
- [ ] Verbosity setting (concise/detailed)
- [ ] Auto-apply setting (with/without confirmation)
- [ ] Preferred language for responses
- [ ] Session history retention preference
- [ ] Settings persisted per user

---

## Story Dependencies

```
6-0 (Spike)
  │
  └──► 6-1 (Core Runtime)
        │
        ├──► 6-1a (Tool Registry)
        │
        ├──► 6-1b (Constraint Engine)
        │
        ├──► 6-1c (Self-Healing)
        │
        ├──► 6-1d (Event Stream)
        │
        └──► 6-1e (Observability)
              │
              └──► 6-2 (Chat UI)
                    │
                    ├──► 6-3 (Confirmation Flow)
                    │
                    └──► 6-4 (Service Generation)
                          │
                          └──► 6-5 (Refinement)
                                │
                                └──► 6-6 (Gap Detection)
                                      │
                                      └──► 6-7 (Settings)
```

## MVP vs Post-MVP

### MVP (8 stories, ~47 points)
- 6-0: Spike (5)
- 6-1: Core Runtime (8)
- 6-1a: Tool Registry (8)
- 6-1b: Constraint Engine (5)
- 6-1c: Self-Healing (5)
- 6-1d: Event Stream (5)
- 6-1e: Observability (3)
- 6-2: Chat UI (5)
- 6-3: Confirmation Flow (3)

### MVP Extended (add 2 stories, +13 points)
- 6-4: Service Generation (8)
- 6-5: Iterative Refinement (5)

### Post-MVP (2 stories, +8 points)
- 6-6: Gap Detection (5)
- 6-7: Agent Settings (3)

---

## Requirements Mapping

| Story | FRs Covered |
|-------|-------------|
| 6-0 | FR25 (LLM Integration) |
| 6-1 | FR25, FR31 (Processing) |
| 6-1a | FR25 (Backend Integration) |
| 6-1b | FR32 (Constraints) |
| 6-1c | FR63 (Error Handling) |
| 6-1d | FR31 (Real-time) |
| 6-1e | FR64 (Audit) |
| 6-2 | FR26 (Chat Interface) |
| 6-3 | FR30 (Accept/Review) |
| 6-4 | FR29 (Complete Config) |
| 6-5 | FR31 (Iterative Refinement) |
| 6-6 | FR33 (Gap Detection) |
| 6-7 | FR27 (Preferences) |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| OpenAPI spec incomplete | Parallel work to complete API docs |
| Groq rate limits | LiteLLM failover to Claude |
| Tool count explosion | Start with CRUD, add complex tools later |
| WebSocket complexity | Use Socket.io for reconnection handling |

---

## Success Metrics (NFRs)

- **NFR17:** AI response < 10 seconds (target: 5s for simple queries)
- **NFR32:** LLM cost < $1.00 per service configuration
- **NFR33:** Agent achieves 80% task completion without fallback to manual

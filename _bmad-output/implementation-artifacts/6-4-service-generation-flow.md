# Story 6.4: Service Generation Flow

Status: review

## Story

As a **service designer**,
I want to **describe a service in natural language and have the AI agent generate the complete configuration**,
so that **I can rapidly create services without manually configuring metadata, forms, and workflows**.

## Acceptance Criteria

1. **Natural Language Input**: User can describe service requirements conversationally (e.g., "Create a business registration service with company name, address, and owner details")
2. **Multi-Step Generation**: Agent breaks generation into visible steps: metadata → form fields → workflow → review
3. **Progress Indicator**: UI shows current generation step and completion percentage
4. **Partial Results**: Each completed step is displayed to user before proceeding
5. **Cancellation**: User can stop generation at any step via cancel button or Escape key
6. **Resume Capability**: If interrupted, user can resume from last completed step
7. **Final Review**: Agent presents summary of generated configuration for user approval
8. **Real Agent Integration**: Chat UI connected to actual BPAAgent runtime (replacing mocks)

## Tasks / Subtasks

- [x] **Task 1: Create Chat Streaming API Endpoint** (AC: #8)
  - [x] Create `/api/agent/chat/route.ts` with streaming response
  - [x] Wire BPAAgent from `packages/ai-agent` to API route
  - [x] Configure SSE streaming with createResponseStream
  - [x] Add NextAuth session authentication passthrough
  - [x] Handle AbortController for cancellation

- [x] **Task 2: Replace Mock Chat with Real Agent** (AC: #8)
  - [x] Update `use-chat.ts` to call `/api/agent/chat` endpoint
  - [x] Remove `generateMockResponse()` function
  - [x] Implement parseSSEStream async generator
  - [x] Handle streaming response chunks properly
  - [x] Preserve message history state
  - [x] Add cancel() method with AbortController

- [x] **Task 3: Implement Generation Steps State Machine** (AC: #2, #6)
  - [x] Define generation steps enum: ANALYZING, METADATA, FORM, WORKFLOW, REVIEW
  - [x] Create `useGenerationFlow` hook for step tracking
  - [x] Store step progress in local state (survives re-renders)
  - [x] Persist step progress to localStorage for resume capability
  - [x] Add step transition events with callbacks

- [x] **Task 4: Build Progress Indicator Component** (AC: #3)
  - [x] Create `GenerationProgress.tsx` component
  - [x] Display stepper UI with step labels
  - [x] Animate current step indicator with spinner
  - [x] Show percentage progress bar

- [x] **Task 5: Display Partial Results** (AC: #4)
  - [x] Create `GenerationPreview.tsx` component
  - [x] Show metadata preview after METADATA step
  - [x] Show form field preview after FORM step
  - [x] Show workflow preview after WORKFLOW step
  - [x] Collapsible sections with edit buttons

- [x] **Task 6: Implement Cancellation Flow** (AC: #5)
  - [x] Add Cancel button to ChatSidebar during generation
  - [x] Handle Escape key press during generation
  - [x] Call AbortController.abort() on cancel
  - [x] Cancel both chat and generation flow
  - [x] Resume prompt for interrupted sessions

- [x] **Task 7: Build Final Review Summary** (AC: #7)
  - [x] Create `GenerationSummary.tsx` component
  - [x] Display all generated config in organized sections
  - [x] Add "Approve & Save" and "Start Over" buttons
  - [x] Summary stats (fields, steps, transitions)
  - [x] Confirmation dialog for save action

- [x] **Task 8: Integration Tests** (AC: all)
  - [x] Add unit tests for useGenerationFlow hook (25 tests)
  - [x] Test state transitions through all steps
  - [x] Test cancellation behavior
  - [x] Test localStorage persistence and resume
  - [x] Test error handling

## Dev Notes

### Critical Architecture: Wire Real Agent to Chat UI

**Current State (Mock)**:
```typescript
// apps/web/src/components/ai-agent/use-chat.ts
const response = generateMockResponse(content, serviceId); // REMOVE THIS
```

**Target State (Real Agent)**:
```typescript
// apps/web/src/app/api/agent/chat/route.ts
import { BPAAgent } from '@bpa/ai-agent';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages, serviceId } = await req.json();

  const agent = new BPAAgent({
    serviceId,
    // ... agent config
  });

  const result = await agent.chat(messages);

  return new Response(result.toReadableStream(), {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

### Generation Steps Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  User: "Create a business registration service..."          │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: ANALYZING (5%)                                      │
│  Agent: "I'll analyze your requirements..."                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: METADATA (25%)                                      │
│  Agent: [calls createService tool]                           │
│  Preview: { name: "Business Registration", ... }             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: FORM (50%)                                          │
│  Agent: [calls addFormField tool x N]                        │
│  Preview: Form fields list                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: WORKFLOW (75%)                                      │
│  Agent: [calls addWorkflowStep, addTransition tools]         │
│  Preview: Workflow diagram                                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: REVIEW (100%)                                       │
│  Agent: "Here's your complete service..."                    │
│  Summary: Full configuration with Approve/Edit buttons       │
└─────────────────────────────────────────────────────────────┘
```

### Key Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `apps/web/src/app/api/agent/chat/route.ts` | CREATE | Streaming chat endpoint |
| `apps/web/src/components/ai-agent/use-chat.ts` | MODIFY | Replace mock with real agent call |
| `apps/web/src/components/ai-agent/GenerationProgress.tsx` | CREATE | Step progress indicator |
| `apps/web/src/components/ai-agent/GenerationPreview.tsx` | CREATE | Partial results display |
| `apps/web/src/components/ai-agent/GenerationSummary.tsx` | CREATE | Final review summary |
| `apps/web/src/components/ai-agent/use-generation-flow.ts` | CREATE | Generation state machine hook |
| `apps/web/src/components/ai-agent/ChatSidebar.tsx` | MODIFY | Add progress UI and cancel |

### Existing Infrastructure to Leverage

From `packages/ai-agent`:
- **BPAAgent class**: `src/runtime/agent.ts` - Core agent with `chat()` method
- **Streaming utilities**: `src/runtime/stream.ts` - Response streaming
- **Tool registry**: `src/tools/registry.ts` - Available tools for generation
- **Constraint engine**: `src/constraints/engine.ts` - Confirmation triggers
- **Observability**: `src/observability/audit.ts` - Log tool executions

From `apps/web`:
- **ChatSidebar**: `src/components/ai-agent/ChatSidebar.tsx` - Base component
- **use-chat hook**: `src/components/ai-agent/use-chat.ts` - Chat state management
- **ConfirmationDialog**: `src/components/ai-agent/ConfirmationDialog.tsx` - Confirmations

### API Environment Variables Required

```bash
# .env.local
GROQ_API_KEY=your-groq-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key  # Fallback

# Optional (for LiteLLM gateway)
LITELLM_BASE_URL=http://localhost:4000
```

### Project Structure Notes

- Chat API route goes in `apps/web/src/app/api/agent/chat/` (Next.js App Router)
- Generation components in `apps/web/src/components/ai-agent/`
- State management via React hooks (existing pattern) + localStorage for persistence
- Streaming via Vercel AI SDK (already in package.json)

### Testing Standards

- Unit tests for `use-generation-flow.ts` hook
- Integration tests via Playwright for full flow
- Mock BPAAgent in unit tests, real agent in integration
- Test cancellation and resume scenarios

### Previous Story Learnings (From Epic 6 Retro)

1. **Integration testing gap**: Add Playwright E2E tests (not just unit tests)
2. **Mock responses**: Must be replaced with real agent - this story's primary goal
3. **Type safety for tools**: Consider enhancing Zod schemas for better DX

### References

- [Epic 6 Stories](../_bmad-output/implementation-artifacts/epic-6-ai-agent-stories.md#6-4-service-generation-flow)
- [Epic 6 Retrospective](../_bmad-output/implementation-artifacts/epic-6-retrospective.md#recommendations-for-story-6-4)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Project Context](../_bmad-output/project-context.md#llm-streaming-litellm)
- [Source: packages/ai-agent/src/runtime/agent.ts - BPAAgent class]
- [Source: apps/web/src/components/ai-agent/use-chat.ts - Current mock implementation]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Created streaming chat API endpoint at `/api/agent/chat` using BPAAgent and SSE
2. Replaced mock chat implementation with real agent calls using parseSSEStream
3. Implemented generation flow state machine with localStorage persistence
4. Built generation progress, preview, and summary UI components
5. Added cancellation flow with Escape key support
6. Added comprehensive unit tests for useGenerationFlow hook (25 tests passing)

### Change Log

- 2026-01-02: Initial implementation of all 8 tasks
- 2026-01-02: Fixed nextStep stale closure issue for proper state tracking
- 2026-01-02: Added metadata field to ChatMessage type for tool calls

### File List

**Created:**
- `apps/web/src/app/api/agent/chat/route.ts` - Streaming chat API endpoint
- `apps/web/src/components/ai-agent/use-generation-flow.ts` - Generation flow state machine hook
- `apps/web/src/components/ai-agent/use-generation-flow.test.ts` - Unit tests (25 tests)
- `apps/web/src/components/ai-agent/GenerationProgress.tsx` - Progress indicator component
- `apps/web/src/components/ai-agent/GenerationPreview.tsx` - Partial results preview component
- `apps/web/src/components/ai-agent/GenerationSummary.tsx` - Final review summary component

**Modified:**
- `apps/web/package.json` - Added @bpa/ai-agent dependency
- `apps/web/src/components/ai-agent/use-chat.ts` - Replaced mock with real agent calls
- `apps/web/src/components/ai-agent/ChatSidebar.tsx` - Integrated generation flow and cancellation
- `apps/web/src/components/ai-agent/types.ts` - Added metadata field to ChatMessage
- `apps/web/src/components/ai-agent/index.ts` - Added exports for new components


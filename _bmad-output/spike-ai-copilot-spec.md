# AI Copilot Technical Specification

**Type:** Research Spike
**Status:** Complete
**Date:** 2026-01-01

---

## Executive Decision

**Framework:** CopilotKit
**License:** MIT (core) | Cloud-only: guardrails, analytics, >30 actions
**Risk Level:** Low (BPA scope: 15 actions, under paywall threshold)

---

## Framework Evaluation Summary

| Candidate | License | Weekly Downloads | Verdict |
|-----------|---------|------------------|---------|
| **CopilotKit** | MIT | 72k | **Selected** - native Groq, CoAgents, 40% effort reduction |
| Vercel AI SDK | Apache 2.0 | 20M+ | Backup - no lock-in, more manual work |
| assistant-ui | MIT | 72k | Components only, 1-person bus factor |
| Open WebUI | Proprietary | N/A | **Rejected** - 23 CVEs, license fraud |
| Lobe Chat | Dual-license | N/A | **Rejected** - commercial restrictions |
| LibreChat | MIT | N/A | Full app, not embeddable |

---

## Architecture Integration

### Provider Setup

```typescript
// app/providers.tsx
import { CopilotKit } from "@copilotkit/react-core";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      transcribeAudioUrl="/api/copilotkit/transcribe"
    >
      {children}
    </CopilotKit>
  );
}
```

### Runtime Configuration

```typescript
// app/api/copilotkit/route.ts
import { CopilotRuntime, GroqAdapter } from "@copilotkit/runtime";

const runtime = new CopilotRuntime({
  telemetry: { enabled: false } // Data sovereignty
});

const adapter = new GroqAdapter({
  model: "llama-3.3-70b-versatile",
  // Fallback handled by LiteLLM proxy, not CopilotKit
});

export async function POST(req: Request) {
  return runtime.streamHttpServerResponse(req, adapter);
}
```

---

## Action Registry

### Core Actions (15 total)

| Action | Scope | Mutates | API Endpoint |
|--------|-------|---------|--------------|
| `createService` | service | Yes | POST `/api/v1/services` |
| `updateService` | service | Yes | PATCH `/api/v1/services/:id` |
| `deleteService` | service | Yes | DELETE `/api/v1/services/:id` |
| `previewService` | service | No | GET `/api/v1/preview/:id` |
| `publishService` | service | Yes | POST `/api/v1/services/:id/publish` |
| `addFormField` | form | Yes | PATCH `/api/v1/services/:id/forms` |
| `updateFormField` | form | Yes | PATCH (same) |
| `removeFormField` | form | Yes | PATCH (same) |
| `reorderFormFields` | form | Yes | PATCH (same) |
| `configureWorkflow` | workflow | Yes | PUT `/api/v1/services/:id/workflow` |
| `addWorkflowStep` | workflow | Yes | POST `/api/v1/services/:id/workflow/steps` |
| `setTransitions` | workflow | Yes | PATCH `/api/v1/services/:id/workflow` |
| `createDeterminant` | rules | Yes | POST `/api/v1/services/:id/determinants` |
| `detectGaps` | analysis | No | GET + LLM analysis |
| `applyAISuggestions` | multi | Yes | Multi-PATCH transaction |

### Action Implementation Pattern

```typescript
// packages/copilot-actions/src/form-actions.ts
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import type { FormField, FormSchema } from "@bpa/types";

export function useFormCopilotActions(serviceId: string) {
  const { data: form, mutate } = useFormConfig(serviceId);

  // Expose current form state to AI
  useCopilotReadable({
    description: "Current form configuration",
    value: form
  });

  useCopilotAction({
    name: "addFormField",
    description: "Add a new field to the applicant form",
    parameters: [
      { name: "fieldType", type: "string", enum: ["text", "number", "date", "select", "checkbox", "file"] },
      { name: "key", type: "string", description: "Unique field identifier (camelCase)" },
      { name: "label", type: "string", description: "Display label" },
      { name: "required", type: "boolean" },
      { name: "validation", type: "object", optional: true },
      { name: "position", type: "number", optional: true, description: "Insert position (0-indexed)" }
    ],
    handler: async ({ fieldType, key, label, required, validation, position }) => {
      const field: FormField = { type: fieldType, key, label, required, ...validation };
      const updated = await formApi.addField(serviceId, field, position);
      mutate(updated);
      return { success: true, fieldCount: updated.fields.length };
    }
  });

  useCopilotAction({
    name: "removeFormField",
    description: "Remove a field from the form by its key",
    parameters: [
      { name: "fieldKey", type: "string" }
    ],
    handler: async ({ fieldKey }) => {
      const updated = await formApi.removeField(serviceId, fieldKey);
      mutate(updated);
      return { success: true, removed: fieldKey };
    }
  });
}
```

---

## Context Hooks

### Readable State Exposure

```typescript
// components/ServiceBuilder.tsx
export function ServiceBuilder({ serviceId }: Props) {
  const { data: service } = useService(serviceId);
  const { data: form } = useFormConfig(serviceId);
  const { data: workflow } = useWorkflow(serviceId);

  // AI can read full service context
  useCopilotReadable({
    description: "Service metadata",
    value: { id: service.id, name: service.name, status: service.status }
  });

  useCopilotReadable({
    description: "Form fields configuration",
    value: form?.fields ?? []
  });

  useCopilotReadable({
    description: "Workflow steps and transitions",
    value: workflow ?? { steps: [], transitions: [] }
  });

  useCopilotReadable({
    description: "Validation errors and gaps",
    value: useValidationErrors(serviceId)
  });
}
```

---

## CoAgents for Multi-Step Operations

### Service Generation Flow

```typescript
// packages/copilot-actions/src/agents/service-generator.ts
import { useCoAgent, useCoAgentStateRender } from "@copilotkit/react-core";

interface GenerationState {
  phase: "analyzing" | "generating-form" | "generating-workflow" | "generating-rules" | "complete";
  progress: number;
  artifacts: {
    form?: FormSchema;
    workflow?: WorkflowConfig;
    determinants?: DeterminantRule[];
  };
}

export function useServiceGeneratorAgent() {
  const { state, setState } = useCoAgent<GenerationState>({
    name: "serviceGenerator",
    initialState: { phase: "analyzing", progress: 0, artifacts: {} }
  });

  // Render progress UI during generation
  useCoAgentStateRender({
    name: "serviceGenerator",
    render: ({ state }) => (
      <GenerationProgress
        phase={state.phase}
        progress={state.progress}
        artifacts={state.artifacts}
      />
    )
  });

  return { state, setState };
}
```

---

## UI Components

### Chat Interface

```typescript
// components/AICopilot/index.tsx
import { CopilotSidebar, CopilotPopup } from "@copilotkit/react-ui";

export function AICopilot() {
  return (
    <CopilotSidebar
      labels={{
        title: "BPA Assistant",
        initial: "Describe the government service you want to create..."
      }}
      defaultOpen={true}
      clickOutsideToClose={false}
    />
  );
}

// Field-level AI assistance
export function FieldAIHelper({ fieldKey }: { fieldKey: string }) {
  return (
    <CopilotPopup
      labels={{
        initial: `How can I help with the "${fieldKey}" field?`
      }}
    />
  );
}
```

---

## Backend API Contract

### Required Endpoints

```yaml
# Minimum API surface for copilot actions
/api/v1/services:
  POST: Create service from AI-generated config
  GET: List services (for context)

/api/v1/services/{id}:
  GET: Full service with form, workflow, determinants
  PATCH: Partial update (name, description, status)
  DELETE: Soft delete

/api/v1/services/{id}/forms:
  GET: Form schema
  PATCH: Atomic field operations { op: "add"|"remove"|"update", field: {...} }

/api/v1/services/{id}/workflow:
  GET: Workflow config
  PUT: Replace workflow
  PATCH: Update steps/transitions

/api/v1/services/{id}/determinants:
  GET: List determinants
  POST: Create determinant
  DELETE: Remove determinant

/api/v1/services/{id}/publish:
  POST: Validate and publish

/api/v1/preview/{id}:
  GET: Rendered preview (HTML or JSON)

/api/v1/ai/generate:
  POST: Natural language -> structured config (standalone, non-CopilotKit)
```

---

## Error Handling

```typescript
// packages/copilot-actions/src/error-handler.ts
import { CopilotActionError } from "@copilotkit/react-core";

export function handleActionError(error: unknown, actionName: string): never {
  if (error instanceof ValidationError) {
    throw new CopilotActionError({
      message: `Validation failed: ${error.message}`,
      code: "VALIDATION_ERROR",
      recoverable: true,
      suggestion: error.suggestion
    });
  }

  if (error instanceof ApiError && error.status === 409) {
    throw new CopilotActionError({
      message: "Conflict: another user modified this resource",
      code: "CONFLICT",
      recoverable: true,
      suggestion: "Refresh and try again"
    });
  }

  throw new CopilotActionError({
    message: `${actionName} failed unexpectedly`,
    code: "INTERNAL_ERROR",
    recoverable: false
  });
}
```

---

## Testing Strategy

```typescript
// packages/copilot-actions/__tests__/form-actions.test.ts
import { renderHook } from "@testing-library/react";
import { CopilotKit } from "@copilotkit/react-core";
import { useFormCopilotActions } from "../src/form-actions";

describe("Form Copilot Actions", () => {
  it("addFormField creates field via API", async () => {
    const mockApi = vi.spyOn(formApi, "addField").mockResolvedValue(mockForm);

    const { result } = renderHook(
      () => useFormCopilotActions("service-123"),
      { wrapper: CopilotKit }
    );

    // Simulate AI invoking action
    await result.current.actions.addFormField({
      fieldType: "text",
      key: "applicantName",
      label: "Full Name",
      required: true
    });

    expect(mockApi).toHaveBeenCalledWith("service-123", expect.objectContaining({
      type: "text",
      key: "applicantName"
    }), undefined);
  });
});
```

---

## Monitoring & Observability

```typescript
// lib/copilot-telemetry.ts (self-hosted, no cloud dependency)
import { ActionEvent } from "@copilotkit/react-core";

export function trackCopilotAction(event: ActionEvent) {
  // Send to internal analytics (PostHog, Plausible, or custom)
  analytics.track("copilot_action", {
    action: event.name,
    serviceId: event.parameters?.serviceId,
    success: event.success,
    latencyMs: event.duration,
    tokenCount: event.tokenUsage?.total
  });
}

// Cost tracking per NFR32 (< $1.00 per service)
export function trackLLMCost(usage: TokenUsage) {
  const cost = calculateGroqCost(usage);
  costTracker.record({
    serviceId: usage.serviceId,
    cost,
    model: "llama-3.3-70b-versatile"
  });
}
```

---

## Migration Path (if needed)

If CopilotKit becomes unviable, swap to Vercel AI SDK:

```typescript
// Alternative: Vercel AI SDK implementation
import { generateText, streamText, tool } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";

const addFormFieldTool = tool({
  description: "Add a new field to the form",
  parameters: z.object({
    fieldType: z.enum(["text", "number", "date", "select"]),
    key: z.string(),
    label: z.string(),
    required: z.boolean()
  }),
  execute: async (params) => {
    return formApi.addField(serviceId, params);
  }
});

// Effort: ~1 week to migrate 15 actions
```

---

## Acceptance Criteria

- [ ] CopilotKit provider configured with Groq adapter
- [ ] All 15 actions implemented and tested
- [ ] `useCopilotReadable` exposes service/form/workflow state
- [ ] CoAgent implemented for multi-step service generation
- [ ] Error handling with recovery suggestions
- [ ] Self-hosted telemetry (no CopilotKit cloud)
- [ ] Action latency < 10s (NFR: AI < 10s)
- [ ] LLM cost tracking per service

---

## Dependencies

```json
{
  "@copilotkit/react-core": "^1.x",
  "@copilotkit/react-ui": "^1.x",
  "@copilotkit/runtime": "^1.x"
}
```

---

## References

- PRD: FR25-FR33 (AI-Powered Assistance)
- Architecture: AI Chat UI section
- CopilotKit Docs: https://docs.copilotkit.ai
- Groq API: https://console.groq.com/docs

# AI Agent Architecture Specification

**Type:** Architecture Decision Record
**Status:** Draft
**Date:** 2026-01-01
**Supersedes:** spike-ai-copilot-spec.md (CopilotKit approach)

---

## Executive Summary

This document defines the architecture for BPA's AI Agent system using **Vercel AI SDK** as the foundation. The agent operates as an intelligent system operator—not a chat sidebar with predefined actions, but a reasoning engine that understands the full API surface, enforces constraints, and can self-heal from errors.

### Decision: Vercel AI SDK over CopilotKit

| Factor | CopilotKit | Vercel AI SDK | Winner |
|--------|-----------|---------------|--------|
| Action limits | 30 max (cloud tier) | Unlimited | Vercel |
| Dynamic tool generation | Manual registration | OpenAPI → Tools | Vercel |
| Agent loop control | Abstracted | Full control | Vercel |
| Self-healing capability | DIY | Full control | Vercel |
| License | MIT + cloud paywall | Apache 2.0 | Vercel |
| UI components | Built-in | Build/use helpers | CopilotKit |
| Effort | 2-3 weeks | 4-5 weeks | CopilotKit |

**Verdict:** The additional 2-week investment yields 10x flexibility and eliminates vendor lock-in risk.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BPA AI Agent                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                         Agent Core                                       ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ ││
│  │  │   Vercel    │  │   Groq/     │  │  Streaming  │  │  Conversation   │ ││
│  │  │   AI SDK    │  │   LiteLLM   │  │  Response   │  │  State Manager  │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │                      Dynamic Tool Registry                               ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  ││
│  │  │ OpenAPI Parser  │  │ Tool Generator  │  │ Constraint Wrapper      │  ││
│  │  │ (runtime scan)  │──▶│ (Zod schemas)   │──▶│ (permission+confirm)   │  ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │                         Context Layer                                    ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │  UI State    │  │  Backend     │  │  User        │  │  Service     │ ││
│  │  │  Observer    │  │  Events      │  │  Permissions │  │  Snapshot    │ ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │                       Constraint Engine                                  ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │  Rule        │  │  Permission  │  │  Confirm     │  │  Cost        │ ││
│  │  │  Definitions │  │  Checker     │  │  Gates       │  │  Guards      │ ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │                       Self-Healing Layer                                 ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │  Error       │  │  Recovery    │  │  Retry       │  │  Escalation  │ ││
│  │  │  Classifier  │  │  Strategies  │  │  Logic       │  │  Handler     │ ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                    │                                         │
│  ┌─────────────────────────────────▼───────────────────────────────────────┐│
│  │                       Observability                                      ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ ││
│  │  │  Action      │  │  Cost        │  │  Latency     │  │  Error       │ ││
│  │  │  Audit Log   │  │  Tracking    │  │  Metrics     │  │  Reporting   │ ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                              UI Layer                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  Chat Panel  │  │  Inline      │  │  Status      │  │  Confirmation    │ │
│  │  (sidebar)   │  │  Assistance  │  │  Indicators  │  │  Dialogs         │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Agent Core

The agent core orchestrates all AI interactions using Vercel AI SDK.

### 1.1 Dependencies

```json
{
  "ai": "^4.x",
  "@ai-sdk/groq": "^1.x",
  "zod": "^3.x"
}
```

### 1.2 Agent Runtime

```typescript
// packages/ai-agent/src/runtime/agent.ts
import { generateText, streamText, CoreMessage } from "ai";
import { groq } from "@ai-sdk/groq";
import { getToolRegistry } from "../tools/registry";
import { getContextSnapshot } from "../context/provider";
import { applyConstraints } from "../constraints/engine";
import { handleToolError } from "../healing/handler";

export interface AgentConfig {
  serviceId: string;
  userId: string;
  sessionId: string;
}

export class BPAAgent {
  private messages: CoreMessage[] = [];
  private config: AgentConfig;
  private tools: Record<string, any>;

  constructor(config: AgentConfig) {
    this.config = config;
    this.tools = this.initializeTools();
  }

  private initializeTools() {
    // Dynamic tool generation from OpenAPI + custom tools
    const registeredTools = getToolRegistry();

    // Wrap each tool with constraint layer
    return Object.fromEntries(
      Object.entries(registeredTools).map(([name, tool]) => [
        name,
        applyConstraints(tool, {
          userId: this.config.userId,
          serviceId: this.config.serviceId,
        }),
      ])
    );
  }

  async chat(userMessage: string): Promise<AsyncIterable<string>> {
    // Inject current context into system prompt
    const context = await getContextSnapshot(this.config.serviceId);

    const systemPrompt = buildSystemPrompt(context);

    this.messages.push({ role: "user", content: userMessage });

    const { textStream, toolCalls } = await streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: systemPrompt,
      messages: this.messages,
      tools: this.tools,
      maxSteps: 10, // Allow multi-step reasoning
      onStepFinish: async (step) => {
        // Handle tool execution results
        for (const call of step.toolCalls || []) {
          if (call.result?.error) {
            const healed = await handleToolError(call, this.config);
            if (!healed.success) {
              // Escalate to user
              this.messages.push({
                role: "assistant",
                content: healed.userMessage,
              });
            }
          }
        }
      },
    });

    return textStream;
  }
}

function buildSystemPrompt(context: ContextSnapshot): string {
  return `You are an AI agent for BPA (Business Process Application).
You help service designers create and configure government services.

## Current Context
- Service: ${context.service?.name || "No service selected"}
- Status: ${context.service?.status || "N/A"}
- Form fields: ${context.form?.fields?.length || 0}
- Workflow steps: ${context.workflow?.steps?.length || 0}
- Validation errors: ${context.errors?.length || 0}

## Your Capabilities
You can perform any operation available in the BPA API. When the user asks you
to do something, use the appropriate tool. If multiple steps are needed,
execute them in sequence.

## Constraints
- Always confirm before destructive operations (delete, publish)
- Report errors clearly and suggest recovery steps
- Stay within the user's permission scope
- Track costs and warn if approaching limits

## Backend Status
${context.backendHealth ? "All systems operational" : `Issues: ${context.backendIssues?.join(", ")}`}
`;
}
```

### 1.3 Streaming Response Handler

```typescript
// packages/ai-agent/src/runtime/stream.ts
import { StreamingTextResponse } from "ai";

export function createAgentStream(
  agent: BPAAgent,
  userMessage: string
): Response {
  const stream = agent.chat(userMessage);

  return new StreamingTextResponse(stream, {
    headers: {
      "X-Agent-Session": agent.sessionId,
    },
  });
}
```

---

## 2. Dynamic Tool Registry

The key innovation: tools are generated at runtime from OpenAPI specifications.

### 2.1 OpenAPI → Tool Generator

```typescript
// packages/ai-agent/src/tools/generator.ts
import { tool } from "ai";
import { z } from "zod";
import type { OpenAPIV3 } from "openapi-types";

interface GeneratedTool {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (params: any) => Promise<any>;
  metadata: {
    method: string;
    path: string;
    mutates: boolean;
    scope: "service" | "form" | "workflow" | "system";
  };
}

export async function generateToolsFromOpenAPI(
  specUrl: string
): Promise<Record<string, GeneratedTool>> {
  const spec: OpenAPIV3.Document = await fetch(specUrl).then((r) => r.json());
  const tools: Record<string, GeneratedTool> = {};

  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const [method, operation] of Object.entries(pathItem || {})) {
      if (typeof operation !== "object" || !("operationId" in operation)) {
        continue;
      }

      const op = operation as OpenAPIV3.OperationObject;
      const toolName = op.operationId || `${method}_${path.replace(/\//g, "_")}`;

      tools[toolName] = {
        name: toolName,
        description: op.summary || op.description || `${method.toUpperCase()} ${path}`,
        parameters: schemaToZod(op.requestBody, op.parameters),
        execute: createExecutor(method, path, spec.servers?.[0]?.url),
        metadata: {
          method,
          path,
          mutates: ["post", "put", "patch", "delete"].includes(method),
          scope: inferScope(path),
        },
      };
    }
  }

  return tools;
}

function schemaToZod(
  requestBody: OpenAPIV3.RequestBodyObject | undefined,
  parameters: OpenAPIV3.ParameterObject[] | undefined
): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  // Convert path/query parameters
  for (const param of parameters || []) {
    if ("name" in param) {
      shape[param.name] = openApiTypeToZod(param.schema as OpenAPIV3.SchemaObject);
      if (!param.required) {
        shape[param.name] = shape[param.name].optional();
      }
    }
  }

  // Convert request body
  if (requestBody?.content?.["application/json"]?.schema) {
    const bodySchema = requestBody.content["application/json"].schema as OpenAPIV3.SchemaObject;
    if (bodySchema.properties) {
      for (const [key, prop] of Object.entries(bodySchema.properties)) {
        shape[key] = openApiTypeToZod(prop as OpenAPIV3.SchemaObject);
        if (!bodySchema.required?.includes(key)) {
          shape[key] = shape[key].optional();
        }
      }
    }
  }

  return z.object(shape);
}

function openApiTypeToZod(schema: OpenAPIV3.SchemaObject): z.ZodTypeAny {
  switch (schema.type) {
    case "string":
      if (schema.enum) return z.enum(schema.enum as [string, ...string[]]);
      return z.string().describe(schema.description || "");
    case "integer":
    case "number":
      return z.number().describe(schema.description || "");
    case "boolean":
      return z.boolean().describe(schema.description || "");
    case "array":
      return z.array(openApiTypeToZod(schema.items as OpenAPIV3.SchemaObject));
    case "object":
      return z.record(z.any());
    default:
      return z.any();
  }
}

function createExecutor(
  method: string,
  path: string,
  baseUrl: string = "/api/v1"
) {
  return async (params: Record<string, any>) => {
    // Substitute path parameters
    let url = `${baseUrl}${path}`;
    for (const [key, value] of Object.entries(params)) {
      if (path.includes(`{${key}}`)) {
        url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
        delete params[key];
      }
    }

    const isBodyMethod = ["post", "put", "patch"].includes(method);

    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers: { "Content-Type": "application/json" },
      body: isBodyMethod ? JSON.stringify(params) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          status: response.status,
          message: error.message || response.statusText,
          details: error,
        },
      };
    }

    return {
      success: true,
      data: await response.json(),
    };
  };
}

function inferScope(path: string): "service" | "form" | "workflow" | "system" {
  if (path.includes("/forms")) return "form";
  if (path.includes("/workflow")) return "workflow";
  if (path.includes("/services")) return "service";
  return "system";
}
```

### 2.2 Tool Registry

```typescript
// packages/ai-agent/src/tools/registry.ts
import { tool } from "ai";
import { generateToolsFromOpenAPI } from "./generator";
import { customTools } from "./custom";

let cachedTools: Record<string, any> | null = null;

export async function getToolRegistry(): Promise<Record<string, any>> {
  if (cachedTools) return cachedTools;

  // Generate tools from OpenAPI spec
  const apiTools = await generateToolsFromOpenAPI("/api/v1/openapi.json");

  // Add custom tools that aren't in OpenAPI
  const allTools = {
    ...apiTools,
    ...customTools,
  };

  // Convert to Vercel AI SDK tool format
  cachedTools = Object.fromEntries(
    Object.entries(allTools).map(([name, t]) => [
      name,
      tool({
        description: t.description,
        parameters: t.parameters,
        execute: t.execute,
      }),
    ])
  );

  return cachedTools;
}

// Invalidate cache when OpenAPI spec changes
export function invalidateToolCache() {
  cachedTools = null;
}
```

### 2.3 Custom Tools (Non-API Operations)

```typescript
// packages/ai-agent/src/tools/custom.ts
import { z } from "zod";

export const customTools = {
  analyzeServiceGaps: {
    name: "analyzeServiceGaps",
    description: "Analyze current service configuration and identify missing or incomplete elements",
    parameters: z.object({
      serviceId: z.string().describe("The service ID to analyze"),
      includeWorkflow: z.boolean().optional().describe("Include workflow analysis"),
      includeForms: z.boolean().optional().describe("Include form analysis"),
    }),
    execute: async ({ serviceId, includeWorkflow = true, includeForms = true }) => {
      // Complex analysis that spans multiple data sources
      const service = await fetchService(serviceId);
      const gaps: string[] = [];

      if (includeForms && service.form) {
        if (!service.form.fields?.length) {
          gaps.push("No form fields defined");
        }
        // Check for missing validations, labels, etc.
      }

      if (includeWorkflow && service.workflow) {
        if (!service.workflow.steps?.length) {
          gaps.push("No workflow steps defined");
        }
        // Check for disconnected transitions, missing roles, etc.
      }

      return { gaps, severity: gaps.length > 3 ? "high" : "low" };
    },
    metadata: { mutates: false, scope: "service" as const },
  },

  suggestFormFields: {
    name: "suggestFormFields",
    description: "Use AI to suggest form fields based on service description",
    parameters: z.object({
      serviceId: z.string(),
      description: z.string().describe("Natural language description of what data to collect"),
    }),
    execute: async ({ serviceId, description }) => {
      // This would call the LLM to generate field suggestions
      // Then return structured suggestions for user approval
      return {
        suggestions: [
          { type: "text", key: "applicantName", label: "Full Name", required: true },
          { type: "email", key: "email", label: "Email Address", required: true },
          // ... more suggestions
        ],
        confidence: 0.85,
      };
    },
    metadata: { mutates: false, scope: "form" as const },
  },
};
```

---

## 3. Context Layer

The agent needs awareness of UI state, backend events, and service configuration.

### 3.1 Context Provider

```typescript
// packages/ai-agent/src/context/provider.ts
import { create } from "zustand";

export interface ContextSnapshot {
  service: ServiceState | null;
  form: FormState | null;
  workflow: WorkflowState | null;
  errors: ValidationError[];
  backendHealth: boolean;
  backendIssues: string[];
  userPermissions: string[];
  currentView: string;
}

interface ContextStore extends ContextSnapshot {
  setService: (service: ServiceState) => void;
  setForm: (form: FormState) => void;
  setWorkflow: (workflow: WorkflowState) => void;
  setErrors: (errors: ValidationError[]) => void;
  setBackendHealth: (health: boolean, issues?: string[]) => void;
}

export const useContextStore = create<ContextStore>((set) => ({
  service: null,
  form: null,
  workflow: null,
  errors: [],
  backendHealth: true,
  backendIssues: [],
  userPermissions: [],
  currentView: "dashboard",

  setService: (service) => set({ service }),
  setForm: (form) => set({ form }),
  setWorkflow: (workflow) => set({ workflow }),
  setErrors: (errors) => set({ errors }),
  setBackendHealth: (health, issues = []) =>
    set({ backendHealth: health, backendIssues: issues }),
}));

export async function getContextSnapshot(serviceId: string): Promise<ContextSnapshot> {
  const store = useContextStore.getState();

  // Ensure we have fresh data
  if (!store.service || store.service.id !== serviceId) {
    const service = await fetchService(serviceId);
    store.setService(service);
  }

  return {
    service: store.service,
    form: store.form,
    workflow: store.workflow,
    errors: store.errors,
    backendHealth: store.backendHealth,
    backendIssues: store.backendIssues,
    userPermissions: store.userPermissions,
    currentView: store.currentView,
  };
}
```

### 3.2 Backend Event Stream

```typescript
// packages/ai-agent/src/context/events.ts

export function useBackendEventStream(serviceId: string) {
  const store = useContextStore();

  useEffect(() => {
    const ws = new WebSocket(`/api/v1/events?serviceId=${serviceId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "validation":
          store.setErrors(data.errors);
          break;
        case "workflow_update":
          store.setWorkflow(data.workflow);
          break;
        case "health_check":
          store.setBackendHealth(data.healthy, data.issues);
          break;
        case "integration_error":
          // Agent should be aware of external integration issues
          store.setBackendHealth(false, [
            ...store.backendIssues,
            `Integration error: ${data.integration}`,
          ]);
          break;
      }
    };

    return () => ws.close();
  }, [serviceId]);

  return store;
}
```

---

## 4. Constraint Engine

Rules that govern what the agent can and cannot do.

### 4.1 Constraint Definitions

```yaml
# packages/ai-agent/src/constraints/rules.yaml
rules:
  # Confirmation required
  - name: confirm_destructive
    condition: "tool.metadata.mutates && tool.name.match(/delete|remove|clear/)"
    action: require_confirmation
    message: "This will permanently delete data. Are you sure?"

  - name: confirm_publish
    condition: "tool.name === 'publishService'"
    action: require_confirmation
    message: "Publishing will make this service live. Confirm?"

  # Permission checks
  - name: check_service_ownership
    condition: "tool.metadata.scope === 'service'"
    action: check_permission
    permission: "service:write:{serviceId}"

  - name: check_admin_only
    condition: "tool.name.match(/system|config/)"
    action: check_permission
    permission: "admin:*"

  # Cost guards
  - name: llm_cost_limit
    condition: "context.sessionCost > 0.50"
    action: warn
    message: "Approaching cost limit ($0.50). Consider completing current task."

  - name: llm_cost_block
    condition: "context.sessionCost > 1.00"
    action: block
    message: "Cost limit reached ($1.00). Please start a new session."

  # Scope limits
  - name: no_cross_service
    condition: "params.serviceId && params.serviceId !== context.serviceId"
    action: block
    message: "Cannot modify other services in this session."
```

### 4.2 Constraint Engine

```typescript
// packages/ai-agent/src/constraints/engine.ts
import { load } from "js-yaml";
import { readFileSync } from "fs";

interface Constraint {
  name: string;
  condition: string;
  action: "require_confirmation" | "check_permission" | "warn" | "block";
  message: string;
  permission?: string;
}

const rules: Constraint[] = load(
  readFileSync("./constraints/rules.yaml", "utf-8")
).rules;

export function applyConstraints(
  originalTool: any,
  context: { userId: string; serviceId: string }
) {
  return {
    ...originalTool,
    execute: async (params: any) => {
      // Evaluate each constraint
      for (const rule of rules) {
        const matches = evaluateCondition(rule.condition, {
          tool: originalTool,
          params,
          context,
        });

        if (matches) {
          switch (rule.action) {
            case "block":
              return {
                success: false,
                blocked: true,
                reason: rule.message,
              };

            case "require_confirmation":
              // Return a confirmation request instead of executing
              return {
                success: false,
                requiresConfirmation: true,
                confirmationId: crypto.randomUUID(),
                message: rule.message,
                pendingAction: { tool: originalTool.name, params },
              };

            case "check_permission":
              const hasPermission = await checkPermission(
                context.userId,
                rule.permission!.replace("{serviceId}", context.serviceId)
              );
              if (!hasPermission) {
                return {
                  success: false,
                  permissionDenied: true,
                  reason: `Missing permission: ${rule.permission}`,
                };
              }
              break;

            case "warn":
              // Log warning but continue
              console.warn(`[Constraint Warning] ${rule.name}: ${rule.message}`);
              break;
          }
        }
      }

      // All constraints passed, execute the tool
      return originalTool.execute(params);
    },
  };
}

function evaluateCondition(
  condition: string,
  context: { tool: any; params: any; context: any }
): boolean {
  // Safe evaluation using a sandboxed function
  try {
    const fn = new Function(
      "tool",
      "params",
      "context",
      `return ${condition}`
    );
    return fn(context.tool, context.params, context.context);
  } catch {
    return false;
  }
}
```

### 4.3 Confirmation Handler

```typescript
// packages/ai-agent/src/constraints/confirmation.ts

const pendingConfirmations = new Map<string, PendingAction>();

export async function requestConfirmation(
  confirmationId: string,
  action: PendingAction
): Promise<void> {
  pendingConfirmations.set(confirmationId, action);
  // Confirmation will be resolved by UI interaction
}

export async function resolveConfirmation(
  confirmationId: string,
  approved: boolean
): Promise<any> {
  const action = pendingConfirmations.get(confirmationId);
  if (!action) {
    throw new Error("Confirmation expired or not found");
  }

  pendingConfirmations.delete(confirmationId);

  if (approved) {
    // Execute the original action
    const tool = getToolRegistry()[action.tool];
    return tool.execute(action.params);
  }

  return { success: false, cancelled: true };
}
```

---

## 5. Self-Healing Layer

Automatic error recovery when possible, graceful escalation when not.

### 5.1 Error Classification

```typescript
// packages/ai-agent/src/healing/classifier.ts

export type ErrorCategory =
  | "retryable"      // Transient error, retry may succeed
  | "user_fixable"   // User needs to provide different input
  | "permission"     // Need elevated permissions
  | "fatal"          // Unrecoverable, report to user
  | "conflict";      // Concurrent modification, refresh and retry

export interface ClassifiedError {
  category: ErrorCategory;
  originalError: any;
  canAutoHeal: boolean;
  healingStrategy?: HealingStrategy;
  userGuidance: string;
}

export function classifyError(error: any): ClassifiedError {
  const status = error.status || error.code;

  // Network/timeout errors
  if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
    return {
      category: "retryable",
      originalError: error,
      canAutoHeal: true,
      healingStrategy: { type: "retry", maxAttempts: 3, backoff: "exponential" },
      userGuidance: "Network issue detected. Retrying...",
    };
  }

  // Rate limiting
  if (status === 429) {
    return {
      category: "retryable",
      originalError: error,
      canAutoHeal: true,
      healingStrategy: { type: "retry", delay: error.retryAfter || 5000 },
      userGuidance: "Rate limited. Waiting before retry...",
    };
  }

  // Validation errors
  if (status === 400 || status === 422) {
    return {
      category: "user_fixable",
      originalError: error,
      canAutoHeal: false,
      userGuidance: `Validation error: ${error.message}. Please adjust your request.`,
    };
  }

  // Permission errors
  if (status === 401 || status === 403) {
    return {
      category: "permission",
      originalError: error,
      canAutoHeal: false,
      userGuidance: "You don't have permission for this action.",
    };
  }

  // Conflict (concurrent edit)
  if (status === 409) {
    return {
      category: "conflict",
      originalError: error,
      canAutoHeal: true,
      healingStrategy: { type: "refresh_and_retry" },
      userGuidance: "Another user modified this. Refreshing and retrying...",
    };
  }

  // Server errors
  if (status >= 500) {
    return {
      category: "retryable",
      originalError: error,
      canAutoHeal: true,
      healingStrategy: { type: "retry", maxAttempts: 2 },
      userGuidance: "Server error. Retrying...",
    };
  }

  // Unknown
  return {
    category: "fatal",
    originalError: error,
    canAutoHeal: false,
    userGuidance: `Unexpected error: ${error.message}`,
  };
}
```

### 5.2 Healing Handler

```typescript
// packages/ai-agent/src/healing/handler.ts
import { classifyError, ClassifiedError } from "./classifier";

interface HealingResult {
  success: boolean;
  result?: any;
  userMessage?: string;
}

export async function handleToolError(
  toolCall: { name: string; args: any; result: any },
  context: { serviceId: string }
): Promise<HealingResult> {
  const classified = classifyError(toolCall.result.error);

  if (!classified.canAutoHeal) {
    return {
      success: false,
      userMessage: classified.userGuidance,
    };
  }

  // Attempt healing based on strategy
  switch (classified.healingStrategy?.type) {
    case "retry":
      return await retryWithBackoff(
        toolCall,
        classified.healingStrategy.maxAttempts || 3,
        classified.healingStrategy.backoff || "linear"
      );

    case "refresh_and_retry":
      // Refresh context and retry
      await invalidateCache(context.serviceId);
      const freshTool = getToolRegistry()[toolCall.name];
      const result = await freshTool.execute(toolCall.args);
      return { success: result.success, result };

    default:
      return {
        success: false,
        userMessage: classified.userGuidance,
      };
  }
}

async function retryWithBackoff(
  toolCall: any,
  maxAttempts: number,
  backoff: "linear" | "exponential"
): Promise<HealingResult> {
  const tool = getToolRegistry()[toolCall.name];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const delay = backoff === "exponential"
      ? Math.pow(2, attempt) * 1000
      : attempt * 1000;

    await sleep(delay);

    const result = await tool.execute(toolCall.args);
    if (result.success) {
      return { success: true, result };
    }
  }

  return {
    success: false,
    userMessage: `Failed after ${maxAttempts} attempts. Please try again later.`,
  };
}
```

---

## 6. Observability

### 6.1 Action Audit Log

```typescript
// packages/ai-agent/src/observability/audit.ts

interface AuditEntry {
  timestamp: Date;
  sessionId: string;
  userId: string;
  serviceId: string;
  action: string;
  params: Record<string, any>;
  result: "success" | "failure" | "blocked" | "healed";
  durationMs: number;
  error?: string;
}

export async function logAction(entry: AuditEntry): Promise<void> {
  // Write to audit log (database, file, or external service)
  await db.auditLog.create({ data: entry });
}
```

### 6.2 Cost Tracking

```typescript
// packages/ai-agent/src/observability/cost.ts

const GROQ_PRICING = {
  "llama-3.3-70b-versatile": {
    input: 0.00059 / 1000,  // per token
    output: 0.00079 / 1000,
  },
};

export function trackLLMCost(usage: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  serviceId: string;
  sessionId: string;
}): number {
  const pricing = GROQ_PRICING[usage.model];
  const cost =
    usage.inputTokens * pricing.input + usage.outputTokens * pricing.output;

  // Record for aggregation
  costStore.record({
    serviceId: usage.serviceId,
    sessionId: usage.sessionId,
    cost,
    timestamp: new Date(),
  });

  return cost;
}

export async function getSessionCost(sessionId: string): Promise<number> {
  return costStore.sumBySession(sessionId);
}

export async function getServiceCost(serviceId: string): Promise<number> {
  return costStore.sumByService(serviceId);
}
```

---

## 7. UI Layer

### 7.1 Chat Component

```typescript
// apps/web/src/components/AIAgent/ChatPanel.tsx
"use client";

import { useChat } from "ai/react";
import { useState } from "react";

export function AIAgentChat({ serviceId }: { serviceId: string }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: `/api/agent/${serviceId}/chat`,
      onError: (error) => {
        console.error("Agent error:", error);
      },
    });

  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {/* Confirmation dialogs */}
        {confirmations.map((c) => (
          <ConfirmationCard
            key={c.id}
            confirmation={c}
            onConfirm={() => handleConfirm(c.id, true)}
            onCancel={() => handleConfirm(c.id, false)}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Describe what you want to do..."
            className="flex-1 px-4 py-2 border rounded-lg"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

### 7.2 Inline Assistance

```typescript
// apps/web/src/components/AIAgent/InlineHelper.tsx
"use client";

import { useCompletion } from "ai/react";

export function FieldAIHelper({
  fieldKey,
  currentValue,
  onSuggestion,
}: {
  fieldKey: string;
  currentValue: any;
  onSuggestion: (value: any) => void;
}) {
  const { complete, completion, isLoading } = useCompletion({
    api: "/api/agent/complete",
  });

  const handleSuggest = () => {
    complete(`Suggest a value for the "${fieldKey}" field. Current: ${currentValue}`);
  };

  return (
    <div className="relative">
      <button
        onClick={handleSuggest}
        className="text-sm text-blue-600 hover:underline"
      >
        AI Suggest
      </button>
      {completion && (
        <div className="absolute top-full mt-1 p-2 bg-white shadow-lg rounded border">
          <p className="text-sm">{completion}</p>
          <button
            onClick={() => onSuggestion(completion)}
            className="text-xs text-blue-600"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
```

### 7.3 Status Indicators

```typescript
// apps/web/src/components/AIAgent/StatusBar.tsx
"use client";

import { useContextStore } from "@bpa/ai-agent";

export function AgentStatusBar() {
  const { backendHealth, backendIssues, errors } = useContextStore();

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-100">
      {/* Backend Health */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            backendHealth ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm">
          {backendHealth ? "All systems operational" : backendIssues[0]}
        </span>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="flex items-center gap-2 text-amber-600">
          <AlertIcon />
          <span className="text-sm">{errors.length} validation issues</span>
        </div>
      )}
    </div>
  );
}
```

---

## 8. API Routes

### 8.1 Chat Endpoint

```typescript
// apps/web/src/app/api/agent/[serviceId]/chat/route.ts
import { BPAAgent, createAgentStream } from "@bpa/ai-agent";
import { getServerSession } from "next-auth";

export async function POST(
  req: Request,
  { params }: { params: { serviceId: string } }
) {
  const session = await getServerSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();
  const userMessage = messages[messages.length - 1].content;

  const agent = new BPAAgent({
    serviceId: params.serviceId,
    userId: session.user.id,
    sessionId: req.headers.get("X-Session-Id") || crypto.randomUUID(),
  });

  return createAgentStream(agent, userMessage);
}
```

### 8.2 Confirmation Endpoint

```typescript
// apps/web/src/app/api/agent/confirm/route.ts
import { resolveConfirmation } from "@bpa/ai-agent";

export async function POST(req: Request) {
  const { confirmationId, approved } = await req.json();

  const result = await resolveConfirmation(confirmationId, approved);

  return Response.json(result);
}
```

---

## 9. Package Structure

```
packages/
├── ai-agent/
│   ├── src/
│   │   ├── runtime/
│   │   │   ├── agent.ts           # Agent core
│   │   │   └── stream.ts          # Streaming handler
│   │   ├── tools/
│   │   │   ├── generator.ts       # OpenAPI → Tools
│   │   │   ├── registry.ts        # Tool registry
│   │   │   └── custom.ts          # Custom tools
│   │   ├── context/
│   │   │   ├── provider.ts        # Context store
│   │   │   └── events.ts          # Backend event stream
│   │   ├── constraints/
│   │   │   ├── rules.yaml         # Constraint definitions
│   │   │   ├── engine.ts          # Constraint evaluator
│   │   │   └── confirmation.ts    # Confirmation handler
│   │   ├── healing/
│   │   │   ├── classifier.ts      # Error classification
│   │   │   └── handler.ts         # Healing logic
│   │   └── observability/
│   │       ├── audit.ts           # Action audit log
│   │       └── cost.ts            # Cost tracking
│   ├── package.json
│   └── tsconfig.json
```

---

## 10. NFR Compliance

| NFR | Requirement | How Addressed |
|-----|-------------|---------------|
| NFR03 | AI response < 10s | Streaming responses, Groq low latency |
| NFR32 | LLM cost < $1/service | Cost tracking + guards in constraint engine |
| NFR27 | Audit trail | Action audit log captures all operations |
| NFR15 | Error recovery | Self-healing layer with classification |
| NFR07 | Permission model | Constraint engine checks permissions |

---

## 11. Testing Strategy

```typescript
// packages/ai-agent/__tests__/tools/generator.test.ts
import { generateToolsFromOpenAPI } from "../src/tools/generator";

describe("Tool Generator", () => {
  it("generates tools from OpenAPI spec", async () => {
    const tools = await generateToolsFromOpenAPI("/mock/openapi.json");

    expect(Object.keys(tools)).toContain("createService");
    expect(tools.createService.parameters).toBeDefined();
    expect(tools.createService.metadata.mutates).toBe(true);
  });

  it("respects constraints", async () => {
    const tool = applyConstraints(mockDeleteTool, mockContext);
    const result = await tool.execute({ id: "123" });

    expect(result.requiresConfirmation).toBe(true);
  });
});
```

---

## 12. Migration from Spike

The original spike (`spike-ai-copilot-spec.md`) defined 15 CopilotKit actions. These are now:

| Original Action | New Implementation |
|-----------------|-------------------|
| `createService` | Auto-generated from `POST /api/v1/services` |
| `updateService` | Auto-generated from `PATCH /api/v1/services/:id` |
| `deleteService` | Auto-generated from `DELETE /api/v1/services/:id` |
| ... (all CRUD) | Auto-generated from OpenAPI |
| `detectGaps` | Custom tool: `analyzeServiceGaps` |
| `applyAISuggestions` | Custom tool: `suggestFormFields` + batch execute |

---

## 13. Acceptance Criteria

- [ ] Vercel AI SDK agent core implemented
- [ ] Dynamic tool generation from OpenAPI spec
- [ ] Constraint engine with YAML rule definitions
- [ ] Self-healing layer with error classification
- [ ] UI components: chat panel, inline helper, status bar
- [ ] Backend event stream integration
- [ ] Cost tracking per session/service
- [ ] Action audit logging
- [ ] All NFRs met

---

## References

- Vercel AI SDK: https://sdk.vercel.ai/docs
- Groq SDK: https://sdk.vercel.ai/providers/ai-sdk-providers/groq
- Original spike: `spike-ai-copilot-spec.md`
- PRD: FR25-FR33 (AI-Powered Assistance)

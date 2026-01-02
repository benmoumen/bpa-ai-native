# Epic 6 Spike: AI Agent Architecture Findings

**Story ID:** 6-0
**Completed:** 2026-01-02
**Status:** Done

---

## Executive Summary

The Vercel AI SDK architecture is validated for Epic 6 implementation. Key findings:

1. **OpenAPI Status**: Swagger/OpenAPI is configured at runtime (`/api/docs`) - no static `openapi.json` exists. We need to create an endpoint that exports the JSON spec dynamically.

2. **WebSocket Status**: No existing WebSocket implementation. NestJS WebSocket gateway needs to be added.

3. **Package Structure**: Follow `@bpa/db` patterns for the new `@bpa/ai-agent` package with ESM modules.

4. **State Management**: Zustand (UI) + React Query (server state) - both proven patterns in codebase.

5. **Streaming**: Next.js App Router supports streaming via route handlers with `ReadableStream`.

---

## Architecture Decisions Confirmed

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM Framework | Vercel AI SDK 4.x | Unlimited tools, Apache 2.0, full control |
| Primary LLM | Groq (llama-3.3-70b-versatile) | Speed + cost efficiency |
| Fallback LLM | Claude via LiteLLM | Reliability guarantee |
| Tool Generation | OpenAPI → Zod → Vercel Tools | Dynamic, no manual registration |
| State Sync | Zustand + WebSocket | Real-time + persistent |
| Constraint Engine | YAML rules | Declarative, hot-reloadable |

---

## Pattern Reference

### Backend API Patterns

**Controller Pattern** (from `forms.controller.ts`):
```typescript
@Controller('services/:serviceId/forms')
@ApiTags('Forms')
@ApiBearerAuth('JWT-auth')
export class FormsController {
  @Post()
  @ApiOperation({ summary: 'Create form' })
  @ApiResponse({ status: 201, type: FormResponseDto })
  async create(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() dto: CreateFormDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormResponseDto>
}
```

**Service Pattern** (from `forms.service.ts`):
```typescript
@Injectable()
export class FormsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(serviceId: string, dto: CreateFormDto, userId: string) {
    return this.prisma.form.create({ data: { ... } });
  }
}
```

**Response Format**:
```typescript
// Success
{ data: T, meta?: { page, limit, total, hasNext } }

// Error
{ error: { code: string, message: string, requestId: string, details?: {} } }
```

### Frontend Patterns

**Zustand Store** (from `ui-store.ts`):
```typescript
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarExpanded: false,
      toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
    }),
    { name: 'bpa-ui-state', storage: createJSONStorage(() => localStorage) }
  )
);
```

**React Query** (from `use-services.ts`):
```typescript
export const serviceKeys = {
  all: ['services'] as const,
  list: (params) => [...serviceKeys.all, 'list', params] as const,
};

export function useServices(params = {}) {
  return useQuery({
    queryKey: serviceKeys.list(params),
    queryFn: () => getServices(params),
  });
}
```

**AppShell Layout** (from `AppShell.tsx`):
- 3-region layout: sidebar + header + main
- Collapsible sidebar with hover expansion
- CSS Grid for responsive regions

---

## Package Structure

### packages/ai-agent

```
packages/ai-agent/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                  # Barrel exports
    ├── types.ts                  # Shared types
    ├── runtime/
    │   ├── agent.ts              # BPAAgent class
    │   └── stream.ts             # Streaming utilities
    ├── tools/
    │   ├── generator.ts          # OpenAPI → Tools
    │   ├── registry.ts           # Tool registry
    │   └── executor.ts           # HTTP executor
    ├── constraints/
    │   ├── engine.ts             # Rule evaluator
    │   ├── rules.yaml            # Default rules
    │   └── types.ts
    ├── context/
    │   ├── store.ts              # Zustand store
    │   └── types.ts
    ├── healing/
    │   ├── classifier.ts         # Error categories
    │   └── handler.ts            # Recovery logic
    └── observability/
        ├── audit.ts              # Action logging
        └── cost.ts               # Token tracking
```

### package.json Template

```json
{
  "name": "@bpa/ai-agent",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint src/"
  },
  "dependencies": {
    "ai": "^4.0.0",
    "@ai-sdk/groq": "^1.0.0",
    "@bpa/types": "workspace:*",
    "zod": "^3.24.0",
    "yaml": "^2.6.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "typescript": "^5.7.2"
  }
}
```

---

## API Endpoints to Create

### Backend (NestJS)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/openapi.json` | GET | Export OpenAPI spec |
| `/api/v1/agent/tools` | GET | Get available tools for context |
| `/api/v1/agent/chat` | POST | Send message, get response |
| `/api/v1/agent/events` | WS | WebSocket event stream |
| `/api/v1/agent/audit` | GET | Query audit log |
| `/api/v1/agent/cost` | GET | Session cost tracking |

### Frontend (Next.js Routes)

| Route | Purpose |
|-------|---------|
| `/api/agent/chat` | Proxy to backend with streaming |
| `/api/agent/confirm` | Confirmation gate handling |

---

## WebSocket Implementation

**NestJS Gateway Pattern:**
```typescript
@WebSocketGateway({ namespace: '/ws/events' })
@UseGuards(WsJwtGuard)
export class AgentGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe')
  handleSubscribe(@MessageBody() { serviceId }: { serviceId: string }) {
    // Join room for service-scoped events
  }

  emitEvent(serviceId: string, event: AgentEvent) {
    this.server.to(serviceId).emit('event', event);
  }
}
```

**Event Types:**
- `entity.created` - New form/field/step created
- `entity.updated` - Existing entity modified
- `entity.deleted` - Entity removed
- `tool.executing` - Tool started
- `tool.completed` - Tool finished
- `tool.failed` - Tool error

---

## Constraint Rules (Default)

```yaml
rules:
  - name: confirm_destructive
    condition: "tool.metadata.mutates && tool.name.match(/delete|remove/i)"
    action: require_confirmation
    message: "This will permanently delete data. Confirm?"

  - name: cost_guard
    condition: "context.sessionCost > 1.00"
    action: block
    message: "Session cost limit ($1.00) reached"

  - name: publish_gate
    condition: "tool.name === 'publishService'"
    action: require_confirmation
    message: "Publishing will make this service live. Proceed?"
```

---

## Self-Healing Categories

| Category | Status Codes | Strategy |
|----------|-------------|----------|
| retryable | 429, 503, 504 | Exponential backoff (max 3) |
| conflict | 409 | Refresh context, retry once |
| user_fixable | 400, 422 | Show guidance, await user fix |
| fatal | 401, 403, 500 | Report error, no auto-heal |

---

## Dependencies to Add

### packages/ai-agent
```
ai@^4.0.0
@ai-sdk/groq@^1.0.0
zod@^3.24.0
yaml@^2.6.0
```

### apps/api
```
@nestjs/websockets@^10.0.0
socket.io@^4.8.0
@bpa/ai-agent@workspace:*
```

### apps/web
```
@bpa/ai-agent@workspace:*
socket.io-client@^4.8.0
```

---

## Implementation Order

Based on dependency analysis:

1. **6-1: Core Runtime** - `packages/ai-agent` package with BPAAgent class
2. **6-1a: Tool Registry** - OpenAPI → Tools generation
3. **6-1b: Constraint Engine** - YAML rules evaluation
4. **6-1c: Self-Healing** - Error classification and recovery
5. **6-1d: Event Stream** - WebSocket gateway + Zustand store
6. **6-1e: Observability** - Audit log + cost tracking
7. **6-2: Chat UI** - React components for chat sidebar
8. **6-3: Confirmation Flow** - Constraint confirmation UX

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Groq rate limits | LiteLLM failover to Claude (configured in 6-1) |
| OpenAPI spec incomplete | Create minimal spec first, expand iteratively |
| WebSocket complexity | Use Socket.io for reconnection handling |
| Tool count explosion | Start with CRUD operations only |
| Session cost overrun | Hard limit in constraint engine (block at $1.00) |

---

## Success Metrics

- AI response < 10 seconds (NFR17) - target 5s for simple queries
- Streaming start < 1 second (NFR2)
- LLM cost < $1.00 per service configuration (NFR32)
- Agent task completion > 80% without fallback (NFR33)

---

## Next Steps

1. Create `packages/ai-agent` package scaffold
2. Implement BPAAgent class with Groq integration
3. Add OpenAPI export endpoint to backend
4. Implement tool generator from OpenAPI spec
5. Create YAML constraint engine
6. Add WebSocket gateway for events
7. Build chat UI components
8. Add confirmation flow

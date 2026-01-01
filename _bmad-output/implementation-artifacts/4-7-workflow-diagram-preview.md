# Story 4.7: Workflow Diagram Preview

> **Epic**: 4 - Workflow Configuration
> **Story ID**: 4-7
> **Status**: done
> **Priority**: Deferrable (Nice-to-have visualization)
> **Effort**: 5-8 points
> **Created**: 2026-01-01

---

## Story

As a **Service Designer**,
I want to preview the complete workflow as a visual diagram,
So that I can verify the approval flow is correct.

---

## Acceptance Criteria

### AC1: Visual Flowchart Display

**Given** a workflow is configured (has roles with statuses and transitions)
**When** the Service Designer clicks "Preview Diagram"
**Then** a visual flowchart is displayed showing:
- All roles as nodes
- RoleStatus outcomes as edge sources
- WorkflowTransitions as directed edges
- Status labels on edges (PASSED, RETURNED, etc.)
- Role type indicators on nodes (USER vs BOT icons)

### AC2: Node Tooltips

**Given** the diagram is displayed
**When** the Service Designer hovers over a node
**Then** a tooltip shows:
- Role name and type (USER/BOT)
- Assigned form name (if any)
- Available status outcomes
- Actor type (APPLICANT/OPERATOR/SYSTEM)

### AC3: Zoom and Pan Controls

**Given** the diagram is complex (many roles/transitions)
**When** it exceeds the viewport
**Then** zoom and pan controls are available
**And** mouse wheel zooms in/out
**And** drag pans the viewport

### AC4: Minimap Navigation

**Given** a complex diagram with many nodes
**When** displayed in the preview
**Then** a minimap shows the full workflow
**And** clicking the minimap navigates to that area

### AC5: Conditional Transition Labels

**Given** transitions have conditions (determinant-based routing)
**When** displayed in the diagram
**Then** condition summaries are shown as labels on edges
**And** branching paths are visually distinct

---

## Tasks / Subtasks

- [x] **Task 1: Install React Flow library** (AC: 1, 3, 4)
  - [x] 1.1 Add `@xyflow/react` to web package
  - [x] 1.2 Configure for React 19 compatibility
  - [x] 1.3 Set up basic flow container component

- [x] **Task 2: Create API endpoint for workflow graph data** (AC: 1, 5)
  - [x] 2.1 Add `GET /api/services/:serviceId/workflow-graph` endpoint
  - [x] 2.2 Return nodes (roles) and edges (transitions) in React Flow format
  - [x] 2.3 Include role metadata (form, statuses, actorType)
  - [x] 2.4 Include transition conditions summary

- [x] **Task 3: Build WorkflowDiagram component** (AC: 1, 2)
  - [x] 3.1 Create `WorkflowDiagram.tsx` client component
  - [x] 3.2 Implement custom RoleNode component with type icons
  - [x] 3.3 Add tooltip on hover with role details
  - [x] 3.4 Style edges with status colors (green=PASSED, red=REJECTED, yellow=RETURNED)

- [x] **Task 4: Add zoom/pan and minimap** (AC: 3, 4)
  - [x] 4.1 Enable React Flow controls (zoom, pan, fitView)
  - [x] 4.2 Add MiniMap component
  - [x] 4.3 Configure keyboard shortcuts (zoom +/-, fit view)

- [x] **Task 5: Integrate into service edit page** (AC: 1-5)
  - [x] 5.1 Add "Preview Diagram" button to workflow tab
  - [x] 5.2 Show diagram in modal or side panel
  - [x] 5.3 Add loading state with skeleton

- [x] **Task 6: Handle edge cases** (AC: 1-5)
  - [x] 6.1 Empty workflow (no roles) → show "Add roles to see diagram"
  - [x] 6.2 Roles without transitions → show orphan nodes
  - [x] 6.3 Layout algorithm for automatic node positioning

---

## Dev Notes

### Technology Choice: React Flow

**Library**: `@xyflow/react` v12+ (formerly react-flow-renderer)
- Most popular React library for node-based diagrams
- Built-in zoom, pan, minimap, controls
- Custom node/edge components supported
- MIT licensed, actively maintained
- Works with React 19

**Installation**:
```bash
pnpm --filter web add @xyflow/react
```

### Existing Models

The workflow data comes from these Prisma models:

```
Role (packages/db/prisma/schema.prisma:432)
├── id, name, roleType (USER|BOT), actorType (APPLICANT|OPERATOR|SYSTEM)
├── formId (optional assigned form)
├── isStartRole (entry point marker)
└── statuses: RoleStatus[]

RoleStatus (packages/db/prisma/schema.prisma:477)
├── id, roleId, code (PENDING|PASSED|RETURNED|REJECTED)
├── name (display label)
└── transitions: WorkflowTransition[]

WorkflowTransition (packages/db/prisma/schema.prisma:499)
├── id, fromStatusId, toRoleId
├── conditions (JSON - determinant-based routing)
└── sortOrder
```

### Graph Data Shape (API Response)

```typescript
interface WorkflowGraphResponse {
  nodes: {
    id: string;           // roleId
    type: 'roleNode';     // custom node type
    data: {
      name: string;
      roleType: 'USER' | 'BOT';
      actorType: 'APPLICANT' | 'OPERATOR' | 'SYSTEM';
      formName?: string;
      statuses: { id: string; code: string; name: string }[];
      isStartRole: boolean;
    };
    position: { x: number; y: number }; // auto-layout
  }[];
  edges: {
    id: string;           // transitionId
    source: string;       // fromStatusId (composite: roleId-statusId)
    target: string;       // toRoleId
    label: string;        // status code (PASSED, RETURNED, etc.)
    data: {
      statusCode: 'PASSED' | 'RETURNED' | 'REJECTED';
      conditionSummary?: string;
    };
  }[];
}
```

### Layout Algorithm

Use `dagre` layout (included in react-flow ecosystem):
```typescript
import dagre from 'dagre';

const layoutGraph = (nodes, edges) => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 100, ranksep: 150 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach(n => g.setNode(n.id, { width: 200, height: 100 }));
  edges.forEach(e => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map(n => ({
    ...n,
    position: { x: g.node(n.id).x, y: g.node(n.id).y }
  }));
};
```

### Project Structure Notes

```
apps/web/src/
├── components/
│   └── workflow/
│       ├── WorkflowDiagram.tsx      # Main diagram component
│       ├── RoleNode.tsx             # Custom node renderer
│       ├── TransitionEdge.tsx       # Custom edge with status colors
│       └── WorkflowTooltip.tsx      # Hover tooltip component
├── lib/api/
│   └── workflow-graph.ts            # API client for graph endpoint
└── hooks/
    └── use-workflow-graph.ts        # React Query hook

apps/api/src/
└── roles/
    └── roles.controller.ts          # Add getWorkflowGraph endpoint
```

### Edge Color Scheme (4-Status Model)

| Status | Color | Meaning |
|--------|-------|---------|
| PENDING | Gray | Waiting (not shown as transition) |
| PASSED | Green (#22c55e) | Approved, moves forward |
| RETURNED | Yellow (#eab308) | Sent back for revision |
| REJECTED | Red (#ef4444) | Terminal rejection |

### References

- [React Flow Documentation](https://reactflow.dev)
- [Dagre Layout Algorithm](https://github.com/dagrejs/dagre)
- [Source: epics.md#Story-4.7](../_bmad-output/project-planning-artifacts/epics.md)
- [Source: epic-4.yaml](../_bmad-output/epic-contexts/epic-4.yaml)
- [Schema: packages/db/prisma/schema.prisma](../../packages/db/prisma/schema.prisma)

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (create-story workflow)

### Completion Notes List

- Story file created from Epic 4 context and epics.md
- React Flow chosen as visualization library (industry standard)
- Dagre layout algorithm recommended for auto-positioning
- API endpoint pattern follows existing roles module structure
- 4-Status Model color scheme defined

### File List

**Backend (API)**:
- `apps/api/src/roles/dto/workflow-graph.dto.ts` - NEW: DTOs for React Flow graph data
- `apps/api/src/roles/dto/index.ts` - MODIFIED: Export new DTOs
- `apps/api/src/roles/roles.service.ts` - MODIFIED: Added getWorkflowGraph method
- `apps/api/src/roles/roles.controller.ts` - MODIFIED: Added workflow-graph endpoint

**Frontend (Web)**:
- `apps/web/src/components/workflow/RoleNode.tsx` - NEW: Custom React Flow node component
- `apps/web/src/components/workflow/WorkflowDiagram.tsx` - NEW: Main diagram component with Controls/MiniMap
- `apps/web/src/components/workflow/index.ts` - MODIFIED: Export new components
- `apps/web/src/lib/api/roles.ts` - MODIFIED: Added WorkflowGraph types and API client
- `apps/web/src/hooks/use-roles.ts` - MODIFIED: Added useWorkflowGraph hook
- `apps/web/src/app/services/[serviceId]/page.tsx` - MODIFIED: Integrated WorkflowDiagram section

**UI Components Added**:
- `apps/web/src/components/ui/alert.tsx` - NEW: Shadcn Alert component
- `apps/web/src/components/ui/tooltip.tsx` - NEW: Shadcn Tooltip component

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-01 | Story created by create-story workflow |
| 2026-01-01 | Implementation completed by dev-story workflow |

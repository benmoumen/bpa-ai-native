'use client';

/**
 * WorkflowDiagram - React Flow visualization of workflow roles and transitions
 * Story 4-7: Workflow Diagram Preview
 */

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Edge,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { RoleNode } from './RoleNode';
import { useWorkflowGraph } from '@/hooks/use-roles';
import { Loader2, AlertCircle, Workflow } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { WorkflowEdge as ApiWorkflowEdge, WorkflowNode as ApiWorkflowNode } from '@/lib/api/roles';

interface WorkflowDiagramProps {
  serviceId: string;
  className?: string;
}

// Custom node types for React Flow
const nodeTypes = {
  roleNode: RoleNode,
};

// Edge color mapping based on status code
const statusColors = {
  PASSED: {
    stroke: '#22c55e', // green-500
    label: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  RETURNED: {
    stroke: '#eab308', // yellow-500
    label: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  REJECTED: {
    stroke: '#ef4444', // red-500
    label: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
} as const;

/**
 * Transform API edges to React Flow edges with styling
 */
function transformEdges(apiEdges: ApiWorkflowEdge[]): Edge[] {
  return apiEdges.map((edge) => {
    const statusCode = edge.data?.statusCode || 'PASSED';
    const colors = statusColors[statusCode] || statusColors.PASSED;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      animated: statusCode === 'PASSED',
      style: {
        stroke: colors.stroke,
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: colors.stroke,
      },
      labelStyle: {
        fontSize: 11,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: 'white',
        fillOpacity: 0.9,
      },
      data: edge.data,
    };
  });
}

/**
 * Transform API nodes to React Flow nodes
 */
function transformNodes(apiNodes: ApiWorkflowNode[]) {
  return apiNodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
  }));
}

export function WorkflowDiagram({ serviceId, className }: WorkflowDiagramProps) {
  const { data: graph, isLoading, error, refetch } = useWorkflowGraph(serviceId);

  // Transform API data to React Flow format
  const initialNodes = useMemo(
    () => (graph?.nodes ? transformNodes(graph.nodes) : []),
    [graph]
  );
  const initialEdges = useMemo(
    () => (graph?.edges ? transformEdges(graph.edges) : []),
    [graph]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when data changes
  useMemo(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);

  useMemo(() => {
    if (initialEdges.length > 0) {
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  // MiniMap node color based on role type
  const nodeColor = useCallback((node: { data?: { roleType?: string; isStartRole?: boolean } }) => {
    if (node.data?.isStartRole) return '#22c55e'; // green for start
    if (node.data?.roleType === 'BOT') return '#3b82f6'; // blue for bots
    return '#6b7280'; // gray for users
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-[500px] bg-muted/30 rounded-lg', className)}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading workflow diagram...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load workflow diagram: {error.message}
          <button
            onClick={() => refetch()}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (!graph || graph.nodes.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-[500px] bg-muted/30 rounded-lg border-2 border-dashed', className)}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Workflow className="h-12 w-12" />
          <span className="font-medium">No workflow roles defined</span>
          <span className="text-sm">Add roles to see the workflow diagram</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-[500px] w-full rounded-lg border bg-background', className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={nodeColor}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bg-background"
        />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}

export default WorkflowDiagram;

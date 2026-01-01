'use client';

/**
 * RoleNode - Custom React Flow node for workflow roles
 * Story 4-7: Workflow Diagram Preview
 */

import { memo, useState } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { User, Bot, Play, FileText, Building2, Monitor } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WorkflowNodeData } from '@/lib/api/roles';

// Define the custom node type for React Flow v12+
type RoleNodeType = Node<WorkflowNodeData, 'roleNode'>;

function RoleNodeComponent({ data, selected }: NodeProps<RoleNodeType>) {
  const [isHovered, setIsHovered] = useState(false);

  const roleIcon =
    data.roleType === 'BOT' ? (
      <Bot className="h-4 w-4" />
    ) : (
      <User className="h-4 w-4" />
    );

  const actorIcon = {
    APPLICANT: <FileText className="h-3 w-3" />,
    OPERATOR: <Building2 className="h-3 w-3" />,
    SYSTEM: <Monitor className="h-3 w-3" />,
  }[data.actorType];

  return (
    <TooltipProvider>
      <Tooltip open={isHovered}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'rounded-lg border-2 bg-background px-4 py-3 shadow-md transition-all',
              'min-w-[180px] max-w-[220px]',
              selected ? 'border-primary ring-2 ring-primary/20' : 'border-border',
              data.isStartRole && 'border-green-500 bg-green-50 dark:bg-green-950/20',
              data.roleType === 'BOT' && 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Input handle */}
            <Handle
              type="target"
              position={Position.Left}
              className="!h-3 !w-3 !border-2 !border-border !bg-background"
            />

            {/* Header with icons */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full',
                  data.roleType === 'BOT'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                )}
              >
                {roleIcon}
              </div>
              {data.isStartRole && (
                <Play className="h-4 w-4 text-green-600 fill-green-600" />
              )}
            </div>

            {/* Role name */}
            <div className="font-medium text-sm truncate" title={data.name}>
              {data.name}
            </div>

            {/* Actor type badge */}
            <div className="mt-2 flex items-center gap-1">
              <Badge variant="outline" className="text-xs gap-1">
                {actorIcon}
                {data.actorType}
              </Badge>
            </div>

            {/* Status count */}
            <div className="mt-2 text-xs text-muted-foreground">
              {data.statuses.length} status{data.statuses.length !== 1 ? 'es' : ''}
            </div>

            {/* Output handle */}
            <Handle
              type="source"
              position={Position.Right}
              className="!h-3 !w-3 !border-2 !border-border !bg-background"
            />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2">
            <div className="font-semibold">{data.name}</div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Type:</span>
                <span>{data.roleType}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Actor:</span>
                <span>{data.actorType}</span>
              </div>
              {data.formName && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Form:</span>
                  <span className="truncate">{data.formName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Statuses:</span>
                <span>{data.statuses.map((s) => s.code).join(', ')}</span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const RoleNode = memo(RoleNodeComponent);

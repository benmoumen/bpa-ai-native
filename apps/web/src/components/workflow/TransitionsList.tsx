'use client';

/**
 * TransitionsList Component
 *
 * Displays a list of workflow transitions for a service.
 * Shows source role+status → target role with actions for editing/deleting.
 * Story 4-3: Configure Workflow Transitions
 */

import { useCallback, useMemo, useState } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  ArrowRight,
  GitBranch,
  Filter,
} from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useTransitions,
  useDeleteTransition,
  type WorkflowTransition,
} from '@/hooks/use-transitions';
import { useRoles } from '@/hooks/use-roles';
import type { Role } from '@/lib/api/roles';
import { CreateTransitionDialog } from './CreateTransitionDialog';
import { parseCondition, formatConditionSummary } from '@/lib/types/conditions';

interface TransitionsListProps {
  serviceId: string;
  isEditable?: boolean;
}


export function TransitionsList({
  serviceId,
  isEditable = true,
}: TransitionsListProps) {
  const { data: transitionsData, isLoading: transitionsLoading, isError: transitionsError, error: transitionsErrorObj } = useTransitions(serviceId);
  const { data: rolesData, isLoading: rolesLoading } = useRoles(serviceId);
  const deleteTransitionMutation = useDeleteTransition(serviceId);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTransition, setEditTransition] = useState<WorkflowTransition | null>(null);

  const roles = useMemo(() => rolesData?.data || [], [rolesData]);
  const transitions = transitionsData || [];

  // Build role lookup map
  const roleMap = useMemo(() => {
    const map = new Map<string, Role>();
    roles.forEach((role) => map.set(role.id, role));
    return map;
  }, [roles]);

  const handleAddTransition = useCallback(() => {
    setEditTransition(null);
    setCreateDialogOpen(true);
  }, []);

  const handleEditTransition = useCallback((transition: WorkflowTransition) => {
    setEditTransition(transition);
    setCreateDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (transition: WorkflowTransition) => {
      if (
        window.confirm(
          `Are you sure you want to delete this transition? This action cannot be undone.`
        )
      ) {
        await deleteTransitionMutation.mutateAsync(transition.id);
      }
    },
    [deleteTransitionMutation]
  );

  const handleDialogClose = useCallback(() => {
    setCreateDialogOpen(false);
    setEditTransition(null);
  }, []);

  // Don't show section if no roles exist
  if (roles.length === 0 && !rolesLoading) {
    return null;
  }

  if (transitionsLoading || rolesLoading) {
    return <TransitionsListSkeleton />;
  }

  if (transitionsError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-lg font-medium text-red-600">
          Failed to load workflow transitions
        </p>
        <p className="mt-1 text-sm text-black/50">
          {transitionsErrorObj?.message || 'Something went wrong'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-black">Workflow Transitions</h3>
          <p className="text-sm text-black/60">
            Define how applications flow between steps based on outcomes
          </p>
        </div>
        {isEditable && roles.length > 0 && (
          <Button onClick={handleAddTransition}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transition
          </Button>
        )}
      </div>

      {/* Empty state or table */}
      {transitions.length === 0 ? (
        <EmptyState onAddTransition={handleAddTransition} isEditable={isEditable} hasRoles={roles.length > 0} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From (Role + Status)</TableHead>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>To (Role)</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Order</TableHead>
              {isEditable && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {transitions.map((transition) => {
              const toRole = roleMap.get(transition.toRoleId);
              const condition = parseCondition(transition.conditions);
              return (
                <TableRow key={transition.id}>
                  <TableCell>
                    <TransitionSource transition={transition} />
                  </TableCell>
                  <TableCell className="text-center">
                    <ArrowRight className="h-4 w-4 text-black/40 mx-auto" />
                  </TableCell>
                  <TableCell className="font-medium">
                    {toRole?.name || (
                      <span className="text-red-500">Unknown Role</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {condition ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Filter className="h-3 w-3 text-blue-600" />
                        <span className="text-blue-700" title={formatConditionSummary(condition)}>
                          Conditional
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-black/40 italic">Always</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-black/60">
                    {transition.sortOrder}
                  </TableCell>
                  {isEditable && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Actions for transition`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTransition(transition)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:bg-red-50 focus:text-red-700"
                            onClick={() => handleDelete(transition)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Create/Edit Transition Dialog */}
      <CreateTransitionDialog
        serviceId={serviceId}
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
          else setCreateDialogOpen(open);
        }}
        editTransition={editTransition}
        roles={roles}
      />
    </div>
  );
}

interface TransitionSourceProps {
  transition: WorkflowTransition;
}

/**
 * Displays the source of a transition (role name + status)
 * We need to fetch the status info to display properly
 */
function TransitionSource({ transition }: TransitionSourceProps) {
  // The fromStatusId refers to a RoleStatus, but we only have the roles loaded
  // For now, display the status ID - a future enhancement could load statuses
  // and show "Role Name → Status Name" properly

  // We'll need to look up the status to get the role and status name
  // For MVP, we show a simplified view
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs">
        Status: {transition.fromStatusId.slice(-8)}...
      </Badge>
    </div>
  );
}

interface EmptyStateProps {
  onAddTransition: () => void;
  isEditable: boolean;
  hasRoles: boolean;
}

function EmptyState({ onAddTransition, isEditable, hasRoles }: EmptyStateProps) {
  if (!hasRoles) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/20 py-8 text-center">
        <div className="mx-auto h-10 w-10 rounded-full bg-black/5 flex items-center justify-center">
          <GitBranch className="h-5 w-5 text-black/40" />
        </div>
        <h4 className="mt-3 text-sm font-medium text-black">
          Add workflow steps first
        </h4>
        <p className="mt-1 text-xs text-black/60">
          Create roles above before configuring transitions.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/20 py-8 text-center">
      <div className="mx-auto h-10 w-10 rounded-full bg-black/5 flex items-center justify-center">
        <GitBranch className="h-5 w-5 text-black/40" />
      </div>
      <h4 className="mt-3 text-sm font-medium text-black">
        No transitions configured
      </h4>
      <p className="mt-1 text-xs text-black/60">
        Define how applications flow between workflow steps.
      </p>
      {isEditable && (
        <Button onClick={onAddTransition} className="mt-3" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add your first transition
        </Button>
      )}
    </div>
  );
}

function TransitionsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-40 animate-pulse bg-slate-100" />
          <div className="h-4 w-72 animate-pulse bg-slate-100" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded bg-slate-100" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>From (Role + Status)</TableHead>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>To (Role)</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Order</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="h-5 w-48 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-4 animate-pulse bg-slate-100 mx-auto" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-32 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-16 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-8 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-8 w-8 animate-pulse rounded bg-slate-100" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

'use client';

/**
 * RolesList Component
 *
 * Displays a list of workflow roles (steps) for a service in a table format.
 * Includes role type icons, start role indicator, and actions for editing/deleting.
 * Supports reordering via up/down buttons.
 * Story 4-2: Define Workflow Steps
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Plus,
  User,
  Bot,
  Play,
  ChevronUp,
  ChevronDown,
  Users,
  AlertTriangle,
  Settings,
  Workflow,
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
  useRoles,
  useDeleteRole,
  useSetStartRole,
  useReorderRole,
} from '@/hooks/use-roles';
import { useTransitions } from '@/hooks/use-transitions';
import { useForms } from '@/hooks/use-forms';
import type { Role, RoleType } from '@/lib/api/roles';
import type { Form } from '@/lib/api/forms';
import { CreateRoleDialog } from './CreateRoleDialog';
import { StepActionsPanel } from './StepActionsPanel';
import { LinearChainWizard } from './LinearChainWizard';
import { RegistrationBindingPanel } from './RegistrationBindingPanel';
import { InstitutionAssignmentPanel } from './InstitutionAssignmentPanel';

interface RolesListProps {
  serviceId: string;
  isEditable?: boolean;
}

const roleTypeIcons: Record<RoleType, React.ReactNode> = {
  USER: <User className="h-4 w-4" />,
  BOT: <Bot className="h-4 w-4" />,
};

const roleTypeLabels: Record<RoleType, string> = {
  USER: 'Human',
  BOT: 'Bot',
};

export function RolesList({ serviceId, isEditable = true }: RolesListProps) {
  const { data, isLoading, isError, error } = useRoles(serviceId);
  const { data: transitionsData } = useTransitions(serviceId);
  const { data: formsData } = useForms(serviceId, { isActive: true });
  const deleteRoleMutation = useDeleteRole(serviceId);
  const setStartRoleMutation = useSetStartRole(serviceId);
  const reorderRoleMutation = useReorderRole(serviceId);

  // Build form lookup map
  const formLookup = useMemo(() => {
    const map = new Map<string, Form>();
    const forms = formsData?.data || [];
    forms.forEach((form) => map.set(form.id, form));
    return map;
  }, [formsData]);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  // Calculate which roles have incoming transitions
  // Roles without incoming transitions (except start role) are unreachable
  const unreachableRoleIds = useMemo(() => {
    const roles = data?.data || [];
    const transitions = transitionsData || [];

    if (roles.length === 0) return new Set<string>();

    // Get all role IDs that have incoming transitions
    const rolesWithIncoming = new Set(transitions.map((t) => t.toRoleId));

    // Find roles without incoming transitions, excluding start role
    return new Set(
      roles
        .filter((role) => !role.isStartRole && !rolesWithIncoming.has(role.id))
        .map((role) => role.id)
    );
  }, [data?.data, transitionsData]);

  const handleAddStep = useCallback(() => {
    setEditRole(null);
    setCreateDialogOpen(true);
  }, []);

  const handleEditStep = useCallback((role: Role) => {
    setEditRole(role);
    setCreateDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (role: Role) => {
      if (
        window.confirm(
          `Are you sure you want to delete "${role.name}"? This action cannot be undone.`
        )
      ) {
        await deleteRoleMutation.mutateAsync(role.id);
      }
    },
    [deleteRoleMutation]
  );

  const handleSetStartRole = useCallback(
    async (role: Role) => {
      if (role.isStartRole) return; // Already start role
      await setStartRoleMutation.mutateAsync(role.id);
    },
    [setStartRoleMutation]
  );

  const handleMoveUp = useCallback(
    async (role: Role, roles: Role[]) => {
      const currentIndex = roles.findIndex((r) => r.id === role.id);
      if (currentIndex <= 0) return;

      // Swap with previous role
      const prevRole = roles[currentIndex - 1];
      await reorderRoleMutation.mutateAsync({
        roleId: role.id,
        sortOrder: prevRole.sortOrder,
      });
      await reorderRoleMutation.mutateAsync({
        roleId: prevRole.id,
        sortOrder: role.sortOrder,
      });
    },
    [reorderRoleMutation]
  );

  const handleMoveDown = useCallback(
    async (role: Role, roles: Role[]) => {
      const currentIndex = roles.findIndex((r) => r.id === role.id);
      if (currentIndex >= roles.length - 1) return;

      // Swap with next role
      const nextRole = roles[currentIndex + 1];
      await reorderRoleMutation.mutateAsync({
        roleId: role.id,
        sortOrder: nextRole.sortOrder,
      });
      await reorderRoleMutation.mutateAsync({
        roleId: nextRole.id,
        sortOrder: role.sortOrder,
      });
    },
    [reorderRoleMutation]
  );

  const handleDialogClose = useCallback(() => {
    setCreateDialogOpen(false);
    setEditRole(null);
  }, []);

  const handleToggleExpand = useCallback((roleId: string) => {
    setExpandedRoleId((prev) => (prev === roleId ? null : roleId));
  }, []);

  const handleOpenWizard = useCallback(() => {
    setWizardOpen(true);
  }, []);

  if (isLoading) {
    return <RolesListSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-lg font-medium text-red-600">
          Failed to load workflow steps
        </p>
        <p className="mt-1 text-sm text-black/50">
          {error?.message || 'Something went wrong'}
        </p>
      </div>
    );
  }

  const roles = data?.data || [];

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-black">Workflow Steps</h3>
          <p className="text-sm text-black/60">
            Define the processing steps and their sequence
          </p>
        </div>
        {isEditable && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleOpenWizard}>
              <Workflow className="mr-2 h-4 w-4" />
              Quick Setup
            </Button>
            <Button onClick={handleAddStep}>
              <Plus className="mr-2 h-4 w-4" />
              Add Step
            </Button>
          </div>
        )}
      </div>

      {/* Empty state or table */}
      {roles.length === 0 ? (
        <EmptyState onAddStep={handleAddStep} onQuickSetup={handleOpenWizard} isEditable={isEditable} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Order</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Form</TableHead>
              <TableHead>Status</TableHead>
              {isEditable && <TableHead className="w-[120px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role, index) => {
              const isExpanded = expandedRoleId === role.id;
              return (
              <React.Fragment key={role.id}>
              <TableRow>
                <TableCell className="font-mono text-sm text-black/60">
                  {isEditable ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0 || reorderRoleMutation.isPending}
                        onClick={() => handleMoveUp(role, roles)}
                        aria-label="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={
                          index === roles.length - 1 ||
                          reorderRoleMutation.isPending
                        }
                        onClick={() => handleMoveDown(role, roles)}
                        aria-label="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {role.isStartRole && (
                      <Play className="h-4 w-4 text-green-600" />
                    )}
                    {unreachableRoleIds.has(role.id) && (
                      <span
                        title="This step has no incoming transitions and may be unreachable"
                        className="inline-flex"
                      >
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      </span>
                    )}
                    <span>{role.name}</span>
                    {role.shortName && (
                      <span className="text-xs text-black/40">
                        ({role.shortName})
                      </span>
                    )}
                  </div>
                  {role.description && (
                    <p className="mt-0.5 text-xs text-black/50 line-clamp-1">
                      {role.description}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {roleTypeIcons[role.roleType]}
                    <span className="text-sm">{roleTypeLabels[role.roleType]}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {role.formId ? (
                    (() => {
                      const form = formLookup.get(role.formId);
                      return form ? (
                        <Badge variant="outline" className="font-normal">
                          {form.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-black/40 italic">Unknown form</span>
                      );
                    })()
                  ) : (
                    <span className="text-xs text-black/40 italic">No form</span>
                  )}
                </TableCell>
                <TableCell>
                  {role.isStartRole ? (
                    <Badge variant="default" className="bg-green-600">
                      Start
                    </Badge>
                  ) : role.isActive ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-black/40">Inactive</span>
                  )}
                </TableCell>
                {isEditable && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Actions for ${role.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditStep(role)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Step
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleExpand(role.id)}>
                          <Settings className="mr-2 h-4 w-4" />
                          {isExpanded ? 'Hide Actions' : 'View Actions'}
                        </DropdownMenuItem>
                        {!role.isStartRole && (
                          <DropdownMenuItem
                            onClick={() => handleSetStartRole(role)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Set as Start
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:bg-red-50 focus:text-red-700"
                          onClick={() => handleDelete(role)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
              {/* Expandable Actions Panel */}
              {isExpanded && (
                <TableRow>
                  <TableCell colSpan={isEditable ? 6 : 5} className="bg-slate-50 p-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <StepActionsPanel
                        role={role}
                        serviceId={serviceId}
                        isEditable={isEditable}
                      />
                      <RegistrationBindingPanel
                        serviceId={serviceId}
                        roleId={role.id}
                        roleName={role.name}
                      />
                      <InstitutionAssignmentPanel
                        serviceId={serviceId}
                        roleId={role.id}
                        roleName={role.name}
                        roleType={role.roleType}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Create/Edit Role Dialog */}
      <CreateRoleDialog
        serviceId={serviceId}
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
          else setCreateDialogOpen(open);
        }}
        editRole={editRole}
      />

      {/* Linear Chain Wizard */}
      <LinearChainWizard
        serviceId={serviceId}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
      />
    </div>
  );
}

interface EmptyStateProps {
  onAddStep: () => void;
  onQuickSetup: () => void;
  isEditable: boolean;
}

function EmptyState({ onAddStep, onQuickSetup, isEditable }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/20 py-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-black/5 flex items-center justify-center">
        <Users className="h-6 w-6 text-black/40" />
      </div>
      <h4 className="mt-4 text-base font-medium text-black">
        No workflow steps yet
      </h4>
      <p className="mt-1 text-sm text-black/60">
        Define the processing steps for this service workflow.
      </p>
      {isEditable && (
        <div className="mt-4 flex items-center gap-3">
          <Button variant="outline" onClick={onQuickSetup}>
            <Workflow className="mr-2 h-4 w-4" />
            Quick Setup
          </Button>
          <span className="text-xs text-black/40">or</span>
          <Button onClick={onAddStep}>
            <Plus className="mr-2 h-4 w-4" />
            Add manually
          </Button>
        </div>
      )}
    </div>
  );
}

function RolesListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 animate-pulse bg-slate-100" />
          <div className="h-4 w-64 animate-pulse bg-slate-100" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded bg-slate-100" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Order</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Form</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="h-5 w-12 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-40 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-20 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-24 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-16 animate-pulse bg-slate-100" />
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

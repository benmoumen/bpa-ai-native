'use client';

/**
 * StepActionsPanel Component
 *
 * Displays all configured statuses (actions) for a role with their action types,
 * labels, and linked transitions. Allows editing action labels and deleting custom statuses.
 * Story 4-4: Specify Step Actions
 */

import { useCallback, useMemo, useState } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Clock,
  CheckCircle,
  ArrowLeft,
  XCircle,
  ArrowRight,
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
  useRoleStatuses,
  useDeleteRoleStatus,
  useTransitions,
  type RoleStatus,
} from '@/hooks/use-transitions';
import type { Role } from '@/lib/api/roles';
import { EditStatusDialog } from './EditStatusDialog';

interface StepActionsPanelProps {
  role: Role;
  serviceId: string;
  isEditable?: boolean;
}

/**
 * Status code configuration with icons, colors, and labels
 */
const STATUS_CONFIG = {
  PENDING: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Pending',
    semantic: 'Awaiting action',
  },
  PASSED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Approved',
    semantic: 'Success/Continue',
  },
  RETURNED: {
    icon: ArrowLeft,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Returned',
    semantic: 'Needs revision',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Rejected',
    semantic: 'Terminal/Denied',
  },
} as const;

export function StepActionsPanel({
  role,
  serviceId,
  isEditable = true,
}: StepActionsPanelProps) {
  const {
    data: statusesData,
    isLoading: statusesLoading,
    isError: statusesError,
    error: statusesErrorObj,
  } = useRoleStatuses(role.id);
  const { data: transitionsData } = useTransitions(serviceId);
  const deleteStatusMutation = useDeleteRoleStatus(role.id, serviceId);

  const [editStatus, setEditStatus] = useState<RoleStatus | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const statuses = statusesData || [];
  const transitions = transitionsData || [];

  // Build map of statusId → transitions that originate from that status
  const transitionsFromStatus = useMemo(() => {
    const map = new Map<string, typeof transitions>();
    transitions.forEach((t) => {
      const existing = map.get(t.fromStatusId) || [];
      map.set(t.fromStatusId, [...existing, t]);
    });
    return map;
  }, [transitions]);

  const handleEditStatus = useCallback((status: RoleStatus) => {
    setEditStatus(status);
    setEditDialogOpen(true);
  }, []);

  const handleDeleteStatus = useCallback(
    async (status: RoleStatus) => {
      const linkedTransitions = transitionsFromStatus.get(status.id) || [];
      const warningMessage = linkedTransitions.length > 0
        ? `This action has ${linkedTransitions.length} linked transition(s). Deleting it will also remove those transitions. Continue?`
        : 'Are you sure you want to delete this action? This cannot be undone.';

      if (window.confirm(warningMessage)) {
        await deleteStatusMutation.mutateAsync(status.id);
      }
    },
    [deleteStatusMutation, transitionsFromStatus]
  );

  const handleDialogClose = useCallback(() => {
    setEditDialogOpen(false);
    setEditStatus(null);
  }, []);

  if (statusesLoading) {
    return <StepActionsPanelSkeleton />;
  }

  if (statusesError) {
    return (
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <p className="text-sm font-medium text-red-600">
          Failed to load actions
        </p>
        <p className="mt-1 text-xs text-black/50">
          {statusesErrorObj?.message || 'Something went wrong'}
        </p>
      </div>
    );
  }

  if (statuses.length === 0) {
    return (
      <div className="py-4 text-center">
        <p className="text-sm text-black/60">
          No actions configured. Create default statuses first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium text-black">Available Actions</h4>
        <p className="text-xs text-black/60">
          Actions that operators can take at this step
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Routes To</TableHead>
            {isEditable && <TableHead className="w-[80px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {statuses
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((status) => {
              const config = STATUS_CONFIG[status.code];
              const linkedTransitions = transitionsFromStatus.get(status.id) || [];

              return (
                <TableRow key={status.id}>
                  <TableCell>
                    <StatusTypeBadge code={status.code} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{status.name}</span>
                      <span className="text-xs text-black/50">
                        {config.semantic}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TransitionDestinations transitions={linkedTransitions} />
                  </TableCell>
                  {isEditable && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={`Actions for ${status.name}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditStatus(status)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Label
                          </DropdownMenuItem>
                          {!status.isDefault && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:bg-red-50 focus:text-red-700"
                                onClick={() => handleDeleteStatus(status)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
        </TableBody>
      </Table>

      {/* Edit Status Dialog */}
      <EditStatusDialog
        status={editStatus}
        roleId={role.id}
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDialogClose();
          else setEditDialogOpen(open);
        }}
      />
    </div>
  );
}

interface StatusTypeBadgeProps {
  code: keyof typeof STATUS_CONFIG;
}

function StatusTypeBadge({ code }: StatusTypeBadgeProps) {
  const config = STATUS_CONFIG[code];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.bgColor} ${config.borderColor} ${config.color} gap-1`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

interface TransitionDestinationsProps {
  transitions: Array<{ toRoleId: string }>;
}

function TransitionDestinations({ transitions }: TransitionDestinationsProps) {
  if (transitions.length === 0) {
    return (
      <span className="text-xs text-black/40 italic">No transitions</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {transitions.map((t, idx) => (
        <Badge
          key={idx}
          variant="secondary"
          className="gap-1 text-xs font-normal"
        >
          <ArrowRight className="h-3 w-3" />
          {t.toRoleId.slice(-6)}...
        </Badge>
      ))}
    </div>
  );
}

function StepActionsPanelSkeleton() {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="h-4 w-28 animate-pulse bg-slate-100 rounded" />
        <div className="h-3 w-48 animate-pulse bg-slate-100 rounded" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Routes To</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="h-5 w-20 animate-pulse bg-slate-100 rounded" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-24 animate-pulse bg-slate-100 rounded" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-16 animate-pulse bg-slate-100 rounded" />
              </TableCell>
              <TableCell>
                <div className="h-7 w-7 animate-pulse bg-slate-100 rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

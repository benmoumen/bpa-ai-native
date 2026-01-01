'use client';

/**
 * CreateTransitionDialog Component
 *
 * Modal dialog for creating new workflow transitions.
 * Supports selecting source role+status and target role.
 * Handles roles without statuses by prompting to create defaults.
 * Story 4-3: Configure Workflow Transitions
 */

import * as React from 'react';
import { Loader2, AlertCircle, Plus } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateTransition,
  useUpdateTransition,
  useRoleStatuses,
  useCreateDefaultStatuses,
  type WorkflowTransition,
} from '@/hooks/use-transitions';
import type { Role } from '@/lib/api/roles';
import { ConditionBuilder } from './ConditionBuilder';
import { type TransitionCondition, parseCondition } from '@/lib/types/conditions';

interface CreateTransitionDialogProps {
  serviceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTransition?: WorkflowTransition | null;
  roles: Role[];
}

interface FormData {
  sourceRoleId: string;
  sourceStatusId: string;
  targetRoleId: string;
  sortOrder: number;
  condition: TransitionCondition | null;
}

interface FormErrors {
  sourceRoleId?: string;
  sourceStatusId?: string;
  targetRoleId?: string;
}

export function CreateTransitionDialog({
  serviceId,
  open,
  onOpenChange,
  editTransition,
  roles,
}: CreateTransitionDialogProps) {
  const isEditMode = !!editTransition;

  const [formData, setFormData] = React.useState<FormData>({
    sourceRoleId: '',
    sourceStatusId: '',
    targetRoleId: '',
    sortOrder: 0,
    condition: null,
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Fetch statuses for the selected source role
  const {
    data: statuses,
    isLoading: statusesLoading,
    refetch: refetchStatuses,
  } = useRoleStatuses(formData.sourceRoleId);

  const createTransition = useCreateTransition(serviceId);
  const updateTransition = useUpdateTransition(serviceId);
  const createDefaultStatuses = useCreateDefaultStatuses(serviceId);

  const isPending =
    createTransition.isPending ||
    updateTransition.isPending ||
    createDefaultStatuses.isPending;

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      if (editTransition) {
        // In edit mode, we'd need to look up the source role from the status
        // For now, we only allow editing target and sortOrder in edit mode
        setFormData({
          sourceRoleId: '',
          sourceStatusId: editTransition.fromStatusId,
          targetRoleId: editTransition.toRoleId,
          sortOrder: editTransition.sortOrder,
          condition: parseCondition(editTransition.conditions),
        });
      } else {
        setFormData({
          sourceRoleId: '',
          sourceStatusId: '',
          targetRoleId: '',
          sortOrder: 0,
          condition: null,
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [open, editTransition]);

  const handleSourceRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      sourceRoleId: value,
      sourceStatusId: '', // Reset status when role changes
    }));
    if (errors.sourceRoleId) {
      setErrors((prev) => ({ ...prev, sourceRoleId: undefined }));
    }
  };

  const handleSourceStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, sourceStatusId: value }));
    if (errors.sourceStatusId) {
      setErrors((prev) => ({ ...prev, sourceStatusId: undefined }));
    }
  };

  const handleTargetRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, targetRoleId: value }));
    if (errors.targetRoleId) {
      setErrors((prev) => ({ ...prev, targetRoleId: undefined }));
    }
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setFormData((prev) => ({ ...prev, sortOrder: isNaN(value) ? 0 : value }));
  };

  const handleConditionChange = (condition: TransitionCondition | null) => {
    setFormData((prev) => ({ ...prev, condition }));
  };

  const handleCreateDefaultStatuses = async () => {
    if (!formData.sourceRoleId) return;

    try {
      await createDefaultStatuses.mutateAsync(formData.sourceRoleId);
      // Refetch statuses after creating defaults
      refetchStatuses();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create default statuses'
      );
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!isEditMode) {
      if (!formData.sourceRoleId) {
        newErrors.sourceRoleId = 'Please select a source role';
      }
      if (!formData.sourceStatusId) {
        newErrors.sourceStatusId = 'Please select a source status';
      }
    }
    if (!formData.targetRoleId) {
      newErrors.targetRoleId = 'Please select a target role';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitError(null);

    try {
      // Convert condition to Record<string, unknown> for API
      const conditionsPayload = formData.condition
        ? (formData.condition as unknown as Record<string, unknown>)
        : undefined;

      if (isEditMode && editTransition) {
        await updateTransition.mutateAsync({
          transitionId: editTransition.id,
          data: {
            toRoleId: formData.targetRoleId,
            sortOrder: formData.sortOrder,
            conditions: conditionsPayload,
          },
        });
      } else {
        await createTransition.mutateAsync({
          fromStatusId: formData.sourceStatusId,
          toRoleId: formData.targetRoleId,
          sortOrder: formData.sortOrder,
          conditions: conditionsPayload,
        });
      }

      onOpenChange(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    }
  };

  // Filter target roles (exclude source role's parent in a real implementation)
  // For now, we just show all roles except the source role
  const availableTargetRoles = roles.filter(
    (r) => r.id !== formData.sourceRoleId
  );

  // Check if the selected role has no statuses
  const hasNoStatuses =
    formData.sourceRoleId &&
    !statusesLoading &&
    (!statuses || statuses.length === 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Transition' : 'Add Transition'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update the transition configuration.'
                : 'Define how applications flow from one step to another.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Source Role selector (not in edit mode) */}
            {!isEditMode && (
              <div className="grid gap-2">
                <Label htmlFor="sourceRoleId">
                  Source Role <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sourceRoleId}
                  onValueChange={handleSourceRoleChange}
                >
                  <SelectTrigger aria-invalid={!!errors.sourceRoleId}>
                    <SelectValue placeholder="Select source role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                        {role.isStartRole && (
                          <span className="ml-2 text-xs text-green-600">
                            (Start)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sourceRoleId && (
                  <p className="text-sm text-red-600">{errors.sourceRoleId}</p>
                )}
                <p className="text-xs text-black/50">
                  The workflow step where the transition originates
                </p>
              </div>
            )}

            {/* No statuses warning */}
            {hasNoStatuses && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      No statuses configured
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      This role needs status outcomes before you can create
                      transitions. Create the default 4-status set?
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={handleCreateDefaultStatuses}
                      disabled={createDefaultStatuses.isPending}
                    >
                      {createDefaultStatuses.isPending ? (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-3 w-3" />
                      )}
                      Create Default Statuses
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Source Status selector (not in edit mode) */}
            {!isEditMode && formData.sourceRoleId && !hasNoStatuses && (
              <div className="grid gap-2">
                <Label htmlFor="sourceStatusId">
                  Source Status <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.sourceStatusId}
                  onValueChange={handleSourceStatusChange}
                  disabled={statusesLoading}
                >
                  <SelectTrigger aria-invalid={!!errors.sourceStatusId}>
                    <SelectValue
                      placeholder={
                        statusesLoading ? 'Loading...' : 'Select status outcome'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses?.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        <span className={getStatusColorClass(status.code)}>
                          {status.name}
                        </span>
                        <span className="ml-2 text-xs text-black/40">
                          ({status.code})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sourceStatusId && (
                  <p className="text-sm text-red-600">{errors.sourceStatusId}</p>
                )}
                <p className="text-xs text-black/50">
                  The status outcome that triggers this transition
                </p>
              </div>
            )}

            {/* Edit mode: show source as read-only */}
            {isEditMode && editTransition && (
              <div className="grid gap-2">
                <Label>Source</Label>
                <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm">
                  Status ID: {editTransition.fromStatusId.slice(-8)}...
                </div>
                <p className="text-xs text-black/50">
                  Source cannot be changed. Delete and recreate to change source.
                </p>
              </div>
            )}

            {/* Target Role selector */}
            <div className="grid gap-2">
              <Label htmlFor="targetRoleId">
                Target Role <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.targetRoleId}
                onValueChange={handleTargetRoleChange}
                disabled={!isEditMode && !formData.sourceStatusId}
              >
                <SelectTrigger aria-invalid={!!errors.targetRoleId}>
                  <SelectValue placeholder="Select target role" />
                </SelectTrigger>
                <SelectContent>
                  {availableTargetRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                      {role.isStartRole && (
                        <span className="ml-2 text-xs text-green-600">
                          (Start)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.targetRoleId && (
                <p className="text-sm text-red-600">{errors.targetRoleId}</p>
              )}
              <p className="text-xs text-black/50">
                The workflow step to transition to
              </p>
            </div>

            {/* Sort Order */}
            <div className="grid gap-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                min="0"
                value={formData.sortOrder}
                onChange={handleSortOrderChange}
              />
              <p className="text-xs text-black/50">
                Order when multiple transitions exist from the same status (lower
                = first)
              </p>
            </div>

            {/* Condition Builder */}
            <ConditionBuilder
              serviceId={serviceId}
              value={formData.condition}
              onChange={handleConditionChange}
            />

            {/* Submit error */}
            {submitError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {submitError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                (!isEditMode && hasNoStatuses) ||
                (!isEditMode && !formData.sourceStatusId)
              }
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending
                ? isEditMode
                  ? 'Saving...'
                  : 'Creating...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Add Transition'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Get color class for status code
 */
function getStatusColorClass(code: string): string {
  switch (code) {
    case 'PENDING':
      return 'text-yellow-700';
    case 'PASSED':
      return 'text-green-700';
    case 'RETURNED':
      return 'text-orange-700';
    case 'REJECTED':
      return 'text-red-700';
    default:
      return '';
  }
}

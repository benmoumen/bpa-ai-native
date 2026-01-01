'use client';

/**
 * EditStatusDialog Component
 *
 * Dialog for editing a role status (action) label.
 * Story 4-4: Specify Step Actions
 */

import { useCallback, useState } from 'react';
import { Clock, CheckCircle, ArrowLeft, XCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  useUpdateRoleStatus,
  type RoleStatus,
} from '@/hooks/use-transitions';

interface EditStatusDialogProps {
  status: RoleStatus | null;
  roleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Status code configuration with icons and colors
 */
const STATUS_CONFIG = {
  PENDING: {
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Pending',
  },
  PASSED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Approved',
  },
  RETURNED: {
    icon: ArrowLeft,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Returned',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Rejected',
  },
} as const;

export function EditStatusDialog({
  status,
  roleId,
  open,
  onOpenChange,
}: EditStatusDialogProps) {
  const updateStatusMutation = useUpdateRoleStatus(roleId);

  // Key forces remount when switching between different statuses
  const dialogKey = status?.id ?? 'new';

  // Initialize with status name (will reset due to key change on status switch)
  const [name, setName] = useState(status?.name ?? '');

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!status || !name.trim()) return;

      await updateStatusMutation.mutateAsync({
        statusId: status.id,
        data: { name: name.trim() },
      });

      onOpenChange(false);
    },
    [status, name, updateStatusMutation, onOpenChange]
  );

  if (!status) return null;

  const config = STATUS_CONFIG[status.code];
  const Icon = config.icon;

  return (
    <Dialog key={dialogKey} open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Action Label</DialogTitle>
          <DialogDescription>
            Change the display label for this action. The action type cannot be changed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Action Type (read-only) */}
            <div className="grid gap-2">
              <Label htmlFor="type">Action Type</Label>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`${config.bgColor} ${config.borderColor} ${config.color} gap-1`}
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                </Badge>
                <span className="text-xs text-black/50">
                  (Cannot be changed)
                </span>
              </div>
            </div>

            {/* Action Label (editable) */}
            <div className="grid gap-2">
              <Label htmlFor="name">Action Label</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter action label..."
                required
              />
              <p className="text-xs text-black/50">
                This is the button text shown to operators (e.g., &quot;Approve Application&quot;, &quot;Send for Revision&quot;)
              </p>
            </div>

            {/* Current code reference */}
            <div className="grid gap-2">
              <Label className="text-black/50">Technical Code</Label>
              <code className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                {status.code}
              </code>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

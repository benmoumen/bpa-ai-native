'use client';

/**
 * DeleteRegistrationDialog Component
 *
 * Confirmation dialog for soft-deleting a registration.
 * Soft delete sets isActive=false rather than permanent removal.
 */

import * as React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteRegistration } from '@/hooks/use-registrations';
import type { Registration } from '@/lib/api/registrations';

interface DeleteRegistrationDialogProps {
  serviceId: string;
  registration: Registration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Dialog for confirming deletion (soft-delete) of a registration
 */
export function DeleteRegistrationDialog({
  serviceId,
  registration,
  open,
  onOpenChange,
  onSuccess,
}: DeleteRegistrationDialogProps) {
  const [error, setError] = React.useState<string | null>(null);
  const deleteRegistration = useDeleteRegistration(serviceId);

  // Reset error when dialog closes
  React.useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!registration) return;

    setError(null);

    try {
      await deleteRegistration.mutateAsync(registration.id);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete registration'
      );
    }
  };

  if (!registration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Delete Registration</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-black">
              {registration.name}
            </span>
            ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Info message */}
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> This will deactivate the registration. It
              will no longer appear in the active list but can be restored if
              needed.
            </p>
          </div>

          {/* Registration details */}
          <div className="mt-3 rounded-md border border-black/10 bg-black/[0.02] p-3">
            <dl className="grid gap-1 text-sm">
              <div className="flex gap-2">
                <dt className="text-black/50">Name:</dt>
                <dd className="font-medium">{registration.name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-black/50">Short Name:</dt>
                <dd>{registration.shortName}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-black/50">Key:</dt>
                <dd>
                  <code className="rounded bg-black/5 px-1">{registration.key}</code>
                </dd>
              </div>
            </dl>
          </div>

          {/* Error display */}
          {error && (
            <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteRegistration.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteRegistration.isPending}
          >
            {deleteRegistration.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {deleteRegistration.isPending ? 'Deleting...' : 'Delete Registration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

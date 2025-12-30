'use client';

/**
 * DeleteServiceDialog Component
 *
 * Confirmation dialog for permanently deleting a DRAFT service.
 * Shows a warning that this action cannot be undone.
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
import { useDeleteService } from '@/hooks/use-services';
import type { Service } from '@/lib/api/services';

interface DeleteServiceDialogProps {
  service: Service | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Dialog for confirming permanent deletion of a DRAFT service
 */
export function DeleteServiceDialog({
  service,
  open,
  onOpenChange,
  onSuccess,
}: DeleteServiceDialogProps) {
  const [error, setError] = React.useState<string | null>(null);
  const deleteService = useDeleteService();

  // Reset error when dialog closes
  React.useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  const handleDelete = async () => {
    if (!service) return;

    setError(null);

    try {
      await deleteService.mutateAsync(service.id);
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service');
    }
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Delete Service</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to permanently delete{' '}
            <span className="font-semibold text-black">{service.name}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Warning message */}
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone. The service
              and all its associated data will be permanently removed.
            </p>
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
            disabled={deleteService.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteService.isPending}
          >
            {deleteService.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {deleteService.isPending ? 'Deleting...' : 'Delete Service'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

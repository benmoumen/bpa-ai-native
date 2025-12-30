'use client';

/**
 * ServiceActions Component
 *
 * Provides action buttons for service lifecycle state transitions:
 * - Publish: DRAFT -> PUBLISHED
 * - Archive: PUBLISHED -> ARCHIVED
 * - Restore: ARCHIVED -> DRAFT
 *
 * Each action opens a confirmation dialog before executing.
 */

import * as React from 'react';
import { Loader2, Globe, Archive, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  usePublishService,
  useArchiveService,
  useRestoreService,
  type ServiceStatus,
} from '@/hooks/use-services';

type ActionType = 'publish' | 'archive' | 'restore';

interface ServiceActionsProps {
  serviceId: string;
  serviceName: string;
  status: ServiceStatus;
  onSuccess?: () => void;
  className?: string;
}

const actionConfig: Record<
  ActionType,
  {
    label: string;
    icon: typeof Globe;
    dialogTitle: string;
    dialogDescription: (name: string) => React.ReactNode;
    buttonVariant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    buttonLabel: string;
    pendingLabel: string;
    infoMessage?: string;
  }
> = {
  publish: {
    label: 'Publish',
    icon: Globe,
    dialogTitle: 'Publish Service',
    dialogDescription: (name) => (
      <>
        Are you sure you want to publish{' '}
        <span className="font-semibold text-black">{name}</span>?
      </>
    ),
    buttonVariant: 'default',
    buttonLabel: 'Publish',
    pendingLabel: 'Publishing...',
    infoMessage:
      'Publishing will make this service available to applicants. You can archive it later if needed.',
  },
  archive: {
    label: 'Archive',
    icon: Archive,
    dialogTitle: 'Archive Service',
    dialogDescription: (name) => (
      <>
        Are you sure you want to archive{' '}
        <span className="font-semibold text-black">{name}</span>?
      </>
    ),
    buttonVariant: 'secondary',
    buttonLabel: 'Archive',
    pendingLabel: 'Archiving...',
    infoMessage:
      'Archiving will hide this service from new applicants. Existing applications will continue processing. You can restore it later.',
  },
  restore: {
    label: 'Restore to Draft',
    icon: RotateCcw,
    dialogTitle: 'Restore Service',
    dialogDescription: (name) => (
      <>
        Are you sure you want to restore{' '}
        <span className="font-semibold text-black">{name}</span> to draft status?
      </>
    ),
    buttonVariant: 'outline',
    buttonLabel: 'Restore',
    pendingLabel: 'Restoring...',
    infoMessage:
      'Restoring will return this service to draft status for editing. You will need to publish it again to make it available to applicants.',
  },
};

/**
 * Get available actions based on current service status
 */
function getAvailableActions(status: ServiceStatus): ActionType[] {
  switch (status) {
    case 'DRAFT':
      return ['publish'];
    case 'PUBLISHED':
      return ['archive'];
    case 'ARCHIVED':
      return ['restore'];
    default:
      return [];
  }
}

/**
 * Service lifecycle action buttons with confirmation dialogs
 */
export function ServiceActions({
  serviceId,
  serviceName,
  status,
  onSuccess,
  className,
}: ServiceActionsProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [currentAction, setCurrentAction] = React.useState<ActionType | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const publishService = usePublishService();
  const archiveService = useArchiveService();
  const restoreService = useRestoreService();

  // Reset error when dialog closes
  React.useEffect(() => {
    if (!dialogOpen) {
      setError(null);
    }
  }, [dialogOpen]);

  const handleActionClick = (action: ActionType) => {
    setCurrentAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!currentAction) return;

    setError(null);

    try {
      switch (currentAction) {
        case 'publish':
          await publishService.mutateAsync(serviceId);
          break;
        case 'archive':
          await archiveService.mutateAsync(serviceId);
          break;
        case 'restore':
          await restoreService.mutateAsync(serviceId);
          break;
      }
      onSuccess?.();
      setDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const availableActions = getAvailableActions(status);
  const isPending =
    publishService.isPending ||
    archiveService.isPending ||
    restoreService.isPending;

  const config = currentAction ? actionConfig[currentAction] : null;

  return (
    <>
      <div className={className}>
        {availableActions.map((action) => {
          const { label, icon: Icon, buttonVariant } = actionConfig[action];
          return (
            <Button
              key={action}
              variant={buttonVariant}
              size="sm"
              onClick={() => handleActionClick(action)}
              disabled={isPending}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          );
        })}
      </div>

      {config && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <config.icon className="h-5 w-5 text-slate-600" />
                </div>
                <DialogTitle>{config.dialogTitle}</DialogTitle>
              </div>
              <DialogDescription className="pt-2">
                {config.dialogDescription(serviceName)}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {config.infoMessage && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm text-slate-700">{config.infoMessage}</p>
                </div>
              )}

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
                onClick={() => setDialogOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={config.buttonVariant}
                onClick={handleConfirm}
                disabled={isPending}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? config.pendingLabel : config.buttonLabel}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

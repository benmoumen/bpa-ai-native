'use client';

import { useState } from 'react';
import {
  useRegistrationsForRole,
  useBindRegistration,
  useUnbindRegistration,
  useUpdateBinding,
} from '@/hooks/use-role-registrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileCheck2 } from 'lucide-react';

interface RegistrationBindingPanelProps {
  serviceId: string;
  roleId: string;
  roleName: string;
}

export function RegistrationBindingPanel({
  serviceId,
  roleId,
  roleName,
}: RegistrationBindingPanelProps) {
  const {
    data: registrations,
    isLoading,
    error,
  } = useRegistrationsForRole(serviceId, roleId);

  const bindMutation = useBindRegistration(serviceId, roleId);
  const unbindMutation = useUnbindRegistration(serviceId, roleId);
  const updateMutation = useUpdateBinding(serviceId, roleId);

  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

  const handleBindingChange = async (
    registrationId: string,
    isBound: boolean,
  ) => {
    setPendingChanges((prev) => new Set(prev).add(registrationId));
    try {
      if (isBound) {
        await unbindMutation.mutateAsync(registrationId);
      } else {
        await bindMutation.mutateAsync({ registrationId, finalResultIssued: false });
      }
    } finally {
      setPendingChanges((prev) => {
        const next = new Set(prev);
        next.delete(registrationId);
        return next;
      });
    }
  };

  const handleFinalResultChange = async (
    bindingId: string,
    finalResultIssued: boolean,
  ) => {
    await updateMutation.mutateAsync({ bindingId, finalResultIssued });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Registration Bindings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Registration Bindings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to load registrations</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Registration Bindings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No registrations in this service. Add registrations first.
          </p>
        </CardContent>
      </Card>
    );
  }

  const boundCount = registrations.filter((r) => r.isBound).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Registration Bindings
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {boundCount} / {registrations.length} bound
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Select which registrations this role ({roleName}) processes.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {registrations.map((registration) => {
          const isPending = pendingChanges.has(registration.id);
          const isUpdating =
            bindMutation.isPending ||
            unbindMutation.isPending ||
            updateMutation.isPending;

          return (
            <div
              key={registration.id}
              className="flex flex-col gap-2 rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`bind-${registration.id}`}
                  checked={registration.isBound}
                  disabled={isPending || isUpdating}
                  onCheckedChange={() =>
                    handleBindingChange(registration.id, registration.isBound)
                  }
                />
                <Label
                  htmlFor={`bind-${registration.id}`}
                  className="flex-1 cursor-pointer"
                >
                  <span className="font-medium">{registration.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({registration.key})
                  </span>
                </Label>
              </div>

              {registration.isBound && registration.bindingId && (
                <div className="ml-7 flex items-center gap-2 pt-1">
                  <Switch
                    id={`final-${registration.id}`}
                    checked={registration.finalResultIssued ?? false}
                    disabled={isUpdating}
                    onCheckedChange={(checked) =>
                      handleFinalResultChange(registration.bindingId!, checked)
                    }
                  />
                  <Label
                    htmlFor={`final-${registration.id}`}
                    className="flex cursor-pointer items-center gap-1.5 text-xs"
                  >
                    <FileCheck2 className="h-3.5 w-3.5" />
                    Final Approver
                  </Label>
                  {registration.finalResultIssued && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      Issues final result
                    </Badge>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

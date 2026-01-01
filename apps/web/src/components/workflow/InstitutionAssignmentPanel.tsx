'use client';

import { useState } from 'react';
import {
  useInstitutionsForRole,
  useAssignInstitution,
  useUnassignInstitution,
} from '@/hooks/use-role-institutions';
import { useSeedDemoInstitutions } from '@/hooks/use-institutions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Building2, Plus } from 'lucide-react';

interface InstitutionAssignmentPanelProps {
  serviceId: string;
  roleId: string;
  roleName: string;
  roleType: 'USER' | 'BOT';
}

export function InstitutionAssignmentPanel({
  serviceId,
  roleId,
  roleName,
  roleType,
}: InstitutionAssignmentPanelProps) {
  // BOT roles don't need institution assignments
  if (roleType === 'BOT') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Institution Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bot roles don&apos;t require institution assignments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <UserRoleInstitutionPanel serviceId={serviceId} roleId={roleId} roleName={roleName} />;
}

function UserRoleInstitutionPanel({
  serviceId,
  roleId,
  roleName,
}: {
  serviceId: string;
  roleId: string;
  roleName: string;
}) {
  const {
    data: institutions,
    isLoading,
    error,
  } = useInstitutionsForRole(serviceId, roleId);

  const assignMutation = useAssignInstitution(serviceId, roleId);
  const unassignMutation = useUnassignInstitution(serviceId, roleId);
  const seedMutation = useSeedDemoInstitutions();

  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

  const handleAssignmentChange = async (
    institutionId: string,
    isAssigned: boolean,
  ) => {
    setPendingChanges((prev) => new Set(prev).add(institutionId));
    try {
      if (isAssigned) {
        await unassignMutation.mutateAsync(institutionId);
      } else {
        await assignMutation.mutateAsync(institutionId);
      }
    } finally {
      setPendingChanges((prev) => {
        const next = new Set(prev);
        next.delete(institutionId);
        return next;
      });
    }
  };

  const handleSeedInstitutions = async () => {
    await seedMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Institution Assignment
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
            Institution Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Failed to load institutions</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!institutions || institutions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Institution Assignment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            No institutions available. Create institutions to assign to this role.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedInstitutions}
            disabled={seedMutation.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            {seedMutation.isPending ? 'Creating...' : 'Add Demo Institutions'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const assignedCount = institutions.filter((i) => i.isAssigned).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Institution Assignment
          </CardTitle>
          <Badge
            variant={assignedCount === 0 ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {assignedCount} / {institutions.length} assigned
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Assign institutions whose officers can process this role ({roleName}).
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {institutions.map((institution) => {
          const isPending = pendingChanges.has(institution.id);
          const isUpdating =
            assignMutation.isPending || unassignMutation.isPending;

          return (
            <div
              key={institution.id}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <Checkbox
                id={`inst-${institution.id}`}
                checked={institution.isAssigned}
                disabled={isPending || isUpdating}
                onCheckedChange={() =>
                  handleAssignmentChange(institution.id, institution.isAssigned)
                }
              />
              <Label
                htmlFor={`inst-${institution.id}`}
                className="flex flex-1 cursor-pointer items-center gap-2"
              >
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{institution.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({institution.code})
                </span>
                {institution.country && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {institution.country}
                  </Badge>
                )}
              </Label>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

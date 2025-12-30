'use client';

/**
 * RegistrationList Component
 *
 * Displays a list of registrations for a service in a table format.
 * Includes actions for editing and deleting registrations.
 * Swiss-style minimal design with black borders.
 */

import { useCallback, useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Plus } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRegistrations } from '@/hooks/use-registrations';
import type { Registration } from '@/lib/api/registrations';
import { RegistrationForm } from './RegistrationForm';
import { DeleteRegistrationDialog } from './DeleteRegistrationDialog';

interface RegistrationListProps {
  serviceId: string;
  isEditable?: boolean;
}

export function RegistrationList({
  serviceId,
  isEditable = true,
}: RegistrationListProps) {
  const { data, isLoading, isError, error } = useRegistrations(serviceId);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRegistration, setEditingRegistration] =
    useState<Registration | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] =
    useState<Registration | null>(null);

  const handleAddClick = useCallback(() => {
    setEditingRegistration(null);
    setFormOpen(true);
  }, []);

  const handleEditClick = useCallback((registration: Registration) => {
    setEditingRegistration(registration);
    setFormOpen(true);
  }, []);

  const handleDeleteClick = useCallback((registration: Registration) => {
    setRegistrationToDelete(registration);
    setDeleteDialogOpen(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditingRegistration(null);
  }, []);

  const handleDeleteDialogClose = useCallback(() => {
    setDeleteDialogOpen(false);
    setRegistrationToDelete(null);
  }, []);

  if (isLoading) {
    return <RegistrationListSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-lg font-medium text-red-600">
          Failed to load registrations
        </p>
        <p className="mt-1 text-sm text-black/50">
          {error?.message || 'Something went wrong'}
        </p>
      </div>
    );
  }

  const registrations = data?.data || [];

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-black">Registrations</h3>
          <p className="text-sm text-black/60">
            Authorization types applicants can apply for within this service
          </p>
        </div>
        {isEditable && (
          <Button onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" />
            Add Registration
          </Button>
        )}
      </div>

      {/* Empty state or table */}
      {registrations.length === 0 ? (
        <EmptyState onAddClick={handleAddClick} isEditable={isEditable} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Short Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Description</TableHead>
              {isEditable && (
                <TableHead className="w-[80px]">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((registration) => (
              <TableRow key={registration.id}>
                <TableCell className="font-medium">
                  {registration.name}
                </TableCell>
                <TableCell className="text-black/70">
                  {registration.shortName}
                </TableCell>
                <TableCell>
                  <code className="rounded bg-black/5 px-1.5 py-0.5 text-sm">
                    {registration.key}
                  </code>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-black/60">
                  {registration.description || '---'}
                </TableCell>
                {isEditable && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Actions for ${registration.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEditClick(registration)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:bg-red-50 focus:text-red-700"
                          onClick={() => handleDeleteClick(registration)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create/Edit Form Modal */}
      <RegistrationForm
        serviceId={serviceId}
        registration={editingRegistration}
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) handleFormClose();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteRegistrationDialog
        serviceId={serviceId}
        registration={registrationToDelete}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleDeleteDialogClose();
        }}
      />
    </div>
  );
}

interface EmptyStateProps {
  onAddClick: () => void;
  isEditable: boolean;
}

function EmptyState({ onAddClick, isEditable }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/20 py-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-black/5 flex items-center justify-center">
        <Plus className="h-6 w-6 text-black/40" />
      </div>
      <h4 className="mt-4 text-base font-medium text-black">
        No registrations yet
      </h4>
      <p className="mt-1 text-sm text-black/60">
        Add your first registration to define what applicants can apply for.
      </p>
      {isEditable && (
        <Button onClick={onAddClick} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Add your first registration
        </Button>
      )}
    </div>
  );
}

function RegistrationListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 animate-pulse bg-slate-100" />
          <div className="h-4 w-64 animate-pulse bg-slate-100" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded bg-slate-100" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Short Name</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="h-5 w-40 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-20 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-32 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-48 animate-pulse bg-slate-100" />
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

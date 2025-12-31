'use client';

/**
 * FormList Component
 *
 * Displays a list of forms for a service in a table format.
 * Includes type badges (APPLICANT/GUIDE) and actions for editing/deleting.
 * Swiss-style minimal design with black borders.
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2, Plus, FileText } from 'lucide-react';

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
import { useForms, useDeleteForm } from '@/hooks/use-forms';
import type { Form, FormType } from '@/lib/api/forms';
import { CreateFormDialog } from './CreateFormDialog';

interface FormListProps {
  serviceId: string;
  isEditable?: boolean;
}

const formTypeLabels: Record<FormType, string> = {
  APPLICANT: 'Applicant',
  GUIDE: 'Guide',
};

const formTypeBadgeVariants: Record<FormType, 'default' | 'secondary'> = {
  APPLICANT: 'default',
  GUIDE: 'secondary',
};

export function FormList({ serviceId, isEditable = true }: FormListProps) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useForms(serviceId);
  const deleteFormMutation = useDeleteForm(serviceId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formTypeToCreate, setFormTypeToCreate] = useState<FormType>('APPLICANT');

  const handleEditForm = useCallback(
    (formId: string) => {
      router.push(`/services/${serviceId}/forms/${formId}`);
    },
    [router, serviceId]
  );

  const handleAddApplicantForm = useCallback(() => {
    setFormTypeToCreate('APPLICANT');
    setCreateDialogOpen(true);
  }, []);

  const handleAddGuideForm = useCallback(() => {
    setFormTypeToCreate('GUIDE');
    setCreateDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (form: Form) => {
      if (
        window.confirm(
          `Are you sure you want to delete "${form.name}"? This action cannot be undone.`
        )
      ) {
        await deleteFormMutation.mutateAsync(form.id);
      }
    },
    [deleteFormMutation]
  );

  const handleCreateDialogClose = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  if (isLoading) {
    return <FormListSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-lg font-medium text-red-600">Failed to load forms</p>
        <p className="mt-1 text-sm text-black/50">
          {error?.message || 'Something went wrong'}
        </p>
      </div>
    );
  }

  const forms = data?.data || [];

  return (
    <div className="space-y-4">
      {/* Header with Add buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-black">Forms</h3>
          <p className="text-sm text-black/60">
            Data collection forms for applicants and operators
          </p>
        </div>
        {isEditable && (
          <div className="flex gap-2">
            <Button onClick={handleAddApplicantForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Applicant Form
            </Button>
            <Button variant="outline" onClick={handleAddGuideForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Guide Form
            </Button>
          </div>
        )}
      </div>

      {/* Empty state or table */}
      {forms.length === 0 ? (
        <EmptyState
          onAddApplicantForm={handleAddApplicantForm}
          isEditable={isEditable}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              {isEditable && <TableHead className="w-[80px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.map((form) => (
              <TableRow
                key={form.id}
                className="cursor-pointer hover:bg-black/5"
                onClick={() => handleEditForm(form.id)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-black/40" />
                    {form.name}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={formTypeBadgeVariants[form.type]}>
                    {formTypeLabels[form.type]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {form.isActive ? (
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
                          aria-label={`Actions for ${form.name}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditForm(form.id);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Fields
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:bg-red-50 focus:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(form);
                          }}
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

      {/* Create Form Dialog */}
      <CreateFormDialog
        serviceId={serviceId}
        formType={formTypeToCreate}
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCreateDialogClose();
        }}
      />
    </div>
  );
}

interface EmptyStateProps {
  onAddApplicantForm: () => void;
  isEditable: boolean;
}

function EmptyState({ onAddApplicantForm, isEditable }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/20 py-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-black/5 flex items-center justify-center">
        <FileText className="h-6 w-6 text-black/40" />
      </div>
      <h4 className="mt-4 text-base font-medium text-black">No forms yet</h4>
      <p className="mt-1 text-sm text-black/60">
        Create forms to collect data from applicants and operators.
      </p>
      {isEditable && (
        <Button onClick={onAddApplicantForm} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Add your first Applicant Form
        </Button>
      )}
    </div>
  );
}

function FormListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-24 animate-pulse bg-slate-100" />
          <div className="h-4 w-64 animate-pulse bg-slate-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-40 animate-pulse rounded bg-slate-100" />
          <div className="h-10 w-36 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
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

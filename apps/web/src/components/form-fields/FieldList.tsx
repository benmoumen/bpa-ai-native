'use client';

/**
 * FieldList Component
 *
 * Displays a list of form fields with type icons and labels.
 * Supports inline label editing, field deletion, adding new fields,
 * and field selection for property editing.
 * Swiss-style minimal design with black borders.
 */

import { useCallback, useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, Plus, GripVertical, Settings2 } from 'lucide-react';

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
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useFormFields,
  useUpdateFormField,
  useDeleteFormField,
} from '@/hooks/use-form-fields';
import type { FormField } from '@/lib/api/forms';
import { labelToFieldName } from '@/lib/api/forms';
import { getFieldTypeIcon, getFieldTypeLabel } from './FieldTypeSelector';
import { AddFieldDialog } from './AddFieldDialog';
import { cn } from '@/lib/utils';

interface FieldListProps {
  formId: string;
  isEditable?: boolean;
  /** Currently selected field ID */
  selectedFieldId?: string | null;
  /** Callback when a field is selected for property editing */
  onFieldSelect?: (field: FormField | null) => void;
}

export function FieldList({
  formId,
  isEditable = true,
  selectedFieldId,
  onFieldSelect,
}: FieldListProps) {
  const { data, isLoading, isError, error } = useFormFields(formId);
  const updateFieldMutation = useUpdateFormField(formId);
  const deleteFieldMutation = useDeleteFormField(formId);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');

  const handleFieldSelect = useCallback(
    (field: FormField) => {
      if (onFieldSelect) {
        onFieldSelect(selectedFieldId === field.id ? null : field);
      }
    },
    [onFieldSelect, selectedFieldId]
  );

  const handleAddField = useCallback(() => {
    setAddDialogOpen(true);
  }, []);

  const handleStartEdit = useCallback((field: FormField) => {
    setEditingFieldId(field.id);
    setEditingLabel(field.label);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingFieldId(null);
    setEditingLabel('');
  }, []);

  const handleSaveEdit = useCallback(
    async (fieldId: string) => {
      if (!editingLabel.trim()) {
        handleCancelEdit();
        return;
      }

      const newLabel = editingLabel.trim();
      const newName = labelToFieldName(newLabel);

      try {
        await updateFieldMutation.mutateAsync({
          id: fieldId,
          data: { label: newLabel, name: newName },
        });
        handleCancelEdit();
      } catch {
        // Error handling - mutation will show error state
      }
    },
    [editingLabel, updateFieldMutation, handleCancelEdit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, fieldId: string) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveEdit(fieldId);
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  const handleDelete = useCallback(
    async (field: FormField) => {
      if (
        window.confirm(
          `Are you sure you want to delete "${field.label}"? This action cannot be undone.`
        )
      ) {
        await deleteFieldMutation.mutateAsync(field.id);
      }
    },
    [deleteFieldMutation]
  );

  if (isLoading) {
    return <FieldListSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-lg font-medium text-red-600">Failed to load fields</p>
        <p className="mt-1 text-sm text-black/50">
          {error?.message || 'Something went wrong'}
        </p>
      </div>
    );
  }

  const fields = data?.data || [];
  // Sort fields by sortOrder
  const sortedFields = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);
  const maxSortOrder = sortedFields.length > 0
    ? Math.max(...sortedFields.map((f) => f.sortOrder))
    : -1;

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-black">Fields</h3>
          <p className="text-sm text-black/60">
            Define the data fields to collect from applicants
          </p>
        </div>
        {isEditable && (
          <Button onClick={handleAddField}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        )}
      </div>

      {/* Empty state or table */}
      {sortedFields.length === 0 ? (
        <EmptyState onAddField={handleAddField} isEditable={isEditable} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {isEditable && <TableHead className="w-[40px]" />}
              <TableHead>Label</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Required</TableHead>
              {isEditable && <TableHead className="w-[80px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedFields.map((field) => {
              const Icon = getFieldTypeIcon(field.type);
              const isEditing = editingFieldId === field.id;
              const isSelected = selectedFieldId === field.id;

              return (
                <TableRow
                  key={field.id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && 'bg-black/5'
                  )}
                  onClick={() => isEditable && handleFieldSelect(field)}
                >
                  {isEditable && (
                    <TableCell className="w-[40px]" onClick={(e) => e.stopPropagation()}>
                      <GripVertical className="h-4 w-4 text-black/30 cursor-grab" />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-black/40 flex-shrink-0" />
                      {isEditing ? (
                        <Input
                          value={editingLabel}
                          onChange={(e) => setEditingLabel(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, field.id)}
                          onBlur={() => handleSaveEdit(field.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-full max-w-xs"
                          autoFocus
                          aria-label="Edit field label"
                        />
                      ) : (
                        <span className="flex items-center gap-2">
                          {field.label}
                          {isSelected && (
                            <Settings2 className="h-3 w-3 text-black/40" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getFieldTypeLabel(field.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {field.required ? (
                      <span className="text-black">Yes</span>
                    ) : (
                      <span className="text-black/40">No</span>
                    )}
                  </TableCell>
                  {isEditable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Actions for ${field.label}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleFieldSelect(field)}>
                            <Settings2 className="mr-2 h-4 w-4" />
                            Configure Properties
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStartEdit(field)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Label
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:bg-red-50 focus:text-red-700"
                            onClick={() => handleDelete(field)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Add Field Dialog */}
      <AddFieldDialog
        formId={formId}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        nextSortOrder={maxSortOrder + 1}
      />
    </div>
  );
}

interface EmptyStateProps {
  onAddField: () => void;
  isEditable: boolean;
}

function EmptyState({ onAddField, isEditable }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/20 py-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-black/5 flex items-center justify-center">
        <Plus className="h-6 w-6 text-black/40" />
      </div>
      <h4 className="mt-4 text-base font-medium text-black">No fields yet</h4>
      <p className="mt-1 text-sm text-black/60">
        Add fields to define what data this form will collect.
      </p>
      {isEditable && (
        <Button onClick={onAddField} className="mt-4">
          <Plus className="mr-2 h-4 w-4" />
          Add your first field
        </Button>
      )}
    </div>
  );
}

function FieldListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-16 animate-pulse bg-slate-100" />
          <div className="h-4 w-64 animate-pulse bg-slate-100" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded bg-slate-100" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]" />
            <TableHead>Label</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Required</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 3 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="h-4 w-4 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-40 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-20 animate-pulse bg-slate-100" />
              </TableCell>
              <TableCell>
                <div className="h-5 w-8 animate-pulse bg-slate-100" />
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

'use client';

/**
 * AddFieldDialog Component
 *
 * Dialog for adding a new field to a form.
 * Displays the FieldTypeSelector and creates the field with default label.
 * Swiss-style minimal design.
 */

import { useCallback, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FieldTypeSelector } from './FieldTypeSelector';
import { useCreateFormField } from '@/hooks/use-form-fields';
import {
  type FieldType,
  getDefaultFieldLabel,
  labelToFieldName,
} from '@/lib/api/forms';

interface AddFieldDialogProps {
  formId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current max sortOrder in the field list, new field will be sortOrder + 1 */
  nextSortOrder?: number;
  /** Optional section ID to assign the new field to */
  sectionId?: string;
}

export function AddFieldDialog({
  formId,
  open,
  onOpenChange,
  nextSortOrder = 0,
  sectionId,
}: AddFieldDialogProps) {
  const createFieldMutation = useCreateFormField(formId);
  const [error, setError] = useState<string | null>(null);

  const handleSelectType = useCallback(
    async (type: FieldType) => {
      setError(null);

      const label = getDefaultFieldLabel(type);
      const name = labelToFieldName(label);

      try {
        await createFieldMutation.mutateAsync({
          type,
          label,
          name,
          sortOrder: nextSortOrder,
          required: false,
          properties: {},
          sectionId,
        });
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create field');
      }
    },
    [createFieldMutation, nextSortOrder, onOpenChange, sectionId]
  );

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setError(null);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Field</DialogTitle>
          <DialogDescription>
            Select the type of field you want to add to this form.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <FieldTypeSelector
          onSelect={handleSelectType}
          disabled={createFieldMutation.isPending}
        />

        {createFieldMutation.isPending && (
          <div className="flex items-center justify-center py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
            <span className="ml-2 text-sm text-black/60">Creating field...</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

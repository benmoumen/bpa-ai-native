'use client';

/**
 * LinkToDeterminantDialog Component
 *
 * Dialog for linking a form field to a determinant.
 * Allows selecting an existing determinant or creating a new one.
 * Auto-derives name and type from the field when creating.
 * Swiss-style minimal design.
 */

import { useCallback, useState } from 'react';
import { Plus, Link2, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useDeterminants,
  useCreateDeterminant,
  useLinkFieldToDeterminant,
} from '@/hooks/use-determinants';
import type { FormField } from '@/lib/api/forms';
import {
  type Determinant,
  type DeterminantType,
  FIELD_TYPE_TO_DETERMINANT_TYPE,
} from '@/lib/api/determinants';

interface LinkToDeterminantDialogProps {
  field: FormField;
  serviceId: string;
  formId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Convert field name to determinant name (snake_case)
 */
function fieldNameToDeterminantName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Get determinant type from field type
 */
function getDeterminantType(fieldType: string): DeterminantType {
  return FIELD_TYPE_TO_DETERMINANT_TYPE[fieldType] || 'STRING';
}

/**
 * Get human-readable determinant type label
 */
function getDeterminantTypeLabel(type: DeterminantType): string {
  const labels: Record<DeterminantType, string> = {
    STRING: 'Text',
    NUMBER: 'Number',
    BOOLEAN: 'Boolean',
    DATE: 'Date',
  };
  return labels[type];
}

export function LinkToDeterminantDialog({
  field,
  serviceId,
  formId,
  open,
  onOpenChange,
  onSuccess,
}: LinkToDeterminantDialogProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newDeterminantName, setNewDeterminantName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch existing determinants for the service
  const { data: determinantsResponse, isLoading } = useDeterminants(serviceId, {
    isActive: true,
  });
  const determinants = determinantsResponse?.data || [];

  // Mutations
  const createMutation = useCreateDeterminant(serviceId);
  const linkMutation = useLinkFieldToDeterminant(serviceId, formId);

  const isPending = createMutation.isPending || linkMutation.isPending;

  // Get suggested determinant info from field
  const suggestedName = fieldNameToDeterminantName(field.name);
  const determinantType = getDeterminantType(field.type);

  // Filter determinants to match field type
  const compatibleDeterminants = determinants.filter(
    (d: Determinant) => d.type === determinantType
  );

  const handleSelectDeterminant = useCallback((id: string) => {
    setSelectedId(id);
    setError(null);
  }, []);

  const handleLinkExisting = useCallback(async () => {
    if (!selectedId) return;

    setError(null);
    try {
      await linkMutation.mutateAsync({
        fieldId: field.id,
        determinantId: selectedId,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link determinant');
    }
  }, [selectedId, field.id, linkMutation, onSuccess, onOpenChange]);

  const handleCreateAndLink = useCallback(async () => {
    const name = newDeterminantName.trim() || suggestedName;

    if (!name) {
      setError('Determinant name is required');
      return;
    }

    setError(null);
    try {
      // First create the determinant
      const created = await createMutation.mutateAsync({
        name,
        type: determinantType,
        sourceFieldId: field.id,
      });

      // Then link the field to it
      await linkMutation.mutateAsync({
        fieldId: field.id,
        determinantId: created.id,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create and link determinant');
    }
  }, [
    newDeterminantName,
    suggestedName,
    determinantType,
    field.id,
    createMutation,
    linkMutation,
    onSuccess,
    onOpenChange,
  ]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        // Reset state when closing
        setMode('select');
        setSelectedId(null);
        setNewDeterminantName('');
        setError(null);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link to Determinant</DialogTitle>
          <DialogDescription>
            Connect this field to a business rule variable for workflow decisions.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Field Info */}
        <div className="rounded-md bg-black/5 px-3 py-2 mb-4">
          <p className="text-sm text-black/70">
            Field: <span className="font-medium">{field.label}</span>
          </p>
          <p className="text-xs text-black/50">
            Will create <span className="font-mono">{getDeterminantTypeLabel(determinantType)}</span> determinant
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('select')}
            disabled={isPending}
            className="flex-1"
          >
            <Link2 className="mr-1.5 h-4 w-4" />
            Select Existing
          </Button>
          <Button
            variant={mode === 'create' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('create')}
            disabled={isPending}
            className="flex-1"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Create New
          </Button>
        </div>

        {mode === 'select' ? (
          <>
            {/* Existing Determinants List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
              </div>
            ) : compatibleDeterminants.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-black/50">
                  No compatible determinants found.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setMode('create')}
                  className="mt-2"
                >
                  Create a new one
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {compatibleDeterminants.map((d: Determinant) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleSelectDeterminant(d.id)}
                    disabled={isPending}
                    className={`w-full text-left px-3 py-2 rounded-md border transition-colors ${
                      selectedId === d.id
                        ? 'border-black bg-black/5'
                        : 'border-black/10 hover:border-black/30 hover:bg-black/[0.02]'
                    }`}
                  >
                    <p className="text-sm font-medium font-mono">{d.name}</p>
                    <p className="text-xs text-black/50">
                      {getDeterminantTypeLabel(d.type)}
                      {d.linkedFieldCount !== undefined &&
                        ` · ${d.linkedFieldCount} field${d.linkedFieldCount !== 1 ? 's' : ''} linked`}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Link Button */}
            {compatibleDeterminants.length > 0 && (
              <Button
                onClick={handleLinkExisting}
                disabled={!selectedId || isPending}
                className="w-full mt-4"
              >
                {isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Linking...
                  </>
                ) : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Link to Determinant
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Create New Determinant Form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="determinant-name">Determinant Name</Label>
                <Input
                  id="determinant-name"
                  value={newDeterminantName}
                  onChange={(e) => setNewDeterminantName(e.target.value)}
                  placeholder={suggestedName}
                  disabled={isPending}
                  className="font-mono"
                />
                <p className="text-xs text-black/50">
                  Leave empty to use suggested: <span className="font-mono">{suggestedName}</span>
                </p>
              </div>

              <div className="rounded-md bg-black/5 px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-black/70">Type:</span>
                  <span className="font-medium">{getDeterminantTypeLabel(determinantType)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-black/70">Source:</span>
                  <span className="font-mono text-xs">{field.name}</span>
                </div>
              </div>
            </div>

            {/* Create and Link Button */}
            <Button
              onClick={handleCreateAndLink}
              disabled={isPending}
              className="w-full mt-4"
            >
              {isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Create & Link
                </>
              )}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

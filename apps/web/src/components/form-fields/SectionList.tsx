'use client';

/**
 * SectionList Component
 *
 * Displays form fields organized into collapsible sections.
 * Includes an "Unsectioned Fields" group for fields without a section.
 * Supports adding sections, moving fields between sections,
 * and editing section/field properties.
 * Swiss-style minimal design with black borders.
 */

import { useCallback, useState, useMemo } from 'react';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
  Settings2,
  FolderInput,
} from 'lucide-react';

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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useFormFields,
  useUpdateFormField,
  useDeleteFormField,
} from '@/hooks/use-form-fields';
import {
  useFormSections,
  useCreateFormSection,
  useUpdateFormSection,
  useDeleteFormSection,
} from '@/hooks/use-form-sections';
import type { FormField, FormSection } from '@/lib/api/forms';
import { labelToFieldName } from '@/lib/api/forms';
import { getFieldTypeIcon, getFieldTypeLabel } from './FieldTypeSelector';
import { AddFieldDialog } from './AddFieldDialog';
import { SectionHeader } from './SectionHeader';
import { cn } from '@/lib/utils';

interface SectionListProps {
  formId: string;
  isEditable?: boolean;
  /** Currently selected field ID for property editing */
  selectedFieldId?: string | null;
  /** Currently selected section ID for property editing */
  selectedSectionId?: string | null;
  /** Callback when a field is selected for property editing */
  onFieldSelect?: (field: FormField | null) => void;
  /** Callback when a section is selected for property editing */
  onSectionSelect?: (section: FormSection | null) => void;
}

export function SectionList({
  formId,
  isEditable = true,
  selectedFieldId,
  selectedSectionId,
  onFieldSelect,
  onSectionSelect,
}: SectionListProps) {
  // Fetch data
  const {
    data: fieldsData,
    isLoading: fieldsLoading,
    isError: fieldsError,
    error: fieldsErr,
  } = useFormFields(formId);
  const {
    data: sectionsData,
    isLoading: sectionsLoading,
    isError: sectionsError,
    error: sectionsErr,
  } = useFormSections(formId);

  // Mutations
  const updateFieldMutation = useUpdateFormField(formId);
  const deleteFieldMutation = useDeleteFormField(formId);
  const createSectionMutation = useCreateFormSection(formId);
  const updateSectionMutation = useUpdateFormSection(formId);
  const deleteSectionMutation = useDeleteFormSection(formId);

  // Local state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addToSectionId, setAddToSectionId] = useState<string | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  // Track which sections user has explicitly collapsed (default: all expanded)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  // Derived data
  const fields = useMemo(() => fieldsData?.data || [], [fieldsData]);
  const sections = useMemo(() => {
    const data = sectionsData?.data || [];
    return [...data].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [sectionsData]);

  // Derive expanded state: section is expanded if NOT in collapsed set
  const isSectionExpanded = useCallback(
    (sectionId: string) => !collapsedSections.has(sectionId),
    [collapsedSections]
  );

  // Group fields by section
  const fieldsBySection = useMemo(() => {
    const grouped: Record<string, FormField[]> = {};
    const unsectioned: FormField[] = [];

    // Sort fields by sortOrder
    const sortedFields = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);

    for (const field of sortedFields) {
      if (field.sectionId) {
        if (!grouped[field.sectionId]) {
          grouped[field.sectionId] = [];
        }
        grouped[field.sectionId].push(field);
      } else {
        unsectioned.push(field);
      }
    }

    return { grouped, unsectioned };
  }, [fields]);

  // Calculate max sort orders for adding new items
  const maxFieldSortOrder = useMemo(() => {
    return fields.length > 0
      ? Math.max(...fields.map((f) => f.sortOrder))
      : -1;
  }, [fields]);

  const maxSectionSortOrder = useMemo(() => {
    return sections.length > 0
      ? Math.max(...sections.map((s) => s.sortOrder))
      : -1;
  }, [sections]);

  // Handlers
  const handleFieldSelect = useCallback(
    (field: FormField) => {
      if (onFieldSelect) {
        onFieldSelect(selectedFieldId === field.id ? null : field);
      }
      if (onSectionSelect) {
        onSectionSelect(null);
      }
    },
    [onFieldSelect, onSectionSelect, selectedFieldId]
  );

  const handleSectionSelect = useCallback(
    (section: FormSection) => {
      if (onSectionSelect) {
        onSectionSelect(selectedSectionId === section.id ? null : section);
      }
      if (onFieldSelect) {
        onFieldSelect(null);
      }
    },
    [onSectionSelect, onFieldSelect, selectedSectionId]
  );

  const handleToggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      // Toggle: if collapsed, expand (remove from set); if expanded, collapse (add to set)
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  const handleAddSection = useCallback(async () => {
    try {
      await createSectionMutation.mutateAsync({
        name: 'New Section',
        sortOrder: maxSectionSortOrder + 1,
      });
      // New sections are expanded by default (not in collapsedSections set)
    } catch {
      // Error handled by mutation
    }
  }, [createSectionMutation, maxSectionSortOrder]);

  const handleAddField = useCallback(
    (sectionId?: string | null) => {
      setAddToSectionId(sectionId || null);
      setAddDialogOpen(true);
    },
    []
  );

  const handleStartFieldEdit = useCallback((field: FormField) => {
    setEditingFieldId(field.id);
    setEditingLabel(field.label);
  }, []);

  const handleCancelFieldEdit = useCallback(() => {
    setEditingFieldId(null);
    setEditingLabel('');
  }, []);

  const handleSaveFieldEdit = useCallback(
    async (fieldId: string) => {
      if (!editingLabel.trim()) {
        handleCancelFieldEdit();
        return;
      }

      const newLabel = editingLabel.trim();
      const newName = labelToFieldName(newLabel);

      try {
        await updateFieldMutation.mutateAsync({
          id: fieldId,
          data: { label: newLabel, name: newName },
        });
        handleCancelFieldEdit();
      } catch {
        // Error handling - mutation will show error state
      }
    },
    [editingLabel, updateFieldMutation, handleCancelFieldEdit]
  );

  const handleFieldKeyDown = useCallback(
    (e: React.KeyboardEvent, fieldId: string) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveFieldEdit(fieldId);
      } else if (e.key === 'Escape') {
        handleCancelFieldEdit();
      }
    },
    [handleSaveFieldEdit, handleCancelFieldEdit]
  );

  const handleDeleteField = useCallback(
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

  const handleMoveFieldToSection = useCallback(
    async (fieldId: string, sectionId: string | null) => {
      try {
        await updateFieldMutation.mutateAsync({
          id: fieldId,
          data: { sectionId },
        });
      } catch {
        // Error handled by mutation
      }
    },
    [updateFieldMutation]
  );

  const handleUpdateSectionName = useCallback(
    async (sectionId: string, name: string) => {
      try {
        await updateSectionMutation.mutateAsync({
          id: sectionId,
          data: { name },
        });
      } catch {
        // Error handled by mutation
      }
    },
    [updateSectionMutation]
  );

  const handleDeleteSection = useCallback(
    async (section: FormSection) => {
      const fieldCount = fieldsBySection.grouped[section.id]?.length || 0;
      const message =
        fieldCount > 0
          ? `Are you sure you want to delete "${section.name}"? The ${fieldCount} field(s) in this section will become unsectioned.`
          : `Are you sure you want to delete "${section.name}"?`;

      if (window.confirm(message)) {
        await deleteSectionMutation.mutateAsync(section.id);
      }
    },
    [deleteSectionMutation, fieldsBySection.grouped]
  );

  // Loading state
  if (fieldsLoading || sectionsLoading) {
    return <SectionListSkeleton />;
  }

  // Error state
  if (fieldsError || sectionsError) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-lg font-medium text-red-600">Failed to load data</p>
        <p className="mt-1 text-sm text-black/50">
          {fieldsErr?.message || sectionsErr?.message || 'Something went wrong'}
        </p>
      </div>
    );
  }

  const hasNoContent = sections.length === 0 && fields.length === 0;

  return (
    <div className="space-y-4">
      {/* Header with Add buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-black">Form Structure</h3>
          <p className="text-sm text-black/60">
            Organize fields into sections for better user experience
          </p>
        </div>
        {isEditable && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleAddSection}>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
            </Button>
            <Button onClick={() => handleAddField(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Field
            </Button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {hasNoContent ? (
        <EmptyState
          onAddSection={handleAddSection}
          onAddField={() => handleAddField(null)}
          isEditable={isEditable}
        />
      ) : (
        <div className="rounded-lg border border-black/10 overflow-hidden">
          {/* Sections */}
          {sections.map((section) => {
            const sectionFields = fieldsBySection.grouped[section.id] || [];
            const isExpanded = isSectionExpanded(section.id);
            const isSelected = selectedSectionId === section.id;

            return (
              <div key={section.id}>
                <SectionHeader
                  section={section}
                  isExpanded={isExpanded}
                  fieldCount={sectionFields.length}
                  isEditable={isEditable}
                  isSelected={isSelected}
                  onToggle={() => handleToggleSection(section.id)}
                  onDelete={handleDeleteSection}
                  onSelect={handleSectionSelect}
                  onUpdateName={(name) => handleUpdateSectionName(section.id, name)}
                />

                {/* Section Fields */}
                {isExpanded && (
                  <div className="bg-white">
                    {sectionFields.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-black/50">No fields in this section</p>
                        {isEditable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddField(section.id)}
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add field to this section
                          </Button>
                        )}
                      </div>
                    ) : (
                      <FieldsTable
                        fields={sectionFields}
                        sections={sections}
                        isEditable={isEditable}
                        selectedFieldId={selectedFieldId}
                        editingFieldId={editingFieldId}
                        editingLabel={editingLabel}
                        setEditingLabel={setEditingLabel}
                        onFieldSelect={handleFieldSelect}
                        onStartEdit={handleStartFieldEdit}
                        onSaveEdit={handleSaveFieldEdit}
                        onKeyDown={handleFieldKeyDown}
                        onDelete={handleDeleteField}
                        onMoveToSection={handleMoveFieldToSection}
                        showDragHandle={true}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Unsectioned Fields */}
          {fieldsBySection.unsectioned.length > 0 && (
            <div>
              <div className="flex items-center gap-2 px-4 py-3 bg-black/[0.02] border-t border-black/10">
                <span className="text-sm font-medium text-black/70">
                  Unsectioned Fields
                </span>
                <Badge variant="secondary">
                  {fieldsBySection.unsectioned.length}
                </Badge>
              </div>
              <div className="bg-white border-t border-black/10">
                <FieldsTable
                  fields={fieldsBySection.unsectioned}
                  sections={sections}
                  isEditable={isEditable}
                  selectedFieldId={selectedFieldId}
                  editingFieldId={editingFieldId}
                  editingLabel={editingLabel}
                  setEditingLabel={setEditingLabel}
                  onFieldSelect={handleFieldSelect}
                  onStartEdit={handleStartFieldEdit}
                  onSaveEdit={handleSaveFieldEdit}
                  onKeyDown={handleFieldKeyDown}
                  onDelete={handleDeleteField}
                  onMoveToSection={handleMoveFieldToSection}
                  showDragHandle={true}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Field Dialog */}
      <AddFieldDialog
        formId={formId}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        nextSortOrder={maxFieldSortOrder + 1}
        sectionId={addToSectionId || undefined}
      />
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface FieldsTableProps {
  fields: FormField[];
  sections: FormSection[];
  isEditable: boolean;
  selectedFieldId?: string | null;
  editingFieldId: string | null;
  editingLabel: string;
  setEditingLabel: (label: string) => void;
  onFieldSelect: (field: FormField) => void;
  onStartEdit: (field: FormField) => void;
  onSaveEdit: (fieldId: string) => void;
  onKeyDown: (e: React.KeyboardEvent, fieldId: string) => void;
  onDelete: (field: FormField) => void;
  onMoveToSection: (fieldId: string, sectionId: string | null) => void;
  showDragHandle: boolean;
}

function FieldsTable({
  fields,
  sections,
  isEditable,
  selectedFieldId,
  editingFieldId,
  editingLabel,
  setEditingLabel,
  onFieldSelect,
  onStartEdit,
  onSaveEdit,
  onKeyDown,
  onDelete,
  onMoveToSection,
  showDragHandle,
}: FieldsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {isEditable && showDragHandle && <TableHead className="w-[40px]" />}
          <TableHead>Label</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Required</TableHead>
          {isEditable && <TableHead className="w-[80px]">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {fields.map((field) => {
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
              onClick={() => isEditable && onFieldSelect(field)}
            >
              {isEditable && showDragHandle && (
                <TableCell
                  className="w-[40px]"
                  onClick={(e) => e.stopPropagation()}
                >
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
                      onKeyDown={(e) => onKeyDown(e, field.id)}
                      onBlur={() => onSaveEdit(field.id)}
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
                <Badge variant="secondary">{getFieldTypeLabel(field.type)}</Badge>
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
                      <DropdownMenuItem onClick={() => onFieldSelect(field)}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        Configure Properties
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStartEdit(field)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Label
                      </DropdownMenuItem>

                      {/* Move to Section submenu */}
                      {sections.length > 0 && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <FolderInput className="mr-2 h-4 w-4" />
                            Move to Section
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {field.sectionId && (
                              <DropdownMenuItem
                                onClick={() => onMoveToSection(field.id, null)}
                              >
                                Unsectioned
                              </DropdownMenuItem>
                            )}
                            {sections.map((section) => (
                              <DropdownMenuItem
                                key={section.id}
                                onClick={() => onMoveToSection(field.id, section.id)}
                                disabled={section.id === field.sectionId}
                              >
                                {section.name}
                                {section.id === field.sectionId && ' (current)'}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:bg-red-50 focus:text-red-700"
                        onClick={() => onDelete(field)}
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
  );
}

interface EmptyStateProps {
  onAddSection: () => void;
  onAddField: () => void;
  isEditable: boolean;
}

function EmptyState({ onAddSection, onAddField, isEditable }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/20 py-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-black/5 flex items-center justify-center">
        <Plus className="h-6 w-6 text-black/40" />
      </div>
      <h4 className="mt-4 text-base font-medium text-black">No form structure yet</h4>
      <p className="mt-1 text-sm text-black/60 max-w-sm">
        Start by adding sections to organize your fields, or add fields directly.
      </p>
      {isEditable && (
        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" onClick={onAddSection}>
            <Plus className="mr-2 h-4 w-4" />
            Add Section
          </Button>
          <Button onClick={onAddField}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        </div>
      )}
    </div>
  );
}

function SectionListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 animate-pulse bg-slate-100" />
          <div className="h-4 w-64 animate-pulse bg-slate-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 animate-pulse rounded bg-slate-100" />
          <div className="h-10 w-24 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="rounded-lg border border-black/10 overflow-hidden">
        {/* Section skeleton */}
        <div className="bg-black/[0.02] px-4 py-3 border-b border-black/10">
          <div className="h-5 w-40 animate-pulse bg-slate-100" />
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
    </div>
  );
}

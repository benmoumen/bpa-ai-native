'use client';

/**
 * SectionPropertiesPanel Component
 *
 * A panel that displays and allows editing of section properties.
 * Shows title, description, and collapsible toggle.
 * Swiss-style minimal design.
 */

import { useCallback, useState } from 'react';
import { X, Save, Layers } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateFormSection } from '@/hooks/use-form-sections';
import type { FormSection, UpdateFormSectionInput } from '@/lib/api/forms';

interface SectionPropertiesPanelProps {
  section: FormSection;
  formId: string;
  onClose: () => void;
}

/**
 * Wrapper component that uses key to reset state when section changes
 */
export function SectionPropertiesPanel(props: SectionPropertiesPanelProps) {
  return <SectionPropertiesPanelInner key={props.section.id} {...props} />;
}

function SectionPropertiesPanelInner({
  section,
  formId,
  onClose,
}: SectionPropertiesPanelProps) {
  const updateSectionMutation = useUpdateFormSection(formId);

  // Local state for form values - initialized from section props
  const [name, setName] = useState(section.name);
  const [description, setDescription] = useState(section.description || '');

  // Track if form has unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    setHasChanges(true);
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    const data: UpdateFormSectionInput = {
      name: name.trim(),
      description: description.trim() || null,
    };

    try {
      await updateSectionMutation.mutateAsync({ id: section.id, data });
      setHasChanges(false);
    } catch {
      // Error handling - mutation will show error state
    }
  }, [section.id, name, description, updateSectionMutation]);

  return (
    <div className="flex h-full flex-col border-l border-black/10 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-black/60" />
          <h3 className="text-base font-medium text-black">Section Properties</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
          aria-label="Close properties panel"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-6">
          {/* Section Info */}
          <div className="rounded-md bg-black/5 px-3 py-2">
            <span className="text-sm text-black/70">
              Fields: <span className="font-medium">{section.fieldCount ?? 0}</span>
            </span>
          </div>

          {/* Section Properties */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-black/70 uppercase tracking-wide">
              Section Properties
            </h4>

            {/* Name/Title */}
            <div className="space-y-1.5">
              <Label htmlFor="section-name">Title</Label>
              <Input
                id="section-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Section title"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="section-description">Description</Label>
              <Textarea
                id="section-description"
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Optional description shown under the title"
                rows={3}
              />
              <p className="text-xs text-black/50">
                This text appears below the section title
              </p>
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-black/70 uppercase tracking-wide">
              Display Options
            </h4>

            <p className="text-sm text-black/60">
              Collapse state is managed per-session and not persisted.
              Users can expand/collapse sections as needed.
            </p>
          </div>
        </div>
      </div>

      {/* Footer with Save button */}
      <div className="border-t border-black/10 px-4 py-3">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateSectionMutation.isPending || !name.trim()}
          className="w-full"
        >
          {updateSectionMutation.isPending ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        {updateSectionMutation.isError && (
          <p className="mt-2 text-sm text-red-600">
            Failed to save: {updateSectionMutation.error?.message}
          </p>
        )}
      </div>
    </div>
  );
}

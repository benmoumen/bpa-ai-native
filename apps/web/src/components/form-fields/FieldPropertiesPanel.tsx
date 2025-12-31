'use client';

/**
 * FieldPropertiesPanel Component
 *
 * A panel that displays and allows editing of field properties.
 * Shows common properties (label, name, required, placeholder, helpText)
 * and type-specific properties based on the field type.
 * Swiss-style minimal design.
 */

import { useCallback, useState } from 'react';
import { X, Link2, Link2Off, Save, Settings2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateFormField } from '@/hooks/use-form-fields';
import type { FormField, UpdateFormFieldInput } from '@/lib/api/forms';
import { labelToFieldName } from '@/lib/api/forms';
import { getFieldTypeLabel } from './FieldTypeSelector';
import { TextFieldProperties } from './TextFieldProperties';
import { NumberFieldProperties } from './NumberFieldProperties';
import { SelectFieldProperties } from './SelectFieldProperties';
import { DateFieldProperties } from './DateFieldProperties';
import { FileFieldProperties } from './FileFieldProperties';

interface FieldPropertiesPanelProps {
  field: FormField;
  formId: string;
  onClose: () => void;
}

/**
 * Wrapper component that uses key to reset state when field changes
 */
export function FieldPropertiesPanel(props: FieldPropertiesPanelProps) {
  return <FieldPropertiesPanelInner key={props.field.id} {...props} />;
}

function FieldPropertiesPanelInner({
  field,
  formId,
  onClose,
}: FieldPropertiesPanelProps) {
  const updateFieldMutation = useUpdateFormField(formId);

  // Local state for form values - initialized from field props
  // State resets when field.id changes due to key prop on wrapper
  const [label, setLabel] = useState(field.label);
  const [name, setName] = useState(field.name);
  const [required, setRequired] = useState(field.required);
  const [placeholder, setPlaceholder] = useState(
    (field.properties?.placeholder as string) || ''
  );
  const [helpText, setHelpText] = useState(
    (field.properties?.helpText as string) || ''
  );
  const [properties, setProperties] = useState<Record<string, unknown>>(
    field.properties || {}
  );

  // Track if name is linked to label (auto-generated)
  const [isNameLinked, setIsNameLinked] = useState(
    labelToFieldName(field.label) === field.name
  );

  // Track if form has unsaved changes
  const [hasChanges, setHasChanges] = useState(false);

  // Auto-update name when label changes (if linked)
  const handleLabelChange = useCallback(
    (newLabel: string) => {
      setLabel(newLabel);
      if (isNameLinked) {
        setName(labelToFieldName(newLabel));
      }
      setHasChanges(true);
    },
    [isNameLinked]
  );

  const handleNameChange = useCallback((newName: string) => {
    setName(newName);
    setHasChanges(true);
  }, []);

  const handleRequiredChange = useCallback((checked: boolean) => {
    setRequired(checked);
    setHasChanges(true);
  }, []);

  const handlePlaceholderChange = useCallback((value: string) => {
    setPlaceholder(value);
    setHasChanges(true);
  }, []);

  const handleHelpTextChange = useCallback((value: string) => {
    setHelpText(value);
    setHasChanges(true);
  }, []);

  const handlePropertiesChange = useCallback(
    (newProps: Record<string, unknown>) => {
      setProperties((prev) => ({ ...prev, ...newProps }));
      setHasChanges(true);
    },
    []
  );

  const toggleNameLink = useCallback(() => {
    if (!isNameLinked) {
      // Re-link: sync name to label
      setName(labelToFieldName(label));
      setHasChanges(true);
    }
    setIsNameLinked(!isNameLinked);
  }, [isNameLinked, label]);

  const handleSave = useCallback(async () => {
    const data: UpdateFormFieldInput = {
      label: label.trim(),
      name: name.trim() || labelToFieldName(label.trim()),
      required,
      properties: {
        ...properties,
        placeholder: placeholder.trim() || undefined,
        helpText: helpText.trim() || undefined,
      },
    };

    // Remove undefined values from properties
    Object.keys(data.properties!).forEach((key) => {
      if (data.properties![key] === undefined) {
        delete data.properties![key];
      }
    });

    try {
      await updateFieldMutation.mutateAsync({ id: field.id, data });
      setHasChanges(false);
    } catch {
      // Error handling - mutation will show error state
    }
  }, [
    field.id,
    label,
    name,
    required,
    placeholder,
    helpText,
    properties,
    updateFieldMutation,
  ]);

  // Render type-specific properties
  const renderTypeProperties = () => {
    switch (field.type) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'EMAIL':
      case 'PHONE':
        return (
          <TextFieldProperties
            minLength={(properties.minLength as number) || undefined}
            maxLength={(properties.maxLength as number) || undefined}
            onChange={handlePropertiesChange}
          />
        );

      case 'NUMBER':
        return (
          <NumberFieldProperties
            min={(properties.min as number) || undefined}
            max={(properties.max as number) || undefined}
            decimalPlaces={(properties.decimalPlaces as number) || undefined}
            onChange={handlePropertiesChange}
          />
        );

      case 'SELECT':
      case 'RADIO':
      case 'CHECKBOX':
        return (
          <SelectFieldProperties
            options={
              (properties.options as Array<{ label: string; value: string }>) ||
              []
            }
            onChange={handlePropertiesChange}
          />
        );

      case 'DATE':
        return (
          <DateFieldProperties
            minDate={(properties.minDate as string) || undefined}
            maxDate={(properties.maxDate as string) || undefined}
            onChange={handlePropertiesChange}
          />
        );

      case 'FILE':
        return (
          <FileFieldProperties
            acceptedTypes={(properties.acceptedTypes as string[]) || []}
            maxSizeKB={(properties.maxSizeKB as number) || undefined}
            onChange={handlePropertiesChange}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col border-l border-black/10 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-black/60" />
          <h3 className="text-base font-medium text-black">Field Properties</h3>
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
          {/* Field Type Badge */}
          <div className="rounded-md bg-black/5 px-3 py-2">
            <span className="text-sm text-black/70">
              Type: <span className="font-medium">{getFieldTypeLabel(field.type)}</span>
            </span>
          </div>

          {/* Common Properties */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-black/70 uppercase tracking-wide">
              Common Properties
            </h4>

            {/* Label */}
            <div className="space-y-1.5">
              <Label htmlFor="field-label">Label</Label>
              <Input
                id="field-label"
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Field label"
              />
            </div>

            {/* Name with link toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="field-name">Name (identifier)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleNameLink}
                  className="h-6 px-2 text-xs"
                  title={
                    isNameLinked
                      ? 'Unlink from label'
                      : 'Link to label (auto-generate)'
                  }
                >
                  {isNameLinked ? (
                    <>
                      <Link2 className="mr-1 h-3 w-3" />
                      Linked
                    </>
                  ) : (
                    <>
                      <Link2Off className="mr-1 h-3 w-3" />
                      Custom
                    </>
                  )}
                </Button>
              </div>
              <Input
                id="field-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="fieldName"
                disabled={isNameLinked}
                className={isNameLinked ? 'bg-black/5' : ''}
              />
              <p className="text-xs text-black/50">
                Used as the property name in form data
              </p>
            </div>

            {/* Required */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="field-required"
                checked={required}
                onChange={(e) => handleRequiredChange(e.target.checked)}
                className="h-4 w-4 border-black/20 text-black focus:ring-black focus:ring-offset-0"
              />
              <Label htmlFor="field-required" className="cursor-pointer">
                Required field
              </Label>
            </div>

            {/* Placeholder */}
            <div className="space-y-1.5">
              <Label htmlFor="field-placeholder">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={placeholder}
                onChange={(e) => handlePlaceholderChange(e.target.value)}
                placeholder="Hint text shown in empty field"
              />
            </div>

            {/* Help Text */}
            <div className="space-y-1.5">
              <Label htmlFor="field-helptext">Help Text</Label>
              <Textarea
                id="field-helptext"
                value={helpText}
                onChange={(e) => handleHelpTextChange(e.target.value)}
                placeholder="Additional guidance for the user"
                rows={2}
              />
            </div>
          </div>

          {/* Type-specific Properties */}
          {renderTypeProperties() && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-black/70 uppercase tracking-wide">
                Type-specific Properties
              </h4>
              {renderTypeProperties()}
            </div>
          )}
        </div>
      </div>

      {/* Footer with Save button */}
      <div className="border-t border-black/10 px-4 py-3">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateFieldMutation.isPending}
          className="w-full"
        >
          {updateFieldMutation.isPending ? (
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
        {updateFieldMutation.isError && (
          <p className="mt-2 text-sm text-red-600">
            Failed to save: {updateFieldMutation.error?.message}
          </p>
        )}
      </div>
    </div>
  );
}

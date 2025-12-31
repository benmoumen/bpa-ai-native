'use client';

/**
 * FormPreviewField Component
 *
 * Renders a single form field with appropriate input type,
 * label, help text, and validation error display.
 */

import { Label } from '@/components/ui/label';
import type { FormField } from '@/lib/api/forms';
import {
  TextPreview,
  NumberPreview,
  SelectPreview,
  DatePreview,
  FilePreview,
} from './fields';
import { validateField } from './utils/validateField';

interface FormPreviewFieldProps {
  field: FormField;
  value: string | number | boolean | undefined;
  onChange: (fieldName: string, value: string | number | boolean | undefined) => void;
  showValidation?: boolean;
}

export function FormPreviewField({
  field,
  value,
  onChange,
  showValidation = false,
}: FormPreviewFieldProps) {
  const properties = field.properties || {};
  const helpText = properties.helpText as string | undefined;

  // Validate field if validation is enabled
  const validation = showValidation ? validateField(field, value) : { isValid: true };
  const error = validation.isValid ? undefined : validation.error;
  const errorId = `preview-${field.id}-error`;

  const handleChange = (newValue: string | number | boolean | undefined) => {
    onChange(field.name, newValue);
  };

  const fieldType = field.type.toUpperCase();

  // Render appropriate field component based on type
  const renderField = () => {
    switch (fieldType) {
      case 'TEXT':
      case 'TEXTAREA':
      case 'EMAIL':
      case 'PHONE':
        return (
          <TextPreview
            field={field}
            value={String(value || '')}
            onChange={handleChange}
            error={error}
          />
        );

      case 'NUMBER':
        return (
          <NumberPreview
            field={field}
            value={value as number | string}
            onChange={handleChange}
            error={error}
          />
        );

      case 'SELECT':
      case 'RADIO':
      case 'CHECKBOX':
        return (
          <SelectPreview
            field={field}
            value={value as string | boolean}
            onChange={handleChange}
            error={error}
          />
        );

      case 'DATE':
        return (
          <DatePreview
            field={field}
            value={String(value || '')}
            onChange={handleChange}
            error={error}
          />
        );

      case 'FILE':
        return <FilePreview field={field} error={error} />;

      default:
        return (
          <TextPreview
            field={field}
            value={String(value || '')}
            onChange={handleChange}
            error={error}
          />
        );
    }
  };

  // Checkbox has its own label inline, skip wrapper label
  if (fieldType === 'CHECKBOX') {
    return (
      <div className="space-y-1">
        {renderField()}
        {helpText && <p className="text-xs text-black/50">{helpText}</p>}
        {error && <p id={errorId} className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={`preview-${field.id}`}>
        {field.label}
        {field.required && <span className="ml-1 text-red-600">*</span>}
      </Label>
      {renderField()}
      {helpText && <p className="text-xs text-black/50">{helpText}</p>}
      {error && <p id={errorId} className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

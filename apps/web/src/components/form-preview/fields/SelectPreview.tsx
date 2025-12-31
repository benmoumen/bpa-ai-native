'use client';

/**
 * SelectPreview Component
 *
 * Renders select-based fields (SELECT, RADIO, CHECKBOX) in preview mode.
 */

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FormField } from '@/lib/api/forms';

interface SelectPreviewProps {
  field: FormField;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
  error?: string;
  disabled?: boolean;
}

export function SelectPreview({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: SelectPreviewProps) {
  const properties = field.properties || {};
  const options = (properties.options as { label: string; value: string }[]) || [];
  const placeholder = (properties.placeholder as string) || 'Select an option';

  const fieldType = field.type.toUpperCase();
  const inputId = `preview-${field.id}`;
  const errorId = error ? `${inputId}-error` : undefined;

  // Checkbox - single boolean toggle
  if (fieldType === 'CHECKBOX') {
    const isChecked = value === true;
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={inputId}
          checked={isChecked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className={`h-4 w-4 border-black/20 text-black focus:ring-black focus:ring-offset-0 ${
            error ? 'border-red-500' : ''
          }`}
          aria-invalid={!!error}
          aria-describedby={errorId}
        />
        <Label htmlFor={inputId} className="cursor-pointer text-sm">
          {field.label}
        </Label>
      </div>
    );
  }

  // Radio buttons
  if (fieldType === 'RADIO') {
    if (options.length === 0) {
      return (
        <p className="text-sm text-black/50 italic">No options configured</p>
      );
    }
    return (
      <RadioGroup
        value={String(value || '')}
        onValueChange={onChange}
        disabled={disabled}
        className={`space-y-2 ${error ? 'border-l-2 border-red-500 pl-2' : ''}`}
        aria-invalid={!!error}
        aria-describedby={errorId}
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center gap-2">
            <RadioGroupItem
              value={option.value}
              id={`${inputId}-${option.value}`}
            />
            <Label
              htmlFor={`${inputId}-${option.value}`}
              className="cursor-pointer text-sm"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  // Select dropdown (default)
  if (options.length === 0) {
    return (
      <p className="text-sm text-black/50 italic">No options configured</p>
    );
  }

  return (
    <Select
      value={String(value || '')}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger
        id={inputId}
        className={error ? 'border-red-500' : ''}
        aria-invalid={!!error}
        aria-describedby={errorId}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

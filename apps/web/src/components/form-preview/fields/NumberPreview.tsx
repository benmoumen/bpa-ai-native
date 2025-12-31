'use client';

/**
 * NumberPreview Component
 *
 * Renders number input fields in preview mode.
 */

import { Input } from '@/components/ui/input';
import type { FormField } from '@/lib/api/forms';

interface NumberPreviewProps {
  field: FormField;
  value: string | number;
  onChange: (value: number | undefined) => void;
  error?: string;
  disabled?: boolean;
}

export function NumberPreview({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: NumberPreviewProps) {
  const properties = field.properties || {};
  const placeholder = (properties.placeholder as string) || '';
  const min = properties.min as number | undefined;
  const max = properties.max as number | undefined;
  const decimalPlaces = properties.decimalPlaces as number | undefined;

  const inputId = `preview-${field.id}`;
  const errorId = error ? `${inputId}-error` : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(undefined);
    } else {
      const num = parseFloat(val);
      if (!isNaN(num)) {
        onChange(num);
      }
    }
  };

  // Format step based on decimal places
  const step = decimalPlaces !== undefined ? Math.pow(10, -decimalPlaces) : 'any';

  return (
    <Input
      id={inputId}
      type="number"
      value={value === undefined ? '' : String(value)}
      onChange={handleChange}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      className={error ? 'border-red-500' : ''}
      aria-invalid={!!error}
      aria-describedby={errorId}
    />
  );
}

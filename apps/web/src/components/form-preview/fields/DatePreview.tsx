'use client';

/**
 * DatePreview Component
 *
 * Renders date input fields in preview mode.
 */

import { Input } from '@/components/ui/input';
import type { FormField } from '@/lib/api/forms';

interface DatePreviewProps {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function DatePreview({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: DatePreviewProps) {
  const properties = field.properties || {};
  const minDate = properties.minDate as string | undefined;
  const maxDate = properties.maxDate as string | undefined;

  const inputId = `preview-${field.id}`;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <Input
      id={inputId}
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      min={minDate}
      max={maxDate}
      disabled={disabled}
      className={error ? 'border-red-500' : ''}
      aria-invalid={!!error}
      aria-describedby={errorId}
    />
  );
}

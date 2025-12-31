'use client';

/**
 * TextPreview Component
 *
 * Renders text-based fields (TEXT, TEXTAREA, EMAIL, PHONE) in preview mode.
 */

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { FormField } from '@/lib/api/forms';

interface TextPreviewProps {
  field: FormField;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function TextPreview({
  field,
  value,
  onChange,
  error,
  disabled = false,
}: TextPreviewProps) {
  const properties = field.properties || {};
  const placeholder = (properties.placeholder as string) || '';
  const minLength = properties.minLength as number | undefined;
  const maxLength = properties.maxLength as number | undefined;

  const fieldType = field.type.toUpperCase();
  const inputId = `preview-${field.id}`;
  const errorId = error ? `${inputId}-error` : undefined;

  // Use textarea for TEXTAREA type
  if (fieldType === 'TEXTAREA') {
    return (
      <Textarea
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        disabled={disabled}
        className={error ? 'border-red-500' : ''}
        rows={4}
        aria-invalid={!!error}
        aria-describedby={errorId}
      />
    );
  }

  // Determine input type
  let inputType = 'text';
  if (fieldType === 'EMAIL') inputType = 'email';
  if (fieldType === 'PHONE') inputType = 'tel';

  return (
    <Input
      id={inputId}
      type={inputType}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      minLength={minLength}
      maxLength={maxLength}
      disabled={disabled}
      className={error ? 'border-red-500' : ''}
      aria-invalid={!!error}
      aria-describedby={errorId}
    />
  );
}

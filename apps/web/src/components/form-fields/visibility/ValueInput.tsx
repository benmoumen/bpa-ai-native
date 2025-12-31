'use client';

/**
 * ValueInput Component
 *
 * Dynamic value input based on the source field type.
 * Shows appropriate input (text, number, select, etc.) based on field type.
 */

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FormField, VisibilityOperator } from '@/lib/api/forms';

interface ValueInputProps {
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
  sourceField?: FormField;
  operator: VisibilityOperator;
  disabled?: boolean;
}

// Operators that don't require a value
const OPERATORS_WITHOUT_VALUE: VisibilityOperator[] = ['is_empty', 'is_not_empty'];

export function ValueInput({
  value,
  onChange,
  sourceField,
  operator,
  disabled = false,
}: ValueInputProps) {
  // If operator doesn't require a value, show nothing
  if (OPERATORS_WITHOUT_VALUE.includes(operator)) {
    return (
      <div className="w-[150px] text-sm text-black/40 italic px-3 py-2">
        (no value needed)
      </div>
    );
  }

  const fieldType = sourceField?.type?.toUpperCase();
  const properties = sourceField?.properties || {};

  // For SELECT and RADIO fields with options, show a dropdown
  if ((fieldType === 'SELECT' || fieldType === 'RADIO') && properties.options) {
    const options = properties.options as { label: string; value: string }[];

    return (
      <Select
        value={String(value || '')}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Select value" />
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

  // For CHECKBOX fields, show true/false dropdown
  if (fieldType === 'CHECKBOX') {
    return (
      <Select
        value={String(value || 'false')}
        onValueChange={(v) => onChange(v === 'true')}
        disabled={disabled}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Select value" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Checked</SelectItem>
          <SelectItem value="false">Unchecked</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  // For NUMBER fields
  if (fieldType === 'NUMBER') {
    return (
      <Input
        type="number"
        className="w-[150px]"
        value={value === undefined ? '' : String(value)}
        onChange={(e) => {
          const num = parseFloat(e.target.value);
          onChange(isNaN(num) ? e.target.value : num);
        }}
        placeholder="Enter value"
        disabled={disabled}
      />
    );
  }

  // For DATE fields
  if (fieldType === 'DATE') {
    return (
      <Input
        type="date"
        className="w-[150px]"
        value={String(value || '')}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    );
  }

  // Default: text input
  return (
    <Input
      type="text"
      className="w-[150px]"
      value={String(value || '')}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter value"
      disabled={disabled}
      maxLength={500}
    />
  );
}

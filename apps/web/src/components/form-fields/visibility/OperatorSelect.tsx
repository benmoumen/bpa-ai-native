'use client';

/**
 * OperatorSelect Component
 *
 * Dropdown for selecting visibility condition operators.
 * Shows appropriate operators based on the source field type.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { VisibilityOperator } from '@/lib/api/forms';

interface OperatorSelectProps {
  value: VisibilityOperator;
  onChange: (value: VisibilityOperator) => void;
  fieldType?: string;
  disabled?: boolean;
}

const ALL_OPERATORS: { value: VisibilityOperator; label: string }[] = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'not_contains', label: 'not contains' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
  { value: 'greater_or_equal', label: 'greater or equal' },
  { value: 'less_or_equal', label: 'less or equal' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
];

// Operators available for each field type
const OPERATORS_BY_TYPE: Record<string, VisibilityOperator[]> = {
  TEXT: ['equals', 'not_equals', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
  TEXTAREA: ['equals', 'not_equals', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
  EMAIL: ['equals', 'not_equals', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
  PHONE: ['equals', 'not_equals', 'contains', 'not_contains', 'is_empty', 'is_not_empty'],
  NUMBER: [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_or_equal',
    'less_or_equal',
    'is_empty',
    'is_not_empty',
  ],
  DATE: [
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_or_equal',
    'less_or_equal',
    'is_empty',
    'is_not_empty',
  ],
  SELECT: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
  RADIO: ['equals', 'not_equals', 'is_empty', 'is_not_empty'],
  CHECKBOX: ['equals', 'not_equals'],
  FILE: ['is_empty', 'is_not_empty'],
};

export function OperatorSelect({
  value,
  onChange,
  fieldType,
  disabled = false,
}: OperatorSelectProps) {
  // Get available operators based on field type
  const availableOperators = fieldType
    ? OPERATORS_BY_TYPE[fieldType.toUpperCase()] || ALL_OPERATORS.map((o) => o.value)
    : ALL_OPERATORS.map((o) => o.value);

  const filteredOperators = ALL_OPERATORS.filter((op) =>
    availableOperators.includes(op.value)
  );

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Select operator" />
      </SelectTrigger>
      <SelectContent>
        {filteredOperators.map((operator) => (
          <SelectItem key={operator.value} value={operator.value}>
            {operator.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

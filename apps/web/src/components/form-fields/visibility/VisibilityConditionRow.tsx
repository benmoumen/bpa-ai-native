'use client';

/**
 * VisibilityConditionRow Component
 *
 * Displays a single visibility condition with source field, operator, and value.
 * Includes a delete button to remove the condition.
 */

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FormField, VisibilityCondition } from '@/lib/api/forms';
import { SourceFieldSelect } from './SourceFieldSelect';
import { OperatorSelect } from './OperatorSelect';
import { ValueInput } from './ValueInput';

interface VisibilityConditionRowProps {
  condition: VisibilityCondition;
  fields: FormField[];
  excludeFieldName?: string;
  onChange: (condition: VisibilityCondition) => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function VisibilityConditionRow({
  condition,
  fields,
  excludeFieldName,
  onChange,
  onRemove,
  disabled = false,
}: VisibilityConditionRowProps) {
  // Find the source field to get its type
  const sourceField = fields.find((f) => f.name === condition.fieldName);

  const handleFieldChange = (fieldName: string) => {
    // Reset operator and value when field changes
    onChange({
      fieldName,
      operator: 'equals',
      value: undefined,
    });
  };

  const handleOperatorChange = (operator: VisibilityCondition['operator']) => {
    // Clear value if operator doesn't need one
    const needsValue = !['is_empty', 'is_not_empty'].includes(operator);
    onChange({
      ...condition,
      operator,
      value: needsValue ? condition.value : undefined,
    });
  };

  const handleValueChange = (value: string | number | boolean) => {
    onChange({
      ...condition,
      value,
    });
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-white border border-black/10 rounded">
      <SourceFieldSelect
        value={condition.fieldName}
        onChange={handleFieldChange}
        fields={fields}
        excludeFieldName={excludeFieldName}
        disabled={disabled}
      />

      <OperatorSelect
        value={condition.operator}
        onChange={handleOperatorChange}
        fieldType={sourceField?.type}
        disabled={disabled || !condition.fieldName}
      />

      <ValueInput
        value={condition.value}
        onChange={handleValueChange}
        sourceField={sourceField}
        operator={condition.operator}
        disabled={disabled || !condition.fieldName}
      />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-black/40 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
        onClick={onRemove}
        disabled={disabled}
        aria-label="Remove condition"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

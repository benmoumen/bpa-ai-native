'use client';

/**
 * ConditionBuilder Component
 *
 * UI for building determinant-based conditions on workflow transitions.
 * Supports single conditions with type-aware operators and value inputs.
 * Story 4-5a: Determinants in Workflow Conditions
 */

import { X, Filter } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDeterminants } from '@/hooks/use-determinants';
import type { DeterminantType } from '@/lib/api/determinants';
import {
  type TransitionCondition,
  type ConditionOperator,
  OPERATORS_BY_TYPE,
  OPERATOR_LABELS,
} from '@/lib/types/conditions';

interface ConditionBuilderProps {
  serviceId: string;
  value: TransitionCondition | null;
  onChange: (condition: TransitionCondition | null) => void;
}

export function ConditionBuilder({
  serviceId,
  value,
  onChange,
}: ConditionBuilderProps) {
  const { data: determinantsData, isLoading } = useDeterminants(serviceId, {
    isActive: true,
  });
  const determinants = determinantsData?.data || [];

  // Find selected determinant
  const selectedDeterminant = value?.determinantId
    ? determinants.find((d) => d.id === value.determinantId)
    : null;

  const handleDeterminantChange = (determinantId: string) => {
    if (determinantId === '__none__') {
      onChange(null);
      return;
    }

    const det = determinants.find((d) => d.id === determinantId);
    if (!det) return;

    // Get default operator for this type
    const operators = OPERATORS_BY_TYPE[det.type];
    const defaultOperator = operators[0];

    // Get default value for this type
    const defaultValue = getDefaultValue(det.type);

    onChange({
      determinantId,
      determinantName: det.name,
      operator: defaultOperator,
      value: defaultValue,
    });
  };

  const handleOperatorChange = (operator: string) => {
    if (!value) return;
    onChange({
      ...value,
      operator: operator as ConditionOperator,
    });
  };

  const handleValueChange = (newValue: string | number | boolean) => {
    if (!value) return;
    onChange({
      ...value,
      value: newValue,
    });
  };

  const handleClear = () => {
    onChange(null);
  };

  // Get available operators for selected determinant
  const availableOperators = selectedDeterminant
    ? OPERATORS_BY_TYPE[selectedDeterminant.type]
    : [];

  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-black/70">
          <Filter className="h-4 w-4" />
          Condition (Optional)
        </div>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-6 px-2 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Determinant Selector */}
      <div className="grid gap-1.5">
        <Label htmlFor="determinant" className="text-xs text-black/60">
          When this field...
        </Label>
        <Select
          value={value?.determinantId || '__none__'}
          onValueChange={handleDeterminantChange}
          disabled={isLoading}
        >
          <SelectTrigger className="bg-white">
            <SelectValue
              placeholder={
                isLoading ? 'Loading...' : 'No condition (always applies)'
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">
              <span className="text-black/50 italic">No condition</span>
            </SelectItem>
            {determinants.map((det) => (
              <SelectItem key={det.id} value={det.id}>
                <div className="flex items-center gap-2">
                  <span>{det.name}</span>
                  <span className="text-xs text-black/40">({det.type})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Operator & Value (only shown when determinant selected) */}
      {selectedDeterminant && value && (
        <>
          {/* Operator Selector */}
          <div className="grid gap-1.5">
            <Label htmlFor="operator" className="text-xs text-black/60">
              Comparison
            </Label>
            <Select
              value={value.operator}
              onValueChange={handleOperatorChange}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableOperators.map((op) => (
                  <SelectItem key={op} value={op}>
                    {OPERATOR_LABELS[op]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value Input (type-aware) */}
          <div className="grid gap-1.5">
            <Label htmlFor="value" className="text-xs text-black/60">
              Value
            </Label>
            <ConditionValueInput
              type={selectedDeterminant.type}
              value={value.value}
              onChange={handleValueChange}
            />
          </div>
        </>
      )}

      {/* Empty state message */}
      {determinants.length === 0 && !isLoading && (
        <p className="text-xs text-black/50 italic">
          No determinants configured for this service.
          Create determinants from the Forms page to use conditions.
        </p>
      )}
    </div>
  );
}

/**
 * Type-aware value input component
 */
interface ConditionValueInputProps {
  type: DeterminantType;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
}

function ConditionValueInput({ type, value, onChange }: ConditionValueInputProps) {
  switch (type) {
    case 'BOOLEAN':
      return (
        <Select
          value={value === true || value === 'true' ? 'true' : 'false'}
          onValueChange={(v) => onChange(v === 'true')}
        >
          <SelectTrigger className="bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">True</SelectItem>
            <SelectItem value="false">False</SelectItem>
          </SelectContent>
        </Select>
      );

    case 'NUMBER':
      return (
        <Input
          type="number"
          value={String(value)}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="bg-white"
          placeholder="Enter number..."
        />
      );

    case 'DATE':
      return (
        <Input
          type="date"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white"
        />
      );

    case 'STRING':
    default:
      return (
        <Input
          type="text"
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="bg-white"
          placeholder="Enter text..."
        />
      );
  }
}

/**
 * Get default value for a determinant type
 */
function getDefaultValue(type: DeterminantType): string | number | boolean {
  switch (type) {
    case 'BOOLEAN':
      return true;
    case 'NUMBER':
      return 0;
    case 'DATE':
      return new Date().toISOString().split('T')[0];
    case 'STRING':
    default:
      return '';
  }
}

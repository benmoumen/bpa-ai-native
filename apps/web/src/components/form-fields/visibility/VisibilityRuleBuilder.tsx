'use client';

/**
 * VisibilityRuleBuilder Component
 *
 * Main container for building conditional visibility rules.
 * Allows adding/removing conditions and selecting AND/OR logic.
 */

import { useCallback, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  FormField,
  VisibilityCondition,
  VisibilityMode,
  VisibilityRule,
} from '@/lib/api/forms';
import { VisibilityConditionRow } from './VisibilityConditionRow';

interface VisibilityRuleBuilderProps {
  rule: VisibilityRule | null;
  fields: FormField[];
  excludeFieldName?: string; // For fields, exclude self
  onChange: (rule: VisibilityRule | null) => void;
  disabled?: boolean;
}

const DEFAULT_CONDITION: VisibilityCondition = {
  fieldName: '',
  operator: 'equals',
  value: undefined,
};

export function VisibilityRuleBuilder({
  rule,
  fields,
  excludeFieldName,
  onChange,
  disabled = false,
}: VisibilityRuleBuilderProps) {
  const mode: VisibilityMode = rule?.mode || 'always';
  const conditions: VisibilityCondition[] = useMemo(
    () => rule?.conditions || [],
    [rule?.conditions]
  );
  const logic = rule?.logic || 'AND';

  const handleModeChange = useCallback(
    (newMode: VisibilityMode) => {
      if (newMode === 'always') {
        // When switching to always, clear the rule
        onChange({ mode: 'always' });
      } else {
        // When switching to conditional, add a default condition if none exist
        onChange({
          mode: 'conditional',
          conditions: conditions.length > 0 ? conditions : [{ ...DEFAULT_CONDITION }],
          logic,
        });
      }
    },
    [conditions, logic, onChange]
  );

  const handleLogicChange = useCallback(
    (newLogic: 'AND' | 'OR') => {
      onChange({
        mode: 'conditional',
        conditions,
        logic: newLogic,
      });
    },
    [conditions, onChange]
  );

  const handleAddCondition = useCallback(() => {
    onChange({
      mode: 'conditional',
      conditions: [...conditions, { ...DEFAULT_CONDITION }],
      logic,
    });
  }, [conditions, logic, onChange]);

  const handleUpdateCondition = useCallback(
    (index: number, updatedCondition: VisibilityCondition) => {
      const newConditions = [...conditions];
      newConditions[index] = updatedCondition;
      onChange({
        mode: 'conditional',
        conditions: newConditions,
        logic,
      });
    },
    [conditions, logic, onChange]
  );

  const handleRemoveCondition = useCallback(
    (index: number) => {
      const newConditions = conditions.filter((_, i) => i !== index);
      if (newConditions.length === 0) {
        // If no conditions left, switch back to always visible
        onChange({ mode: 'always' });
      } else {
        onChange({
          mode: 'conditional',
          conditions: newConditions,
          logic,
        });
      }
    },
    [conditions, logic, onChange]
  );

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Visibility</Label>
        <RadioGroup
          value={mode}
          onValueChange={(value) => handleModeChange(value as VisibilityMode)}
          className="flex flex-col gap-2"
          disabled={disabled}
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="always" id="visibility-always" />
            <Label htmlFor="visibility-always" className="text-sm cursor-pointer">
              Always visible
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="conditional" id="visibility-conditional" />
            <Label htmlFor="visibility-conditional" className="text-sm cursor-pointer">
              Conditional
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Conditions Section */}
      {mode === 'conditional' && (
        <div className="space-y-3 pl-4 border-l-2 border-black/10">
          <Label className="text-sm text-black/60">
            Show this when:
          </Label>

          {/* Condition Rows */}
          <div className="space-y-2">
            {conditions.map((condition, index) => (
              <div key={index}>
                {index > 0 && (
                  <div className="flex items-center gap-2 py-1">
                    <Select
                      value={logic}
                      onValueChange={(value) => handleLogicChange(value as 'AND' | 'OR')}
                      disabled={disabled}
                    >
                      <SelectTrigger className="w-[80px] h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">AND</SelectItem>
                        <SelectItem value="OR">OR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <VisibilityConditionRow
                  condition={condition}
                  fields={fields}
                  excludeFieldName={excludeFieldName}
                  onChange={(updated) => handleUpdateCondition(index, updated)}
                  onRemove={() => handleRemoveCondition(index)}
                  disabled={disabled}
                />
              </div>
            ))}
          </div>

          {/* Add Condition Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddCondition}
            disabled={disabled}
            className="text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Condition
          </Button>
        </div>
      )}
    </div>
  );
}

'use client';

/**
 * SelectFieldProperties Component
 *
 * Type-specific properties editor for SELECT, RADIO, CHECKBOX fields.
 * Allows managing a list of options with label and value.
 */

import { useCallback, useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Option {
  label: string;
  value: string;
}

interface SelectFieldPropertiesProps {
  options: Option[];
  onChange: (props: { options: Option[] }) => void;
}

/**
 * Convert a label to a valid option value (snake_case)
 */
function labelToOptionValue(label: string): string {
  return label
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .join('_');
}

export function SelectFieldProperties({
  options,
  onChange,
}: SelectFieldPropertiesProps) {
  // Track which option values are manually edited (unlinked from label)
  const [unlinkedValues, setUnlinkedValues] = useState<Set<number>>(new Set());

  const handleAddOption = useCallback(() => {
    const newOption: Option = {
      label: `Option ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    };
    onChange({ options: [...options, newOption] });
  }, [options, onChange]);

  const handleRemoveOption = useCallback(
    (index: number) => {
      const newOptions = options.filter((_, i) => i !== index);
      // Update unlinked values set
      const newUnlinked = new Set<number>();
      unlinkedValues.forEach((i) => {
        if (i < index) newUnlinked.add(i);
        else if (i > index) newUnlinked.add(i - 1);
      });
      setUnlinkedValues(newUnlinked);
      onChange({ options: newOptions });
    },
    [options, unlinkedValues, onChange]
  );

  const handleLabelChange = useCallback(
    (index: number, newLabel: string) => {
      const newOptions = [...options];
      newOptions[index] = {
        ...newOptions[index],
        label: newLabel,
        // Auto-update value if not manually edited
        value: unlinkedValues.has(index)
          ? newOptions[index].value
          : labelToOptionValue(newLabel),
      };
      onChange({ options: newOptions });
    },
    [options, unlinkedValues, onChange]
  );

  const handleValueChange = useCallback(
    (index: number, newValue: string) => {
      const newOptions = [...options];
      newOptions[index] = { ...newOptions[index], value: newValue };
      // Mark this value as manually edited
      setUnlinkedValues((prev) => new Set(prev).add(index));
      onChange({ options: newOptions });
    },
    [options, onChange]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Options</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          className="h-7 px-2 text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Option
        </Button>
      </div>

      {options.length === 0 ? (
        <div className="rounded-md border-2 border-dashed border-black/10 p-4 text-center">
          <p className="text-sm text-black/50">No options yet</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddOption}
            className="mt-2"
          >
            <Plus className="mr-1 h-4 w-4" />
            Add your first option
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {options.map((option, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded border border-black/10 p-2"
            >
              <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-black/30" />
              <div className="flex-1 grid grid-cols-2 gap-2">
                <Input
                  value={option.label}
                  onChange={(e) => handleLabelChange(index, e.target.value)}
                  placeholder="Label"
                  className="h-8 text-sm"
                  aria-label={`Option ${index + 1} label`}
                />
                <Input
                  value={option.value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  placeholder="value"
                  className="h-8 text-sm font-mono"
                  aria-label={`Option ${index + 1} value`}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveOption(index)}
                className="h-8 w-8 flex-shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                aria-label={`Remove option ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-black/50">
        The label is displayed to users. The value is stored in form data.
      </p>
    </div>
  );
}

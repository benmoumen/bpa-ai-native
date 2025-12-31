'use client';

/**
 * SourceFieldSelect Component
 *
 * Dropdown for selecting the source field for a visibility condition.
 * Shows all other fields in the same form.
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FormField } from '@/lib/api/forms';

interface SourceFieldSelectProps {
  value: string;
  onChange: (value: string) => void;
  fields: FormField[];
  excludeFieldName?: string; // Exclude the current field to prevent self-reference
  disabled?: boolean;
}

export function SourceFieldSelect({
  value,
  onChange,
  fields,
  excludeFieldName,
  disabled = false,
}: SourceFieldSelectProps) {
  // Filter out the current field and inactive fields
  const availableFields = fields.filter(
    (field) => field.isActive && field.name !== excludeFieldName
  );

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select field" />
      </SelectTrigger>
      <SelectContent>
        {availableFields.length === 0 ? (
          <SelectItem value="__none__" disabled>
            No fields available
          </SelectItem>
        ) : (
          availableFields.map((field) => (
            <SelectItem key={field.id} value={field.name}>
              {field.label}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

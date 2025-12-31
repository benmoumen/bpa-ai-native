'use client';

/**
 * DateFieldProperties Component
 *
 * Type-specific properties editor for DATE fields.
 * Allows configuration of minDate and maxDate.
 */

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DateFieldPropertiesProps {
  minDate?: string;
  maxDate?: string;
  onChange: (props: { minDate?: string; maxDate?: string }) => void;
}

export function DateFieldProperties({
  minDate,
  maxDate,
  onChange,
}: DateFieldPropertiesProps) {
  const handleMinDateChange = useCallback(
    (value: string) => {
      onChange({ minDate: value || undefined, maxDate });
    },
    [maxDate, onChange]
  );

  const handleMaxDateChange = useCallback(
    (value: string) => {
      onChange({ minDate, maxDate: value || undefined });
    },
    [minDate, onChange]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Min Date */}
        <div className="space-y-1.5">
          <Label htmlFor="min-date">Earliest Date</Label>
          <Input
            id="min-date"
            type="date"
            value={minDate || ''}
            onChange={(e) => handleMinDateChange(e.target.value)}
          />
        </div>

        {/* Max Date */}
        <div className="space-y-1.5">
          <Label htmlFor="max-date">Latest Date</Label>
          <Input
            id="max-date"
            type="date"
            value={maxDate || ''}
            onChange={(e) => handleMaxDateChange(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-black/50">
        Restrict the date range users can select. Leave empty for no restriction.
      </p>
    </div>
  );
}

'use client';

/**
 * TextFieldProperties Component
 *
 * Type-specific properties editor for TEXT, TEXTAREA, EMAIL, PHONE fields.
 * Allows configuration of minLength and maxLength.
 */

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TextFieldPropertiesProps {
  minLength?: number;
  maxLength?: number;
  onChange: (props: { minLength?: number; maxLength?: number }) => void;
}

export function TextFieldProperties({
  minLength,
  maxLength,
  onChange,
}: TextFieldPropertiesProps) {
  const handleMinLengthChange = useCallback(
    (value: string) => {
      const num = value === '' ? undefined : parseInt(value, 10);
      onChange({ minLength: isNaN(num as number) ? undefined : num, maxLength });
    },
    [maxLength, onChange]
  );

  const handleMaxLengthChange = useCallback(
    (value: string) => {
      const num = value === '' ? undefined : parseInt(value, 10);
      onChange({ minLength, maxLength: isNaN(num as number) ? undefined : num });
    },
    [minLength, onChange]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Min Length */}
        <div className="space-y-1.5">
          <Label htmlFor="min-length">Min Length</Label>
          <Input
            id="min-length"
            type="number"
            min={0}
            value={minLength ?? ''}
            onChange={(e) => handleMinLengthChange(e.target.value)}
            placeholder="0"
          />
        </div>

        {/* Max Length */}
        <div className="space-y-1.5">
          <Label htmlFor="max-length">Max Length</Label>
          <Input
            id="max-length"
            type="number"
            min={0}
            value={maxLength ?? ''}
            onChange={(e) => handleMaxLengthChange(e.target.value)}
            placeholder="255"
          />
        </div>
      </div>
      <p className="text-xs text-black/50">
        Set character limits for text input. Leave empty for no limit.
      </p>
    </div>
  );
}

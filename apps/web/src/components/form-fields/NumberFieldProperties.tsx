'use client';

/**
 * NumberFieldProperties Component
 *
 * Type-specific properties editor for NUMBER fields.
 * Allows configuration of min value, max value, and decimal places.
 */

import { useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NumberFieldPropertiesProps {
  min?: number;
  max?: number;
  decimalPlaces?: number;
  onChange: (props: { min?: number; max?: number; decimalPlaces?: number }) => void;
}

export function NumberFieldProperties({
  min,
  max,
  decimalPlaces,
  onChange,
}: NumberFieldPropertiesProps) {
  const handleMinChange = useCallback(
    (value: string) => {
      const num = value === '' ? undefined : parseFloat(value);
      onChange({ min: isNaN(num as number) ? undefined : num, max, decimalPlaces });
    },
    [max, decimalPlaces, onChange]
  );

  const handleMaxChange = useCallback(
    (value: string) => {
      const num = value === '' ? undefined : parseFloat(value);
      onChange({ min, max: isNaN(num as number) ? undefined : num, decimalPlaces });
    },
    [min, decimalPlaces, onChange]
  );

  const handleDecimalPlacesChange = useCallback(
    (value: string) => {
      const num = value === '' ? undefined : parseInt(value, 10);
      onChange({ min, max, decimalPlaces: isNaN(num as number) ? undefined : num });
    },
    [min, max, onChange]
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Min Value */}
        <div className="space-y-1.5">
          <Label htmlFor="min-value">Min Value</Label>
          <Input
            id="min-value"
            type="number"
            value={min ?? ''}
            onChange={(e) => handleMinChange(e.target.value)}
            placeholder="No minimum"
          />
        </div>

        {/* Max Value */}
        <div className="space-y-1.5">
          <Label htmlFor="max-value">Max Value</Label>
          <Input
            id="max-value"
            type="number"
            value={max ?? ''}
            onChange={(e) => handleMaxChange(e.target.value)}
            placeholder="No maximum"
          />
        </div>
      </div>

      {/* Decimal Places */}
      <div className="space-y-1.5">
        <Label htmlFor="decimal-places">Decimal Places</Label>
        <Input
          id="decimal-places"
          type="number"
          min={0}
          max={10}
          value={decimalPlaces ?? ''}
          onChange={(e) => handleDecimalPlacesChange(e.target.value)}
          placeholder="0 (integers only)"
        />
        <p className="text-xs text-black/50">
          Number of digits after decimal point. Leave empty for integers.
        </p>
      </div>
    </div>
  );
}

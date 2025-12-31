'use client';

/**
 * FileFieldProperties Component
 *
 * Type-specific properties editor for FILE fields.
 * Allows configuration of accepted file types and max file size.
 */

import { useCallback, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FileFieldPropertiesProps {
  acceptedTypes: string[];
  maxSizeKB?: number;
  onChange: (props: { acceptedTypes?: string[]; maxSizeKB?: number }) => void;
}

/**
 * Common file type presets
 */
const FILE_TYPE_PRESETS = [
  { label: 'PDF', value: '.pdf' },
  { label: 'Images', value: '.jpg,.jpeg,.png,.gif,.webp' },
  { label: 'Documents', value: '.pdf,.doc,.docx' },
  { label: 'Spreadsheets', value: '.xls,.xlsx,.csv' },
];

export function FileFieldProperties({
  acceptedTypes,
  maxSizeKB,
  onChange,
}: FileFieldPropertiesProps) {
  const [newType, setNewType] = useState('');

  const handleAddType = useCallback(() => {
    if (!newType.trim()) return;
    // Ensure it starts with a dot
    const type = newType.trim().startsWith('.') ? newType.trim() : `.${newType.trim()}`;
    if (!acceptedTypes.includes(type)) {
      onChange({ acceptedTypes: [...acceptedTypes, type], maxSizeKB });
    }
    setNewType('');
  }, [newType, acceptedTypes, maxSizeKB, onChange]);

  const handleRemoveType = useCallback(
    (index: number) => {
      const newTypes = acceptedTypes.filter((_, i) => i !== index);
      onChange({ acceptedTypes: newTypes, maxSizeKB });
    },
    [acceptedTypes, maxSizeKB, onChange]
  );

  const handlePresetClick = useCallback(
    (preset: string) => {
      const types = preset.split(',');
      const newTypes = [...new Set([...acceptedTypes, ...types])];
      onChange({ acceptedTypes: newTypes, maxSizeKB });
    },
    [acceptedTypes, maxSizeKB, onChange]
  );

  const handleMaxSizeChange = useCallback(
    (value: string) => {
      const num = value === '' ? undefined : parseInt(value, 10);
      onChange({
        acceptedTypes,
        maxSizeKB: isNaN(num as number) ? undefined : num,
      });
    },
    [acceptedTypes, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddType();
      }
    },
    [handleAddType]
  );

  return (
    <div className="space-y-4">
      {/* Accepted File Types */}
      <div className="space-y-2">
        <Label>Accepted File Types</Label>

        {/* Preset buttons */}
        <div className="flex flex-wrap gap-1">
          {FILE_TYPE_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePresetClick(preset.value)}
              className="h-6 px-2 text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Current types */}
        {acceptedTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {acceptedTypes.map((type, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 rounded bg-black/5 px-2 py-1 text-xs font-mono"
              >
                {type}
                <button
                  type="button"
                  onClick={() => handleRemoveType(index)}
                  className="text-black/40 hover:text-red-600"
                  aria-label={`Remove ${type}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add custom type */}
        <div className="flex gap-2">
          <Input
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=".pdf, .docx, etc."
            className="h-8 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddType}
            className="h-8 px-2"
            disabled={!newType.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-black/50">
          Leave empty to accept all file types.
        </p>
      </div>

      {/* Max File Size */}
      <div className="space-y-1.5">
        <Label htmlFor="max-size">Max File Size (KB)</Label>
        <Input
          id="max-size"
          type="number"
          min={0}
          value={maxSizeKB ?? ''}
          onChange={(e) => handleMaxSizeChange(e.target.value)}
          placeholder="5120 (5 MB)"
        />
        <p className="text-xs text-black/50">
          {maxSizeKB
            ? `${(maxSizeKB / 1024).toFixed(1)} MB`
            : 'Leave empty for no size limit'}
        </p>
      </div>
    </div>
  );
}

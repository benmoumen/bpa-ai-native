'use client';

/**
 * FilePreview Component
 *
 * Renders file upload field placeholder in preview mode.
 * Note: Actual file upload functionality is for runtime, not design-time preview.
 */

import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FormField } from '@/lib/api/forms';

interface FilePreviewProps {
  field: FormField;
  error?: string;
  disabled?: boolean;
}

export function FilePreview({ field, error, disabled = false }: FilePreviewProps) {
  const properties = field.properties || {};
  const acceptedTypes = properties.acceptedTypes as string[] | undefined;
  const maxSizeKB = properties.maxSizeKB as number | undefined;

  const formatFileTypes = () => {
    if (!acceptedTypes || acceptedTypes.length === 0) return 'All files';
    return acceptedTypes.join(', ');
  };

  const formatMaxSize = () => {
    if (!maxSizeKB) return '';
    if (maxSizeKB >= 1024) {
      return `Max ${(maxSizeKB / 1024).toFixed(1)} MB`;
    }
    return `Max ${maxSizeKB} KB`;
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 ${
        error ? 'border-red-500 bg-red-50' : 'border-black/20 bg-black/5'
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <Upload className="h-8 w-8 text-black/40" />
      <Button variant="outline" size="sm" disabled={disabled}>
        Choose File
      </Button>
      <div className="text-center text-xs text-black/50">
        <p>{formatFileTypes()}</p>
        {maxSizeKB && <p>{formatMaxSize()}</p>}
      </div>
    </div>
  );
}

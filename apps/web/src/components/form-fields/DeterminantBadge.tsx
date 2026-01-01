'use client';

/**
 * DeterminantBadge Component
 *
 * Displays a badge showing a linked determinant with its name and a link icon.
 * Shows loading state when fetching determinant info.
 * Allows clicking to unlink.
 * Swiss-style minimal design.
 */

import { X, LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeterminant } from '@/hooks/use-determinants';

interface DeterminantBadgeProps {
  determinantId: string;
  onUnlink?: () => void;
  unlinking?: boolean;
}

export function DeterminantBadge({
  determinantId,
  onUnlink,
  unlinking = false,
}: DeterminantBadgeProps) {
  const { data: determinant, isLoading, isError } = useDeterminant(determinantId);

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/5 border border-black/10">
        <div className="h-3 w-3 animate-spin rounded-full border border-black/30 border-t-transparent" />
        <span className="text-xs text-black/50">Loading...</span>
      </div>
    );
  }

  if (isError || !determinant) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 border border-red-200">
        <span className="text-xs text-red-600">Unknown determinant</span>
        {onUnlink && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onUnlink}
            disabled={unlinking}
            className="h-4 w-4 p-0 hover:bg-red-100"
            aria-label="Unlink determinant"
          >
            <X className="h-3 w-3 text-red-600" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 border border-blue-200">
      <LinkIcon className="h-3 w-3 text-blue-600" />
      <span className="text-xs font-mono text-blue-700">{determinant.name}</span>
      {onUnlink && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onUnlink}
          disabled={unlinking}
          className="h-4 w-4 p-0 hover:bg-blue-100"
          aria-label="Unlink determinant"
        >
          {unlinking ? (
            <div className="h-3 w-3 animate-spin rounded-full border border-blue-600 border-t-transparent" />
          ) : (
            <X className="h-3 w-3 text-blue-600" />
          )}
        </Button>
      )}
    </div>
  );
}

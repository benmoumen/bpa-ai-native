'use client';

import * as React from 'react';
import { Plus, Minus, Edit2, RotateCcw, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  RefinementIntent,
  AddFieldIntent,
  RemoveFieldIntent,
  ModifyFieldIntent,
  RemoveSectionIntent,
  UndoIntent,
  BatchIntent,
} from './refinement-parser';
import { isDestructiveIntent } from './refinement-parser';

/**
 * Props for the ChangePreview component
 */
interface ChangePreviewProps {
  /** The refinement intent to preview */
  intent: RefinementIntent;
  /** Callback when changes are applied */
  onApply: () => void;
  /** Callback when changes are cancelled */
  onCancel: () => void;
  /** Whether the apply action is in progress */
  isApplying?: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Single change item display
 */
interface ChangeItemProps {
  intent: Exclude<RefinementIntent, BatchIntent>;
  className?: string;
}

/**
 * Get icon and color for a change type
 */
function getChangeStyle(intent: Exclude<RefinementIntent, BatchIntent>) {
  switch (intent.type) {
    case 'ADD_FIELD':
      return {
        icon: Plus,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        iconColor: 'text-green-600',
        prefix: '+',
      };
    case 'REMOVE_FIELD':
    case 'REMOVE_SECTION':
      return {
        icon: Minus,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        iconColor: 'text-red-600',
        prefix: '-',
      };
    case 'MODIFY_FIELD':
      return {
        icon: Edit2,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        iconColor: 'text-amber-600',
        prefix: '~',
      };
    case 'UNDO':
      return {
        icon: RotateCcw,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
        iconColor: 'text-blue-600',
        prefix: '↩',
      };
    case 'UNKNOWN':
      return {
        icon: AlertTriangle,
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        textColor: 'text-slate-700',
        iconColor: 'text-slate-500',
        prefix: '?',
      };
  }
}

/**
 * Format intent details for display
 */
function formatDetails(intent: Exclude<RefinementIntent, BatchIntent>): React.ReactNode {
  switch (intent.type) {
    case 'ADD_FIELD': {
      const addIntent = intent as AddFieldIntent;
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Field:</span>
            <span className="font-mono bg-green-100 px-1.5 py-0.5 rounded text-xs">
              {addIntent.fieldName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Type:</span>
            <span className="text-green-600">{addIntent.fieldType}</span>
          </div>
          {addIntent.section && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Section:</span>
              <span className="text-green-600">{addIntent.section}</span>
            </div>
          )}
        </div>
      );
    }
    case 'REMOVE_FIELD': {
      const removeIntent = intent as RemoveFieldIntent;
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">Field:</span>
          <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded text-xs line-through">
            {removeIntent.fieldName}
          </span>
        </div>
      );
    }
    case 'REMOVE_SECTION': {
      const sectionIntent = intent as RemoveSectionIntent;
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Section:</span>
            <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded text-xs line-through">
              {sectionIntent.sectionName}
            </span>
          </div>
          <p className="text-xs text-red-600">All fields in this section will be removed</p>
        </div>
      );
    }
    case 'MODIFY_FIELD': {
      const modifyIntent = intent as ModifyFieldIntent;
      const changes: React.ReactNode[] = [];

      if (modifyIntent.changes.required !== undefined) {
        changes.push(
          <div key="required" className="flex items-center gap-2">
            <span className="text-amber-600">
              {modifyIntent.changes.required ? '✓ Make required' : '○ Make optional'}
            </span>
          </div>
        );
      }
      if (modifyIntent.changes.newName) {
        changes.push(
          <div key="rename" className="flex items-center gap-2">
            <span className="text-amber-600">
              Rename to: <span className="font-mono">{modifyIntent.changes.newName}</span>
            </span>
          </div>
        );
      }
      if (modifyIntent.changes.newType) {
        changes.push(
          <div key="type" className="flex items-center gap-2">
            <span className="text-amber-600">
              Change type to: <span className="font-mono">{modifyIntent.changes.newType}</span>
            </span>
          </div>
        );
      }

      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Field:</span>
            <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded text-xs">
              {modifyIntent.fieldName}
            </span>
          </div>
          {changes.length > 0 && (
            <div className="pl-2 border-l-2 border-amber-200 space-y-1">
              {changes}
            </div>
          )}
        </div>
      );
    }
    case 'UNDO': {
      const undoIntent = intent as UndoIntent;
      return (
        <div className="text-blue-600">
          {undoIntent.count
            ? `Undo the last ${undoIntent.count} changes`
            : 'Undo the last change'}
        </div>
      );
    }
    case 'UNKNOWN':
      return (
        <div className="text-slate-500 italic">
          Unable to parse command
        </div>
      );
  }
}

/**
 * Single change item component
 */
function ChangeItem({ intent, className }: ChangeItemProps) {
  const style = getChangeStyle(intent);
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3',
        style.bgColor,
        style.borderColor,
        className
      )}
      role="listitem"
    >
      <div
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
          style.bgColor
        )}
      >
        <Icon className={cn('h-4 w-4', style.iconColor)} aria-hidden="true" />
      </div>
      <div className={cn('flex-1 text-sm', style.textColor)}>
        {formatDetails(intent)}
      </div>
    </div>
  );
}

/**
 * Change Preview Component
 *
 * Story 6-5: Iterative Refinement (Task 2)
 *
 * Displays a diff-style preview of proposed refinement changes.
 * Shows added, removed, and modified elements with visual indicators.
 */
export function ChangePreview({
  intent,
  onApply,
  onCancel,
  isApplying = false,
  className,
}: ChangePreviewProps) {
  const isDestructive = isDestructiveIntent(intent);

  // Get list of changes to display
  const changes: Exclude<RefinementIntent, BatchIntent>[] =
    intent.type === 'BATCH'
      ? (intent.commands as Exclude<RefinementIntent, BatchIntent>[])
      : [intent as Exclude<RefinementIntent, BatchIntent>];

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && !isApplying) {
        e.preventDefault();
        onApply();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onApply, onCancel, isApplying]);

  return (
    <div
      className={cn('rounded-lg border border-slate-200 bg-white p-4 shadow-sm', className)}
      role="region"
      aria-label="Change preview"
    >
      {/* Header */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-slate-900">Proposed Changes</h4>
        <p className="text-xs text-slate-500 mt-1">
          {changes.length} {changes.length === 1 ? 'change' : 'changes'} will be applied
        </p>
      </div>

      {/* Destructive warning */}
      {isDestructive && (
        <div
          className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>This action will remove data. This cannot be undone.</span>
        </div>
      )}

      {/* Changes list */}
      <div className="space-y-2" role="list" aria-label="List of changes">
        {changes.map((change, index) => (
          <ChangeItem key={`change-${index}`} intent={change} />
        ))}
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isApplying}
          className="flex-1"
          aria-label="Cancel changes"
        >
          <X className="mr-2 h-4 w-4" aria-hidden="true" />
          Cancel
          <span className="ml-2 text-xs text-slate-400">(Esc)</span>
        </Button>
        <Button
          onClick={onApply}
          disabled={isApplying}
          className={cn(
            'flex-1',
            isDestructive && 'bg-red-600 hover:bg-red-700'
          )}
          aria-label={isApplying ? 'Applying changes...' : 'Apply changes'}
        >
          {isApplying ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Applying...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" aria-hidden="true" />
              Apply {changes.length > 1 ? `${changes.length} Changes` : 'Change'}
              <span className="ml-2 text-xs text-slate-300">(Enter)</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default ChangePreview;

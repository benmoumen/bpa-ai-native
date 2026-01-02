'use client';

import * as React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  X,
  Wrench,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Gap Report Component
 *
 * Story 6-6: Gap Detection (Task 4)
 *
 * Displays detected configuration gaps with severity indicators
 * and fix options.
 */

/**
 * Gap severity type
 */
export type GapSeverity = 'critical' | 'warning' | 'suggestion';

/**
 * Gap fix information
 */
export interface GapFix {
  action: string;
  description: string;
  params?: Record<string, unknown>;
}

/**
 * Gap item for display
 */
export interface GapItem {
  id: string;
  severity: GapSeverity;
  message: string;
  suggestion: string;
  location: string;
  hasFix: boolean;
  fix?: GapFix;
}

/**
 * Props for GapReport component
 */
export interface GapReportProps {
  /** Total number of gaps */
  totalGaps: number;
  /** Summary message */
  summary: string;
  /** Critical gaps */
  criticalGaps: GapItem[];
  /** Warning gaps */
  warningGaps: GapItem[];
  /** Suggestion gaps */
  suggestionGaps: GapItem[];
  /** Number of gaps with available fixes */
  fixableCount: number;
  /** Callback when "Fix All" is clicked */
  onFixAll?: () => void;
  /** Callback when specific gaps are selected for fixing */
  onFixSelected?: (gapIds: string[]) => void;
  /** Callback when report is dismissed */
  onDismiss?: () => void;
  /** Whether fixes are being applied */
  isApplyingFixes?: boolean;
  /** Additional CSS class name */
  className?: string;
}

/**
 * Get style configuration for severity
 */
function getSeverityStyle(severity: GapSeverity) {
  switch (severity) {
    case 'critical':
      return {
        icon: AlertCircle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        iconColor: 'text-red-600',
        badgeBg: 'bg-red-100',
        badgeText: 'text-red-800',
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-700',
        iconColor: 'text-amber-600',
        badgeBg: 'bg-amber-100',
        badgeText: 'text-amber-800',
      };
    case 'suggestion':
      return {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-700',
        iconColor: 'text-blue-600',
        badgeBg: 'bg-blue-100',
        badgeText: 'text-blue-800',
      };
  }
}

/**
 * Single gap item component
 */
interface GapItemComponentProps {
  gap: GapItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  showCheckbox: boolean;
}

function GapItemComponent({
  gap,
  isSelected,
  onToggleSelect,
  showCheckbox,
}: GapItemComponentProps) {
  const style = getSeverityStyle(gap.severity);
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3',
        style.bgColor,
        style.borderColor,
        isSelected && 'ring-2 ring-primary ring-offset-1'
      )}
      role="listitem"
    >
      {showCheckbox && gap.hasFix && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(gap.id)}
          className="mt-1 h-4 w-4 rounded border-slate-300"
          aria-label={`Select ${gap.message} for fixing`}
        />
      )}
      <div
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
          style.bgColor
        )}
      >
        <Icon className={cn('h-4 w-4', style.iconColor)} aria-hidden="true" />
      </div>
      <div className="flex-1 space-y-1">
        <p className={cn('text-sm font-medium', style.textColor)}>{gap.message}</p>
        <p className="text-xs text-slate-500">
          <span className="font-medium">Location:</span> {gap.location}
        </p>
        <p className="text-xs text-slate-600">
          <span className="font-medium">Suggestion:</span> {gap.suggestion}
        </p>
        {gap.hasFix && gap.fix && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <Wrench className="h-3 w-3" aria-hidden="true" />
            <span>Auto-fix: {gap.fix.description}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Collapsible section for gap category
 */
interface GapSectionProps {
  title: string;
  severity: GapSeverity;
  gaps: GapItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  showCheckboxes: boolean;
  defaultExpanded?: boolean;
}

function GapSection({
  title,
  severity,
  gaps,
  selectedIds,
  onToggleSelect,
  showCheckboxes,
  defaultExpanded = true,
}: GapSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const style = getSeverityStyle(severity);

  if (gaps.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between py-1 text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <span className={cn('text-sm font-semibold', style.textColor)}>{title}</span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-medium',
              style.badgeBg,
              style.badgeText
            )}
          >
            {gaps.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {isExpanded && (
        <div className="space-y-2" role="list">
          {gaps.map((gap) => (
            <GapItemComponent
              key={gap.id}
              gap={gap}
              isSelected={selectedIds.has(gap.id)}
              onToggleSelect={onToggleSelect}
              showCheckbox={showCheckboxes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Gap Report Component
 *
 * Displays a comprehensive report of detected configuration gaps
 * with options to fix them individually or in batch.
 */
export function GapReport({
  totalGaps,
  summary,
  criticalGaps,
  warningGaps,
  suggestionGaps,
  fixableCount,
  onFixAll,
  onFixSelected,
  onDismiss,
  isApplyingFixes = false,
  className,
}: GapReportProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [showCheckboxes, setShowCheckboxes] = React.useState(false);

  // Handle selecting/deselecting a gap
  const handleToggleSelect = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Handle select all fixable gaps
  const handleSelectAll = React.useCallback(() => {
    const allFixable = [
      ...criticalGaps.filter((g) => g.hasFix),
      ...warningGaps.filter((g) => g.hasFix),
      ...suggestionGaps.filter((g) => g.hasFix),
    ].map((g) => g.id);
    setSelectedIds(new Set(allFixable));
  }, [criticalGaps, warningGaps, suggestionGaps]);

  // Handle clear selection
  const handleClearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Handle fix selected
  const handleFixSelected = React.useCallback(() => {
    if (onFixSelected && selectedIds.size > 0) {
      onFixSelected(Array.from(selectedIds));
    }
  }, [onFixSelected, selectedIds]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onDismiss) {
        e.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  // If no gaps, show success message
  if (totalGaps === 0) {
    return (
      <div
        className={cn(
          'rounded-lg border border-green-200 bg-green-50 p-4',
          className
        )}
        role="status"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <Check className="h-5 w-5 text-green-600" aria-hidden="true" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-green-800">
              Configuration Complete
            </h4>
            <p className="text-sm text-green-600">
              No gaps detected. Your configuration appears valid.
            </p>
          </div>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="mt-3 w-full text-green-700 hover:bg-green-100"
          >
            Dismiss
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-4 shadow-sm',
        className
      )}
      role="region"
      aria-label="Gap detection report"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Configuration Gaps Detected
          </h4>
          <p className="text-xs text-slate-500 mt-1">{summary}</p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Dismiss report"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Gap sections */}
      <div className="space-y-4 max-h-80 overflow-y-auto">
        <GapSection
          title="Critical Issues"
          severity="critical"
          gaps={criticalGaps}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          showCheckboxes={showCheckboxes}
          defaultExpanded={true}
        />
        <GapSection
          title="Warnings"
          severity="warning"
          gaps={warningGaps}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          showCheckboxes={showCheckboxes}
          defaultExpanded={criticalGaps.length === 0}
        />
        <GapSection
          title="Suggestions"
          severity="suggestion"
          gaps={suggestionGaps}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          showCheckboxes={showCheckboxes}
          defaultExpanded={criticalGaps.length === 0 && warningGaps.length === 0}
        />
      </div>

      {/* Actions */}
      {fixableCount > 0 && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-600">
            <Wrench className="inline h-3 w-3 mr-1" aria-hidden="true" />
            {fixableCount} {fixableCount === 1 ? 'gap has' : 'gaps have'} automatic
            fixes available
          </p>

          {!showCheckboxes ? (
            <div className="flex gap-2">
              {onFixAll && (
                <Button
                  onClick={onFixAll}
                  disabled={isApplyingFixes}
                  className="flex-1"
                  aria-label="Fix all gaps"
                >
                  {isApplyingFixes ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Fixing...
                    </>
                  ) : (
                    <>
                      <Wrench className="mr-2 h-4 w-4" aria-hidden="true" />
                      Fix All ({fixableCount})
                    </>
                  )}
                </Button>
              )}
              {onFixSelected && (
                <Button
                  variant="outline"
                  onClick={() => setShowCheckboxes(true)}
                  disabled={isApplyingFixes}
                >
                  Select...
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-primary hover:underline"
                >
                  Select all
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-primary hover:underline"
                >
                  Clear
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setShowCheckboxes(false)}
                  className="text-slate-500 hover:underline"
                >
                  Cancel
                </button>
              </div>
              <Button
                onClick={handleFixSelected}
                disabled={isApplyingFixes || selectedIds.size === 0}
                className="w-full"
                aria-label={`Fix ${selectedIds.size} selected gaps`}
              >
                {isApplyingFixes ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Wrench className="mr-2 h-4 w-4" aria-hidden="true" />
                    Fix Selected ({selectedIds.size})
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GapReport;

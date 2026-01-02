'use client';

import * as React from 'react';
import type { GapItem } from './GapReport';

/**
 * Gap Detection Hook
 *
 * Story 6-6: Gap Detection (Task 4 & 5)
 *
 * Manages gap detection state and integrates with the service configuration.
 */

/**
 * Gap report data structure
 */
export interface GapReportData {
  timestamp: number;
  totalGaps: number;
  summary: string;
  criticalGaps: GapItem[];
  warningGaps: GapItem[];
  suggestionGaps: GapItem[];
  fixableCount: number;
}

/**
 * Gap detection state
 */
export interface GapDetectionState {
  /** Whether gap detection is in progress */
  isDetecting: boolean;
  /** Whether fixes are being applied */
  isApplyingFixes: boolean;
  /** The current gap report (null if not analyzed) */
  report: GapReportData | null;
  /** Error message if detection failed */
  error: string | null;
  /** Whether the gap report is visible */
  isVisible: boolean;
}

/**
 * Service configuration for gap analysis
 */
export interface ServiceConfigForAnalysis {
  id: string;
  name: string;
  type?: string;
  forms: Array<{
    id: string;
    name: string;
    sections: Array<{
      id: string;
      name: string;
      fields: Array<{
        id: string;
        name: string;
        type: string;
        validation?: Record<string, unknown>;
      }>;
    }>;
    fields: Array<{
      id: string;
      name: string;
      type: string;
      validation?: Record<string, unknown>;
    }>;
  }>;
  workflow?: {
    id: string;
    name: string;
    steps: Array<{
      id: string;
      name: string;
      isTerminal?: boolean;
      isStart?: boolean;
    }>;
    transitions: Array<{
      id: string;
      fromStepId: string;
      toStepId: string;
    }>;
    startStepId?: string;
  };
}

/**
 * Options for the useGapDetection hook
 */
export interface UseGapDetectionOptions {
  /** Service configuration to analyze */
  config: ServiceConfigForAnalysis | null;
  /** Callback when fixes are applied */
  onApplyFixes?: (gapIds: string[]) => Promise<void>;
  /** Whether to auto-detect on config change */
  autoDetect?: boolean;
  /** Debounce delay for auto-detection (ms) */
  debounceMs?: number;
}

/**
 * Return value of the useGapDetection hook
 */
export interface UseGapDetectionReturn {
  /** Current state */
  state: GapDetectionState;
  /** Trigger gap detection */
  detectGaps: () => Promise<void>;
  /** Apply all available fixes */
  fixAll: () => Promise<void>;
  /** Apply fixes for specific gap IDs */
  fixSelected: (gapIds: string[]) => Promise<void>;
  /** Dismiss the gap report */
  dismiss: () => void;
  /** Show the gap report */
  show: () => void;
  /** Clear the report and state */
  clear: () => void;
}

/**
 * Generate a unique gap ID
 */
function generateGapId(): string {
  return `gap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Analyze configuration for gaps (client-side implementation)
 */
function analyzeConfig(config: ServiceConfigForAnalysis): GapReportData {
  const gaps: GapItem[] = [];

  // Get all fields from all forms
  const allFields: Array<{ id: string; name: string; type: string; validation?: Record<string, unknown> }> = [];
  for (const form of config.forms) {
    allFields.push(...form.fields);
    for (const section of form.sections) {
      allFields.push(...section.fields);
    }
  }

  // Check for missing applicant name
  const hasName = allFields.some(
    (f) =>
      f.name.toLowerCase().includes('name') ||
      f.name.toLowerCase().includes('applicant')
  );
  if (!hasName) {
    gaps.push({
      id: generateGapId(),
      severity: 'critical',
      message: 'No applicant name field found',
      suggestion: 'Add a field to collect applicant name',
      location: config.forms[0]?.name ?? 'Form',
      hasFix: true,
      fix: {
        action: 'add_field',
        description: 'Add "Applicant Full Name" field',
      },
    });
  }

  // Check for missing email
  const hasEmail = allFields.some(
    (f) =>
      f.type === 'email' ||
      f.name.toLowerCase().includes('email')
  );
  if (!hasEmail) {
    gaps.push({
      id: generateGapId(),
      severity: 'warning',
      message: 'No contact email field found',
      suggestion: 'Add an email field for notifications',
      location: config.forms[0]?.name ?? 'Form',
      hasFix: true,
      fix: {
        action: 'add_field',
        description: 'Add "Email Address" field',
      },
    });
  }

  // Check for validation gaps
  for (const field of allFields) {
    if (field.type === 'email' && !field.validation?.pattern) {
      gaps.push({
        id: generateGapId(),
        severity: 'warning',
        message: `Email field "${field.name}" lacks format validation`,
        suggestion: 'Add email pattern validation',
        location: `field "${field.name}"`,
        hasFix: true,
        fix: {
          action: 'add_validation',
          description: `Add email pattern to "${field.name}"`,
        },
      });
    }

    if (field.type === 'tel' && !field.validation?.pattern) {
      gaps.push({
        id: generateGapId(),
        severity: 'suggestion',
        message: `Phone field "${field.name}" lacks format validation`,
        suggestion: 'Add phone pattern validation',
        location: `field "${field.name}"`,
        hasFix: true,
        fix: {
          action: 'add_validation',
          description: `Add phone pattern to "${field.name}"`,
        },
      });
    }
  }

  // Check workflow gaps
  if (config.workflow) {
    const { workflow } = config;

    // Check for start state
    if (!workflow.startStepId && !workflow.steps.some((s) => s.isStart)) {
      if (workflow.steps.length > 0) {
        gaps.push({
          id: generateGapId(),
          severity: 'critical',
          message: 'Workflow has no designated start step',
          suggestion: 'Set one step as the start step',
          location: `workflow "${workflow.name}"`,
          hasFix: true,
          fix: {
            action: 'set_start',
            description: `Set "${workflow.steps[0]?.name}" as start step`,
          },
        });
      }
    }

    // Check for end state
    if (!workflow.steps.some((s) => s.isTerminal)) {
      if (workflow.steps.length > 0) {
        gaps.push({
          id: generateGapId(),
          severity: 'critical',
          message: 'Workflow has no terminal (end) step',
          suggestion: 'Mark at least one step as terminal',
          location: `workflow "${workflow.name}"`,
          hasFix: false,
        });
      }
    }

    // Check for orphan steps
    if (workflow.steps.length > 1) {
      const startId = workflow.startStepId ?? workflow.steps.find((s) => s.isStart)?.id ?? workflow.steps[0]?.id;
      const reachable = new Set<string>();
      const queue = [startId];
      reachable.add(startId!);

      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const t of workflow.transitions) {
          if (t.fromStepId === current && !reachable.has(t.toStepId)) {
            reachable.add(t.toStepId);
            queue.push(t.toStepId);
          }
        }
      }

      for (const step of workflow.steps) {
        if (!reachable.has(step.id)) {
          gaps.push({
            id: generateGapId(),
            severity: 'critical',
            message: `Step "${step.name}" is not reachable from start`,
            suggestion: 'Add a transition to this step or remove it',
            location: `step "${step.name}"`,
            hasFix: true,
            fix: {
              action: 'remove_step',
              description: `Remove orphan step "${step.name}"`,
            },
          });
        }
      }
    }
  }

  // Categorize gaps
  const criticalGaps = gaps.filter((g) => g.severity === 'critical');
  const warningGaps = gaps.filter((g) => g.severity === 'warning');
  const suggestionGaps = gaps.filter((g) => g.severity === 'suggestion');
  const fixableCount = gaps.filter((g) => g.hasFix).length;

  // Generate summary
  let summary: string;
  if (gaps.length === 0) {
    summary = 'No gaps detected. Configuration appears complete.';
  } else {
    const parts: string[] = [];
    if (criticalGaps.length > 0) {
      parts.push(`${criticalGaps.length} critical`);
    }
    if (warningGaps.length > 0) {
      parts.push(`${warningGaps.length} warning${warningGaps.length > 1 ? 's' : ''}`);
    }
    if (suggestionGaps.length > 0) {
      parts.push(`${suggestionGaps.length} suggestion${suggestionGaps.length > 1 ? 's' : ''}`);
    }
    summary = `Found ${parts.join(', ')}.`;
  }

  return {
    timestamp: Date.now(),
    totalGaps: gaps.length,
    summary,
    criticalGaps,
    warningGaps,
    suggestionGaps,
    fixableCount,
  };
}

/**
 * Hook for managing gap detection flow
 */
export function useGapDetection({
  config,
  onApplyFixes,
  autoDetect = false,
  debounceMs = 1000,
}: UseGapDetectionOptions): UseGapDetectionReturn {
  const [state, setState] = React.useState<GapDetectionState>({
    isDetecting: false,
    isApplyingFixes: false,
    report: null,
    error: null,
    isVisible: false,
  });

  // Debounce timer ref
  const debounceTimer = React.useRef<NodeJS.Timeout | null>(null);

  /**
   * Detect gaps in the current configuration
   */
  const detectGaps = React.useCallback(async () => {
    if (!config) {
      setState((prev) => ({
        ...prev,
        error: 'No configuration to analyze',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isDetecting: true,
      error: null,
    }));

    try {
      // Simulate async analysis (in production, this might call a backend API)
      const report = analyzeConfig(config);

      setState((prev) => ({
        ...prev,
        isDetecting: false,
        report,
        isVisible: report.totalGaps > 0,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isDetecting: false,
        error: error instanceof Error ? error.message : 'Gap detection failed',
      }));
    }
  }, [config]);

  /**
   * Apply all available fixes
   */
  const fixAll = React.useCallback(async () => {
    if (!state.report || !onApplyFixes) return;

    const allFixableIds = [
      ...state.report.criticalGaps,
      ...state.report.warningGaps,
      ...state.report.suggestionGaps,
    ]
      .filter((g) => g.hasFix)
      .map((g) => g.id);

    if (allFixableIds.length === 0) return;

    setState((prev) => ({ ...prev, isApplyingFixes: true, error: null }));

    try {
      await onApplyFixes(allFixableIds);

      // Re-run detection after fixes
      setState((prev) => ({
        ...prev,
        isApplyingFixes: false,
        report: null,
        isVisible: false,
      }));

      // Trigger re-detection
      setTimeout(() => detectGaps(), 100);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isApplyingFixes: false,
        error: error instanceof Error ? error.message : 'Failed to apply fixes',
      }));
    }
  }, [state.report, onApplyFixes, detectGaps]);

  /**
   * Apply fixes for specific gap IDs
   */
  const fixSelected = React.useCallback(
    async (gapIds: string[]) => {
      if (!onApplyFixes || gapIds.length === 0) return;

      setState((prev) => ({ ...prev, isApplyingFixes: true, error: null }));

      try {
        await onApplyFixes(gapIds);

        // Re-run detection after fixes
        setState((prev) => ({
          ...prev,
          isApplyingFixes: false,
          report: null,
          isVisible: false,
        }));

        // Trigger re-detection
        setTimeout(() => detectGaps(), 100);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isApplyingFixes: false,
          error: error instanceof Error ? error.message : 'Failed to apply fixes',
        }));
      }
    },
    [onApplyFixes, detectGaps]
  );

  /**
   * Dismiss the gap report
   */
  const dismiss = React.useCallback(() => {
    setState((prev) => ({ ...prev, isVisible: false }));
  }, []);

  /**
   * Show the gap report
   */
  const show = React.useCallback(() => {
    setState((prev) => ({ ...prev, isVisible: true }));
  }, []);

  /**
   * Clear the report and state
   */
  const clear = React.useCallback(() => {
    setState({
      isDetecting: false,
      isApplyingFixes: false,
      report: null,
      error: null,
      isVisible: false,
    });
  }, []);

  // Auto-detect on config change (debounced)
  React.useEffect(() => {
    if (!autoDetect || !config) return;

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      detectGaps();
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [autoDetect, config, debounceMs, detectGaps]);

  return {
    state,
    detectGaps,
    fixAll,
    fixSelected,
    dismiss,
    show,
    clear,
  };
}

export default useGapDetection;

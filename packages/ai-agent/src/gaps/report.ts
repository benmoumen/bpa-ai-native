/**
 * Gap Report Formatter
 *
 * Story 6-6: Gap Detection (Task 3)
 *
 * Formats gap reports for different output contexts (chat, UI, export).
 */

import type { Gap, GapReport, GapFix } from './types.js';

/**
 * Format options for gap report
 */
export interface FormatOptions {
  /** Include fix suggestions */
  includeFixes?: boolean;
  /** Include gap IDs */
  includeIds?: boolean;
  /** Maximum gaps to show per category */
  maxPerCategory?: number;
  /** Whether to use markdown formatting */
  useMarkdown?: boolean;
}

const DEFAULT_FORMAT_OPTIONS: Required<FormatOptions> = {
  includeFixes: true,
  includeIds: false,
  maxPerCategory: 10,
  useMarkdown: true,
};

/**
 * Format a gap report for chat display
 */
export function formatReportForChat(
  report: GapReport,
  options: FormatOptions = {}
): string {
  const opts = { ...DEFAULT_FORMAT_OPTIONS, ...options };

  if (report.totalGaps === 0) {
    return opts.useMarkdown
      ? "**Configuration Analysis Complete**\n\nNo gaps detected. Your configuration appears complete and valid."
      : "Configuration Analysis Complete\n\nNo gaps detected. Your configuration appears complete and valid.";
  }

  const lines: string[] = [];

  // Header
  if (opts.useMarkdown) {
    lines.push('**Configuration Gaps Detected**\n');
    lines.push(report.summary + '\n');
  } else {
    lines.push('Configuration Gaps Detected\n');
    lines.push(report.summary + '\n');
  }

  // Critical gaps
  if (report.criticalGaps.length > 0) {
    lines.push(formatGapSection('Critical Issues', report.criticalGaps, opts, '🔴'));
  }

  // Warnings
  if (report.warningGaps.length > 0) {
    lines.push(formatGapSection('Warnings', report.warningGaps, opts, '🟡'));
  }

  // Suggestions
  if (report.suggestionGaps.length > 0) {
    lines.push(formatGapSection('Suggestions', report.suggestionGaps, opts, '🔵'));
  }

  // Fix prompt
  const fixableCount = [
    ...report.criticalGaps,
    ...report.warningGaps,
    ...report.suggestionGaps,
  ].filter((g) => g.fix).length;

  if (fixableCount > 0) {
    lines.push('');
    if (opts.useMarkdown) {
      lines.push(
        `**${String(fixableCount)} ${fixableCount === 1 ? 'gap has' : 'gaps have'} automatic fixes available.**`
      );
      lines.push('Would you like me to fix these issues?');
    } else {
      lines.push(
        `${String(fixableCount)} ${fixableCount === 1 ? 'gap has' : 'gaps have'} automatic fixes available.`
      );
      lines.push('Would you like me to fix these issues?');
    }
  }

  return lines.join('\n');
}

/**
 * Format a section of gaps
 */
function formatGapSection(
  title: string,
  gaps: Gap[],
  opts: Required<FormatOptions>,
  emoji: string
): string {
  const lines: string[] = [];
  const displayGaps = gaps.slice(0, opts.maxPerCategory);
  const remaining = gaps.length - displayGaps.length;

  if (opts.useMarkdown) {
    lines.push(`\n### ${emoji} ${title} (${String(gaps.length)})\n`);
  } else {
    lines.push(`\n${title} (${String(gaps.length)}):\n`);
  }

  for (const gap of displayGaps) {
    lines.push(formatGapItem(gap, opts));
  }

  if (remaining > 0) {
    lines.push(`  ... and ${String(remaining)} more`);
  }

  return lines.join('\n');
}

/**
 * Format a single gap item
 */
function formatGapItem(gap: Gap, opts: Required<FormatOptions>): string {
  const parts: string[] = [];

  if (opts.useMarkdown) {
    parts.push(`- **${gap.message}**`);
    parts.push(`  - Location: ${formatLocation(gap)}`);
    parts.push(`  - Suggestion: ${gap.suggestion}`);
    if (opts.includeFixes && gap.fix) {
      parts.push(`  - Fix: ${gap.fix.description}`);
    }
  } else {
    parts.push(`- ${gap.message}`);
    parts.push(`  Location: ${formatLocation(gap)}`);
    parts.push(`  Suggestion: ${gap.suggestion}`);
    if (opts.includeFixes && gap.fix) {
      parts.push(`  Fix: ${gap.fix.description}`);
    }
  }

  if (opts.includeIds) {
    parts.push(`  ID: ${gap.id}`);
  }

  return parts.join('\n');
}

/**
 * Format gap location for display
 */
function formatLocation(gap: Gap): string {
  const { location } = gap;
  const parts: string[] = [location.entityType];

  if (location.entityName) {
    parts.push(`"${location.entityName}"`);
  }

  if (location.parentName) {
    parts.push(`in ${location.parentName}`);
  }

  return parts.join(' ');
}

/**
 * Format a gap report for UI display (structured data)
 */
export interface UiGapItem {
  id: string;
  type: Gap['type'];
  severity: Gap['severity'];
  message: string;
  suggestion: string;
  location: string;
  hasFix: boolean;
  fix?: {
    action: string;
    description: string;
  };
}

export interface UiGapReport {
  timestamp: number;
  totalGaps: number;
  summary: string;
  hasFixableGaps: boolean;
  fixableCount: number;
  critical: UiGapItem[];
  warnings: UiGapItem[];
  suggestions: UiGapItem[];
}

/**
 * Convert a gap report to UI-friendly format
 */
export function formatReportForUi(report: GapReport): UiGapReport {
  const convertGap = (gap: Gap): UiGapItem => ({
    id: gap.id,
    type: gap.type,
    severity: gap.severity,
    message: gap.message,
    suggestion: gap.suggestion,
    location: formatLocation(gap),
    hasFix: !!gap.fix,
    fix: gap.fix
      ? {
          action: gap.fix.action,
          description: gap.fix.description,
        }
      : undefined,
  });

  const allGaps = [
    ...report.criticalGaps,
    ...report.warningGaps,
    ...report.suggestionGaps,
  ];
  const fixableCount = allGaps.filter((g) => g.fix).length;

  return {
    timestamp: report.timestamp,
    totalGaps: report.totalGaps,
    summary: report.summary,
    hasFixableGaps: fixableCount > 0,
    fixableCount,
    critical: report.criticalGaps.map(convertGap),
    warnings: report.warningGaps.map(convertGap),
    suggestions: report.suggestionGaps.map(convertGap),
  };
}

/**
 * Generate a fix prompt message
 */
export function generateFixPrompt(report: GapReport): string | null {
  const allGaps = [
    ...report.criticalGaps,
    ...report.warningGaps,
    ...report.suggestionGaps,
  ];
  const fixableGaps = allGaps.filter((g) => g.fix);

  if (fixableGaps.length === 0) {
    return null;
  }

  const criticalFixes = report.criticalGaps.filter((g) => g.fix).length;
  const warningFixes = report.warningGaps.filter((g) => g.fix).length;
  const suggestionFixes = report.suggestionGaps.filter((g) => g.fix).length;

  const parts: string[] = [];

  if (criticalFixes > 0) {
    parts.push(`${String(criticalFixes)} critical`);
  }
  if (warningFixes > 0) {
    parts.push(`${String(warningFixes)} warning${warningFixes > 1 ? 's' : ''}`);
  }
  if (suggestionFixes > 0) {
    parts.push(`${String(suggestionFixes)} suggestion${suggestionFixes > 1 ? 's' : ''}`);
  }

  return `I can automatically fix ${parts.join(', ')}. Would you like me to fix all issues, or would you prefer to select specific ones?`;
}

/**
 * Get all fixes from a report
 */
export function getFixesFromReport(report: GapReport): Array<{ gap: Gap; fix: GapFix }> {
  const allGaps = [
    ...report.criticalGaps,
    ...report.warningGaps,
    ...report.suggestionGaps,
  ];

  return allGaps
    .filter((g): g is Gap & { fix: GapFix } => !!g.fix)
    .map((g) => ({ gap: g, fix: g.fix }));
}

/**
 * Get fixes for specific gap IDs
 */
export function getFixesForGapIds(
  report: GapReport,
  gapIds: string[]
): Array<{ gap: Gap; fix: GapFix }> {
  const idSet = new Set(gapIds);
  return getFixesFromReport(report).filter(({ gap }) => idSet.has(gap.id));
}

export default {
  formatReportForChat,
  formatReportForUi,
  generateFixPrompt,
  getFixesFromReport,
  getFixesForGapIds,
};

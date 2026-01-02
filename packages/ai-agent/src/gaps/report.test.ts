/**
 * Gap Report Tests
 *
 * Story 6-6: Gap Detection (Task 3)
 */

import { describe, it, expect } from 'vitest';
import {
  formatReportForChat,
  formatReportForUi,
  generateFixPrompt,
  getFixesFromReport,
  getFixesForGapIds,
} from './report.js';
import type { Gap, GapReport } from './types.js';

const createMockGap = (overrides: Partial<Gap> = {}): Gap => ({
  id: `gap-${Math.random().toString(36).slice(2)}`,
  type: 'MISSING_FIELD',
  severity: 'warning',
  message: 'Test gap message',
  suggestion: 'Test suggestion',
  location: { entityType: 'form', entityName: 'Test Form' },
  ...overrides,
});

const createMockReport = (overrides: Partial<GapReport> = {}): GapReport => ({
  timestamp: Date.now(),
  totalGaps: 0,
  criticalGaps: [],
  warningGaps: [],
  suggestionGaps: [],
  summary: 'Test summary',
  ...overrides,
});

describe('formatReportForChat', () => {
  it('returns no gaps message when report is empty', () => {
    const report = createMockReport();
    const formatted = formatReportForChat(report);

    expect(formatted).toContain('No gaps detected');
    expect(formatted).toContain('complete');
  });

  it('includes critical gaps section', () => {
    const report = createMockReport({
      totalGaps: 1,
      criticalGaps: [
        createMockGap({ severity: 'critical', message: 'Critical issue here' }),
      ],
      summary: 'Found 1 critical issue.',
    });

    const formatted = formatReportForChat(report);

    expect(formatted).toContain('Critical');
    expect(formatted).toContain('Critical issue here');
  });

  it('includes warning gaps section', () => {
    const report = createMockReport({
      totalGaps: 1,
      warningGaps: [
        createMockGap({ severity: 'warning', message: 'Warning issue here' }),
      ],
      summary: 'Found 1 warning.',
    });

    const formatted = formatReportForChat(report);

    expect(formatted).toContain('Warning');
    expect(formatted).toContain('Warning issue here');
  });

  it('includes suggestion gaps section', () => {
    const report = createMockReport({
      totalGaps: 1,
      suggestionGaps: [
        createMockGap({ severity: 'suggestion', message: 'Suggestion here' }),
      ],
      summary: 'Found 1 suggestion.',
    });

    const formatted = formatReportForChat(report);

    expect(formatted).toContain('Suggestion');
    expect(formatted).toContain('Suggestion here');
  });

  it('includes fix prompt when fixes available', () => {
    const report = createMockReport({
      totalGaps: 1,
      criticalGaps: [
        createMockGap({
          severity: 'critical',
          fix: {
            action: 'add_field',
            params: {},
            description: 'Add test field',
          },
        }),
      ],
      summary: 'Found 1 critical issue.',
    });

    const formatted = formatReportForChat(report);

    expect(formatted).toContain('automatic fix');
    expect(formatted).toContain('Would you like me to fix');
  });

  it('uses markdown formatting by default', () => {
    const report = createMockReport({
      totalGaps: 1,
      criticalGaps: [createMockGap({ severity: 'critical' })],
      summary: 'Found 1 critical issue.',
    });

    const formatted = formatReportForChat(report);

    expect(formatted).toContain('**');
    expect(formatted).toContain('###');
  });

  it('respects useMarkdown: false option', () => {
    const report = createMockReport({
      totalGaps: 1,
      criticalGaps: [createMockGap({ severity: 'critical' })],
      summary: 'Found 1 critical issue.',
    });

    const formatted = formatReportForChat(report, { useMarkdown: false });

    expect(formatted).not.toContain('**');
    expect(formatted).not.toContain('###');
  });

  it('respects maxPerCategory option', () => {
    const report = createMockReport({
      totalGaps: 5,
      criticalGaps: [
        createMockGap({ message: 'Gap 1' }),
        createMockGap({ message: 'Gap 2' }),
        createMockGap({ message: 'Gap 3' }),
        createMockGap({ message: 'Gap 4' }),
        createMockGap({ message: 'Gap 5' }),
      ],
      summary: 'Found 5 critical issues.',
    });

    const formatted = formatReportForChat(report, { maxPerCategory: 2 });

    expect(formatted).toContain('Gap 1');
    expect(formatted).toContain('Gap 2');
    expect(formatted).toContain('... and 3 more');
  });

  it('includes location information', () => {
    const report = createMockReport({
      totalGaps: 1,
      criticalGaps: [
        createMockGap({
          location: { entityType: 'field', entityName: 'Email', parentName: 'Contact Form' },
        }),
      ],
      summary: 'Found 1 critical issue.',
    });

    const formatted = formatReportForChat(report);

    expect(formatted).toContain('Email');
    expect(formatted).toContain('Contact Form');
  });
});

describe('formatReportForUi', () => {
  it('returns structured UI report', () => {
    const report = createMockReport({
      totalGaps: 2,
      criticalGaps: [createMockGap({ severity: 'critical' })],
      warningGaps: [createMockGap({ severity: 'warning' })],
      summary: 'Test',
    });

    const uiReport = formatReportForUi(report);

    expect(uiReport.totalGaps).toBe(2);
    expect(uiReport.critical).toHaveLength(1);
    expect(uiReport.warnings).toHaveLength(1);
    expect(uiReport.suggestions).toHaveLength(0);
  });

  it('includes hasFixableGaps flag', () => {
    const reportWithFix = createMockReport({
      totalGaps: 1,
      criticalGaps: [
        createMockGap({
          fix: { action: 'add_field', params: {}, description: 'Fix' },
        }),
      ],
    });

    const reportWithoutFix = createMockReport({
      totalGaps: 1,
      criticalGaps: [createMockGap()],
    });

    expect(formatReportForUi(reportWithFix).hasFixableGaps).toBe(true);
    expect(formatReportForUi(reportWithoutFix).hasFixableGaps).toBe(false);
  });

  it('counts fixable gaps correctly', () => {
    const report = createMockReport({
      totalGaps: 3,
      criticalGaps: [
        createMockGap({ fix: { action: 'add_field', params: {}, description: 'Fix 1' } }),
      ],
      warningGaps: [
        createMockGap({ fix: { action: 'add_field', params: {}, description: 'Fix 2' } }),
        createMockGap(), // No fix
      ],
    });

    const uiReport = formatReportForUi(report);

    expect(uiReport.fixableCount).toBe(2);
  });

  it('formats location as string', () => {
    const report = createMockReport({
      totalGaps: 1,
      criticalGaps: [
        createMockGap({
          location: { entityType: 'field', entityName: 'Email' },
        }),
      ],
    });

    const uiReport = formatReportForUi(report);

    expect(uiReport.critical[0].location).toBe('field "Email"');
  });

  it('includes fix information in UI items', () => {
    const report = createMockReport({
      totalGaps: 1,
      criticalGaps: [
        createMockGap({
          fix: { action: 'add_field', params: {}, description: 'Add email field' },
        }),
      ],
    });

    const uiReport = formatReportForUi(report);

    expect(uiReport.critical[0].hasFix).toBe(true);
    expect(uiReport.critical[0].fix?.description).toBe('Add email field');
  });
});

describe('generateFixPrompt', () => {
  it('returns null when no fixes available', () => {
    const report = createMockReport({
      totalGaps: 1,
      criticalGaps: [createMockGap()],
    });

    const prompt = generateFixPrompt(report);

    expect(prompt).toBeNull();
  });

  it('generates prompt for single fix', () => {
    const report = createMockReport({
      totalGaps: 1,
      criticalGaps: [
        createMockGap({
          fix: { action: 'add_field', params: {}, description: 'Fix' },
        }),
      ],
    });

    const prompt = generateFixPrompt(report);

    expect(prompt).toContain('1 critical');
    expect(prompt).toContain('automatically fix');
  });

  it('includes multiple fix categories', () => {
    const report = createMockReport({
      totalGaps: 3,
      criticalGaps: [
        createMockGap({ fix: { action: 'add_field', params: {}, description: 'Fix' } }),
      ],
      warningGaps: [
        createMockGap({ fix: { action: 'add_field', params: {}, description: 'Fix' } }),
        createMockGap({ fix: { action: 'add_field', params: {}, description: 'Fix' } }),
      ],
    });

    const prompt = generateFixPrompt(report);

    expect(prompt).toContain('1 critical');
    expect(prompt).toContain('2 warnings');
  });

  it('handles suggestions correctly', () => {
    const report = createMockReport({
      totalGaps: 1,
      suggestionGaps: [
        createMockGap({ fix: { action: 'add_field', params: {}, description: 'Fix' } }),
      ],
    });

    const prompt = generateFixPrompt(report);

    expect(prompt).toContain('1 suggestion');
  });
});

describe('getFixesFromReport', () => {
  it('returns empty array when no fixes', () => {
    const report = createMockReport({
      totalGaps: 1,
      criticalGaps: [createMockGap()],
    });

    const fixes = getFixesFromReport(report);

    expect(fixes).toHaveLength(0);
  });

  it('extracts all fixes from report', () => {
    const gap1 = createMockGap({
      id: 'gap-1',
      fix: { action: 'add_field', params: { name: 'field1' }, description: 'Fix 1' },
    });
    const gap2 = createMockGap({
      id: 'gap-2',
      fix: { action: 'add_validation', params: { pattern: 'email' }, description: 'Fix 2' },
    });
    const gap3 = createMockGap({ id: 'gap-3' }); // No fix

    const report = createMockReport({
      totalGaps: 3,
      criticalGaps: [gap1],
      warningGaps: [gap2, gap3],
    });

    const fixes = getFixesFromReport(report);

    expect(fixes).toHaveLength(2);
    expect(fixes[0].gap.id).toBe('gap-1');
    expect(fixes[1].gap.id).toBe('gap-2');
  });

  it('includes gap and fix in result', () => {
    const gap = createMockGap({
      message: 'Test message',
      fix: { action: 'add_field', params: {}, description: 'Test fix' },
    });

    const report = createMockReport({
      totalGaps: 1,
      criticalGaps: [gap],
    });

    const fixes = getFixesFromReport(report);

    expect(fixes[0].gap.message).toBe('Test message');
    expect(fixes[0].fix.description).toBe('Test fix');
  });
});

describe('getFixesForGapIds', () => {
  it('returns empty array when no matching IDs', () => {
    const gap = createMockGap({
      id: 'gap-1',
      fix: { action: 'add_field', params: {}, description: 'Fix' },
    });

    const report = createMockReport({
      totalGaps: 1,
      criticalGaps: [gap],
    });

    const fixes = getFixesForGapIds(report, ['gap-nonexistent']);

    expect(fixes).toHaveLength(0);
  });

  it('returns fixes for specified IDs only', () => {
    const gap1 = createMockGap({
      id: 'gap-1',
      fix: { action: 'add_field', params: {}, description: 'Fix 1' },
    });
    const gap2 = createMockGap({
      id: 'gap-2',
      fix: { action: 'add_field', params: {}, description: 'Fix 2' },
    });
    const gap3 = createMockGap({
      id: 'gap-3',
      fix: { action: 'add_field', params: {}, description: 'Fix 3' },
    });

    const report = createMockReport({
      totalGaps: 3,
      criticalGaps: [gap1, gap2, gap3],
    });

    const fixes = getFixesForGapIds(report, ['gap-1', 'gap-3']);

    expect(fixes).toHaveLength(2);
    expect(fixes.map((f) => f.gap.id)).toEqual(['gap-1', 'gap-3']);
  });

  it('ignores gaps without fixes', () => {
    const gap1 = createMockGap({
      id: 'gap-1',
      fix: { action: 'add_field', params: {}, description: 'Fix 1' },
    });
    const gap2 = createMockGap({ id: 'gap-2' }); // No fix

    const report = createMockReport({
      totalGaps: 2,
      criticalGaps: [gap1, gap2],
    });

    const fixes = getFixesForGapIds(report, ['gap-1', 'gap-2']);

    expect(fixes).toHaveLength(1);
    expect(fixes[0].gap.id).toBe('gap-1');
  });
});

/**
 * Gap Fixer Tests
 *
 * Story 6-6: Gap Detection (Task 6)
 */

import { describe, it, expect, vi } from 'vitest';
import type { GapItem } from './GapReport';
import {
  gapFixToIntent,
  generateFixPreviews,
  applyGapFixes,
  filterGapsByIds,
  getFixableGaps,
  describeFixAction,
} from './gap-fixer';

// Helper to create test gaps
const createGap = (overrides: Partial<GapItem> = {}): GapItem => ({
  id: `gap-${Math.random().toString(36).slice(2)}`,
  severity: 'warning',
  message: 'Test gap message',
  suggestion: 'Test suggestion',
  location: 'Test Form',
  hasFix: false,
  ...overrides,
});

describe('gap-fixer', () => {
  describe('gapFixToIntent', () => {
    it('returns null for gaps without fixes', () => {
      const gap = createGap({ hasFix: false });
      expect(gapFixToIntent(gap)).toBeNull();
    });

    it('returns null when fix is undefined', () => {
      const gap = createGap({ hasFix: true, fix: undefined });
      expect(gapFixToIntent(gap)).toBeNull();
    });

    it('creates ADD_FIELD intent for add_field action', () => {
      const gap = createGap({
        hasFix: true,
        fix: {
          action: 'add_field',
          description: 'Add field',
          params: { fieldName: 'Email', fieldType: 'email' },
        },
      });

      const intent = gapFixToIntent(gap);
      expect(intent).toEqual({
        type: 'ADD_FIELD',
        fieldName: 'Email',
        fieldType: 'email',
        validation: undefined,
      });
    });

    it('creates ADD_FIELD intent with validation', () => {
      const gap = createGap({
        hasFix: true,
        fix: {
          action: 'add_field',
          description: 'Add field',
          params: {
            fieldName: 'Phone',
            fieldType: 'tel',
            validation: { required: true, pattern: '^[0-9]+$' },
          },
        },
      });

      const intent = gapFixToIntent(gap);
      expect(intent).toEqual({
        type: 'ADD_FIELD',
        fieldName: 'Phone',
        fieldType: 'tel',
        validation: { required: true, pattern: '^[0-9]+$' },
      });
    });

    it('creates MODIFY_FIELD intent for add_validation action', () => {
      const gap = createGap({
        hasFix: true,
        fix: {
          action: 'add_validation',
          description: 'Add validation',
          params: { fieldId: 'email-field', pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        },
      });

      const intent = gapFixToIntent(gap);
      expect(intent?.type).toBe('MODIFY_FIELD');
    });

    it('creates workflow intent for set_start action', () => {
      const gap = createGap({
        hasFix: true,
        fix: {
          action: 'set_start',
          description: 'Set start',
          params: { stepId: 'step-1' },
        },
      });

      const intent = gapFixToIntent(gap);
      expect(intent?.type).toBe('MODIFY_FIELD');
      expect((intent as { fieldName: string }).fieldName).toBe('workflow:set_start');
    });

    it('creates workflow intent for remove_step action', () => {
      const gap = createGap({
        hasFix: true,
        fix: {
          action: 'remove_step',
          description: 'Remove step',
          params: { stepId: 'orphan-step' },
        },
      });

      const intent = gapFixToIntent(gap);
      expect(intent?.type).toBe('MODIFY_FIELD');
      expect((intent as { fieldName: string }).fieldName).toBe('workflow:remove_step');
    });

    it('defaults to text type when fieldType not provided', () => {
      const gap = createGap({
        hasFix: true,
        fix: {
          action: 'add_field',
          description: 'Add field',
          params: { fieldName: 'Name' },
        },
      });

      const intent = gapFixToIntent(gap);
      expect(intent).toMatchObject({
        type: 'ADD_FIELD',
        fieldName: 'Name',
        fieldType: 'text',
      });
    });
  });

  describe('generateFixPreviews', () => {
    it('returns empty array for empty input', () => {
      expect(generateFixPreviews([])).toEqual([]);
    });

    it('filters out gaps without fixes', () => {
      const gaps = [
        createGap({ hasFix: false }),
        createGap({ hasFix: true, fix: undefined }),
      ];
      expect(generateFixPreviews(gaps)).toEqual([]);
    });

    it('generates previews for fixable gaps', () => {
      const gaps = [
        createGap({
          id: 'gap-1',
          message: 'Missing email',
          hasFix: true,
          fix: {
            action: 'add_field',
            description: 'Add email',
            params: { fieldName: 'Email', fieldType: 'email' },
          },
        }),
      ];

      const previews = generateFixPreviews(gaps);
      expect(previews).toHaveLength(1);
      expect(previews[0].gapId).toBe('gap-1');
      expect(previews[0].message).toBe('Missing email');
      expect(previews[0].intent.type).toBe('ADD_FIELD');
    });

    it('generates multiple previews', () => {
      const gaps = [
        createGap({
          hasFix: true,
          fix: { action: 'add_field', description: 'Add 1', params: { fieldName: 'A' } },
        }),
        createGap({
          hasFix: true,
          fix: { action: 'add_field', description: 'Add 2', params: { fieldName: 'B' } },
        }),
        createGap({ hasFix: false }), // Should be filtered
      ];

      const previews = generateFixPreviews(gaps);
      expect(previews).toHaveLength(2);
    });
  });

  describe('applyGapFixes', () => {
    it('returns empty result for empty gaps', async () => {
      const result = await applyGapFixes([], {});
      expect(result).toEqual({
        success: true,
        appliedCount: 0,
        failedCount: 0,
        errors: [],
      });
    });

    it('calls onAddField for add_field fixes', async () => {
      const onAddField = vi.fn().mockResolvedValue(undefined);
      const gaps = [
        createGap({
          hasFix: true,
          fix: { action: 'add_field', description: 'Add', params: { fieldName: 'Test' } },
        }),
      ];

      const result = await applyGapFixes(gaps, { onAddField });

      expect(onAddField).toHaveBeenCalledTimes(1);
      expect(onAddField).toHaveBeenCalledWith({
        type: 'ADD_FIELD',
        fieldName: 'Test',
        fieldType: 'text',
        validation: undefined,
      });
      expect(result.appliedCount).toBe(1);
      expect(result.success).toBe(true);
    });

    it('calls onModifyField for add_validation fixes', async () => {
      const onModifyField = vi.fn().mockResolvedValue(undefined);
      const gaps = [
        createGap({
          hasFix: true,
          fix: {
            action: 'add_validation',
            description: 'Add validation',
            params: { fieldId: 'f1', pattern: '^test$' },
          },
        }),
      ];

      const result = await applyGapFixes(gaps, { onModifyField });

      expect(onModifyField).toHaveBeenCalledTimes(1);
      expect(result.appliedCount).toBe(1);
    });

    it('calls onWorkflowChange for workflow fixes', async () => {
      const onWorkflowChange = vi.fn().mockResolvedValue(undefined);
      const gaps = [
        createGap({
          hasFix: true,
          fix: { action: 'set_start', description: 'Set start', params: { stepId: 's1' } },
        }),
      ];

      const result = await applyGapFixes(gaps, { onWorkflowChange });

      expect(onWorkflowChange).toHaveBeenCalledWith('set_start', { stepId: 's1' });
      expect(result.appliedCount).toBe(1);
    });

    it('handles errors gracefully', async () => {
      const onAddField = vi.fn().mockRejectedValue(new Error('Failed'));
      const gaps = [
        createGap({
          id: 'gap-err',
          hasFix: true,
          fix: { action: 'add_field', description: 'Add', params: { fieldName: 'Test' } },
        }),
      ];

      const result = await applyGapFixes(gaps, { onAddField });

      expect(result.success).toBe(false);
      expect(result.failedCount).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].gapId).toBe('gap-err');
      expect(result.errors[0].error).toBe('Failed');
    });

    it('continues after errors', async () => {
      const onAddField = vi
        .fn()
        .mockRejectedValueOnce(new Error('First failed'))
        .mockResolvedValueOnce(undefined);

      const gaps = [
        createGap({
          id: 'gap-1',
          hasFix: true,
          fix: { action: 'add_field', description: 'Add 1', params: { fieldName: 'A' } },
        }),
        createGap({
          id: 'gap-2',
          hasFix: true,
          fix: { action: 'add_field', description: 'Add 2', params: { fieldName: 'B' } },
        }),
      ];

      const result = await applyGapFixes(gaps, { onAddField });

      expect(result.appliedCount).toBe(1);
      expect(result.failedCount).toBe(1);
      expect(result.success).toBe(false);
    });

    it('skips gaps without handlers', async () => {
      const gaps = [
        createGap({
          hasFix: true,
          fix: { action: 'add_field', description: 'Add', params: { fieldName: 'Test' } },
        }),
      ];

      // No handlers provided
      const result = await applyGapFixes(gaps, {});

      expect(result.appliedCount).toBe(0);
      expect(result.success).toBe(true);
    });
  });

  describe('filterGapsByIds', () => {
    it('returns empty for empty input', () => {
      expect(filterGapsByIds([], ['id1'])).toEqual([]);
      expect(filterGapsByIds([createGap()], [])).toEqual([]);
    });

    it('filters gaps by IDs', () => {
      const gaps = [
        createGap({ id: 'gap-1' }),
        createGap({ id: 'gap-2' }),
        createGap({ id: 'gap-3' }),
      ];

      const filtered = filterGapsByIds(gaps, ['gap-1', 'gap-3']);
      expect(filtered).toHaveLength(2);
      expect(filtered.map((g) => g.id)).toEqual(['gap-1', 'gap-3']);
    });

    it('ignores non-existent IDs', () => {
      const gaps = [createGap({ id: 'gap-1' })];
      const filtered = filterGapsByIds(gaps, ['gap-1', 'gap-nonexistent']);
      expect(filtered).toHaveLength(1);
    });
  });

  describe('getFixableGaps', () => {
    it('returns empty for empty input', () => {
      expect(getFixableGaps([])).toEqual([]);
    });

    it('returns only fixable gaps', () => {
      const gaps = [
        createGap({ id: 'no-fix', hasFix: false }),
        createGap({
          id: 'has-fix',
          hasFix: true,
          fix: { action: 'add_field', description: 'Add' },
        }),
        createGap({ id: 'has-fix-undefined', hasFix: true, fix: undefined }),
      ];

      const fixable = getFixableGaps(gaps);
      expect(fixable).toHaveLength(1);
      expect(fixable[0].id).toBe('has-fix');
    });
  });

  describe('describeFixAction', () => {
    it('describes add_field action', () => {
      const desc = describeFixAction({
        action: 'add_field',
        description: 'Add',
        params: { fieldName: 'Email', fieldType: 'email' },
      });
      expect(desc).toBe('Add field "Email" (email)');
    });

    it('describes add_validation action', () => {
      const desc = describeFixAction({
        action: 'add_validation',
        description: 'Add validation',
        params: { fieldId: 'f1' },
      });
      expect(desc).toBe('Add validation to "f1"');
    });

    it('describes set_start action', () => {
      const desc = describeFixAction({
        action: 'set_start',
        description: 'Set start',
        params: { stepId: 'step-1' },
      });
      expect(desc).toBe('Set "step-1" as start step');
    });

    it('describes set_terminal action', () => {
      const desc = describeFixAction({
        action: 'set_terminal',
        description: 'Set terminal',
        params: { stepId: 'step-end' },
      });
      expect(desc).toBe('Mark "step-end" as terminal step');
    });

    it('describes remove_step action', () => {
      const desc = describeFixAction({
        action: 'remove_step',
        description: 'Remove',
        params: { stepId: 'orphan' },
      });
      expect(desc).toBe('Remove orphan step "orphan"');
    });

    it('falls back to description for unknown actions', () => {
      const desc = describeFixAction({
        action: 'unknown_action' as 'add_field',
        description: 'Custom fix',
      });
      expect(desc).toBe('Custom fix');
    });

    it('uses defaults when params missing', () => {
      const desc = describeFixAction({
        action: 'add_field',
        description: 'Add',
      });
      expect(desc).toBe('Add field "Unknown" (text)');
    });
  });
});

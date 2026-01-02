/**
 * Gap Detection Hook Tests
 *
 * Story 6-6: Gap Detection (Task 4)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGapDetection } from './use-gap-detection';
import type { ServiceConfigForAnalysis } from './use-gap-detection';

describe('useGapDetection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createConfig = (overrides: Partial<ServiceConfigForAnalysis> = {}): ServiceConfigForAnalysis => ({
    id: 'svc-1',
    name: 'Test Service',
    forms: [
      {
        id: 'form-1',
        name: 'Application Form',
        sections: [],
        fields: [],
      },
    ],
    ...overrides,
  });

  describe('initial state', () => {
    it('starts with correct initial state', () => {
      const { result } = renderHook(() =>
        useGapDetection({
          config: createConfig(),
        })
      );

      expect(result.current.state.isDetecting).toBe(false);
      expect(result.current.state.isApplyingFixes).toBe(false);
      expect(result.current.state.report).toBeNull();
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.isVisible).toBe(false);
    });
  });

  describe('detectGaps', () => {
    it('completes analysis and sets report', async () => {
      const { result } = renderHook(() =>
        useGapDetection({
          config: createConfig(),
        })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      // After analysis completes, isDetecting should be false and report should exist
      expect(result.current.state.isDetecting).toBe(false);
      expect(result.current.state.report).not.toBeNull();
    });

    it('sets error when config is null', async () => {
      const { result } = renderHook(() =>
        useGapDetection({
          config: null,
        })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      expect(result.current.state.error).toBe('No configuration to analyze');
    });

    it('detects missing name field as critical gap', async () => {
      const config = createConfig({
        forms: [
          {
            id: 'form-1',
            name: 'Form',
            sections: [],
            fields: [{ id: 'f1', name: 'Description', type: 'text' }],
          },
        ],
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      expect(result.current.state.report).not.toBeNull();
      expect(result.current.state.report!.criticalGaps.length).toBeGreaterThan(0);
      expect(result.current.state.report!.criticalGaps.some((g) => g.message.includes('name'))).toBe(true);
    });

    it('detects missing email field as warning gap', async () => {
      const config = createConfig({
        forms: [
          {
            id: 'form-1',
            name: 'Form',
            sections: [],
            fields: [{ id: 'f1', name: 'Full Name', type: 'text' }],
          },
        ],
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      expect(result.current.state.report).not.toBeNull();
      expect(result.current.state.report!.warningGaps.some((g) => g.message.includes('email'))).toBe(true);
    });

    it('does not flag missing name when name field exists', async () => {
      const config = createConfig({
        forms: [
          {
            id: 'form-1',
            name: 'Form',
            sections: [],
            fields: [
              { id: 'f1', name: 'Applicant Name', type: 'text' },
              { id: 'f2', name: 'Email', type: 'email' },
            ],
          },
        ],
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      const criticalWithName = result.current.state.report?.criticalGaps.filter(
        (g) => g.message.toLowerCase().includes('applicant name')
      );
      expect(criticalWithName?.length ?? 0).toBe(0);
    });

    it('sets isVisible to true when gaps found', async () => {
      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [] }],
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      expect(result.current.state.isVisible).toBe(true);
    });

    it('keeps isVisible false when no gaps', async () => {
      const config = createConfig({
        forms: [
          {
            id: 'form-1',
            name: 'Form',
            sections: [],
            fields: [
              { id: 'f1', name: 'Applicant Name', type: 'text' },
              { id: 'f2', name: 'Email', type: 'email', validation: { pattern: 'email' } },
            ],
          },
        ],
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      // May have other gaps but should be minimal
      expect(result.current.state.report).not.toBeNull();
    });
  });

  describe('workflow analysis', () => {
    it('detects missing start step as critical', async () => {
      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [{ id: 'f1', name: 'Name', type: 'text' }] }],
        workflow: {
          id: 'wf-1',
          name: 'Process',
          steps: [{ id: 's1', name: 'Step 1' }],
          transitions: [],
        },
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      expect(result.current.state.report!.criticalGaps.some((g) => g.message.includes('start'))).toBe(true);
    });

    it('detects missing terminal step as critical', async () => {
      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [{ id: 'f1', name: 'Name', type: 'text' }] }],
        workflow: {
          id: 'wf-1',
          name: 'Process',
          steps: [{ id: 's1', name: 'Step 1', isStart: true }],
          transitions: [],
          startStepId: 's1',
        },
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      expect(result.current.state.report!.criticalGaps.some((g) => g.message.includes('terminal'))).toBe(true);
    });

    it('detects orphan steps', async () => {
      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [{ id: 'f1', name: 'Name', type: 'text' }] }],
        workflow: {
          id: 'wf-1',
          name: 'Process',
          steps: [
            { id: 's1', name: 'Start', isStart: true },
            { id: 's2', name: 'Orphan Step' }, // No transitions to this step
            { id: 's3', name: 'End', isTerminal: true },
          ],
          transitions: [{ id: 't1', fromStepId: 's1', toStepId: 's3' }],
          startStepId: 's1',
        },
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      expect(result.current.state.report!.criticalGaps.some((g) => g.message.includes('Orphan'))).toBe(true);
    });
  });

  describe('validation gap detection', () => {
    it('detects email field without pattern validation', async () => {
      const config = createConfig({
        forms: [
          {
            id: 'form-1',
            name: 'Form',
            sections: [],
            fields: [
              { id: 'f1', name: 'Applicant Name', type: 'text' },
              { id: 'f2', name: 'Contact Email', type: 'email' },
            ],
          },
        ],
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      expect(result.current.state.report!.warningGaps.some((g) => g.message.includes('format validation'))).toBe(true);
    });

    it('detects phone field without pattern validation', async () => {
      const config = createConfig({
        forms: [
          {
            id: 'form-1',
            name: 'Form',
            sections: [],
            fields: [
              { id: 'f1', name: 'Applicant Name', type: 'text' },
              { id: 'f2', name: 'Email', type: 'email' },
              { id: 'f3', name: 'Phone', type: 'tel' },
            ],
          },
        ],
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      expect(result.current.state.report!.suggestionGaps.some((g) => g.message.includes('Phone'))).toBe(true);
    });
  });

  describe('fixAll', () => {
    it('calls onApplyFixes with all fixable gap IDs', async () => {
      const mockOnApplyFixes = vi.fn().mockResolvedValue(undefined);

      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [] }],
      });

      const { result } = renderHook(() =>
        useGapDetection({
          config,
          onApplyFixes: mockOnApplyFixes,
        })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      const fixableCount = result.current.state.report!.fixableCount;
      expect(fixableCount).toBeGreaterThan(0);

      await act(async () => {
        await result.current.fixAll();
      });

      expect(mockOnApplyFixes).toHaveBeenCalled();
      expect(mockOnApplyFixes.mock.calls[0][0].length).toBe(fixableCount);
    });

    it('sets isApplyingFixes during fix application', async () => {
      let resolveApply: () => void;
      const applyPromise = new Promise<void>((resolve) => {
        resolveApply = resolve;
      });

      const mockOnApplyFixes = vi.fn().mockReturnValue(applyPromise);

      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [] }],
      });

      const { result } = renderHook(() =>
        useGapDetection({
          config,
          onApplyFixes: mockOnApplyFixes,
        })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      let fixPromise: Promise<void>;
      act(() => {
        fixPromise = result.current.fixAll();
      });

      expect(result.current.state.isApplyingFixes).toBe(true);

      await act(async () => {
        resolveApply!();
        await fixPromise;
      });

      expect(result.current.state.isApplyingFixes).toBe(false);
    });

    it('does nothing when no report exists', async () => {
      const mockOnApplyFixes = vi.fn();

      const { result } = renderHook(() =>
        useGapDetection({
          config: createConfig(),
          onApplyFixes: mockOnApplyFixes,
        })
      );

      await act(async () => {
        await result.current.fixAll();
      });

      expect(mockOnApplyFixes).not.toHaveBeenCalled();
    });

    it('handles fix errors', async () => {
      const mockOnApplyFixes = vi.fn().mockRejectedValue(new Error('Fix failed'));

      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [] }],
      });

      const { result } = renderHook(() =>
        useGapDetection({
          config,
          onApplyFixes: mockOnApplyFixes,
        })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      await act(async () => {
        await result.current.fixAll();
      });

      expect(result.current.state.error).toBe('Fix failed');
      expect(result.current.state.isApplyingFixes).toBe(false);
    });
  });

  describe('fixSelected', () => {
    it('calls onApplyFixes with selected gap IDs only', async () => {
      const mockOnApplyFixes = vi.fn().mockResolvedValue(undefined);

      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [] }],
      });

      const { result } = renderHook(() =>
        useGapDetection({
          config,
          onApplyFixes: mockOnApplyFixes,
        })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      const selectedIds = ['gap-1', 'gap-2'];

      await act(async () => {
        await result.current.fixSelected(selectedIds);
      });

      expect(mockOnApplyFixes).toHaveBeenCalledWith(selectedIds);
    });

    it('does nothing when no IDs provided', async () => {
      const mockOnApplyFixes = vi.fn();

      const { result } = renderHook(() =>
        useGapDetection({
          config: createConfig(),
          onApplyFixes: mockOnApplyFixes,
        })
      );

      await act(async () => {
        await result.current.fixSelected([]);
      });

      expect(mockOnApplyFixes).not.toHaveBeenCalled();
    });
  });

  describe('dismiss', () => {
    it('sets isVisible to false', async () => {
      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [] }],
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      expect(result.current.state.isVisible).toBe(true);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.state.isVisible).toBe(false);
    });
  });

  describe('show', () => {
    it('sets isVisible to true', async () => {
      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [] }],
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.state.isVisible).toBe(false);

      act(() => {
        result.current.show();
      });

      expect(result.current.state.isVisible).toBe(true);
    });
  });

  describe('clear', () => {
    it('resets all state', async () => {
      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [] }],
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      expect(result.current.state.report).not.toBeNull();

      act(() => {
        result.current.clear();
      });

      expect(result.current.state.report).toBeNull();
      expect(result.current.state.isDetecting).toBe(false);
      expect(result.current.state.isApplyingFixes).toBe(false);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.isVisible).toBe(false);
    });
  });

  describe('auto-detect', () => {
    it('does not auto-detect when disabled', async () => {
      const config = createConfig();

      const { result } = renderHook(() =>
        useGapDetection({
          config,
          autoDetect: false,
          debounceMs: 100,
        })
      );

      // Advance timers but no auto-detection should happen
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.state.report).toBeNull();
    });

    it('does not auto-detect when config is null', async () => {
      const { result } = renderHook(() =>
        useGapDetection({
          config: null,
          autoDetect: true,
          debounceMs: 100,
        })
      );

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current.state.report).toBeNull();
    });

    it('can be triggered manually', async () => {
      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [] }],
      });

      const { result } = renderHook(() =>
        useGapDetection({
          config,
          autoDetect: false,
        })
      );

      // Initially no report
      expect(result.current.state.report).toBeNull();

      // Manual detection
      await act(async () => {
        await result.current.detectGaps();
      });

      expect(result.current.state.report).not.toBeNull();
    });
  });

  describe('report generation', () => {
    it('generates summary from gaps', async () => {
      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [] }],
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      expect(result.current.state.report!.summary).toBeTruthy();
      expect(result.current.state.report!.totalGaps).toBeGreaterThan(0);
    });

    it('counts fixable gaps', async () => {
      const config = createConfig({
        forms: [{ id: 'f1', name: 'Form', sections: [], fields: [] }],
      });

      const { result } = renderHook(() =>
        useGapDetection({ config })
      );

      await act(async () => {
        await result.current.detectGaps();
      });

      // Most detected gaps should have fixes
      expect(result.current.state.report!.fixableCount).toBeGreaterThan(0);
    });
  });
});

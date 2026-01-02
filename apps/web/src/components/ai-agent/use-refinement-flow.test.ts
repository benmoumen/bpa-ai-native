/**
 * Refinement Flow Hook Tests
 *
 * Story 6-5: Iterative Refinement (Task 6)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRefinementFlow } from './use-refinement-flow';

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

interface TestConfig {
  fields: Array<{ name: string; type: string }>;
}

describe('useRefinementFlow', () => {
  const mockOnConfigChange = vi.fn();

  beforeEach(() => {
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockSessionStorage.clear();
  });

  describe('initial state', () => {
    it('starts with inactive state', () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      expect(result.current.state.isActive).toBe(false);
      expect(result.current.state.pendingIntent).toBeNull();
      expect(result.current.state.isApplying).toBe(false);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.lastChange).toBeNull();
    });

    it('starts with empty undo/redo stacks', () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoCount).toBe(0);
      expect(result.current.redoCount).toBe(0);
    });
  });

  describe('activate/deactivate', () => {
    it('activates refinement mode', () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      act(() => {
        result.current.activate();
      });

      expect(result.current.state.isActive).toBe(true);
    });

    it('deactivates refinement mode', () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      act(() => {
        result.current.activate();
      });

      act(() => {
        result.current.deactivate();
      });

      expect(result.current.state.isActive).toBe(false);
    });

    it('clears pending intent on deactivate', () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      act(() => {
        result.current.activate();
        result.current.parseIntent('add phone field');
      });

      expect(result.current.state.pendingIntent).not.toBeNull();

      act(() => {
        result.current.deactivate();
      });

      expect(result.current.state.pendingIntent).toBeNull();
    });
  });

  describe('parseIntent', () => {
    it('parses add field intent', () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      let intent;
      act(() => {
        intent = result.current.parseIntent('add phone field');
      });

      expect(intent).toEqual({
        type: 'ADD_FIELD',
        fieldName: 'phone',
        fieldType: 'tel',
      });
      expect(result.current.state.pendingIntent).toEqual(intent);
    });

    it('parses remove field intent', () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      let intent;
      act(() => {
        intent = result.current.parseIntent('remove fax field');
      });

      expect(intent).toEqual({
        type: 'REMOVE_FIELD',
        fieldName: 'fax',
      });
      expect(result.current.state.pendingIntent).toEqual(intent);
    });

    it('sets error for unknown intent', () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      act(() => {
        result.current.parseIntent('hello world');
      });

      expect(result.current.state.error).toBe('Could not understand the refinement request');
      expect(result.current.state.pendingIntent).toBeNull();
    });
  });

  describe('cancelIntent', () => {
    it('clears pending intent', () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      act(() => {
        result.current.parseIntent('add email field');
      });

      expect(result.current.state.pendingIntent).not.toBeNull();

      act(() => {
        result.current.cancelIntent();
      });

      expect(result.current.state.pendingIntent).toBeNull();
    });

    it('clears error', () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      act(() => {
        result.current.parseIntent('unknown command');
      });

      expect(result.current.state.error).not.toBeNull();

      act(() => {
        result.current.cancelIntent();
      });

      expect(result.current.state.error).toBeNull();
    });
  });

  describe('applyIntent', () => {
    it('applies pending intent and saves to undo stack', async () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      act(() => {
        result.current.parseIntent('add phone field');
      });

      await act(async () => {
        await result.current.applyIntent();
      });

      expect(result.current.state.pendingIntent).toBeNull();
      expect(result.current.state.lastChange).toContain('Add');
      expect(result.current.canUndo).toBe(true);
    });

    it('sets isApplying during apply', async () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      act(() => {
        result.current.parseIntent('add phone field');
      });

      // Start applying
      const applyPromise = act(async () => {
        await result.current.applyIntent();
      });

      // Check state during apply (initial call sets isApplying)
      await applyPromise;

      expect(result.current.state.isApplying).toBe(false);
    });

    it('handles UNDO intent specially', async () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [{ name: 'phone', type: 'tel' }] },
          onConfigChange: mockOnConfigChange,
        })
      );

      // First apply a change to have something to undo
      act(() => {
        result.current.parseIntent('add email field');
      });

      await act(async () => {
        await result.current.applyIntent();
      });

      expect(result.current.canUndo).toBe(true);

      // Now parse and apply undo intent
      act(() => {
        result.current.parseIntent('undo');
      });

      await act(async () => {
        await result.current.applyIntent();
      });

      expect(result.current.state.lastChange).toContain('Undone');
    });

    it('does nothing if no pending intent', async () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      await act(async () => {
        await result.current.applyIntent();
      });

      expect(result.current.state.lastChange).toBeNull();
      expect(result.current.canUndo).toBe(false);
    });
  });

  describe('undo/redo', () => {
    it('undoes last change', async () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      // Apply a change
      act(() => {
        result.current.parseIntent('add phone field');
      });

      await act(async () => {
        await result.current.applyIntent();
      });

      expect(result.current.canUndo).toBe(true);

      // Undo
      act(() => {
        result.current.undo();
      });

      // Wait for the deferred callback
      await waitFor(() => {
        expect(mockOnConfigChange).toHaveBeenCalled();
      });

      expect(result.current.canRedo).toBe(true);
    });

    it('redoes undone change', async () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      // Apply a change
      act(() => {
        result.current.parseIntent('add phone field');
      });

      await act(async () => {
        await result.current.applyIntent();
      });

      // Undo
      act(() => {
        result.current.undo();
      });

      await waitFor(() => {
        expect(result.current.canRedo).toBe(true);
      });

      // Redo
      act(() => {
        result.current.redo();
      });

      await waitFor(() => {
        expect(result.current.canUndo).toBe(true);
      });
    });
  });

  describe('clearHistory', () => {
    it('clears undo/redo stacks', async () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      // Apply a change
      act(() => {
        result.current.parseIntent('add phone field');
      });

      await act(async () => {
        await result.current.applyIntent();
      });

      expect(result.current.canUndo).toBe(true);

      // Clear history
      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
    });
  });

  describe('helper functions', () => {
    it('isDestructive returns true for remove intents', () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      expect(result.current.isDestructive({ type: 'REMOVE_FIELD', fieldName: 'test' })).toBe(true);
      expect(result.current.isDestructive({ type: 'REMOVE_SECTION', sectionName: 'test' })).toBe(true);
      expect(result.current.isDestructive({ type: 'ADD_FIELD', fieldName: 'test', fieldType: 'text' })).toBe(false);
    });

    it('describeIntent returns human-readable descriptions', () => {
      const { result } = renderHook(() =>
        useRefinementFlow<TestConfig>({
          storageKey: 'test-service',
          config: { fields: [] },
          onConfigChange: mockOnConfigChange,
        })
      );

      expect(result.current.describeIntent({ type: 'ADD_FIELD', fieldName: 'phone', fieldType: 'tel' }))
        .toContain('Add');
      expect(result.current.describeIntent({ type: 'REMOVE_FIELD', fieldName: 'fax' }))
        .toContain('Remove');
    });
  });
});

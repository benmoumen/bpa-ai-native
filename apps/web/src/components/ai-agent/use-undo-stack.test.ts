/**
 * Undo Stack Hook Tests
 *
 * Story 6-5: Iterative Refinement (Task 3)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useUndoStack } from './use-undo-stack';

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
  name: string;
  fields: string[];
}

describe('useUndoStack', () => {
  beforeEach(() => {
    mockSessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockSessionStorage.clear();
  });

  describe('initial state', () => {
    it('starts with empty stacks', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoCount).toBe(0);
      expect(result.current.redoCount).toBe(0);
    });

    it('loads from sessionStorage if available', () => {
      const storedState = {
        undoStack: [
          {
            id: 'snap-1',
            timestamp: Date.now(),
            description: 'Initial',
            data: { name: 'Test', fields: ['a'] },
          },
        ],
        redoStack: [],
      };
      mockSessionStorage.setItem(
        'bpa-undo-stack-test-service',
        JSON.stringify(storedState)
      );

      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      expect(result.current.canUndo).toBe(true);
      expect(result.current.undoCount).toBe(1);
    });
  });

  describe('pushState', () => {
    it('adds a snapshot to the undo stack', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'Added field a');
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.undoCount).toBe(1);
    });

    it('clears redo stack when pushing new state', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      // Push two states
      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'State 1');
        result.current.pushState({ name: 'Test', fields: ['a', 'b'] }, 'State 2');
      });

      // Undo once
      act(() => {
        result.current.undo();
      });

      expect(result.current.canRedo).toBe(true);

      // Push new state
      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a', 'c'] }, 'State 3');
      });

      expect(result.current.canRedo).toBe(false);
      expect(result.current.redoCount).toBe(0);
    });

    it('respects max depth', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service', maxDepth: 3 })
      );

      // Push 5 states
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.pushState({ name: 'Test', fields: [`field-${i}`] }, `State ${i}`);
        }
      });

      expect(result.current.undoCount).toBe(3);
    });
  });

  describe('undo', () => {
    it('returns the last snapshot', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'Added field a');
      });

      let snapshot: ReturnType<typeof result.current.undo>;
      act(() => {
        snapshot = result.current.undo();
      });

      expect(snapshot).not.toBeNull();
      expect(snapshot?.data).toEqual({ name: 'Test', fields: ['a'] });
      expect(snapshot?.description).toBe('Added field a');
    });

    it('moves snapshot to redo stack', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'State 1');
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(true);
      expect(result.current.redoCount).toBe(1);
    });

    it('returns null when stack is empty', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      let snapshot: ReturnType<typeof result.current.undo>;
      act(() => {
        snapshot = result.current.undo();
      });

      expect(snapshot).toBeNull();
    });

    it('calls onUndo callback', async () => {
      const onUndo = vi.fn();
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service', onUndo })
      );

      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'State 1');
      });

      act(() => {
        result.current.undo();
      });

      // Wait for the deferred callback
      await waitFor(() => {
        expect(onUndo).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('redo', () => {
    it('returns the last undone snapshot', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'State 1');
      });

      act(() => {
        result.current.undo();
      });

      let snapshot: ReturnType<typeof result.current.redo>;
      act(() => {
        snapshot = result.current.redo();
      });

      expect(snapshot).not.toBeNull();
      expect(snapshot?.data).toEqual({ name: 'Test', fields: ['a'] });
    });

    it('moves snapshot back to undo stack', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'State 1');
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoCount).toBe(1);
    });

    it('returns null when redo stack is empty', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      let snapshot: ReturnType<typeof result.current.redo>;
      act(() => {
        snapshot = result.current.redo();
      });

      expect(snapshot).toBeNull();
    });

    it('calls onRedo callback', async () => {
      const onRedo = vi.fn();
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service', onRedo })
      );

      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'State 1');
      });

      act(() => {
        result.current.undo();
      });

      act(() => {
        result.current.redo();
      });

      // Wait for the deferred callback
      await waitFor(() => {
        expect(onRedo).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('clear', () => {
    it('clears both stacks', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'State 1');
        result.current.pushState({ name: 'Test', fields: ['b'] }, 'State 2');
      });

      act(() => {
        result.current.undo();
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.canRedo).toBe(true);

      act(() => {
        result.current.clear();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.canRedo).toBe(false);
      expect(result.current.undoCount).toBe(0);
      expect(result.current.redoCount).toBe(0);
    });

    it('removes from sessionStorage', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'State 1');
      });

      act(() => {
        result.current.clear();
      });

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith(
        'bpa-undo-stack-test-service'
      );
    });
  });

  describe('getStack', () => {
    it('returns current stack state', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'State 1');
      });

      const stack = result.current.getStack();
      expect(stack.undoStack).toHaveLength(1);
      expect(stack.redoStack).toHaveLength(0);
    });
  });

  describe('peek', () => {
    it('returns last snapshot without removing', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'State 1');
        result.current.pushState({ name: 'Test', fields: ['b'] }, 'State 2');
      });

      const peeked = result.current.peek();
      expect(peeked?.description).toBe('State 2');
      expect(result.current.undoCount).toBe(2); // Still 2, not removed
    });

    it('returns null when stack is empty', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      const peeked = result.current.peek();
      expect(peeked).toBeNull();
    });
  });

  describe('sessionStorage persistence', () => {
    it('persists state changes', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'State 1');
      });

      // Allow effect to run
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
    });

    it('uses different storage keys for different services', () => {
      // Set up state for service-a
      const stateA = {
        undoStack: [
          {
            id: 'snap-a1',
            timestamp: Date.now(),
            description: 'State A',
            data: { name: 'Service A', fields: ['a'] },
          },
        ],
        redoStack: [],
      };
      mockSessionStorage.setItem(
        'bpa-undo-stack-service-a',
        JSON.stringify(stateA)
      );

      // Hook for service-a should load its data
      const { result: resultA } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'service-a' })
      );
      expect(resultA.current.undoCount).toBe(1);

      // Hook for service-b should have empty stack
      const { result: resultB } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'service-b' })
      );
      expect(resultB.current.undoCount).toBe(0);
    });
  });

  describe('multiple undo/redo operations', () => {
    it('handles sequence of undo/redo correctly', () => {
      const { result } = renderHook(() =>
        useUndoStack<TestConfig>({ storageKey: 'test-service' })
      );

      // Push 3 states
      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a'] }, 'State 1');
        result.current.pushState({ name: 'Test', fields: ['a', 'b'] }, 'State 2');
        result.current.pushState({ name: 'Test', fields: ['a', 'b', 'c'] }, 'State 3');
      });

      expect(result.current.undoCount).toBe(3);

      // Undo twice
      act(() => {
        result.current.undo();
        result.current.undo();
      });

      expect(result.current.undoCount).toBe(1);
      expect(result.current.redoCount).toBe(2);

      // Redo once
      act(() => {
        result.current.redo();
      });

      expect(result.current.undoCount).toBe(2);
      expect(result.current.redoCount).toBe(1);

      // Push new state (should clear redo)
      act(() => {
        result.current.pushState({ name: 'Test', fields: ['a', 'd'] }, 'State 4');
      });

      expect(result.current.undoCount).toBe(3);
      expect(result.current.redoCount).toBe(0);
    });
  });
});

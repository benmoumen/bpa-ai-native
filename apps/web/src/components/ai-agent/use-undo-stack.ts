'use client';

import * as React from 'react';

/**
 * Undo Stack Hook
 *
 * Story 6-5: Iterative Refinement (Task 3)
 *
 * Manages change history for the refinement flow with sessionStorage persistence.
 * Supports undo/redo operations with configurable max depth.
 */

/** Maximum number of snapshots to keep in the undo stack */
const MAX_UNDO_DEPTH = 10;

/** Session storage key prefix */
const STORAGE_KEY_PREFIX = 'bpa-undo-stack-';

/**
 * A snapshot of the service configuration state
 */
export interface ConfigSnapshot<T = unknown> {
  /** Unique identifier for this snapshot */
  id: string;
  /** Timestamp when the snapshot was created */
  timestamp: number;
  /** Description of the change that led to this state */
  description: string;
  /** The actual configuration data */
  data: T;
}

/**
 * Undo stack state
 */
export interface UndoStackState<T = unknown> {
  /** Stack of previous states (for undo) */
  undoStack: ConfigSnapshot<T>[];
  /** Stack of undone states (for redo) */
  redoStack: ConfigSnapshot<T>[];
}

/**
 * Options for the useUndoStack hook
 */
export interface UseUndoStackOptions {
  /** Unique key for sessionStorage (typically serviceId) */
  storageKey: string;
  /** Maximum undo depth (default: 10) */
  maxDepth?: number;
  /** Callback when undo is performed */
  onUndo?: (snapshot: ConfigSnapshot) => void;
  /** Callback when redo is performed */
  onRedo?: (snapshot: ConfigSnapshot) => void;
}

/**
 * Return value of the useUndoStack hook
 */
export interface UseUndoStackReturn<T = unknown> {
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Number of undo steps available */
  undoCount: number;
  /** Number of redo steps available */
  redoCount: number;
  /** Push a new state onto the undo stack */
  pushState: (data: T, description: string) => void;
  /** Undo to the previous state */
  undo: () => ConfigSnapshot<T> | null;
  /** Redo to the next state */
  redo: () => ConfigSnapshot<T> | null;
  /** Clear the entire undo/redo history */
  clear: () => void;
  /** Get the current undo stack (for debugging) */
  getStack: () => UndoStackState<T>;
  /** Peek at the last snapshot without removing it */
  peek: () => ConfigSnapshot<T> | null;
}

/**
 * Generate a unique snapshot ID
 */
function generateSnapshotId(): string {
  return `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Get the full storage key
 */
function getStorageKey(key: string): string {
  return `${STORAGE_KEY_PREFIX}${key}`;
}

/**
 * Load state from sessionStorage
 */
function loadFromStorage<T>(key: string): UndoStackState<T> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = sessionStorage.getItem(getStorageKey(key));
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as UndoStackState<T>;
  } catch (error) {
    console.warn('[useUndoStack] Failed to load from storage:', error);
    return null;
  }
}

/**
 * Save state to sessionStorage
 */
function saveToStorage<T>(key: string, state: UndoStackState<T>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.setItem(getStorageKey(key), JSON.stringify(state));
  } catch (error) {
    console.warn('[useUndoStack] Failed to save to storage:', error);
  }
}

/**
 * Clear state from sessionStorage
 */
function clearStorage(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem(getStorageKey(key));
  } catch (error) {
    console.warn('[useUndoStack] Failed to clear storage:', error);
  }
}

/**
 * Hook for managing undo/redo state with sessionStorage persistence
 *
 * @example
 * ```tsx
 * const {
 *   canUndo,
 *   canRedo,
 *   pushState,
 *   undo,
 *   redo,
 *   clear,
 * } = useUndoStack<ServiceConfig>({
 *   storageKey: serviceId,
 *   onUndo: (snapshot) => setConfig(snapshot.data),
 * });
 *
 * // Before making a change
 * pushState(currentConfig, 'Add phone field');
 *
 * // Undo
 * if (canUndo) {
 *   const previous = undo();
 *   if (previous) setConfig(previous.data);
 * }
 * ```
 */
export function useUndoStack<T = unknown>({
  storageKey,
  maxDepth = MAX_UNDO_DEPTH,
  onUndo,
  onRedo,
}: UseUndoStackOptions): UseUndoStackReturn<T> {
  const [state, setState] = React.useState<UndoStackState<T>>(() => {
    // Try to load from sessionStorage on initial mount
    const loaded = loadFromStorage<T>(storageKey);
    return loaded ?? { undoStack: [], redoStack: [] };
  });

  // Persist to sessionStorage whenever state changes
  React.useEffect(() => {
    saveToStorage(storageKey, state);
  }, [storageKey, state]);

  // Reload from storage if storageKey changes
  React.useEffect(() => {
    const loaded = loadFromStorage<T>(storageKey);
    if (loaded) {
      setState(loaded);
    } else {
      setState({ undoStack: [], redoStack: [] });
    }
  }, [storageKey]);

  /**
   * Push a new state onto the undo stack
   */
  const pushState = React.useCallback(
    (data: T, description: string) => {
      const snapshot: ConfigSnapshot<T> = {
        id: generateSnapshotId(),
        timestamp: Date.now(),
        description,
        data,
      };

      setState((prev) => {
        // Add to undo stack, respecting max depth
        const newUndoStack = [...prev.undoStack, snapshot];
        if (newUndoStack.length > maxDepth) {
          newUndoStack.shift(); // Remove oldest
        }

        return {
          undoStack: newUndoStack,
          redoStack: [], // Clear redo stack on new action
        };
      });
    },
    [maxDepth]
  );

  /**
   * Undo to the previous state
   * Returns the snapshot that was popped, or null if nothing to undo
   */
  const undo = React.useCallback((): ConfigSnapshot<T> | null => {
    // Get current state synchronously to return the value
    if (state.undoStack.length === 0) {
      return null;
    }

    const snapshot = state.undoStack[state.undoStack.length - 1];

    setState((prev) => {
      if (prev.undoStack.length === 0) {
        return prev;
      }

      const newUndoStack = prev.undoStack.slice(0, -1);

      // Note: We call onUndo via setTimeout to avoid calling it during setState
      setTimeout(() => {
        onUndo?.(snapshot);
      }, 0);

      return {
        undoStack: newUndoStack,
        redoStack: [...prev.redoStack, snapshot],
      };
    });

    return snapshot;
  }, [state.undoStack, onUndo]);

  /**
   * Redo to the next state
   * Returns the snapshot that was restored, or null if nothing to redo
   */
  const redo = React.useCallback((): ConfigSnapshot<T> | null => {
    // Get current state synchronously to return the value
    if (state.redoStack.length === 0) {
      return null;
    }

    const snapshot = state.redoStack[state.redoStack.length - 1];

    setState((prev) => {
      if (prev.redoStack.length === 0) {
        return prev;
      }

      const newRedoStack = prev.redoStack.slice(0, -1);

      // Note: We call onRedo via setTimeout to avoid calling it during setState
      setTimeout(() => {
        onRedo?.(snapshot);
      }, 0);

      return {
        undoStack: [...prev.undoStack, snapshot],
        redoStack: newRedoStack,
      };
    });

    return snapshot;
  }, [state.redoStack, onRedo]);

  /**
   * Clear all undo/redo history
   */
  const clear = React.useCallback(() => {
    setState({ undoStack: [], redoStack: [] });
    clearStorage(storageKey);
  }, [storageKey]);

  /**
   * Get the current stack state (for debugging)
   */
  const getStack = React.useCallback(() => {
    return state;
  }, [state]);

  /**
   * Peek at the last snapshot without removing it
   */
  const peek = React.useCallback((): ConfigSnapshot<T> | null => {
    if (state.undoStack.length === 0) {
      return null;
    }
    return state.undoStack[state.undoStack.length - 1];
  }, [state.undoStack]);

  return {
    canUndo: state.undoStack.length > 0,
    canRedo: state.redoStack.length > 0,
    undoCount: state.undoStack.length,
    redoCount: state.redoStack.length,
    pushState,
    undo,
    redo,
    clear,
    getStack,
    peek,
  };
}

export default useUndoStack;

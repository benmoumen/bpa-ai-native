'use client';

import * as React from 'react';
import { parseRefinementIntent, isDestructiveIntent, describeIntent } from './refinement-parser';
import { useUndoStack, type ConfigSnapshot } from './use-undo-stack';
import type { RefinementIntent } from './refinement-parser';

/**
 * Refinement Flow Hook
 *
 * Story 6-5: Iterative Refinement (Task 5)
 *
 * Manages the refinement flow for service configurations.
 * Integrates intent parsing, change preview, and undo/redo.
 */

/**
 * Refinement flow state
 */
export interface RefinementFlowState {
  /** Whether refinement mode is active */
  isActive: boolean;
  /** Current pending intent awaiting confirmation */
  pendingIntent: RefinementIntent | null;
  /** Whether changes are being applied */
  isApplying: boolean;
  /** Last error message */
  error: string | null;
  /** Description of the last applied change */
  lastChange: string | null;
}

/**
 * Options for the useRefinementFlow hook
 */
export interface UseRefinementFlowOptions<T> {
  /** Unique key for undo stack persistence (typically serviceId) */
  storageKey: string;
  /** Current configuration */
  config: T;
  /** Callback when configuration changes */
  onConfigChange: (newConfig: T) => void;
  /** Maximum undo depth (default: 10) */
  maxUndoDepth?: number;
}

/**
 * Return value of the useRefinementFlow hook
 */
export interface UseRefinementFlowReturn<T> {
  /** Current refinement flow state */
  state: RefinementFlowState;
  /** Parse user input and set pending intent */
  parseIntent: (text: string) => RefinementIntent;
  /** Apply the pending intent */
  applyIntent: () => Promise<void>;
  /** Cancel the pending intent */
  cancelIntent: () => void;
  /** Undo the last change */
  undo: () => ConfigSnapshot<T> | null;
  /** Redo the last undone change */
  redo: () => ConfigSnapshot<T> | null;
  /** Clear all undo/redo history */
  clearHistory: () => void;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Number of undo steps available */
  undoCount: number;
  /** Number of redo steps available */
  redoCount: number;
  /** Activate refinement mode */
  activate: () => void;
  /** Deactivate refinement mode */
  deactivate: () => void;
  /** Check if intent is destructive */
  isDestructive: (intent: RefinementIntent) => boolean;
  /** Get human-readable description of an intent */
  describeIntent: (intent: RefinementIntent) => string;
}

/**
 * Hook for managing the refinement flow
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   parseIntent,
 *   applyIntent,
 *   cancelIntent,
 *   undo,
 *   redo,
 *   canUndo,
 *   canRedo,
 * } = useRefinementFlow({
 *   storageKey: serviceId,
 *   config: serviceConfig,
 *   onConfigChange: setServiceConfig,
 * });
 *
 * // When user sends a message during refinement
 * const intent = parseIntent(userMessage);
 * if (intent.type !== 'UNKNOWN') {
 *   // Show ChangePreview component
 * }
 * ```
 */
export function useRefinementFlow<T = unknown>({
  storageKey,
  config,
  onConfigChange,
  maxUndoDepth = 10,
}: UseRefinementFlowOptions<T>): UseRefinementFlowReturn<T> {
  // Refinement flow state
  const [state, setState] = React.useState<RefinementFlowState>({
    isActive: false,
    pendingIntent: null,
    isApplying: false,
    error: null,
    lastChange: null,
  });

  // Undo/redo stack
  const undoStack = useUndoStack<T>({
    storageKey,
    maxDepth: maxUndoDepth,
    onUndo: (snapshot) => {
      onConfigChange(snapshot.data as T);
      setState((prev) => ({
        ...prev,
        lastChange: `Undone: ${snapshot.description}`,
      }));
    },
    onRedo: (snapshot) => {
      onConfigChange(snapshot.data as T);
      setState((prev) => ({
        ...prev,
        lastChange: `Redone: ${snapshot.description}`,
      }));
    },
  });

  /**
   * Parse user input and set pending intent
   */
  const parseIntentFn = React.useCallback(
    (text: string): RefinementIntent => {
      const intent = parseRefinementIntent(text);

      // Set pending intent if valid
      if (intent.type !== 'UNKNOWN') {
        setState((prev) => ({
          ...prev,
          pendingIntent: intent,
          error: null,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          error: 'Could not understand the refinement request',
        }));
      }

      return intent;
    },
    []
  );

  /**
   * Apply the pending intent
   */
  const applyIntent = React.useCallback(async () => {
    if (!state.pendingIntent) {
      return;
    }

    setState((prev) => ({ ...prev, isApplying: true, error: null }));

    try {
      const description = describeIntent(state.pendingIntent);

      // Handle UNDO intent specially
      if (state.pendingIntent.type === 'UNDO') {
        const count = state.pendingIntent.count ?? 1;
        for (let i = 0; i < count; i++) {
          undoStack.undo();
        }
        setState((prev) => ({
          ...prev,
          isApplying: false,
          pendingIntent: null,
          lastChange: `Undone ${count} ${count === 1 ? 'change' : 'changes'}`,
        }));
        return;
      }

      // Save current state before applying changes
      undoStack.pushState(config, description);

      // Apply the intent (this would be implemented by the caller/tool)
      // For now, we simulate applying by calling onConfigChange with modified config
      const newConfig = applyIntentToConfig(config, state.pendingIntent);
      onConfigChange(newConfig);

      setState((prev) => ({
        ...prev,
        isApplying: false,
        pendingIntent: null,
        lastChange: description,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isApplying: false,
        error: error instanceof Error ? error.message : 'Failed to apply changes',
      }));
    }
  }, [state.pendingIntent, config, onConfigChange, undoStack]);

  /**
   * Cancel the pending intent
   */
  const cancelIntent = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      pendingIntent: null,
      error: null,
    }));
  }, []);

  /**
   * Activate refinement mode
   */
  const activate = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: true,
    }));
  }, []);

  /**
   * Deactivate refinement mode
   */
  const deactivate = React.useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: false,
      pendingIntent: null,
      error: null,
    }));
  }, []);

  return {
    state,
    parseIntent: parseIntentFn,
    applyIntent,
    cancelIntent,
    undo: undoStack.undo,
    redo: undoStack.redo,
    clearHistory: undoStack.clear,
    canUndo: undoStack.canUndo,
    canRedo: undoStack.canRedo,
    undoCount: undoStack.undoCount,
    redoCount: undoStack.redoCount,
    activate,
    deactivate,
    isDestructive: isDestructiveIntent,
    describeIntent,
  };
}

/**
 * Apply an intent to a configuration
 *
 * IMPORTANT: This is intentionally a pass-through placeholder.
 * The actual config modification is handled by the service builder UI
 * which receives the intent via the ChangePreview component's onApply callback.
 *
 * This function exists to:
 * 1. Complete the flow interface for testing
 * 2. Allow future local preview transformations
 * 3. Support eventual backend integration via refinement tools
 *
 * The ChatSidebar's handleApplyRefinement will dispatch the actual
 * modifications to the service configuration store.
 */
function applyIntentToConfig<T>(config: T, _intent: RefinementIntent): T {
  // Pass-through: actual modification handled by service builder integration
  return config;
}

export default useRefinementFlow;

'use client';

import * as React from 'react';
import type { PendingAction } from './types';

/**
 * Confirmation state
 */
interface ConfirmationState {
  /** Queue of pending actions */
  pendingActions: PendingAction[];
  /** Currently displayed action */
  currentAction: PendingAction | null;
  /** Whether a confirmation dialog is open */
  isOpen: boolean;
}

/**
 * Confirmation result
 */
export interface ConfirmationResult {
  /** The action that was confirmed/rejected */
  action: PendingAction;
  /** Whether the action was confirmed */
  confirmed: boolean;
  /** Reason for rejection (if rejected) */
  reason?: 'user_rejected' | 'timeout';
}

/**
 * Hook options
 */
interface UseConfirmationOptions {
  /** Callback when an action is confirmed */
  onConfirm?: (result: ConfirmationResult) => void;
  /** Callback when an action is rejected */
  onReject?: (result: ConfirmationResult) => void;
}

/**
 * Hook return type
 */
interface UseConfirmationReturn {
  /** Current confirmation state */
  state: ConfirmationState;
  /** Request confirmation for an action */
  requestConfirmation: (action: PendingAction) => Promise<boolean>;
  /** Confirm the current action */
  confirm: (actionId: string) => void;
  /** Reject the current action */
  reject: (actionId: string, reason?: 'user_rejected' | 'timeout') => void;
  /** Clear all pending actions */
  clearAll: () => void;
}

/**
 * Confirmation Flow Hook
 *
 * Story 6-3: Confirmation Flow UI
 *
 * Manages confirmation state for AI agent actions.
 * Queues multiple confirmations and processes them sequentially.
 */
export function useConfirmation(
  options: UseConfirmationOptions = {}
): UseConfirmationReturn {
  const { onConfirm, onReject } = options;

  const [state, setState] = React.useState<ConfirmationState>({
    pendingActions: [],
    currentAction: null,
    isOpen: false,
  });

  // Map of action ID to promise resolvers
  const resolversRef = React.useRef<
    Map<string, { resolve: (confirmed: boolean) => void }>
  >(new Map());

  /**
   * Show the next pending action
   */
  const showNextAction = React.useCallback(() => {
    setState((prev) => {
      if (prev.pendingActions.length === 0) {
        return { ...prev, currentAction: null, isOpen: false };
      }

      const [next, ...rest] = prev.pendingActions;
      return {
        pendingActions: rest,
        currentAction: next,
        isOpen: true,
      };
    });
  }, []);

  /**
   * Request confirmation for an action
   */
  const requestConfirmation = React.useCallback(
    (action: PendingAction): Promise<boolean> => {
      return new Promise((resolve) => {
        // Store the resolver
        resolversRef.current.set(action.id, { resolve });

        setState((prev) => {
          // If no current action, show immediately
          if (!prev.currentAction) {
            return {
              pendingActions: prev.pendingActions,
              currentAction: action,
              isOpen: true,
            };
          }

          // Otherwise, queue it
          return {
            ...prev,
            pendingActions: [...prev.pendingActions, action],
          };
        });
      });
    },
    []
  );

  /**
   * Confirm the current action
   */
  const confirm = React.useCallback(
    (actionId: string) => {
      const resolver = resolversRef.current.get(actionId);
      const action = state.currentAction;

      if (resolver && action && action.id === actionId) {
        resolver.resolve(true);
        resolversRef.current.delete(actionId);

        const result: ConfirmationResult = {
          action,
          confirmed: true,
        };
        onConfirm?.(result);

        showNextAction();
      }
    },
    [state.currentAction, onConfirm, showNextAction]
  );

  /**
   * Reject the current action
   */
  const reject = React.useCallback(
    (actionId: string, reason: 'user_rejected' | 'timeout' = 'user_rejected') => {
      const resolver = resolversRef.current.get(actionId);
      const action = state.currentAction;

      if (resolver && action && action.id === actionId) {
        resolver.resolve(false);
        resolversRef.current.delete(actionId);

        const result: ConfirmationResult = {
          action,
          confirmed: false,
          reason,
        };
        onReject?.(result);

        showNextAction();
      }
    },
    [state.currentAction, onReject, showNextAction]
  );

  /**
   * Clear all pending actions
   */
  const clearAll = React.useCallback(() => {
    // Reject all pending actions
    for (const action of state.pendingActions) {
      const resolver = resolversRef.current.get(action.id);
      if (resolver) {
        resolver.resolve(false);
        resolversRef.current.delete(action.id);
      }
    }

    // Reject current action
    if (state.currentAction) {
      const resolver = resolversRef.current.get(state.currentAction.id);
      if (resolver) {
        resolver.resolve(false);
        resolversRef.current.delete(state.currentAction.id);
      }
    }

    setState({
      pendingActions: [],
      currentAction: null,
      isOpen: false,
    });
  }, [state.pendingActions, state.currentAction]);

  return {
    state,
    requestConfirmation,
    confirm,
    reject,
    clearAll,
  };
}

/**
 * Create a pending action object
 */
export function createPendingAction(
  toolName: string,
  description: string,
  params: Record<string, unknown>,
  options: {
    constraintId?: string;
    riskLevel?: PendingAction['riskLevel'];
  } = {}
): PendingAction {
  return {
    id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    toolName,
    description,
    params,
    constraintId: options.constraintId,
    riskLevel: options.riskLevel ?? 'info',
  };
}

export default useConfirmation;

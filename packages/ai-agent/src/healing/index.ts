/**
 * Self-Healing Layer - Error classification and recovery
 *
 * Implements Story 6-1c: Self-Healing Layer
 * Placeholder for now, will be implemented in 6-1c
 */

export const HEALING_VERSION = '0.0.1' as const;

export type ErrorCategory = 'retryable' | 'conflict' | 'user_fixable' | 'fatal';

export interface HealingResult {
  category: ErrorCategory;
  shouldRetry: boolean;
  retryDelay?: number;
  userMessage?: string;
}

// Placeholder exports - will be implemented in Story 6-1c
export function classifyError(_error: Error): ErrorCategory {
  return 'fatal';
}

export function attemptHealing(
  _error: Error,
  _context: unknown,
): Promise<HealingResult> {
  throw new Error('Not implemented - see Story 6-1c');
}

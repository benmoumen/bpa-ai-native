/**
 * Self-Healing Layer
 *
 * Implements Story 6-1c: Error classification and automatic recovery
 */

export const HEALING_VERSION = '0.0.1' as const;

// Types
export type {
  ErrorCategory,
  RecoveryStrategy,
  ClassifiedError,
  HealingAttempt,
  HealingConfig,
  HealingResult,
  ContextRefreshFn,
  RetryFn,
} from './types.js';

// Classifier
export {
  classifyError,
  isAutoHealable,
  getRecoveryStrategy,
  createHttpError,
} from './classifier.js';

// Handler
export {
  HealingHandler,
  createHealingHandler,
  withHealing,
  shouldRetry,
} from './handler.js';

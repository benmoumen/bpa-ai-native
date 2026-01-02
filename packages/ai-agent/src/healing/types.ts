/**
 * Self-Healing Layer Types
 *
 * Implements Story 6-1c: Self-Healing Layer
 */

/**
 * Error categories for classification
 */
export type ErrorCategory =
  | 'retryable'     // Rate limits, temporary failures (429, 503, 504)
  | 'conflict'      // Optimistic lock failures (409)
  | 'user_fixable'  // Validation errors (400, 422)
  | 'fatal';        // Auth failures, server errors (401, 403, 500)

/**
 * Recovery strategy for each category
 */
export type RecoveryStrategy =
  | 'exponential_backoff'  // Wait and retry with increasing delay
  | 'refresh_and_retry'    // Refresh context, then retry
  | 'prompt_user'          // Ask user to fix the issue
  | 'abort';               // Stop and report error

/**
 * Classified error with recovery information
 */
export interface ClassifiedError {
  /**
   * Original error
   */
  original: Error;

  /**
   * HTTP status code (if available)
   */
  statusCode?: number;

  /**
   * Error category
   */
  category: ErrorCategory;

  /**
   * Recommended recovery strategy
   */
  strategy: RecoveryStrategy;

  /**
   * User-friendly message
   */
  userMessage: string;

  /**
   * Technical details for logging
   */
  technicalDetails?: Record<string, unknown>;

  /**
   * Whether this error can be auto-healed
   */
  canAutoHeal: boolean;

  /**
   * Suggested user action (for user_fixable errors)
   */
  suggestedAction?: string;
}

/**
 * Healing attempt record
 */
export interface HealingAttempt {
  /**
   * Timestamp of attempt
   */
  timestamp: Date;

  /**
   * Strategy used
   */
  strategy: RecoveryStrategy;

  /**
   * Whether healing succeeded
   */
  success: boolean;

  /**
   * Retry number (1-based)
   */
  attemptNumber: number;

  /**
   * Delay before retry (ms)
   */
  delayMs?: number;

  /**
   * Result or error message
   */
  result?: string;
}

/**
 * Self-healing configuration
 */
export interface HealingConfig {
  /**
   * Maximum retry attempts for retryable errors
   * Default: 3
   */
  maxRetries: number;

  /**
   * Initial delay for exponential backoff (ms)
   * Default: 1000
   */
  initialDelayMs: number;

  /**
   * Maximum delay between retries (ms)
   * Default: 30000
   */
  maxDelayMs: number;

  /**
   * Backoff multiplier
   * Default: 2
   */
  backoffMultiplier: number;

  /**
   * Add jitter to delays to prevent thundering herd
   * Default: true
   */
  useJitter: boolean;

  /**
   * Enable automatic healing
   * Default: true
   */
  autoHealEnabled: boolean;
}

/**
 * Healing result
 */
export interface HealingResult<T = unknown> {
  /**
   * Whether healing succeeded
   */
  success: boolean;

  /**
   * Result data (on success)
   */
  data?: T;

  /**
   * Final error (on failure)
   */
  error?: ClassifiedError;

  /**
   * All healing attempts made
   */
  attempts: HealingAttempt[];

  /**
   * Total time spent healing (ms)
   */
  totalTimeMs: number;
}

/**
 * Context refresh function type
 */
export type ContextRefreshFn = () => Promise<void>;

/**
 * Retry function type
 */
export type RetryFn<T> = () => Promise<T>;

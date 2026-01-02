import type {
  HealingConfig,
  HealingResult,
  HealingAttempt,
  ClassifiedError,
  ContextRefreshFn,
  RetryFn,
} from './types.js';
import { classifyError, isAutoHealable } from './classifier.js';

/**
 * Default healing configuration
 */
const DEFAULT_CONFIG: HealingConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  useJitter: true,
  autoHealEnabled: true,
};

/**
 * Self-Healing Handler
 *
 * Manages automatic error recovery with exponential backoff,
 * context refresh, and user prompting.
 */
export class HealingHandler {
  private readonly config: HealingConfig;
  private readonly onAttempt?: (attempt: HealingAttempt) => void;

  constructor(
    config: Partial<HealingConfig> = {},
    onAttempt?: (attempt: HealingAttempt) => void,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.onAttempt = onAttempt;
  }

  /**
   * Execute an operation with automatic healing
   */
  async heal<T>(
    operation: RetryFn<T>,
    contextRefresh?: ContextRefreshFn,
  ): Promise<HealingResult<T>> {
    const startTime = Date.now();
    const attempts: HealingAttempt[] = [];
    let lastError: ClassifiedError | undefined;

    for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt++) {
      try {
        const data = await operation();
        return {
          success: true,
          data,
          attempts,
          totalTimeMs: Date.now() - startTime,
        };
      } catch (error) {
        const classified = classifyError(error);
        lastError = classified;

        // Check if we should attempt healing
        if (!this.config.autoHealEnabled || !classified.canAutoHeal) {
          const failedAttempt = this.recordAttempt(
            attempts,
            attempt,
            classified.strategy,
            false,
            0,
            classified.userMessage,
          );
          this.notifyAttempt(failedAttempt);

          return {
            success: false,
            error: classified,
            attempts,
            totalTimeMs: Date.now() - startTime,
          };
        }

        // Check if we've exhausted retries
        if (attempt > this.config.maxRetries) {
          const exhaustedAttempt = this.recordAttempt(
            attempts,
            attempt,
            classified.strategy,
            false,
            0,
            'Max retries exhausted',
          );
          this.notifyAttempt(exhaustedAttempt);

          return {
            success: false,
            error: classified,
            attempts,
            totalTimeMs: Date.now() - startTime,
          };
        }

        // Execute healing strategy
        const delayMs = await this.executeStrategy(
          classified,
          attempt,
          contextRefresh,
        );

        const healingAttempt = this.recordAttempt(
          attempts,
          attempt,
          classified.strategy,
          true,
          delayMs,
          `Retrying after ${String(delayMs)}ms delay`,
        );
        this.notifyAttempt(healingAttempt);
      }
    }

    // Should not reach here, but handle gracefully
    return {
      success: false,
      error: lastError,
      attempts,
      totalTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Execute recovery strategy
   */
  private async executeStrategy(
    error: ClassifiedError,
    attemptNumber: number,
    contextRefresh?: ContextRefreshFn,
  ): Promise<number> {
    switch (error.strategy) {
      case 'exponential_backoff': {
        const delay = this.calculateDelay(attemptNumber);
        await this.sleep(delay);
        return delay;
      }

      case 'refresh_and_retry': {
        // Refresh context (e.g., fetch latest entity version)
        if (contextRefresh) {
          await contextRefresh();
        }
        // Small delay before retry
        const delay = this.config.initialDelayMs;
        await this.sleep(delay);
        return delay;
      }

      case 'prompt_user':
        // For user_fixable errors, we don't auto-retry
        // This case shouldn't be reached due to canAutoHeal check
        return 0;

      case 'abort':
        // For fatal errors, we don't retry
        return 0;

      default:
        return 0;
    }
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attemptNumber: number): number {
    const exponentialDelay =
      this.config.initialDelayMs *
      Math.pow(this.config.backoffMultiplier, attemptNumber - 1);

    const baseDelay = Math.min(exponentialDelay, this.config.maxDelayMs);

    if (this.config.useJitter) {
      // Add random jitter (0-25% of base delay)
      const jitter = baseDelay * 0.25 * Math.random();
      return Math.floor(baseDelay + jitter);
    }

    return Math.floor(baseDelay);
  }

  /**
   * Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Record a healing attempt
   */
  private recordAttempt(
    attempts: HealingAttempt[],
    attemptNumber: number,
    strategy: ClassifiedError['strategy'],
    success: boolean,
    delayMs: number,
    result: string,
  ): HealingAttempt {
    const attempt: HealingAttempt = {
      timestamp: new Date(),
      strategy,
      success,
      attemptNumber,
      delayMs: delayMs > 0 ? delayMs : undefined,
      result,
    };
    attempts.push(attempt);
    return attempt;
  }

  /**
   * Notify listener of healing attempt
   */
  private notifyAttempt(attempt: HealingAttempt): void {
    if (this.onAttempt) {
      this.onAttempt(attempt);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): HealingConfig {
    return { ...this.config };
  }
}

/**
 * Create a healing handler with custom config
 */
export function createHealingHandler(
  config?: Partial<HealingConfig>,
  onAttempt?: (attempt: HealingAttempt) => void,
): HealingHandler {
  return new HealingHandler(config, onAttempt);
}

/**
 * Simple retry wrapper with default healing
 */
export async function withHealing<T>(
  operation: RetryFn<T>,
  config?: Partial<HealingConfig>,
): Promise<HealingResult<T>> {
  const handler = new HealingHandler(config);
  return handler.heal(operation);
}

/**
 * Check if an operation should be retried
 */
export function shouldRetry(error: unknown, attemptNumber: number, maxRetries: number): boolean {
  if (attemptNumber >= maxRetries) {
    return false;
  }

  const classified = classifyError(error);
  return isAutoHealable(classified.category);
}

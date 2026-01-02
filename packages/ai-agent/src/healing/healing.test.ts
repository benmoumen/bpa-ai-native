import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  classifyError,
  isAutoHealable,
  createHttpError,
} from './classifier.js';
import {
  HealingHandler,
  createHealingHandler,
  withHealing,
  shouldRetry,
} from './handler.js';

describe('classifyError', () => {
  describe('HTTP errors', () => {
    it('should classify 429 as retryable', () => {
      const error = createHttpError('Rate limited', 429);
      const result = classifyError(error);

      expect(result.category).toBe('retryable');
      expect(result.strategy).toBe('exponential_backoff');
      expect(result.canAutoHeal).toBe(true);
    });

    it('should classify 503 as retryable', () => {
      const error = createHttpError('Service unavailable', 503);
      const result = classifyError(error);

      expect(result.category).toBe('retryable');
      expect(result.canAutoHeal).toBe(true);
    });

    it('should classify 409 as conflict', () => {
      const error = createHttpError('Conflict', 409);
      const result = classifyError(error);

      expect(result.category).toBe('conflict');
      expect(result.strategy).toBe('refresh_and_retry');
      expect(result.canAutoHeal).toBe(true);
    });

    it('should classify 400 as user_fixable', () => {
      const error = createHttpError('Bad request', 400);
      const result = classifyError(error);

      expect(result.category).toBe('user_fixable');
      expect(result.strategy).toBe('prompt_user');
      expect(result.canAutoHeal).toBe(false);
    });

    it('should classify 422 as user_fixable', () => {
      const error = createHttpError('Validation failed', 422);
      const result = classifyError(error);

      expect(result.category).toBe('user_fixable');
      expect(result.suggestedAction).toBeDefined();
    });

    it('should classify 401 as fatal', () => {
      const error = createHttpError('Unauthorized', 401);
      const result = classifyError(error);

      expect(result.category).toBe('fatal');
      expect(result.strategy).toBe('abort');
      expect(result.canAutoHeal).toBe(false);
    });

    it('should classify 500 as fatal', () => {
      const error = createHttpError('Server error', 500);
      const result = classifyError(error);

      expect(result.category).toBe('fatal');
      expect(result.canAutoHeal).toBe(false);
    });

    it('should preserve technical details', () => {
      const error = createHttpError('Error', 400, { field: 'name', reason: 'required' });
      const result = classifyError(error);

      expect(result.technicalDetails).toEqual({ field: 'name', reason: 'required' });
    });
  });

  describe('Network errors', () => {
    it('should classify fetch failed as retryable', () => {
      const error = new Error('fetch failed');
      const result = classifyError(error);

      expect(result.category).toBe('retryable');
      expect(result.canAutoHeal).toBe(true);
    });

    it('should classify ECONNREFUSED as retryable', () => {
      const error = new Error('connect ECONNREFUSED');
      const result = classifyError(error);

      expect(result.category).toBe('retryable');
    });
  });

  describe('Timeout errors', () => {
    it('should classify AbortError as retryable', () => {
      const error = new Error('Request aborted');
      error.name = 'AbortError';
      const result = classifyError(error);

      expect(result.category).toBe('retryable');
      expect(result.canAutoHeal).toBe(true);
    });

    it('should classify timeout messages as retryable', () => {
      const error = new Error('Request timeout');
      const result = classifyError(error);

      expect(result.category).toBe('retryable');
    });
  });

  describe('Unknown errors', () => {
    it('should classify unknown errors as fatal', () => {
      const error = new Error('Something unexpected');
      const result = classifyError(error);

      expect(result.category).toBe('fatal');
      expect(result.canAutoHeal).toBe(false);
    });

    it('should handle non-Error values', () => {
      const result = classifyError('string error');

      expect(result.category).toBe('fatal');
      expect(result.original.message).toBe('string error');
    });
  });
});

describe('isAutoHealable', () => {
  it('should return true for retryable', () => {
    expect(isAutoHealable('retryable')).toBe(true);
  });

  it('should return true for conflict', () => {
    expect(isAutoHealable('conflict')).toBe(true);
  });

  it('should return false for user_fixable', () => {
    expect(isAutoHealable('user_fixable')).toBe(false);
  });

  it('should return false for fatal', () => {
    expect(isAutoHealable('fatal')).toBe(false);
  });
});

describe('HealingHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('successful operations', () => {
    it('should return success on first try', async () => {
      const handler = new HealingHandler();
      const operation = vi.fn().mockResolvedValue('result');

      const resultPromise = handler.heal(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.data).toBe('result');
      expect(result.attempts).toHaveLength(0);
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryable errors', () => {
    it('should retry with exponential backoff', async () => {
      const handler = new HealingHandler({
        maxRetries: 2,
        initialDelayMs: 100,
        backoffMultiplier: 2,
        useJitter: false,
      });

      const error = createHttpError('Rate limited', 429);
      const operation = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');

      const resultPromise = handler.heal(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(result.attempts).toHaveLength(2);
    });

    it('should fail after max retries', async () => {
      const handler = new HealingHandler({
        maxRetries: 2,
        initialDelayMs: 100,
      });

      const error = createHttpError('Rate limited', 429);
      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = handler.heal(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error?.category).toBe('retryable');
      expect(operation).toHaveBeenCalledTimes(3); // initial + 2 retries
    });
  });

  describe('conflict errors', () => {
    it('should call context refresh on conflict', async () => {
      const handler = new HealingHandler({ maxRetries: 1 });
      const error = createHttpError('Conflict', 409);
      const operation = vi
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue('success');
      const contextRefresh = vi.fn().mockResolvedValue(undefined);

      const resultPromise = handler.heal(operation, contextRefresh);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(true);
      expect(contextRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('fatal errors', () => {
    it('should not retry fatal errors', async () => {
      const handler = new HealingHandler({ maxRetries: 3 });
      const error = createHttpError('Unauthorized', 401);
      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = handler.heal(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error?.category).toBe('fatal');
      expect(operation).toHaveBeenCalledTimes(1); // No retries
    });
  });

  describe('user_fixable errors', () => {
    it('should not auto-heal user_fixable errors', async () => {
      const handler = new HealingHandler({ maxRetries: 3 });
      const error = createHttpError('Validation failed', 422);
      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = handler.heal(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error?.category).toBe('user_fixable');
      expect(result.error?.suggestedAction).toBeDefined();
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('configuration', () => {
    it('should respect autoHealEnabled setting', async () => {
      const handler = new HealingHandler({
        autoHealEnabled: false,
        maxRetries: 3,
      });

      const error = createHttpError('Rate limited', 429);
      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = handler.heal(operation);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(operation).toHaveBeenCalledTimes(1); // No retries when disabled
    });

    it('should notify on each attempt', async () => {
      const onAttempt = vi.fn();
      const handler = new HealingHandler({ maxRetries: 1 }, onAttempt);

      const error = createHttpError('Rate limited', 429);
      const operation = vi.fn().mockRejectedValue(error);

      const resultPromise = handler.heal(operation);
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(onAttempt).toHaveBeenCalled();
    });
  });
});

describe('createHealingHandler', () => {
  it('should create handler with custom config', () => {
    const handler = createHealingHandler({ maxRetries: 5 });
    expect(handler.getConfig().maxRetries).toBe(5);
  });
});

describe('withHealing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should provide simple retry wrapper', async () => {
    const operation = vi.fn().mockResolvedValue('result');

    const resultPromise = withHealing(operation);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(result.data).toBe('result');
  });
});

describe('shouldRetry', () => {
  it('should return true for retryable errors with attempts remaining', () => {
    const error = createHttpError('Rate limited', 429);
    expect(shouldRetry(error, 1, 3)).toBe(true);
  });

  it('should return false when max retries reached', () => {
    const error = createHttpError('Rate limited', 429);
    expect(shouldRetry(error, 3, 3)).toBe(false);
  });

  it('should return false for non-retryable errors', () => {
    const error = createHttpError('Unauthorized', 401);
    expect(shouldRetry(error, 1, 3)).toBe(false);
  });
});

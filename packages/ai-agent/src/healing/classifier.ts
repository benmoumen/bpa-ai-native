import type {
  ErrorCategory,
  RecoveryStrategy,
  ClassifiedError,
} from './types.js';

/**
 * HTTP status code to error category mapping
 */
const STATUS_CATEGORY_MAP: Record<number, ErrorCategory> = {
  // Retryable - temporary failures
  429: 'retryable', // Too Many Requests
  503: 'retryable', // Service Unavailable
  504: 'retryable', // Gateway Timeout
  502: 'retryable', // Bad Gateway

  // Conflict - optimistic locking failures
  409: 'conflict',  // Conflict

  // User fixable - validation errors
  400: 'user_fixable', // Bad Request
  422: 'user_fixable', // Unprocessable Entity

  // Fatal - auth and server errors
  401: 'fatal', // Unauthorized
  403: 'fatal', // Forbidden
  404: 'fatal', // Not Found (can't auto-heal)
  500: 'fatal', // Internal Server Error
};

/**
 * Category to recovery strategy mapping
 */
const CATEGORY_STRATEGY_MAP: Record<ErrorCategory, RecoveryStrategy> = {
  retryable: 'exponential_backoff',
  conflict: 'refresh_and_retry',
  user_fixable: 'prompt_user',
  fatal: 'abort',
};

/**
 * User-friendly messages by status code
 */
const USER_MESSAGES: Record<number, string> = {
  400: 'The request was invalid. Please check your input and try again.',
  401: 'You are not authenticated. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. The data may have been modified by someone else.',
  422: 'The data provided could not be processed. Please fix the validation errors.',
  429: 'Too many requests. Please wait a moment before trying again.',
  500: 'An unexpected server error occurred. Please try again later.',
  502: 'The service is temporarily unavailable. Please try again.',
  503: 'The service is temporarily unavailable. Please try again.',
  504: 'The request timed out. Please try again.',
};

/**
 * Suggested actions for user-fixable errors
 */
const SUGGESTED_ACTIONS: Record<number, string> = {
  400: 'Review the input values and correct any errors.',
  422: 'Check the highlighted fields and fix validation errors.',
  409: 'Refresh the page to get the latest data, then try again.',
};

/**
 * Classify an error and determine recovery strategy
 */
export function classifyError(error: unknown): ClassifiedError {
  // Handle HTTP errors with status codes
  if (isHttpError(error)) {
    return classifyHttpError(error);
  }

  // Handle network errors
  if (isNetworkError(error)) {
    return {
      original: error instanceof Error ? error : new Error(String(error)),
      category: 'retryable',
      strategy: 'exponential_backoff',
      userMessage: 'Network connection error. Please check your connection and try again.',
      canAutoHeal: true,
    };
  }

  // Handle timeout errors
  if (isTimeoutError(error)) {
    return {
      original: error instanceof Error ? error : new Error(String(error)),
      category: 'retryable',
      strategy: 'exponential_backoff',
      userMessage: 'The request timed out. Please try again.',
      canAutoHeal: true,
    };
  }

  // Default: unknown errors are fatal
  const errorObj = error instanceof Error ? error : new Error(String(error));
  return {
    original: errorObj,
    category: 'fatal',
    strategy: 'abort',
    userMessage: `An unexpected error occurred: ${errorObj.message}`,
    canAutoHeal: false,
  };
}

/**
 * Classify an HTTP error by status code
 */
function classifyHttpError(error: HttpError): ClassifiedError {
  const statusCode = error.statusCode;
  const category = STATUS_CATEGORY_MAP[statusCode] ?? 'fatal';
  const strategy = CATEGORY_STRATEGY_MAP[category];
  const userMessage = USER_MESSAGES[statusCode] ?? `HTTP error ${String(statusCode)}`;
  const suggestedAction = SUGGESTED_ACTIONS[statusCode];

  return {
    original: error,
    statusCode,
    category,
    strategy,
    userMessage,
    canAutoHeal: category === 'retryable' || category === 'conflict',
    suggestedAction,
    technicalDetails: error.details,
  };
}

/**
 * HTTP error type guard
 */
interface HttpError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;
}

function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as HttpError).statusCode === 'number'
  );
}

/**
 * Network error detection
 */
function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const networkErrorPatterns = [
    /network/i,
    /fetch failed/i,
    /connection refused/i,
    /ECONNREFUSED/i,
    /ENOTFOUND/i,
    /ETIMEDOUT/i,
  ];

  return networkErrorPatterns.some((pattern) => pattern.test(error.message));
}

/**
 * Timeout error detection
 */
function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  return (
    error.name === 'AbortError' ||
    error.message.toLowerCase().includes('timeout') ||
    error.message.includes('ETIMEDOUT')
  );
}

/**
 * Check if an error category is auto-healable
 */
export function isAutoHealable(category: ErrorCategory): boolean {
  return category === 'retryable' || category === 'conflict';
}

/**
 * Get recovery strategy for a category
 */
export function getRecoveryStrategy(category: ErrorCategory): RecoveryStrategy {
  return CATEGORY_STRATEGY_MAP[category];
}

/**
 * Create an HTTP error from response
 */
export function createHttpError(
  message: string,
  statusCode: number,
  details?: Record<string, unknown>,
): HttpError {
  const error = new Error(message) as HttpError;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

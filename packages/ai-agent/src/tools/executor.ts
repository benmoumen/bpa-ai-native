import type { ToolExecutionContext, ToolExecutionResult, ToolMetadata } from './types.js';

/**
 * Execute a tool by making an HTTP request to the API
 */
export async function executeTool(
  metadata: ToolMetadata,
  args: Record<string, unknown>,
  context: ToolExecutionContext,
): Promise<ToolExecutionResult> {
  const startTime = Date.now();

  try {
    const { url, init } = buildRequest(metadata, args, context);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, context.timeout ?? 30000);

    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      const errorBody = await parseResponseBody(response);
      return {
        success: false,
        error: extractError(errorBody, response.status),
        statusCode: response.status,
        durationMs,
      };
    }

    const data = await parseResponseBody(response);

    return {
      success: true,
      data,
      statusCode: response.status,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            code: 'TIMEOUT',
            message: 'Request timed out',
          },
          statusCode: 0,
          durationMs,
        };
      }

      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message,
        },
        statusCode: 0,
        durationMs,
      };
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      },
      statusCode: 0,
      durationMs,
    };
  }
}

/**
 * Safely convert a value to string for URL parameters
 */
function stringifyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value.toString();
  }
  if (value === null) return 'null';
  // For objects/arrays, JSON stringify
  return JSON.stringify(value);
}

/**
 * Build the HTTP request from tool metadata and arguments
 */
function buildRequest(
  metadata: ToolMetadata,
  args: Record<string, unknown>,
  context: ToolExecutionContext,
): { url: string; init: RequestInit } {
  // Replace path parameters
  let path = metadata.path;
  const queryParams: Record<string, string> = {};
  let body: unknown = undefined;

  for (const [key, value] of Object.entries(args)) {
    if (key === 'data') {
      // Request body
      body = value;
    } else if (path.includes(`{${key}}`)) {
      // Path parameter
      path = path.replace(`{${key}}`, encodeURIComponent(stringifyValue(value)));
    } else if (value !== undefined) {
      // Query parameter
      queryParams[key] = stringifyValue(value);
    }
  }

  // Replace serviceId from context if present in path
  if (context.serviceId && path.includes('{serviceId}')) {
    path = path.replace('{serviceId}', context.serviceId);
  }

  // Build URL with query params
  const url = new URL(path, context.apiBaseUrl);
  for (const [key, value] of Object.entries(queryParams)) {
    url.searchParams.set(key, value);
  }

  // Build request init
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (context.authToken) {
    headers['Authorization'] = `Bearer ${context.authToken}`;
  }

  const init: RequestInit = {
    method: metadata.method,
    headers,
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(metadata.method)) {
    init.body = JSON.stringify(body);
  }

  return { url: url.toString(), init };
}

/**
 * Parse response body as JSON or text
 */
async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

/**
 * Extract error details from response body
 */
function extractError(
  body: unknown,
  statusCode: number,
): { code: string; message: string; details?: Record<string, unknown> } {
  // Handle standard API error format
  if (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof (body as Record<string, unknown>).error === 'object'
  ) {
    const error = (body as { error: Record<string, unknown> }).error;
    const errorCode = typeof error.code === 'string' ? error.code : getCodeFromStatus(statusCode);
    const errorMessage = typeof error.message === 'string' ? error.message : 'An error occurred';
    return {
      code: errorCode,
      message: errorMessage,
      details: error.details as Record<string, unknown> | undefined,
    };
  }

  // Handle plain message
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const msg = (body as { message: unknown }).message;
    return {
      code: getCodeFromStatus(statusCode),
      message: typeof msg === 'string' ? msg : 'An error occurred',
    };
  }

  return {
    code: getCodeFromStatus(statusCode),
    message: `HTTP ${String(statusCode)} error`,
  };
}

/**
 * Map HTTP status code to error code
 */
function getCodeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return 'BAD_REQUEST';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 422:
      return 'VALIDATION_ERROR';
    case 429:
      return 'RATE_LIMITED';
    case 500:
      return 'INTERNAL_ERROR';
    case 503:
      return 'SERVICE_UNAVAILABLE';
    default:
      return 'UNKNOWN_ERROR';
  }
}

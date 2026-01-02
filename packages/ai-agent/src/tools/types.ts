import type { z } from 'zod';

/**
 * Tool parameters type (re-export for convenience)
 */
export type { z as ZodType };

/**
 * Tool metadata for constraint evaluation and UI
 */
export interface ToolMetadata {
  /**
   * Tool name (matches OpenAPI operationId)
   */
  name: string;

  /**
   * Human-readable description
   */
  description: string;

  /**
   * Whether this tool mutates data
   */
  mutates: boolean;

  /**
   * Scope of the tool operation
   */
  scope: 'service' | 'form' | 'workflow' | 'registration' | 'global';

  /**
   * Whether confirmation is required before execution
   */
  requiresConfirmation: boolean;

  /**
   * HTTP method for the operation
   */
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

  /**
   * API endpoint path
   */
  path: string;

  /**
   * Tags from OpenAPI spec
   */
  tags: string[];
}

/**
 * Extended tool with metadata
 * Compatible with Vercel AI SDK Tool type
 */
export type BPATool = {
  description?: string;
  parameters: z.ZodTypeAny;
  execute?: (
    args: Record<string, unknown>,
    options?: unknown,
  ) => Promise<unknown> | PromiseLike<unknown>;
  experimental_toToolResultContent?: (result: unknown) => unknown;
  metadata: ToolMetadata;
};

/**
 * Tool registry storage
 */
export interface ToolRegistry {
  /**
   * All available tools
   */
  tools: Map<string, BPATool>;

  /**
   * Tool metadata index
   */
  metadata: Map<string, ToolMetadata>;

  /**
   * Last update timestamp
   */
  updatedAt: Date;
}

/**
 * OpenAPI specification types (minimal subset)
 */
export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, SchemaObject>;
  };
}

export interface PathItem {
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  patch?: OperationObject;
  delete?: OperationObject;
  parameters?: ParameterObject[];
}

export interface OperationObject {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
}

export interface ParameterObject {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
}

export interface RequestBodyObject {
  required?: boolean;
  content?: {
    'application/json'?: {
      schema?: SchemaObject;
    };
  };
}

export interface ResponseObject {
  description?: string;
  content?: {
    'application/json'?: {
      schema?: SchemaObject;
    };
  };
}

export interface SchemaObject {
  type?: string;
  format?: string;
  description?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  enum?: (string | number)[];
  default?: unknown;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  $ref?: string;
}

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  /**
   * API base URL
   */
  apiBaseUrl: string;

  /**
   * JWT auth token
   */
  authToken?: string;

  /**
   * Current service ID (for scoped operations)
   */
  serviceId?: string;

  /**
   * Request timeout in ms
   */
  timeout?: number;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  /**
   * Whether execution succeeded
   */
  success: boolean;

  /**
   * Result data (on success)
   */
  data?: unknown;

  /**
   * Error details (on failure)
   */
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };

  /**
   * HTTP status code
   */
  statusCode: number;

  /**
   * Execution duration in ms
   */
  durationMs: number;
}

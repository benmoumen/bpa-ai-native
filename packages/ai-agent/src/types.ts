import type { CoreMessage, Tool } from 'ai';

/**
 * AI Agent version constant
 */
export const AI_AGENT_VERSION = '0.0.1' as const;

/**
 * LLM provider configuration
 */
export type LLMProvider = 'groq' | 'anthropic';

/**
 * Agent configuration options
 */
export interface AgentConfig {
  /**
   * Primary LLM provider to use
   * @default 'groq'
   */
  provider?: LLMProvider;

  /**
   * Model ID to use (provider-specific)
   * @default 'llama-3.3-70b-versatile' for groq
   */
  modelId?: string;

  /**
   * API key for primary provider
   * Falls back to GROQ_API_KEY or ANTHROPIC_API_KEY env var
   */
  apiKey?: string;

  /**
   * Enable fallback to secondary provider on failure
   * @default true
   */
  enableFallback?: boolean;

  /**
   * Maximum reasoning steps per request
   * @default 10
   */
  maxSteps?: number;

  /**
   * Temperature for LLM responses (0-1)
   * @default 0.7
   */
  temperature?: number;

  /**
   * Maximum tokens for response
   * @default 4096
   */
  maxTokens?: number;

  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeout?: number;
}

/**
 * BPA-specific context for agent operations
 */
export interface BPAContext {
  /**
   * Current service ID being configured
   */
  serviceId?: string;

  /**
   * User ID performing the operation
   */
  userId: string;

  /**
   * User's display name
   */
  userName?: string;

  /**
   * User's email
   */
  userEmail?: string;

  /**
   * User's roles
   */
  userRoles?: string[];

  /**
   * Country code for scoped access
   */
  countryCode?: string;

  /**
   * Conversation session ID
   */
  sessionId: string;

  /**
   * Current session cost in USD
   */
  sessionCost?: number;

  /**
   * Backend API base URL
   */
  apiBaseUrl: string;

  /**
   * JWT token for API authentication
   */
  authToken?: string;
}

/**
 * Options for BPAAgent instantiation
 */
export interface BPAAgentOptions {
  /**
   * Agent configuration
   */
  config?: AgentConfig;

  /**
   * BPA context for operations
   */
  context: BPAContext;

  /**
   * Available tools for the agent
   */
  tools?: Record<string, Tool>;

  /**
   * Custom system prompt (will be merged with default)
   */
  systemPrompt?: string;
}

/**
 * Chat request input
 */
export interface ChatRequest {
  /**
   * User's message
   */
  message: string;

  /**
   * Previous messages in the conversation
   */
  history?: CoreMessage[];

  /**
   * Request-specific context overrides
   */
  context?: Partial<BPAContext>;
}

/**
 * Chat response (streaming or complete)
 */
export interface ChatResponse {
  /**
   * Response text (final or partial for streaming)
   */
  text: string;

  /**
   * Tool calls executed during response
   */
  toolCalls?: ToolCallResult[];

  /**
   * Token usage for this response
   */
  usage?: TokenUsage;

  /**
   * Whether response is still streaming
   */
  isStreaming?: boolean;

  /**
   * Any errors encountered
   */
  error?: AgentError;
}

/**
 * Result of a tool call execution
 */
export interface ToolCallResult {
  /**
   * Tool name that was called
   */
  toolName: string;

  /**
   * Arguments passed to the tool
   */
  args: Record<string, unknown>;

  /**
   * Result returned by the tool
   */
  result: unknown;

  /**
   * Duration of tool execution in ms
   */
  durationMs: number;

  /**
   * Whether confirmation was required
   */
  requiredConfirmation?: boolean;

  /**
   * Error if tool execution failed
   */
  error?: AgentError;
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  /**
   * Input tokens used
   */
  promptTokens: number;

  /**
   * Output tokens generated
   */
  completionTokens: number;

  /**
   * Total tokens used
   */
  totalTokens: number;

  /**
   * Estimated cost in USD
   */
  costUsd: number;
}

/**
 * Agent error with classification
 */
export interface AgentError {
  /**
   * Error code for classification
   */
  code: AgentErrorCode;

  /**
   * Human-readable error message
   */
  message: string;

  /**
   * Original error if wrapped
   */
  cause?: Error;

  /**
   * Whether this error is retryable
   */
  retryable: boolean;

  /**
   * Suggested recovery action
   */
  recovery?: string;
}

/**
 * Error codes for agent errors
 */
export type AgentErrorCode =
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'INVALID_REQUEST'
  | 'VALIDATION_ERROR'
  | 'CONSTRAINT_BLOCKED'
  | 'TOOL_EXECUTION_FAILED'
  | 'CONTEXT_STALE'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'PROVIDER_ERROR'
  | 'FALLBACK_EXHAUSTED';

/**
 * Step completion hook callback
 */
export type StepCompletionHandler = (
  step: StepResult,
) => void | Promise<void>;

/**
 * Result of a single reasoning step
 */
export interface StepResult {
  /**
   * Step number (1-based)
   */
  stepNumber: number;

  /**
   * Type of step
   */
  type: 'text' | 'tool-call' | 'tool-result';

  /**
   * Text content for text steps
   */
  text?: string;

  /**
   * Tool call details for tool steps
   */
  toolCall?: {
    name: string;
    args: Record<string, unknown>;
  };

  /**
   * Tool result for result steps
   */
  toolResult?: {
    name: string;
    result: unknown;
    error?: AgentError;
  };

  /**
   * Token usage for this step
   */
  usage?: TokenUsage;
}

/**
 * LLM model registry with pricing
 */
export const LLM_MODELS = {
  groq: {
    'llama-3.3-70b-versatile': {
      inputPrice: 0.00059, // per 1K tokens
      outputPrice: 0.00079,
      contextWindow: 128000,
    },
    'llama-3.1-8b-instant': {
      inputPrice: 0.00005,
      outputPrice: 0.00008,
      contextWindow: 128000,
    },
  },
  anthropic: {
    'claude-sonnet-4-20250514': {
      inputPrice: 0.003, // per 1K tokens
      outputPrice: 0.015,
      contextWindow: 200000,
    },
    'claude-3-5-haiku-20241022': {
      inputPrice: 0.0008,
      outputPrice: 0.004,
      contextWindow: 200000,
    },
  },
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<AgentConfig> = {
  provider: 'groq',
  modelId: 'llama-3.3-70b-versatile',
  apiKey: '',
  enableFallback: true,
  maxSteps: 10,
  temperature: 0.7,
  maxTokens: 4096,
  timeout: 30000,
};

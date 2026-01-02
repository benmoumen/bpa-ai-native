/**
 * Observability Types
 *
 * Story 6-1e: Observability Layer
 */

/**
 * LLM token usage
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * LLM model cost info
 */
export interface ModelCost {
  inputCostPer1k: number;
  outputCostPer1k: number;
}

/**
 * Cost calculation result
 */
export interface CostResult {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: 'USD';
}

/**
 * Audit entry for tool execution
 */
export interface AuditEntry {
  /** Unique audit entry ID */
  id: string;
  /** Timestamp of the action */
  timestamp: Date;
  /** User ID who initiated the action */
  userId: string;
  /** Session ID for the conversation */
  sessionId: string;
  /** Service ID being configured */
  serviceId: string;
  /** Type of action */
  actionType: 'tool_call' | 'llm_request' | 'constraint_check' | 'healing_attempt';
  /** Tool or action name */
  toolName: string;
  /** Arguments passed */
  args: Record<string, unknown>;
  /** Result of the action */
  result?: unknown;
  /** Whether the action succeeded */
  success: boolean;
  /** Error message if failed */
  errorMessage?: string;
  /** Duration in milliseconds */
  durationMs: number;
  /** Token usage (for LLM requests) */
  tokenUsage?: TokenUsage;
  /** Cost in USD (for LLM requests) */
  costUsd?: number;
}

/**
 * Session summary
 */
export interface SessionSummary {
  sessionId: string;
  userId: string;
  serviceId: string;
  startTime: Date;
  endTime?: Date;
  /** Total LLM requests */
  llmRequestCount: number;
  /** Total tool calls */
  toolCallCount: number;
  /** Total tokens used */
  totalTokens: number;
  /** Total cost in USD */
  totalCostUsd: number;
  /** Total healing attempts */
  healingAttempts: number;
  /** Successful tool calls */
  successfulToolCalls: number;
  /** Failed tool calls */
  failedToolCalls: number;
}

/**
 * Service configuration cost summary
 */
export interface ServiceCostSummary {
  serviceId: string;
  serviceName?: string;
  /** Total sessions configuring this service */
  sessionCount: number;
  /** Total cost across all sessions */
  totalCostUsd: number;
  /** Average cost per session */
  avgCostPerSession: number;
  /** First configuration date */
  firstConfiguredAt: Date;
  /** Last configuration date */
  lastConfiguredAt: Date;
}

/**
 * Metrics for dashboard
 */
export interface AgentMetrics {
  /** Total sessions */
  totalSessions: number;
  /** Active sessions */
  activeSessions: number;
  /** Total LLM cost */
  totalCostUsd: number;
  /** Average cost per session */
  avgCostPerSession: number;
  /** Total tool calls */
  totalToolCalls: number;
  /** Tool call success rate */
  toolCallSuccessRate: number;
  /** Average response time */
  avgResponseTimeMs: number;
  /** Most used tools */
  topTools: Array<{ name: string; count: number }>;
}

/**
 * Audit log query options
 */
export interface AuditLogQuery {
  sessionId?: string;
  serviceId?: string;
  userId?: string;
  actionType?: AuditEntry['actionType'];
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

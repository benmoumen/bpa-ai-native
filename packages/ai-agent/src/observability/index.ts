/**
 * Observability Layer
 *
 * Story 6-1e: Observability Layer
 *
 * Provides audit logging, cost tracking, and metrics for the AI agent.
 */

export const OBSERVABILITY_VERSION = '1.0.0' as const;

// Types
export type {
  TokenUsage,
  ModelCost,
  CostResult,
  AuditEntry,
  SessionSummary,
  ServiceCostSummary,
  AgentMetrics,
  AuditLogQuery,
} from './types.js';

// Cost tracking
export {
  calculateCost,
  getModelCost,
  isModelSupported,
  getProviderFromModel,
  createCostTracker,
  CostTracker,
  GROQ_PRICING,
  ANTHROPIC_PRICING,
} from './cost.js';

// Audit logging
export {
  createAuditLogger,
  startTimer,
  AuditLogger,
} from './audit.js';

// Metrics
export {
  createMetricsCollector,
  getMetricsCollector,
  MetricsCollector,
} from './metrics.js';

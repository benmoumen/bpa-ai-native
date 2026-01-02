/**
 * Audit Logger
 *
 * Story 6-1e: Observability Layer
 *
 * Logs all agent actions for compliance and debugging.
 * Every tool execution, LLM request, and healing attempt is recorded.
 */

import { randomUUID } from 'crypto';
import type {
  AuditEntry,
  AuditLogQuery,
  TokenUsage,
  SessionSummary,
} from './types.js';
import { calculateCost } from './cost.js';

/**
 * Audit Logger for tracking agent actions
 */
export class AuditLogger {
  private entries: AuditEntry[] = [];
  private readonly sessionId: string;
  private readonly userId: string;
  private readonly serviceId: string;
  private readonly startTime: Date;
  private readonly maxEntries: number;

  constructor(
    sessionId: string,
    userId: string,
    serviceId: string,
    options: { maxEntries?: number } = {},
  ) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.serviceId = serviceId;
    this.startTime = new Date();
    this.maxEntries = options.maxEntries || 10000;
  }

  /**
   * Log a tool call
   */
  logToolCall(
    toolName: string,
    args: Record<string, unknown>,
    result: unknown,
    success: boolean,
    durationMs: number,
    errorMessage?: string,
  ): AuditEntry {
    return this.log({
      actionType: 'tool_call',
      toolName,
      args,
      result,
      success,
      durationMs,
      errorMessage,
    });
  }

  /**
   * Log an LLM request
   */
  logLLMRequest(
    modelId: string,
    args: Record<string, unknown>,
    result: unknown,
    success: boolean,
    durationMs: number,
    tokenUsage?: TokenUsage,
    errorMessage?: string,
  ): AuditEntry {
    const costResult = tokenUsage ? calculateCost(modelId, tokenUsage) : null;

    return this.log({
      actionType: 'llm_request',
      toolName: modelId,
      args,
      result,
      success,
      durationMs,
      tokenUsage,
      costUsd: costResult?.totalCost,
      errorMessage,
    });
  }

  /**
   * Log a constraint check
   */
  logConstraintCheck(
    constraintId: string,
    args: Record<string, unknown>,
    passed: boolean,
    durationMs: number,
    errorMessage?: string,
  ): AuditEntry {
    return this.log({
      actionType: 'constraint_check',
      toolName: constraintId,
      args,
      result: { passed },
      success: passed,
      durationMs,
      errorMessage,
    });
  }

  /**
   * Log a healing attempt
   */
  logHealingAttempt(
    strategy: string,
    args: Record<string, unknown>,
    result: unknown,
    success: boolean,
    durationMs: number,
    errorMessage?: string,
  ): AuditEntry {
    return this.log({
      actionType: 'healing_attempt',
      toolName: strategy,
      args,
      result,
      success,
      durationMs,
      errorMessage,
    });
  }

  /**
   * Internal logging method
   */
  private log(
    partial: Omit<AuditEntry, 'id' | 'timestamp' | 'userId' | 'sessionId' | 'serviceId'>,
  ): AuditEntry {
    const entry: AuditEntry = {
      id: randomUUID(),
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
      serviceId: this.serviceId,
      ...partial,
    };

    this.entries.push(entry);

    // Enforce max entries limit (FIFO)
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    return entry;
  }

  /**
   * Query audit entries
   */
  query(options: AuditLogQuery = {}): AuditEntry[] {
    let results = [...this.entries];

    if (options.sessionId) {
      results = results.filter((e) => e.sessionId === options.sessionId);
    }
    if (options.serviceId) {
      results = results.filter((e) => e.serviceId === options.serviceId);
    }
    if (options.userId) {
      results = results.filter((e) => e.userId === options.userId);
    }
    if (options.actionType) {
      results = results.filter((e) => e.actionType === options.actionType);
    }
    if (options.startTime) {
      results = results.filter((e) => e.timestamp >= options.startTime!);
    }
    if (options.endTime) {
      results = results.filter((e) => e.timestamp <= options.endTime!);
    }

    // Sort by timestamp descending (most recent first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    if (options.offset) {
      results = results.slice(options.offset);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get all entries
   */
  getEntries(): AuditEntry[] {
    return [...this.entries];
  }

  /**
   * Get entry count
   */
  getEntryCount(): number {
    return this.entries.length;
  }

  /**
   * Get session summary
   */
  getSessionSummary(): SessionSummary {
    const llmRequests = this.entries.filter((e) => e.actionType === 'llm_request');
    const toolCalls = this.entries.filter((e) => e.actionType === 'tool_call');
    const healingAttempts = this.entries.filter((e) => e.actionType === 'healing_attempt');

    const totalTokens = llmRequests.reduce(
      (sum, e) => sum + (e.tokenUsage?.totalTokens || 0),
      0,
    );
    const totalCostUsd = llmRequests.reduce(
      (sum, e) => sum + (e.costUsd || 0),
      0,
    );

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      serviceId: this.serviceId,
      startTime: this.startTime,
      endTime: this.entries.length > 0
        ? this.entries[this.entries.length - 1].timestamp
        : undefined,
      llmRequestCount: llmRequests.length,
      toolCallCount: toolCalls.length,
      totalTokens,
      totalCostUsd: Math.round(totalCostUsd * 1_000_000) / 1_000_000,
      healingAttempts: healingAttempts.length,
      successfulToolCalls: toolCalls.filter((e) => e.success).length,
      failedToolCalls: toolCalls.filter((e) => !e.success).length,
    };
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = [];
  }
}

/**
 * Create an audit logger instance
 */
export function createAuditLogger(
  sessionId: string,
  userId: string,
  serviceId: string,
  options?: { maxEntries?: number },
): AuditLogger {
  return new AuditLogger(sessionId, userId, serviceId, options);
}

/**
 * Timing helper for measuring operation duration
 */
export function startTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

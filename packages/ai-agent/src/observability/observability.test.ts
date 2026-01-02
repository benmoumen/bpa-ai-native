/**
 * Observability Layer Tests
 *
 * Story 6-1e: Observability Layer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateCost,
  createCostTracker,
  getModelCost,
  isModelSupported,
  getProviderFromModel,
  GROQ_PRICING,
  ANTHROPIC_PRICING,
} from './cost.js';
import { createAuditLogger, startTimer } from './audit.js';
import { createMetricsCollector } from './metrics.js';

describe('Cost Calculator', () => {
  describe('calculateCost', () => {
    it('should calculate cost for Groq models', () => {
      const result = calculateCost('llama-3.3-70b-versatile', {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      expect(result.inputCost).toBeCloseTo(0.00059, 5);
      expect(result.outputCost).toBeCloseTo(0.000395, 5);
      expect(result.totalCost).toBeCloseTo(0.000985, 5);
      expect(result.currency).toBe('USD');
    });

    it('should calculate cost for Anthropic models', () => {
      const result = calculateCost('claude-3-5-sonnet-20241022', {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      expect(result.inputCost).toBeCloseTo(0.003, 5);
      expect(result.outputCost).toBeCloseTo(0.0075, 5);
      expect(result.totalCost).toBeCloseTo(0.0105, 5);
    });

    it('should return zero cost for unknown models', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = calculateCost('unknown-model', {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      expect(result.totalCost).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith('Unknown model for cost calculation: unknown-model');

      consoleSpy.mockRestore();
    });

    it('should round to microcent precision', () => {
      const result = calculateCost('llama-3.1-8b-instant', {
        promptTokens: 1,
        completionTokens: 1,
        totalTokens: 2,
      });

      // Should be 6 decimal places max
      const decimalPlaces = (result.totalCost.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(6);
    });
  });

  describe('getModelCost', () => {
    it('should return cost info for supported models', () => {
      const cost = getModelCost('claude-3-5-sonnet-20241022');
      expect(cost).toEqual({
        inputCostPer1k: 0.003,
        outputCostPer1k: 0.015,
      });
    });

    it('should return null for unsupported models', () => {
      const cost = getModelCost('unsupported-model');
      expect(cost).toBeNull();
    });
  });

  describe('isModelSupported', () => {
    it('should return true for Groq models', () => {
      expect(isModelSupported('llama-3.3-70b-versatile')).toBe(true);
      expect(isModelSupported('mixtral-8x7b-32768')).toBe(true);
    });

    it('should return true for Anthropic models', () => {
      expect(isModelSupported('claude-3-5-sonnet-20241022')).toBe(true);
      expect(isModelSupported('claude-3-haiku-20240307')).toBe(true);
    });

    it('should return false for unknown models', () => {
      expect(isModelSupported('unknown')).toBe(false);
    });
  });

  describe('getProviderFromModel', () => {
    it('should identify Groq models', () => {
      expect(getProviderFromModel('llama-3.3-70b-versatile')).toBe('groq');
      expect(getProviderFromModel('gemma2-9b-it')).toBe('groq');
    });

    it('should identify Anthropic models', () => {
      expect(getProviderFromModel('claude-opus-4-5-20251101')).toBe('anthropic');
      expect(getProviderFromModel('claude-3-5-haiku-20241022')).toBe('anthropic');
    });

    it('should return unknown for unrecognized models', () => {
      expect(getProviderFromModel('gpt-4')).toBe('unknown');
    });
  });

  describe('CostTracker', () => {
    it('should track multiple requests', () => {
      const tracker = createCostTracker();

      tracker.track('llama-3.3-70b-versatile', {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      tracker.track('claude-3-5-sonnet-20241022', {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      expect(tracker.getRequestCount()).toBe(2);
      expect(tracker.getTotalTokens().totalTokens).toBe(3000);
      expect(tracker.getTotalCost()).toBeGreaterThan(0);
    });

    it('should reset tracking', () => {
      const tracker = createCostTracker();

      tracker.track('llama-3.3-70b-versatile', {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      });

      tracker.reset();

      expect(tracker.getRequestCount()).toBe(0);
      expect(tracker.getTotalCost()).toBe(0);
    });

    it('should return request history', () => {
      const tracker = createCostTracker();

      tracker.track('llama-3.3-70b-versatile', {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      });

      const requests = tracker.getRequests();
      expect(requests).toHaveLength(1);
      expect(requests[0].modelId).toBe('llama-3.3-70b-versatile');
      expect(requests[0].usage.totalTokens).toBe(150);
    });
  });

  describe('Pricing constants', () => {
    it('should have Groq pricing for common models', () => {
      expect(GROQ_PRICING['llama-3.3-70b-versatile']).toBeDefined();
      expect(GROQ_PRICING['llama-3.1-8b-instant']).toBeDefined();
      expect(GROQ_PRICING['mixtral-8x7b-32768']).toBeDefined();
    });

    it('should have Anthropic pricing for common models', () => {
      expect(ANTHROPIC_PRICING['claude-opus-4-5-20251101']).toBeDefined();
      expect(ANTHROPIC_PRICING['claude-3-5-sonnet-20241022']).toBeDefined();
      expect(ANTHROPIC_PRICING['claude-3-5-haiku-20241022']).toBeDefined();
    });
  });
});

describe('Audit Logger', () => {
  let logger: ReturnType<typeof createAuditLogger>;

  beforeEach(() => {
    logger = createAuditLogger('session-123', 'user-456', 'service-789');
  });

  describe('logToolCall', () => {
    it('should log successful tool calls', () => {
      const entry = logger.logToolCall(
        'createForm',
        { name: 'Test Form' },
        { id: 'form-1' },
        true,
        150,
      );

      expect(entry.actionType).toBe('tool_call');
      expect(entry.toolName).toBe('createForm');
      expect(entry.args).toEqual({ name: 'Test Form' });
      expect(entry.result).toEqual({ id: 'form-1' });
      expect(entry.success).toBe(true);
      expect(entry.durationMs).toBe(150);
      expect(entry.sessionId).toBe('session-123');
      expect(entry.userId).toBe('user-456');
      expect(entry.serviceId).toBe('service-789');
    });

    it('should log failed tool calls with error', () => {
      const entry = logger.logToolCall(
        'createForm',
        { name: 'Test Form' },
        null,
        false,
        50,
        'Validation failed',
      );

      expect(entry.success).toBe(false);
      expect(entry.errorMessage).toBe('Validation failed');
    });
  });

  describe('logLLMRequest', () => {
    it('should log LLM requests with cost', () => {
      const entry = logger.logLLMRequest(
        'llama-3.3-70b-versatile',
        { prompt: 'test' },
        { text: 'response' },
        true,
        500,
        { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      );

      expect(entry.actionType).toBe('llm_request');
      expect(entry.toolName).toBe('llama-3.3-70b-versatile');
      expect(entry.tokenUsage).toBeDefined();
      expect(entry.costUsd).toBeGreaterThan(0);
    });

    it('should handle LLM requests without token usage', () => {
      const entry = logger.logLLMRequest(
        'unknown-model',
        { prompt: 'test' },
        { text: 'response' },
        true,
        500,
      );

      expect(entry.tokenUsage).toBeUndefined();
      expect(entry.costUsd).toBeUndefined();
    });
  });

  describe('logConstraintCheck', () => {
    it('should log passed constraint checks', () => {
      const entry = logger.logConstraintCheck(
        'max-fields-per-form',
        { currentFields: 10, maxFields: 50 },
        true,
        5,
      );

      expect(entry.actionType).toBe('constraint_check');
      expect(entry.success).toBe(true);
    });

    it('should log failed constraint checks', () => {
      const entry = logger.logConstraintCheck(
        'max-fields-per-form',
        { currentFields: 60, maxFields: 50 },
        false,
        5,
        'Exceeded maximum field count',
      );

      expect(entry.success).toBe(false);
      expect(entry.errorMessage).toBe('Exceeded maximum field count');
    });
  });

  describe('logHealingAttempt', () => {
    it('should log healing attempts', () => {
      const entry = logger.logHealingAttempt(
        'retry',
        { attempt: 2 },
        { success: true },
        true,
        1000,
      );

      expect(entry.actionType).toBe('healing_attempt');
      expect(entry.toolName).toBe('retry');
    });
  });

  describe('query', () => {
    beforeEach(() => {
      logger.logToolCall('tool1', {}, {}, true, 10);
      logger.logToolCall('tool2', {}, {}, false, 20);
      logger.logLLMRequest('model1', {}, {}, true, 100);
    });

    it('should filter by action type', () => {
      const results = logger.query({ actionType: 'tool_call' });
      expect(results).toHaveLength(2);
    });

    it('should apply limit and offset', () => {
      const results = logger.query({ limit: 1, offset: 1 });
      expect(results).toHaveLength(1);
    });

    it('should return all entries when no filter applied', () => {
      const results = logger.query({});
      expect(results).toHaveLength(3);
      // All entries should have valid timestamps
      results.forEach((r) => {
        expect(r.timestamp).toBeInstanceOf(Date);
      });
    });
  });

  describe('getSessionSummary', () => {
    it('should calculate session summary', () => {
      logger.logToolCall('tool1', {}, {}, true, 10);
      logger.logToolCall('tool2', {}, {}, false, 20);
      logger.logLLMRequest(
        'llama-3.3-70b-versatile',
        {},
        {},
        true,
        100,
        { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      );
      logger.logHealingAttempt('retry', {}, {}, true, 50);

      const summary = logger.getSessionSummary();

      expect(summary.sessionId).toBe('session-123');
      expect(summary.userId).toBe('user-456');
      expect(summary.serviceId).toBe('service-789');
      expect(summary.toolCallCount).toBe(2);
      expect(summary.successfulToolCalls).toBe(1);
      expect(summary.failedToolCalls).toBe(1);
      expect(summary.llmRequestCount).toBe(1);
      expect(summary.totalTokens).toBe(150);
      expect(summary.healingAttempts).toBe(1);
      expect(summary.totalCostUsd).toBeGreaterThan(0);
    });
  });

  describe('maxEntries', () => {
    it('should enforce max entries limit', () => {
      const limitedLogger = createAuditLogger('s', 'u', 'svc', { maxEntries: 3 });

      limitedLogger.logToolCall('tool1', {}, {}, true, 10);
      limitedLogger.logToolCall('tool2', {}, {}, true, 10);
      limitedLogger.logToolCall('tool3', {}, {}, true, 10);
      limitedLogger.logToolCall('tool4', {}, {}, true, 10);

      const entries = limitedLogger.getEntries();
      expect(entries).toHaveLength(3);
      expect(entries[0].toolName).toBe('tool2'); // First entry dropped
    });
  });

  describe('startTimer', () => {
    it('should measure elapsed time', async () => {
      const getElapsed = startTimer();
      await new Promise((r) => setTimeout(r, 50));
      const elapsed = getElapsed();

      expect(elapsed).toBeGreaterThanOrEqual(40);
      expect(elapsed).toBeLessThan(150);
    });
  });
});

describe('Metrics Collector', () => {
  let metrics: ReturnType<typeof createMetricsCollector>;

  beforeEach(() => {
    metrics = createMetricsCollector();
  });

  describe('recordLLMRequest', () => {
    it('should record LLM request metrics', () => {
      metrics.recordLLMRequest(
        'llama-3.3-70b-versatile',
        true,
        500,
        1000,
        500,
        0.001,
      );

      const prometheusOutput = metrics.toPrometheusFormat();
      expect(prometheusOutput).toContain('agent_llm_requests_total');
      expect(prometheusOutput).toContain('model="llama-3.3-70b-versatile"');
      expect(prometheusOutput).toContain('status="success"');
    });
  });

  describe('recordToolCall', () => {
    it('should record tool call metrics', () => {
      metrics.recordToolCall('createForm', true, 150);
      metrics.recordToolCall('createForm', false, 50);

      const agentMetrics = metrics.getAgentMetrics();
      expect(agentMetrics.totalToolCalls).toBe(2);
      expect(agentMetrics.toolCallSuccessRate).toBe(0.5);
    });
  });

  describe('session tracking', () => {
    it('should track session lifecycle', () => {
      metrics.sessionStart('session-1', 'user-1', 'service-1');

      let agentMetrics = metrics.getAgentMetrics();
      expect(agentMetrics.activeSessions).toBe(1);

      metrics.sessionEnd('session-1');

      agentMetrics = metrics.getAgentMetrics();
      expect(agentMetrics.activeSessions).toBe(0);
    });

    it('should update session data', () => {
      metrics.sessionStart('session-1', 'user-1', 'service-1');
      metrics.updateSession('session-1', { totalCostUsd: 0.05 });

      const prometheusOutput = metrics.toPrometheusFormat();
      expect(prometheusOutput).toContain('agent_session_cost_usd');
    });
  });

  describe('getAgentMetrics', () => {
    it('should aggregate metrics correctly', () => {
      metrics.sessionStart('s1', 'u1', 'svc1');
      metrics.recordLLMRequest('model1', true, 100, 100, 50, 0.001);
      metrics.recordToolCall('tool1', true, 50);
      metrics.recordToolCall('tool2', true, 30);
      metrics.recordHealingAttempt('retry', true);

      const agentMetrics = metrics.getAgentMetrics();

      expect(agentMetrics.totalSessions).toBe(1);
      expect(agentMetrics.activeSessions).toBe(1);
      expect(agentMetrics.totalToolCalls).toBe(2);
      expect(agentMetrics.toolCallSuccessRate).toBe(1);
    });
  });

  describe('toPrometheusFormat', () => {
    it('should output valid Prometheus format', () => {
      metrics.recordLLMRequest('model1', true, 100, 100, 50, 0.001);
      const output = metrics.toPrometheusFormat();

      expect(output).toContain('# HELP');
      expect(output).toContain('# TYPE');
      expect(output).toContain('counter');
      expect(output).toContain('histogram');
      expect(output).toContain('gauge');
    });

    it('should include histogram buckets', () => {
      metrics.recordLLMRequest('model1', true, 100, 100, 50, 0.001);
      const output = metrics.toPrometheusFormat();

      expect(output).toContain('_bucket{');
      expect(output).toContain('le="');
      expect(output).toContain('_sum');
      expect(output).toContain('_count');
    });
  });

  describe('reset', () => {
    it('should reset all metrics', () => {
      metrics.recordToolCall('tool1', true, 50);
      metrics.sessionStart('s1', 'u1', 'svc1');

      metrics.reset();

      const agentMetrics = metrics.getAgentMetrics();
      expect(agentMetrics.totalToolCalls).toBe(0);
      expect(agentMetrics.activeSessions).toBe(0);
    });
  });
});

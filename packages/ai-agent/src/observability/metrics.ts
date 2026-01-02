/**
 * Metrics Collector
 *
 * Story 6-1e: Observability Layer
 *
 * Collects and exposes metrics for the AI agent.
 * Designed for Prometheus-compatible scraping.
 */

import type { AgentMetrics, SessionSummary } from './types.js';

/**
 * Counter metric
 */
interface Counter {
  name: string;
  help: string;
  labels: string[];
  values: Map<string, number>;
}

/**
 * Histogram metric
 */
interface Histogram {
  name: string;
  help: string;
  labels: string[];
  buckets: number[];
  values: Map<string, { sum: number; count: number; buckets: number[] }>;
}

/**
 * Gauge metric
 */
interface Gauge {
  name: string;
  help: string;
  labels: string[];
  values: Map<string, number>;
}

/**
 * Metrics Collector for agent observability
 */
export class MetricsCollector {
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  private sessions: Map<string, SessionSummary> = new Map();

  constructor() {
    this.initializeMetrics();
  }

  /**
   * Initialize default metrics
   */
  private initializeMetrics(): void {
    // Counters
    this.registerCounter(
      'agent_llm_requests_total',
      'Total number of LLM requests',
      ['model', 'status'],
    );
    this.registerCounter(
      'agent_tool_calls_total',
      'Total number of tool calls',
      ['tool', 'status'],
    );
    this.registerCounter(
      'agent_tokens_total',
      'Total tokens used',
      ['model', 'type'],
    );
    this.registerCounter(
      'agent_cost_usd_total',
      'Total cost in USD (micro-dollars)',
      ['model'],
    );
    this.registerCounter(
      'agent_healing_attempts_total',
      'Total healing attempts',
      ['strategy', 'status'],
    );
    this.registerCounter(
      'agent_constraint_checks_total',
      'Total constraint checks',
      ['constraint', 'status'],
    );

    // Histograms
    this.registerHistogram(
      'agent_llm_duration_ms',
      'LLM request duration in milliseconds',
      ['model'],
      [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    );
    this.registerHistogram(
      'agent_tool_duration_ms',
      'Tool execution duration in milliseconds',
      ['tool'],
      [1, 5, 10, 25, 50, 100, 250, 500, 1000],
    );

    // Gauges
    this.registerGauge(
      'agent_active_sessions',
      'Number of active agent sessions',
      [],
    );
    this.registerGauge(
      'agent_session_cost_usd',
      'Current session cost in USD',
      ['session_id'],
    );
  }

  /**
   * Register a counter metric
   */
  private registerCounter(name: string, help: string, labels: string[]): void {
    this.counters.set(name, { name, help, labels, values: new Map() });
  }

  /**
   * Register a histogram metric
   */
  private registerHistogram(
    name: string,
    help: string,
    labels: string[],
    buckets: number[],
  ): void {
    this.histograms.set(name, { name, help, labels, buckets, values: new Map() });
  }

  /**
   * Register a gauge metric
   */
  private registerGauge(name: string, help: string, labels: string[]): void {
    this.gauges.set(name, { name, help, labels, values: new Map() });
  }

  /**
   * Increment a counter
   */
  incCounter(name: string, labels: Record<string, string> = {}, value = 1): void {
    const counter = this.counters.get(name);
    if (!counter) return;

    const key = this.labelsToKey(labels);
    const current = counter.values.get(key) || 0;
    counter.values.set(key, current + value);
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, labels: Record<string, string> = {}, value: number): void {
    const gauge = this.gauges.get(name);
    if (!gauge) return;

    const key = this.labelsToKey(labels);
    gauge.values.set(key, value);
  }

  /**
   * Increment a gauge
   */
  incGauge(name: string, labels: Record<string, string> = {}, value = 1): void {
    const gauge = this.gauges.get(name);
    if (!gauge) return;

    const key = this.labelsToKey(labels);
    const current = gauge.values.get(key) || 0;
    gauge.values.set(key, current + value);
  }

  /**
   * Decrement a gauge
   */
  decGauge(name: string, labels: Record<string, string> = {}, value = 1): void {
    this.incGauge(name, labels, -value);
  }

  /**
   * Observe a histogram value
   */
  observeHistogram(name: string, labels: Record<string, string> = {}, value: number): void {
    const histogram = this.histograms.get(name);
    if (!histogram) return;

    const key = this.labelsToKey(labels);
    let data = histogram.values.get(key);

    if (!data) {
      data = {
        sum: 0,
        count: 0,
        buckets: histogram.buckets.map(() => 0),
      };
      histogram.values.set(key, data);
    }

    data.sum += value;
    data.count += 1;

    // Update bucket counts
    for (let i = 0; i < histogram.buckets.length; i++) {
      if (value <= histogram.buckets[i]) {
        data.buckets[i]++;
      }
    }
  }

  /**
   * Record an LLM request
   */
  recordLLMRequest(
    model: string,
    success: boolean,
    durationMs: number,
    promptTokens: number,
    completionTokens: number,
    costUsd: number,
  ): void {
    const status = success ? 'success' : 'error';

    this.incCounter('agent_llm_requests_total', { model, status });
    this.incCounter('agent_tokens_total', { model, type: 'prompt' }, promptTokens);
    this.incCounter('agent_tokens_total', { model, type: 'completion' }, completionTokens);
    this.incCounter('agent_cost_usd_total', { model }, Math.round(costUsd * 1_000_000));
    this.observeHistogram('agent_llm_duration_ms', { model }, durationMs);
  }

  /**
   * Record a tool call
   */
  recordToolCall(tool: string, success: boolean, durationMs: number): void {
    const status = success ? 'success' : 'error';
    this.incCounter('agent_tool_calls_total', { tool, status });
    this.observeHistogram('agent_tool_duration_ms', { tool }, durationMs);
  }

  /**
   * Record a healing attempt
   */
  recordHealingAttempt(strategy: string, success: boolean): void {
    const status = success ? 'success' : 'error';
    this.incCounter('agent_healing_attempts_total', { strategy, status });
  }

  /**
   * Record a constraint check
   */
  recordConstraintCheck(constraint: string, passed: boolean): void {
    const status = passed ? 'passed' : 'blocked';
    this.incCounter('agent_constraint_checks_total', { constraint, status });
  }

  /**
   * Track session start
   */
  sessionStart(sessionId: string, userId: string, serviceId: string): void {
    this.sessions.set(sessionId, {
      sessionId,
      userId,
      serviceId,
      startTime: new Date(),
      llmRequestCount: 0,
      toolCallCount: 0,
      totalTokens: 0,
      totalCostUsd: 0,
      healingAttempts: 0,
      successfulToolCalls: 0,
      failedToolCalls: 0,
    });
    this.incGauge('agent_active_sessions');
  }

  /**
   * Update session summary
   */
  updateSession(sessionId: string, summary: Partial<SessionSummary>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, summary);
      if (summary.totalCostUsd !== undefined) {
        this.setGauge('agent_session_cost_usd', { session_id: sessionId }, summary.totalCostUsd);
      }
    }
  }

  /**
   * Track session end
   */
  sessionEnd(sessionId: string): SessionSummary | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = new Date();
      this.sessions.delete(sessionId);
      this.decGauge('agent_active_sessions');
    }
    return session;
  }

  /**
   * Get aggregated agent metrics
   */
  getAgentMetrics(): AgentMetrics {
    const activeSessions = this.sessions.size;
    const allSessions = Array.from(this.sessions.values());

    // Get counter values
    const toolCounter = this.counters.get('agent_tool_calls_total');
    const costCounter = this.counters.get('agent_cost_usd_total');

    let totalToolCalls = 0;
    let successfulToolCalls = 0;
    let totalCostMicrodollars = 0;

    if (toolCounter) {
      toolCounter.values.forEach((v, k) => {
        totalToolCalls += v;
        if (k.includes('success')) {
          successfulToolCalls += v;
        }
      });
    }

    if (costCounter) {
      costCounter.values.forEach((v) => {
        totalCostMicrodollars += v;
      });
    }

    // Get tool histogram for average duration
    const toolHist = this.histograms.get('agent_tool_duration_ms');
    let totalDuration = 0;
    let totalCalls = 0;

    if (toolHist) {
      toolHist.values.forEach((v) => {
        totalDuration += v.sum;
        totalCalls += v.count;
      });
    }

    // Get top tools
    const toolCounts: Record<string, number> = {};
    if (toolCounter) {
      toolCounter.values.forEach((v, k) => {
        // Extract tool name from label key
        const match = k.match(/tool="([^"]+)"/);
        if (match) {
          const tool = match[1];
          toolCounts[tool] = (toolCounts[tool] || 0) + v;
        }
      });
    }

    const topTools = Object.entries(toolCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSessions: allSessions.length,
      activeSessions,
      totalCostUsd: totalCostMicrodollars / 1_000_000,
      avgCostPerSession:
        allSessions.length > 0
          ? totalCostMicrodollars / 1_000_000 / allSessions.length
          : 0,
      totalToolCalls,
      toolCallSuccessRate:
        totalToolCalls > 0 ? successfulToolCalls / totalToolCalls : 1,
      avgResponseTimeMs: totalCalls > 0 ? totalDuration / totalCalls : 0,
      topTools,
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  toPrometheusFormat(): string {
    const lines: string[] = [];

    // Counters
    this.counters.forEach((counter) => {
      lines.push(`# HELP ${counter.name} ${counter.help}`);
      lines.push(`# TYPE ${counter.name} counter`);
      counter.values.forEach((value, key) => {
        const labels = key ? `{${key}}` : '';
        lines.push(`${counter.name}${labels} ${String(value)}`);
      });
    });

    // Gauges
    this.gauges.forEach((gauge) => {
      lines.push(`# HELP ${gauge.name} ${gauge.help}`);
      lines.push(`# TYPE ${gauge.name} gauge`);
      gauge.values.forEach((value, key) => {
        const labels = key ? `{${key}}` : '';
        lines.push(`${gauge.name}${labels} ${String(value)}`);
      });
    });

    // Histograms
    this.histograms.forEach((histogram) => {
      lines.push(`# HELP ${histogram.name} ${histogram.help}`);
      lines.push(`# TYPE ${histogram.name} histogram`);
      histogram.values.forEach((data, key) => {
        const baseLabels = key ? `${key},` : '';
        histogram.buckets.forEach((bucket, i) => {
          lines.push(`${histogram.name}_bucket{${baseLabels}le="${String(bucket)}"} ${String(data.buckets[i])}`);
        });
        lines.push(`${histogram.name}_bucket{${baseLabels}le="+Inf"} ${String(data.count)}`);
        lines.push(`${histogram.name}_sum{${key ? key : ''}} ${String(data.sum)}`);
        lines.push(`${histogram.name}_count{${key ? key : ''}} ${String(data.count)}`);
      });
    });

    return lines.join('\n');
  }

  /**
   * Convert labels object to string key
   */
  private labelsToKey(labels: Record<string, string>): string {
    return Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.forEach((c) => {
      c.values.clear();
    });
    this.gauges.forEach((g) => {
      g.values.clear();
    });
    this.histograms.forEach((h) => {
      h.values.clear();
    });
    this.sessions.clear();
  }
}

/**
 * Singleton metrics collector
 */
let globalMetrics: MetricsCollector | null = null;

/**
 * Get the global metrics collector
 */
export function getMetricsCollector(): MetricsCollector {
  if (!globalMetrics) {
    globalMetrics = new MetricsCollector();
  }
  return globalMetrics;
}

/**
 * Create a new metrics collector (for testing)
 */
export function createMetricsCollector(): MetricsCollector {
  return new MetricsCollector();
}

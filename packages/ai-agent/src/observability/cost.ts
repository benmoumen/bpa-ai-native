/**
 * LLM Cost Calculator
 *
 * Story 6-1e: Observability Layer
 *
 * Tracks token usage and calculates costs for LLM API calls.
 * Supports multiple providers (Groq, Anthropic).
 */

import type { TokenUsage, ModelCost, CostResult } from './types.js';

/**
 * Groq pricing (as of Jan 2025)
 * https://console.groq.com/pricing
 */
export const GROQ_PRICING: Record<string, ModelCost> = {
  // LLaMA 3.3 models
  'llama-3.3-70b-versatile': { inputCostPer1k: 0.00059, outputCostPer1k: 0.00079 },
  'llama-3.3-70b-specdec': { inputCostPer1k: 0.00059, outputCostPer1k: 0.00099 },

  // LLaMA 3.1 models
  'llama-3.1-70b-versatile': { inputCostPer1k: 0.00059, outputCostPer1k: 0.00079 },
  'llama-3.1-8b-instant': { inputCostPer1k: 0.00005, outputCostPer1k: 0.00008 },

  // LLaMA 3.2 vision models
  'llama-3.2-90b-vision-preview': { inputCostPer1k: 0.0009, outputCostPer1k: 0.0009 },
  'llama-3.2-11b-vision-preview': { inputCostPer1k: 0.00018, outputCostPer1k: 0.00018 },

  // Mixtral
  'mixtral-8x7b-32768': { inputCostPer1k: 0.00024, outputCostPer1k: 0.00024 },

  // Gemma
  'gemma2-9b-it': { inputCostPer1k: 0.0002, outputCostPer1k: 0.0002 },
};

/**
 * Anthropic pricing (as of Jan 2025)
 * https://www.anthropic.com/pricing
 */
export const ANTHROPIC_PRICING: Record<string, ModelCost> = {
  // Claude 4 (Opus 4.5)
  'claude-opus-4-5-20251101': { inputCostPer1k: 0.015, outputCostPer1k: 0.075 },

  // Claude 3.5
  'claude-3-5-sonnet-20241022': { inputCostPer1k: 0.003, outputCostPer1k: 0.015 },
  'claude-3-5-haiku-20241022': { inputCostPer1k: 0.001, outputCostPer1k: 0.005 },

  // Claude 3
  'claude-3-opus-20240229': { inputCostPer1k: 0.015, outputCostPer1k: 0.075 },
  'claude-3-sonnet-20240229': { inputCostPer1k: 0.003, outputCostPer1k: 0.015 },
  'claude-3-haiku-20240307': { inputCostPer1k: 0.00025, outputCostPer1k: 0.00125 },
};

/**
 * Combined pricing lookup
 */
const ALL_PRICING: Record<string, ModelCost> = {
  ...GROQ_PRICING,
  ...ANTHROPIC_PRICING,
};

/**
 * Calculate cost for a request
 */
export function calculateCost(
  modelId: string,
  usage: TokenUsage,
): CostResult {
  const pricing = ALL_PRICING[modelId];

  if (!(modelId in ALL_PRICING)) {
    // Unknown model - return zero cost with warning
    console.warn(`Unknown model for cost calculation: ${modelId}`);
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
    };
  }

  const inputCost = (usage.promptTokens / 1000) * pricing.inputCostPer1k;
  const outputCost = (usage.completionTokens / 1000) * pricing.outputCostPer1k;

  return {
    inputCost: roundToMicrocent(inputCost),
    outputCost: roundToMicrocent(outputCost),
    totalCost: roundToMicrocent(inputCost + outputCost),
    currency: 'USD',
  };
}

/**
 * Round to 6 decimal places (microcent precision)
 */
function roundToMicrocent(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

/**
 * Get model cost info
 */
export function getModelCost(modelId: string): ModelCost | null {
  return ALL_PRICING[modelId] ?? null;
}

/**
 * Check if model is supported
 */
export function isModelSupported(modelId: string): boolean {
  return modelId in ALL_PRICING;
}

/**
 * Get provider from model ID
 */
export function getProviderFromModel(modelId: string): 'groq' | 'anthropic' | 'unknown' {
  if (modelId in GROQ_PRICING) return 'groq';
  if (modelId in ANTHROPIC_PRICING) return 'anthropic';
  return 'unknown';
}

/**
 * Cost Tracker for a session
 */
export class CostTracker {
  private requests: Array<{
    modelId: string;
    usage: TokenUsage;
    cost: CostResult;
    timestamp: Date;
  }> = [];

  /**
   * Track a request
   */
  track(modelId: string, usage: TokenUsage): CostResult {
    const cost = calculateCost(modelId, usage);
    this.requests.push({
      modelId,
      usage,
      cost,
      timestamp: new Date(),
    });
    return cost;
  }

  /**
   * Get total cost
   */
  getTotalCost(): number {
    return roundToMicrocent(
      this.requests.reduce((sum, r) => sum + r.cost.totalCost, 0),
    );
  }

  /**
   * Get total tokens
   */
  getTotalTokens(): TokenUsage {
    return this.requests.reduce(
      (acc, r) => ({
        promptTokens: acc.promptTokens + r.usage.promptTokens,
        completionTokens: acc.completionTokens + r.usage.completionTokens,
        totalTokens: acc.totalTokens + r.usage.totalTokens,
      }),
      { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    );
  }

  /**
   * Get request count
   */
  getRequestCount(): number {
    return this.requests.length;
  }

  /**
   * Get all requests
   */
  getRequests(): typeof this.requests {
    return [...this.requests];
  }

  /**
   * Reset tracker
   */
  reset(): void {
    this.requests = [];
  }
}

/**
 * Create a cost tracker
 */
export function createCostTracker(): CostTracker {
  return new CostTracker();
}

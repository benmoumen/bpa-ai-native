import type {
  ConstraintConfig,
  ConstraintContext,
  ConstraintEngineOptions,
  ConstraintResult,
  ConstraintRule,
} from './types.js';
import { parseRules, getDefaultRulesContent } from './parser.js';

/**
 * Constraint Engine
 *
 * Evaluates YAML-based rules to determine whether tool execution
 * is allowed and what actions (confirmation, block, warn) are needed.
 */
export class ConstraintEngine {
  private config: ConstraintConfig;

  constructor(_options: ConstraintEngineOptions = {}) {
    // Options reserved for future hot-reload functionality
    // Load default rules initially
    this.config = parseRules(getDefaultRulesContent());
  }

  /**
   * Load rules from YAML content
   */
  loadRules(yamlContent: string): void {
    this.config = parseRules(yamlContent);
  }

  /**
   * Load rules from config object
   */
  loadConfig(config: ConstraintConfig): void {
    this.config = config;
  }

  /**
   * Get current configuration
   */
  getConfig(): ConstraintConfig {
    return this.config;
  }

  /**
   * Evaluate constraints for a tool execution
   */
  evaluate(ctx: ConstraintContext): ConstraintResult {
    const matchedRules: ConstraintRule[] = [];
    let blockingRule: ConstraintRule | undefined;
    let confirmationRule: ConstraintRule | undefined;
    let warnRule: ConstraintRule | undefined;
    let transformRule: ConstraintRule | undefined;

    // Get enabled rules sorted by priority
    const enabledRules = this.config.rules
      .filter((r) => r.enabled !== false)
      .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));

    for (const rule of enabledRules) {
      if (this.evaluateCondition(rule.condition, ctx)) {
        matchedRules.push(rule);

        // Apply rule based on action (higher priority rules take precedence)
        switch (rule.action) {
          case 'block':
            if (!blockingRule) {
              blockingRule = rule;
            }
            break;
          case 'require_confirmation':
            if (!confirmationRule) {
              confirmationRule = rule;
            }
            break;
          case 'warn':
            if (!warnRule) {
              warnRule = rule;
            }
            break;
          case 'transform':
            if (!transformRule) {
              transformRule = rule;
            }
            break;
        }
      }
    }

    // Block takes highest priority
    if (blockingRule) {
      return {
        allowed: false,
        action: 'block',
        rule: blockingRule,
        message: blockingRule.message,
        matchedRules,
      };
    }

    // Confirmation is next
    if (confirmationRule) {
      return {
        allowed: false, // Not allowed until confirmed
        action: 'require_confirmation',
        rule: confirmationRule,
        message: confirmationRule.message,
        matchedRules,
      };
    }

    // Transform modifies args
    if (transformRule) {
      const transformedArgs = this.applyTransform(transformRule, ctx);
      return {
        allowed: true,
        action: 'transform',
        rule: transformRule,
        message: transformRule.message,
        transformedArgs,
        matchedRules,
      };
    }

    // Warn allows but with message
    if (warnRule) {
      return {
        allowed: true,
        action: 'warn',
        rule: warnRule,
        message: warnRule.message,
        matchedRules,
      };
    }

    // No constraints matched
    return {
      allowed: true,
      matchedRules,
    };
  }

  /**
   * Evaluate a single condition against context
   *
   * Note: Function constructor is intentionally used here to evaluate
   * user-defined YAML conditions. Conditions are validated by parser.ts
   * before being passed here.
   */
  private evaluateCondition(condition: string, ctx: ConstraintContext): boolean {
    try {
      // Create evaluation function - intentional use of Function constructor
      // for YAML-based condition evaluation
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const evalFn = new Function(
        'tool',
        'context',
        'args',
        `return Boolean(${condition})`,
      ) as (
        tool: ConstraintContext['tool'],
        context: ConstraintContext['context'],
        args: ConstraintContext['args'],
      ) => boolean;

      return evalFn(ctx.tool, ctx.context, ctx.args);
    } catch (error) {
      // Log error but don't block - fail open
      console.warn(
        `[ConstraintEngine] Error evaluating condition "${condition}":`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return false;
    }
  }

  /**
   * Apply transformation to args
   *
   * Note: Function constructor is intentionally used here to evaluate
   * user-defined YAML transforms.
   */
  private applyTransform(
    rule: ConstraintRule,
    ctx: ConstraintContext,
  ): Record<string, unknown> {
    if (!rule.transform) {
      return ctx.args;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const transformFn = new Function(
        'tool',
        'context',
        'args',
        `return (${rule.transform})`,
      ) as (
        tool: ConstraintContext['tool'],
        context: ConstraintContext['context'],
        args: ConstraintContext['args'],
      ) => unknown;

      const result = transformFn(ctx.tool, ctx.context, ctx.args);
      if (typeof result === 'object' && result !== null) {
        return result as Record<string, unknown>;
      }
      return ctx.args;
    } catch (error) {
      console.warn(
        `[ConstraintEngine] Error applying transform "${rule.transform}":`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return ctx.args;
    }
  }

  /**
   * Check if confirmations are globally enabled
   */
  areConfirmationsEnabled(): boolean {
    return this.config.settings?.confirmationsEnabled !== false;
  }

  /**
   * Get maximum session cost setting
   */
  getMaxSessionCost(): number {
    return this.config.settings?.maxSessionCost ?? 1.0;
  }

  /**
   * Get all rules (for debugging/admin)
   */
  getRules(): ConstraintRule[] {
    return [...this.config.rules];
  }

  /**
   * Add a rule dynamically
   */
  addRule(rule: ConstraintRule): void {
    this.config.rules.push({
      ...rule,
      priority: rule.priority ?? 100,
      enabled: rule.enabled ?? true,
    });
  }

  /**
   * Remove a rule by name
   */
  removeRule(name: string): boolean {
    const index = this.config.rules.findIndex((r) => r.name === name);
    if (index !== -1) {
      this.config.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Enable/disable a rule by name
   */
  setRuleEnabled(name: string, enabled: boolean): boolean {
    const rule = this.config.rules.find((r) => r.name === name);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }
}

/**
 * Create a new constraint engine with optional custom rules
 */
export function createConstraintEngine(
  options?: ConstraintEngineOptions,
): ConstraintEngine {
  return new ConstraintEngine(options);
}

/**
 * Global engine instance
 */
let globalEngine: ConstraintEngine | null = null;

/**
 * Get or create global constraint engine
 */
export function getConstraintEngine(): ConstraintEngine {
  if (!globalEngine) {
    globalEngine = new ConstraintEngine();
  }
  return globalEngine;
}

/**
 * Initialize global engine with custom rules
 */
export function initializeConstraintEngine(yamlContent: string): ConstraintEngine {
  globalEngine = new ConstraintEngine();
  globalEngine.loadRules(yamlContent);
  return globalEngine;
}

/**
 * Clear global engine
 */
export function clearConstraintEngine(): void {
  globalEngine = null;
}

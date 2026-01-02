import { parse as parseYaml } from 'yaml';
import type { ConstraintConfig, ConstraintRule } from './types.js';

/**
 * Parse and validate YAML constraint rules
 */
export function parseRules(yamlContent: string): ConstraintConfig {
  const parsed = parseYaml(yamlContent) as unknown;

  if (!isValidConfig(parsed)) {
    throw new Error('Invalid constraint rules format');
  }

  // Normalize rules
  const normalizedRules = parsed.rules.map(normalizeRule);

  return {
    version: parsed.version,
    rules: normalizedRules,
    settings: parsed.settings,
  };
}

/**
 * Type guard for valid config
 */
function isValidConfig(value: unknown): value is ConstraintConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const config = value as Record<string, unknown>;

  if (typeof config.version !== 'string') {
    return false;
  }

  if (!Array.isArray(config.rules)) {
    return false;
  }

  // Validate each rule
  for (const rule of config.rules) {
    if (!isValidRule(rule)) {
      return false;
    }
  }

  return true;
}

/**
 * Type guard for valid rule
 */
function isValidRule(value: unknown): value is ConstraintRule {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const rule = value as Record<string, unknown>;

  if (typeof rule.name !== 'string' || rule.name.length === 0) {
    return false;
  }

  if (typeof rule.condition !== 'string' || rule.condition.length === 0) {
    return false;
  }

  const validActions = ['require_confirmation', 'block', 'warn', 'transform'];
  if (!validActions.includes(rule.action as string)) {
    return false;
  }

  if (typeof rule.message !== 'string' || rule.message.length === 0) {
    return false;
  }

  return true;
}

/**
 * Normalize rule with defaults
 */
function normalizeRule(rule: ConstraintRule): ConstraintRule {
  return {
    ...rule,
    priority: rule.priority ?? 100,
    enabled: rule.enabled ?? true,
  };
}

/**
 * Get default rules content
 */
export function getDefaultRulesContent(): string {
  return `
version: "1.0.0"

settings:
  maxSessionCost: 1.00
  confirmationsEnabled: true

rules:
  - name: confirm_delete
    condition: "tool.name.match(/delete|remove/i)"
    action: require_confirmation
    message: "This will permanently delete data. Are you sure?"
    priority: 10

  - name: cost_guard
    condition: "context.sessionCost >= 1.00"
    action: block
    message: "Session cost limit reached ($1.00). Please start a new session."
    priority: 1
`.trim();
}

/**
 * Validate a condition expression (basic safety check)
 */
export function validateCondition(condition: string): {
  valid: boolean;
  error?: string;
} {
  // Disallow dangerous patterns
  const dangerousPatterns = [
    /require\s*\(/,
    /import\s*\(/,
    /eval\s*\(/,
    /Function\s*\(/,
    /process\./,
    /global\./,
    /\bthis\b/,
    /__proto__/,
    /constructor\s*\[/,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(condition)) {
      return {
        valid: false,
        error: `Condition contains disallowed pattern: ${pattern.source}`,
      };
    }
  }

  // Try to parse as expression
  try {
    // Use a simple check - wrap in arrow function syntax check
    // This validates syntax before the condition is used at runtime
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function('tool', 'context', 'args', `return (${condition})`);
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: `Invalid condition syntax: ${e instanceof Error ? e.message : 'Unknown error'}`,
    };
  }
}

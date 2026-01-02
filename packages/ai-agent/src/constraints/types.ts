/**
 * Constraint Engine Types
 *
 * Implements Story 6-1b: Constraint Engine
 */

/**
 * Action to take when constraint is triggered
 */
export type ConstraintAction =
  | 'require_confirmation'
  | 'block'
  | 'warn'
  | 'transform';

/**
 * Individual constraint rule
 */
export interface ConstraintRule {
  /**
   * Unique rule name for identification
   */
  name: string;

  /**
   * JavaScript expression evaluated against context
   * Available variables: tool, context, args
   */
  condition: string;

  /**
   * Action to take when condition matches
   */
  action: ConstraintAction;

  /**
   * User-facing message explaining the constraint
   */
  message: string;

  /**
   * Optional priority (lower = higher priority)
   * Default: 100
   */
  priority?: number;

  /**
   * Whether rule is enabled
   * Default: true
   */
  enabled?: boolean;

  /**
   * Optional transformation function (for 'transform' action)
   * JavaScript expression that returns modified args
   */
  transform?: string;
}

/**
 * Full constraint rules configuration
 */
export interface ConstraintConfig {
  /**
   * Schema version for compatibility
   */
  version: string;

  /**
   * List of constraint rules
   */
  rules: ConstraintRule[];

  /**
   * Global settings
   */
  settings?: {
    /**
     * Maximum session cost before blocking
     */
    maxSessionCost?: number;

    /**
     * Enable/disable all confirmations globally
     */
    confirmationsEnabled?: boolean;
  };
}

/**
 * Context available during constraint evaluation
 */
export interface ConstraintContext {
  /**
   * Tool being executed
   */
  tool: {
    name: string;
    method: string;
    path: string;
    mutates: boolean;
    requiresConfirmation: boolean;
  };

  /**
   * Current session context
   */
  context: {
    sessionCost: number;
    serviceId?: string;
    userId?: string;
    isPublished?: boolean;
  };

  /**
   * Tool arguments
   */
  args: Record<string, unknown>;
}

/**
 * Result of constraint evaluation
 */
export interface ConstraintResult {
  /**
   * Whether execution is allowed
   */
  allowed: boolean;

  /**
   * Action to take (if any constraint matched)
   */
  action?: ConstraintAction;

  /**
   * Rule that triggered (if any)
   */
  rule?: ConstraintRule;

  /**
   * User-facing message
   */
  message?: string;

  /**
   * Transformed arguments (for 'transform' action)
   */
  transformedArgs?: Record<string, unknown>;

  /**
   * All matched rules (for logging)
   */
  matchedRules: ConstraintRule[];
}

/**
 * Constraint engine options
 */
export interface ConstraintEngineOptions {
  /**
   * Path to rules YAML file (for hot-reload)
   */
  rulesPath?: string;

  /**
   * Watch for file changes
   */
  watchForChanges?: boolean;

  /**
   * Custom rule loader function
   */
  ruleLoader?: () => Promise<ConstraintConfig>;
}

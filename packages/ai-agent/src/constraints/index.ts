/**
 * Constraint Engine
 *
 * Implements Story 6-1b: YAML-based constraint rules for AI agent actions
 */

export const CONSTRAINTS_VERSION = '0.0.1' as const;

// Types
export type {
  ConstraintAction,
  ConstraintRule,
  ConstraintConfig,
  ConstraintContext,
  ConstraintResult,
  ConstraintEngineOptions,
} from './types.js';

// Parser
export { parseRules, getDefaultRulesContent, validateCondition } from './parser.js';

// Engine
export {
  ConstraintEngine,
  createConstraintEngine,
  getConstraintEngine,
  initializeConstraintEngine,
  clearConstraintEngine,
} from './engine.js';

/**
 * Constraint Engine - YAML-based rule evaluation
 *
 * Implements Story 6-1b: Constraint Engine
 * Placeholder for now, will be implemented in 6-1b
 */

export const CONSTRAINTS_VERSION = '0.0.1' as const;

export type ConstraintAction = 'require_confirmation' | 'block' | 'warn' | 'transform';

export interface ConstraintRule {
  name: string;
  condition: string;
  action: ConstraintAction;
  message: string;
}

// Placeholder exports - will be implemented in Story 6-1b
export function evaluateConstraints(
  _toolName: string,
  _context: unknown,
): { action: ConstraintAction; message: string } | null {
  return null;
}

export function loadConstraintRules(_yamlPath: string): ConstraintRule[] {
  throw new Error('Not implemented - see Story 6-1b');
}

/**
 * Workflow Condition Types
 *
 * Type definitions for determinant-based conditions used in
 * workflow transitions. MVP scope supports single conditions only.
 * Story 4-5a: Determinants in Workflow Conditions
 */

import type { DeterminantType } from '@/lib/api/determinants';

/**
 * Comparison operators for conditions
 */
export type ConditionOperator =
  // String operators
  | 'equals'
  | 'notEquals'
  | 'contains'
  // Number operators (also includes equals/notEquals)
  | 'greaterThan'
  | 'lessThan'
  | 'greaterOrEqual'
  | 'lessOrEqual'
  // Date operators
  | 'before'
  | 'after';

/**
 * Single workflow condition (MVP scope)
 * Future: Will support condition groups with AND/OR logic
 */
export interface TransitionCondition {
  determinantId: string;
  determinantName?: string; // For display purposes
  operator: ConditionOperator;
  value: string | number | boolean;
}

/**
 * Operators available for each determinant type
 */
export const OPERATORS_BY_TYPE: Record<DeterminantType, ConditionOperator[]> = {
  STRING: ['equals', 'notEquals', 'contains'],
  NUMBER: ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterOrEqual', 'lessOrEqual'],
  BOOLEAN: ['equals', 'notEquals'],
  DATE: ['equals', 'before', 'after'],
};

/**
 * Human-readable labels for operators
 */
export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: 'equals',
  notEquals: 'does not equal',
  contains: 'contains',
  greaterThan: 'is greater than',
  lessThan: 'is less than',
  greaterOrEqual: 'is at least',
  lessOrEqual: 'is at most',
  before: 'is before',
  after: 'is after',
};

/**
 * Check if a value is a valid TransitionCondition
 */
export function isValidCondition(condition: unknown): condition is TransitionCondition {
  if (!condition || typeof condition !== 'object') return false;
  const c = condition as Record<string, unknown>;
  return (
    typeof c.determinantId === 'string' &&
    typeof c.operator === 'string' &&
    c.value !== undefined
  );
}

/**
 * Parse conditions from JSON (stored as Record<string, unknown>)
 */
export function parseCondition(json: Record<string, unknown> | null): TransitionCondition | null {
  if (!json) return null;
  if (isValidCondition(json)) {
    return json;
  }
  return null;
}

/**
 * Convert condition to display string
 */
export function formatConditionSummary(condition: TransitionCondition | null): string {
  if (!condition) return 'No conditions';
  const name = condition.determinantName || 'field';
  const op = OPERATOR_LABELS[condition.operator] || condition.operator;
  const val = String(condition.value);
  return `${name} ${op} "${val}"`;
}

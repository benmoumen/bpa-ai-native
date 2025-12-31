/**
 * Visibility Rule Evaluation Utility
 *
 * Evaluates visibility rules against current form values
 * to determine if a field or section should be visible.
 */

import type { VisibilityRule, VisibilityCondition } from '@/lib/api/forms';

export type FormValues = Record<string, string | number | boolean | undefined>;

/**
 * Evaluates a single visibility condition
 */
function evaluateCondition(
  condition: VisibilityCondition,
  values: FormValues
): boolean {
  const fieldValue = values[condition.fieldName];
  const targetValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return fieldValue === targetValue;

    case 'not_equals':
      return fieldValue !== targetValue;

    case 'contains':
      if (typeof fieldValue === 'string' && typeof targetValue === 'string') {
        return fieldValue.toLowerCase().includes(targetValue.toLowerCase());
      }
      return false;

    case 'not_contains':
      if (typeof fieldValue === 'string' && typeof targetValue === 'string') {
        return !fieldValue.toLowerCase().includes(targetValue.toLowerCase());
      }
      return true;

    case 'greater_than':
      if (typeof fieldValue === 'number' && typeof targetValue === 'number') {
        return fieldValue > targetValue;
      }
      return false;

    case 'less_than':
      if (typeof fieldValue === 'number' && typeof targetValue === 'number') {
        return fieldValue < targetValue;
      }
      return false;

    case 'greater_or_equal':
      if (typeof fieldValue === 'number' && typeof targetValue === 'number') {
        return fieldValue >= targetValue;
      }
      return false;

    case 'less_or_equal':
      if (typeof fieldValue === 'number' && typeof targetValue === 'number') {
        return fieldValue <= targetValue;
      }
      return false;

    case 'is_empty':
      return (
        fieldValue === undefined ||
        fieldValue === null ||
        fieldValue === '' ||
        (typeof fieldValue === 'string' && fieldValue.trim() === '')
      );

    case 'is_not_empty':
      return (
        fieldValue !== undefined &&
        fieldValue !== null &&
        fieldValue !== '' &&
        !(typeof fieldValue === 'string' && fieldValue.trim() === '')
      );

    default:
      return true;
  }
}

/**
 * Evaluates a complete visibility rule
 * Returns true if the element should be visible
 */
export function evaluateVisibilityRule(
  rule: VisibilityRule | null | undefined,
  values: FormValues
): boolean {
  // No rule or 'always' mode means always visible
  if (!rule || rule.mode === 'always') {
    return true;
  }

  // Conditional mode - evaluate conditions
  if (rule.mode === 'conditional' && rule.conditions && rule.conditions.length > 0) {
    const logic = rule.logic || 'AND';

    if (logic === 'AND') {
      // All conditions must be true
      return rule.conditions.every((condition) =>
        evaluateCondition(condition, values)
      );
    } else {
      // At least one condition must be true
      return rule.conditions.some((condition) =>
        evaluateCondition(condition, values)
      );
    }
  }

  // Default to visible
  return true;
}

/**
 * Tests for Visibility Rule Evaluation
 */

import { describe, it, expect } from 'vitest';
import { evaluateVisibilityRule, FormValues } from './evaluateVisibilityRule';
import type { VisibilityRule } from '@/lib/api/forms';

describe('evaluateVisibilityRule', () => {
  describe('basic visibility modes', () => {
    it('returns true when rule is null', () => {
      expect(evaluateVisibilityRule(null, {})).toBe(true);
    });

    it('returns true when rule is undefined', () => {
      expect(evaluateVisibilityRule(undefined, {})).toBe(true);
    });

    it('returns true when mode is "always"', () => {
      const rule: VisibilityRule = { mode: 'always', conditions: [], logic: 'AND' };
      expect(evaluateVisibilityRule(rule, {})).toBe(true);
    });

    it('returns true when mode is conditional but no conditions', () => {
      const rule: VisibilityRule = { mode: 'conditional', conditions: [], logic: 'AND' };
      expect(evaluateVisibilityRule(rule, {})).toBe(true);
    });
  });

  describe('equals operator', () => {
    it('returns true when field equals target value (string)', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'status', operator: 'equals', value: 'active' }],
        logic: 'AND',
      };
      const values: FormValues = { status: 'active' };
      expect(evaluateVisibilityRule(rule, values)).toBe(true);
    });

    it('returns false when field does not equal target value', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'status', operator: 'equals', value: 'active' }],
        logic: 'AND',
      };
      const values: FormValues = { status: 'inactive' };
      expect(evaluateVisibilityRule(rule, values)).toBe(false);
    });

    it('returns true when field equals target value (number)', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'count', operator: 'equals', value: 5 }],
        logic: 'AND',
      };
      const values: FormValues = { count: 5 };
      expect(evaluateVisibilityRule(rule, values)).toBe(true);
    });

    it('returns true when field equals target value (boolean)', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'enabled', operator: 'equals', value: true }],
        logic: 'AND',
      };
      const values: FormValues = { enabled: true };
      expect(evaluateVisibilityRule(rule, values)).toBe(true);
    });
  });

  describe('not_equals operator', () => {
    it('returns true when field does not equal target value', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'status', operator: 'not_equals', value: 'deleted' }],
        logic: 'AND',
      };
      const values: FormValues = { status: 'active' };
      expect(evaluateVisibilityRule(rule, values)).toBe(true);
    });

    it('returns false when field equals target value', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'status', operator: 'not_equals', value: 'active' }],
        logic: 'AND',
      };
      const values: FormValues = { status: 'active' };
      expect(evaluateVisibilityRule(rule, values)).toBe(false);
    });
  });

  describe('contains operator', () => {
    it('returns true when string contains target (case insensitive)', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'name', operator: 'contains', value: 'test' }],
        logic: 'AND',
      };
      const values: FormValues = { name: 'This is a TEST value' };
      expect(evaluateVisibilityRule(rule, values)).toBe(true);
    });

    it('returns false when string does not contain target', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'name', operator: 'contains', value: 'xyz' }],
        logic: 'AND',
      };
      const values: FormValues = { name: 'This is a test' };
      expect(evaluateVisibilityRule(rule, values)).toBe(false);
    });

    it('returns false when field is not a string', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'count', operator: 'contains', value: '5' }],
        logic: 'AND',
      };
      const values: FormValues = { count: 5 };
      expect(evaluateVisibilityRule(rule, values)).toBe(false);
    });
  });

  describe('not_contains operator', () => {
    it('returns true when string does not contain target', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'name', operator: 'not_contains', value: 'xyz' }],
        logic: 'AND',
      };
      const values: FormValues = { name: 'This is a test' };
      expect(evaluateVisibilityRule(rule, values)).toBe(true);
    });

    it('returns false when string contains target', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'name', operator: 'not_contains', value: 'test' }],
        logic: 'AND',
      };
      const values: FormValues = { name: 'This is a TEST' };
      expect(evaluateVisibilityRule(rule, values)).toBe(false);
    });
  });

  describe('numeric comparison operators', () => {
    it('greater_than returns true when value is greater', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'age', operator: 'greater_than', value: 18 }],
        logic: 'AND',
      };
      expect(evaluateVisibilityRule(rule, { age: 21 })).toBe(true);
      expect(evaluateVisibilityRule(rule, { age: 18 })).toBe(false);
      expect(evaluateVisibilityRule(rule, { age: 15 })).toBe(false);
    });

    it('less_than returns true when value is less', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'age', operator: 'less_than', value: 18 }],
        logic: 'AND',
      };
      expect(evaluateVisibilityRule(rule, { age: 15 })).toBe(true);
      expect(evaluateVisibilityRule(rule, { age: 18 })).toBe(false);
      expect(evaluateVisibilityRule(rule, { age: 21 })).toBe(false);
    });

    it('greater_or_equal returns true when value is greater or equal', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'age', operator: 'greater_or_equal', value: 18 }],
        logic: 'AND',
      };
      expect(evaluateVisibilityRule(rule, { age: 21 })).toBe(true);
      expect(evaluateVisibilityRule(rule, { age: 18 })).toBe(true);
      expect(evaluateVisibilityRule(rule, { age: 15 })).toBe(false);
    });

    it('less_or_equal returns true when value is less or equal', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'age', operator: 'less_or_equal', value: 18 }],
        logic: 'AND',
      };
      expect(evaluateVisibilityRule(rule, { age: 15 })).toBe(true);
      expect(evaluateVisibilityRule(rule, { age: 18 })).toBe(true);
      expect(evaluateVisibilityRule(rule, { age: 21 })).toBe(false);
    });

    it('returns false for numeric operators with non-numeric values', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'age', operator: 'greater_than', value: 18 }],
        logic: 'AND',
      };
      expect(evaluateVisibilityRule(rule, { age: 'twenty' })).toBe(false);
    });
  });

  describe('is_empty operator', () => {
    it('returns true when field is undefined', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'name', operator: 'is_empty', value: '' }],
        logic: 'AND',
      };
      expect(evaluateVisibilityRule(rule, {})).toBe(true);
    });

    it('returns true when field is empty string', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'name', operator: 'is_empty', value: '' }],
        logic: 'AND',
      };
      expect(evaluateVisibilityRule(rule, { name: '' })).toBe(true);
    });

    it('returns true when field is whitespace only', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'name', operator: 'is_empty', value: '' }],
        logic: 'AND',
      };
      expect(evaluateVisibilityRule(rule, { name: '   ' })).toBe(true);
    });

    it('returns false when field has value', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'name', operator: 'is_empty', value: '' }],
        logic: 'AND',
      };
      expect(evaluateVisibilityRule(rule, { name: 'test' })).toBe(false);
    });
  });

  describe('is_not_empty operator', () => {
    it('returns false when field is undefined', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'name', operator: 'is_not_empty', value: '' }],
        logic: 'AND',
      };
      expect(evaluateVisibilityRule(rule, {})).toBe(false);
    });

    it('returns true when field has value', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [{ fieldName: 'name', operator: 'is_not_empty', value: '' }],
        logic: 'AND',
      };
      expect(evaluateVisibilityRule(rule, { name: 'test' })).toBe(true);
    });
  });

  describe('AND logic', () => {
    it('returns true when all conditions are met', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [
          { fieldName: 'status', operator: 'equals', value: 'active' },
          { fieldName: 'age', operator: 'greater_than', value: 18 },
        ],
        logic: 'AND',
      };
      const values: FormValues = { status: 'active', age: 25 };
      expect(evaluateVisibilityRule(rule, values)).toBe(true);
    });

    it('returns false when any condition is not met', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [
          { fieldName: 'status', operator: 'equals', value: 'active' },
          { fieldName: 'age', operator: 'greater_than', value: 18 },
        ],
        logic: 'AND',
      };
      const values: FormValues = { status: 'active', age: 15 };
      expect(evaluateVisibilityRule(rule, values)).toBe(false);
    });
  });

  describe('OR logic', () => {
    it('returns true when at least one condition is met', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [
          { fieldName: 'status', operator: 'equals', value: 'active' },
          { fieldName: 'status', operator: 'equals', value: 'pending' },
        ],
        logic: 'OR',
      };
      expect(evaluateVisibilityRule(rule, { status: 'pending' })).toBe(true);
    });

    it('returns false when no conditions are met', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [
          { fieldName: 'status', operator: 'equals', value: 'active' },
          { fieldName: 'status', operator: 'equals', value: 'pending' },
        ],
        logic: 'OR',
      };
      expect(evaluateVisibilityRule(rule, { status: 'deleted' })).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles unknown operator gracefully', () => {
      const rule: VisibilityRule = {
        mode: 'conditional',
        conditions: [
          { fieldName: 'status', operator: 'unknown_op' as never, value: 'active' },
        ],
        logic: 'AND',
      };
      expect(evaluateVisibilityRule(rule, { status: 'active' })).toBe(true);
    });

    it('defaults to AND logic when logic is not specified', () => {
      const rule = {
        mode: 'conditional' as const,
        conditions: [
          { fieldName: 'a', operator: 'equals' as const, value: '1' },
          { fieldName: 'b', operator: 'equals' as const, value: '2' },
        ],
      };
      expect(evaluateVisibilityRule(rule as VisibilityRule, { a: '1', b: '2' })).toBe(true);
      expect(evaluateVisibilityRule(rule as VisibilityRule, { a: '1', b: '3' })).toBe(false);
    });
  });
});

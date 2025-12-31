/**
 * Tests for Field Validation
 */

import { describe, it, expect } from 'vitest';
import { validateField, ValidationResult } from './validateField';
import type { FormField } from '@/lib/api/forms';

// Helper to create a minimal FormField
function createField(overrides: Partial<FormField> = {}): FormField {
  return {
    id: 'test-field',
    formId: 'test-form',
    sectionId: null,
    type: 'TEXT',
    label: 'Test Field',
    name: 'testField',
    required: false,
    properties: {},
    visibilityRule: null,
    sortOrder: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('validateField', () => {
  describe('required field validation', () => {
    it('returns error for required field with undefined value', () => {
      const field = createField({ required: true });
      const result = validateField(field, undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This field is required');
    });

    it('returns error for required field with empty string', () => {
      const field = createField({ required: true });
      const result = validateField(field, '');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This field is required');
    });

    it('returns error for required field with whitespace only', () => {
      const field = createField({ required: true });
      const result = validateField(field, '   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This field is required');
    });

    it('returns valid for required field with value', () => {
      const field = createField({ required: true });
      const result = validateField(field, 'some value');
      expect(result.isValid).toBe(true);
    });

    it('returns valid for optional field with no value', () => {
      const field = createField({ required: false });
      const result = validateField(field, undefined);
      expect(result.isValid).toBe(true);
    });
  });

  describe('TEXT field validation', () => {
    it('validates minLength constraint', () => {
      const field = createField({
        type: 'TEXT',
        properties: { minLength: 5 },
      });
      expect(validateField(field, 'abc').isValid).toBe(false);
      expect(validateField(field, 'abc').error).toBe('Minimum 5 characters required');
      expect(validateField(field, 'abcde').isValid).toBe(true);
    });

    it('validates maxLength constraint', () => {
      const field = createField({
        type: 'TEXT',
        properties: { maxLength: 10 },
      });
      expect(validateField(field, 'short').isValid).toBe(true);
      expect(validateField(field, 'this is too long').isValid).toBe(false);
      expect(validateField(field, 'this is too long').error).toBe('Maximum 10 characters allowed');
    });

    it('skips validation for empty optional field', () => {
      const field = createField({
        type: 'TEXT',
        properties: { minLength: 5 },
        required: false,
      });
      expect(validateField(field, '').isValid).toBe(true);
    });
  });

  describe('TEXTAREA field validation', () => {
    it('validates same as TEXT', () => {
      const field = createField({
        type: 'TEXTAREA',
        properties: { minLength: 10 },
      });
      expect(validateField(field, 'short').isValid).toBe(false);
      expect(validateField(field, 'this is long enough').isValid).toBe(true);
    });
  });

  describe('EMAIL field validation', () => {
    it('returns valid for proper email format', () => {
      const field = createField({ type: 'EMAIL' });
      expect(validateField(field, 'user@example.com').isValid).toBe(true);
      expect(validateField(field, 'test.user+tag@sub.domain.org').isValid).toBe(true);
    });

    it('returns error for invalid email format', () => {
      const field = createField({ type: 'EMAIL' });
      expect(validateField(field, 'not-an-email').isValid).toBe(false);
      expect(validateField(field, 'not-an-email').error).toBe('Please enter a valid email address');
      expect(validateField(field, 'missing@domain').isValid).toBe(false);
      expect(validateField(field, '@nodomain.com').isValid).toBe(false);
    });
  });

  describe('PHONE field validation', () => {
    it('returns valid for proper phone formats', () => {
      const field = createField({ type: 'PHONE' });
      expect(validateField(field, '1234567890').isValid).toBe(true);
      expect(validateField(field, '+1 (555) 123-4567').isValid).toBe(true);
      expect(validateField(field, '555-123-4567').isValid).toBe(true);
    });

    it('returns error for invalid phone format', () => {
      const field = createField({ type: 'PHONE' });
      expect(validateField(field, '123').isValid).toBe(false);
      expect(validateField(field, '123').error).toBe('Please enter a valid phone number');
      expect(validateField(field, 'not-a-phone').isValid).toBe(false);
    });
  });

  describe('NUMBER field validation', () => {
    it('validates numeric values', () => {
      const field = createField({ type: 'NUMBER' });
      expect(validateField(field, 42).isValid).toBe(true);
      expect(validateField(field, '42').isValid).toBe(true);
      expect(validateField(field, 3.14).isValid).toBe(true);
    });

    it('returns error for non-numeric strings', () => {
      const field = createField({ type: 'NUMBER' });
      expect(validateField(field, 'not a number').isValid).toBe(false);
      expect(validateField(field, 'not a number').error).toBe('Please enter a valid number');
    });

    it('validates min constraint', () => {
      const field = createField({
        type: 'NUMBER',
        properties: { min: 10 },
      });
      expect(validateField(field, 5).isValid).toBe(false);
      expect(validateField(field, 5).error).toBe('Minimum value is 10');
      expect(validateField(field, 10).isValid).toBe(true);
      expect(validateField(field, 15).isValid).toBe(true);
    });

    it('validates max constraint', () => {
      const field = createField({
        type: 'NUMBER',
        properties: { max: 100 },
      });
      expect(validateField(field, 50).isValid).toBe(true);
      expect(validateField(field, 100).isValid).toBe(true);
      expect(validateField(field, 150).isValid).toBe(false);
      expect(validateField(field, 150).error).toBe('Maximum value is 100');
    });
  });

  describe('DATE field validation', () => {
    it('validates proper date strings', () => {
      const field = createField({ type: 'DATE' });
      expect(validateField(field, '2024-01-15').isValid).toBe(true);
      expect(validateField(field, '2024-12-31').isValid).toBe(true);
    });

    it('returns error for invalid date strings', () => {
      const field = createField({ type: 'DATE' });
      expect(validateField(field, 'not-a-date').isValid).toBe(false);
      expect(validateField(field, 'not-a-date').error).toBe('Please enter a valid date');
    });

    it('validates minDate constraint', () => {
      const field = createField({
        type: 'DATE',
        properties: { minDate: '2024-01-01' },
      });
      expect(validateField(field, '2023-12-31').isValid).toBe(false);
      expect(validateField(field, '2023-12-31').error).toBe('Date must be on or after 2024-01-01');
      expect(validateField(field, '2024-01-01').isValid).toBe(true);
      expect(validateField(field, '2024-06-15').isValid).toBe(true);
    });

    it('validates maxDate constraint', () => {
      const field = createField({
        type: 'DATE',
        properties: { maxDate: '2024-12-31' },
      });
      expect(validateField(field, '2024-06-15').isValid).toBe(true);
      expect(validateField(field, '2024-12-31').isValid).toBe(true);
      expect(validateField(field, '2025-01-01').isValid).toBe(false);
      expect(validateField(field, '2025-01-01').error).toBe('Date must be on or before 2024-12-31');
    });
  });

  describe('SELECT/RADIO field validation', () => {
    it('returns valid for value in options list', () => {
      const field = createField({
        type: 'SELECT',
        properties: {
          options: [
            { value: 'a', label: 'Option A' },
            { value: 'b', label: 'Option B' },
          ],
        },
      });
      expect(validateField(field, 'a').isValid).toBe(true);
      expect(validateField(field, 'b').isValid).toBe(true);
    });

    it('returns error for value not in options list', () => {
      const field = createField({
        type: 'SELECT',
        properties: {
          options: [
            { value: 'a', label: 'Option A' },
            { value: 'b', label: 'Option B' },
          ],
        },
      });
      expect(validateField(field, 'c').isValid).toBe(false);
      expect(validateField(field, 'c').error).toBe('Please select a valid option');
    });

    it('works same for RADIO type', () => {
      const field = createField({
        type: 'RADIO',
        properties: {
          options: [{ value: 'yes', label: 'Yes' }],
        },
      });
      expect(validateField(field, 'yes').isValid).toBe(true);
      expect(validateField(field, 'no').isValid).toBe(false);
    });
  });

  describe('CHECKBOX field validation', () => {
    it('returns valid for boolean values', () => {
      const field = createField({ type: 'CHECKBOX' });
      expect(validateField(field, true).isValid).toBe(true);
      expect(validateField(field, false).isValid).toBe(true);
    });

    it('returns error for non-boolean values', () => {
      const field = createField({ type: 'CHECKBOX' });
      expect(validateField(field, 'true').isValid).toBe(false);
      expect(validateField(field, 'true').error).toBe('Invalid checkbox value');
    });
  });

  describe('FILE field validation', () => {
    it('passes validation (placeholder implementation)', () => {
      const field = createField({ type: 'FILE' });
      expect(validateField(field, 'file.pdf').isValid).toBe(true);
    });
  });

  describe('unknown field type', () => {
    it('returns valid for unknown types', () => {
      const field = createField({ type: 'UNKNOWN_TYPE' });
      expect(validateField(field, 'any value').isValid).toBe(true);
    });
  });
});

/**
 * Field Validation Utility
 *
 * Validates form field values based on field configuration
 */

import type { FormField } from '@/lib/api/forms';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a field value against its configuration
 */
export function validateField(
  field: FormField,
  value: string | number | boolean | undefined
): ValidationResult {
  const properties = field.properties || {};

  // Required field validation
  if (field.required) {
    if (value === undefined || value === '') {
      return { isValid: false, error: 'This field is required' };
    }
    if (typeof value === 'string' && value.trim() === '') {
      return { isValid: false, error: 'This field is required' };
    }
  }

  // Skip further validation if empty and not required
  if (value === undefined || value === '') {
    return { isValid: true };
  }

  // Type-specific validation
  switch (field.type.toUpperCase()) {
    case 'TEXT':
    case 'TEXTAREA': {
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Invalid text value' };
      }
      const minLength = properties.minLength as number | undefined;
      const maxLength = properties.maxLength as number | undefined;
      if (minLength && value.length < minLength) {
        return { isValid: false, error: `Minimum ${minLength} characters required` };
      }
      if (maxLength && value.length > maxLength) {
        return { isValid: false, error: `Maximum ${maxLength} characters allowed` };
      }
      break;
    }

    case 'EMAIL': {
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Invalid email value' };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return { isValid: false, error: 'Please enter a valid email address' };
      }
      break;
    }

    case 'PHONE': {
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Invalid phone value' };
      }
      // Basic phone validation - allows digits, spaces, dashes, parentheses, plus
      const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;
      if (!phoneRegex.test(value)) {
        return { isValid: false, error: 'Please enter a valid phone number' };
      }
      break;
    }

    case 'NUMBER': {
      const numValue = typeof value === 'number' ? value : parseFloat(String(value));
      if (isNaN(numValue)) {
        return { isValid: false, error: 'Please enter a valid number' };
      }
      const min = properties.min as number | undefined;
      const max = properties.max as number | undefined;
      if (min !== undefined && numValue < min) {
        return { isValid: false, error: `Minimum value is ${min}` };
      }
      if (max !== undefined && numValue > max) {
        return { isValid: false, error: `Maximum value is ${max}` };
      }
      break;
    }

    case 'DATE': {
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Invalid date value' };
      }
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return { isValid: false, error: 'Please enter a valid date' };
      }
      const minDate = properties.minDate as string | undefined;
      const maxDate = properties.maxDate as string | undefined;
      if (minDate && new Date(value) < new Date(minDate)) {
        return { isValid: false, error: `Date must be on or after ${minDate}` };
      }
      if (maxDate && new Date(value) > new Date(maxDate)) {
        return { isValid: false, error: `Date must be on or before ${maxDate}` };
      }
      break;
    }

    case 'SELECT':
    case 'RADIO': {
      const options = properties.options as { value: string }[] | undefined;
      if (options && typeof value === 'string') {
        const validValues = options.map((o) => o.value);
        if (!validValues.includes(value)) {
          return { isValid: false, error: 'Please select a valid option' };
        }
      }
      break;
    }

    case 'CHECKBOX': {
      // Checkbox is valid as long as it's a boolean
      if (typeof value !== 'boolean') {
        return { isValid: false, error: 'Invalid checkbox value' };
      }
      break;
    }

    case 'FILE': {
      // File validation would be handled differently in real implementation
      break;
    }
  }

  return { isValid: true };
}

/**
 * Gap Rules Tests
 *
 * Story 6-6: Gap Detection (Task 2)
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FIELD_RULES,
  BUSINESS_REGISTRATION_RULES,
  DEFAULT_VALIDATION_RULES,
  getRulesForServiceType,
  mergeRules,
  YamlRuleSchema,
} from './rules.js';
import type { ServiceConfig } from './types.js';

describe('DEFAULT_FIELD_RULES', () => {
  it('includes applicant_name rule', () => {
    const rule = DEFAULT_FIELD_RULES.find((r) => r.name === 'applicant_name');
    expect(rule).toBeDefined();
    expect(rule?.severity).toBe('critical');
  });

  it('includes contact_email rule', () => {
    const rule = DEFAULT_FIELD_RULES.find((r) => r.name === 'contact_email');
    expect(rule).toBeDefined();
    expect(rule?.severity).toBe('warning');
  });

  it('includes contact_phone rule', () => {
    const rule = DEFAULT_FIELD_RULES.find((r) => r.name === 'contact_phone');
    expect(rule).toBeDefined();
    expect(rule?.severity).toBe('suggestion');
  });

  it('applicant_name check returns true when name field exists', () => {
    const config: ServiceConfig = {
      id: 'svc-1',
      name: 'Test',
      forms: [
        {
          id: 'f1',
          name: 'Form',
          sections: [],
          fields: [{ id: 'f1', name: 'Full Name', type: 'text' }],
        },
      ],
    };

    const rule = DEFAULT_FIELD_RULES.find((r) => r.name === 'applicant_name');
    expect(rule).toBeDefined();
    expect(rule?.check(config)).toBe(true);
  });

  it('applicant_name check returns false when no name field', () => {
    const config: ServiceConfig = {
      id: 'svc-1',
      name: 'Test',
      forms: [
        {
          id: 'f1',
          name: 'Form',
          sections: [],
          fields: [{ id: 'f1', name: 'Description', type: 'text' }],
        },
      ],
    };

    const rule = DEFAULT_FIELD_RULES.find((r) => r.name === 'applicant_name');
    expect(rule).toBeDefined();
    expect(rule?.check(config)).toBe(false);
  });

  it('contact_email check returns true for email type field', () => {
    const config: ServiceConfig = {
      id: 'svc-1',
      name: 'Test',
      forms: [
        {
          id: 'f1',
          name: 'Form',
          sections: [],
          fields: [{ id: 'f1', name: 'Contact', type: 'email' }],
        },
      ],
    };

    const rule = DEFAULT_FIELD_RULES.find((r) => r.name === 'contact_email');
    expect(rule).toBeDefined();
    expect(rule?.check(config)).toBe(true);
  });

  it('all rules have fix suggestions', () => {
    for (const rule of DEFAULT_FIELD_RULES) {
      expect(rule.fix).toBeDefined();
      expect(rule.fix?.action).toBe('add_field');
    }
  });
});

describe('BUSINESS_REGISTRATION_RULES', () => {
  it('includes business_name rule', () => {
    const rule = BUSINESS_REGISTRATION_RULES.find((r) => r.name === 'business_name');
    expect(rule).toBeDefined();
    expect(rule?.severity).toBe('critical');
  });

  it('includes registration_number rule', () => {
    const rule = BUSINESS_REGISTRATION_RULES.find((r) => r.name === 'registration_number');
    expect(rule).toBeDefined();
    expect(rule?.severity).toBe('warning');
  });

  it('includes business_address rule', () => {
    const rule = BUSINESS_REGISTRATION_RULES.find((r) => r.name === 'business_address');
    expect(rule).toBeDefined();
  });

  it('business_name check returns true when company field exists', () => {
    const config: ServiceConfig = {
      id: 'svc-1',
      name: 'Test',
      forms: [
        {
          id: 'f1',
          name: 'Form',
          sections: [],
          fields: [{ id: 'f1', name: 'Company Name', type: 'text' }],
        },
      ],
    };

    const rule = BUSINESS_REGISTRATION_RULES.find((r) => r.name === 'business_name');
    expect(rule).toBeDefined();
    expect(rule?.check(config)).toBe(true);
  });
});

describe('DEFAULT_VALIDATION_RULES', () => {
  it('includes email_format rule', () => {
    const rule = DEFAULT_VALIDATION_RULES.find((r) => r.name === 'email_format');
    expect(rule).toBeDefined();
    expect(rule?.fieldTypes).toContain('email');
    expect(rule?.severity).toBe('warning');
  });

  it('includes phone_format rule', () => {
    const rule = DEFAULT_VALIDATION_RULES.find((r) => r.name === 'phone_format');
    expect(rule).toBeDefined();
    expect(rule?.fieldTypes).toContain('tel');
    expect(rule?.severity).toBe('suggestion');
  });

  it('includes text_length rule', () => {
    const rule = DEFAULT_VALIDATION_RULES.find((r) => r.name === 'text_length');
    expect(rule).toBeDefined();
    expect(rule?.fieldTypes).toContain('text');
    expect(rule?.fieldTypes).toContain('textarea');
  });

  it('includes number_range rule', () => {
    const rule = DEFAULT_VALIDATION_RULES.find((r) => r.name === 'number_range');
    expect(rule).toBeDefined();
    expect(rule?.fieldTypes).toContain('number');
  });
});

describe('getRulesForServiceType', () => {
  it('returns default rules for general service type', () => {
    const rules = getRulesForServiceType('general');
    expect(rules).toEqual(DEFAULT_FIELD_RULES);
  });

  it('includes business rules for business_registration type', () => {
    const rules = getRulesForServiceType('business_registration');
    expect(rules.length).toBeGreaterThan(DEFAULT_FIELD_RULES.length);
    expect(rules.some((r) => r.name === 'business_name')).toBe(true);
  });

  it('includes business rules for business type (alias)', () => {
    const rules = getRulesForServiceType('business');
    expect(rules.some((r) => r.name === 'business_name')).toBe(true);
  });

  it('is case-insensitive', () => {
    const rules = getRulesForServiceType('BUSINESS_REGISTRATION');
    expect(rules.some((r) => r.name === 'business_name')).toBe(true);
  });
});

describe('mergeRules', () => {
  it('combines multiple rule sets', () => {
    const merged = mergeRules(DEFAULT_FIELD_RULES, BUSINESS_REGISTRATION_RULES);
    expect(merged.length).toBe(DEFAULT_FIELD_RULES.length + BUSINESS_REGISTRATION_RULES.length);
  });

  it('deduplicates rules by name', () => {
    const duplicateRules = [
      { ...DEFAULT_FIELD_RULES[0] },
      { ...DEFAULT_FIELD_RULES[0] },
    ];
    const merged = mergeRules(duplicateRules);
    expect(merged.length).toBe(1);
  });

  it('keeps first occurrence when duplicates exist', () => {
    const rule1 = { ...DEFAULT_FIELD_RULES[0], description: 'First' };
    const rule2 = { ...DEFAULT_FIELD_RULES[0], description: 'Second' };
    const merged = mergeRules([rule1], [rule2]);
    expect(merged[0].description).toBe('First');
  });

  it('handles empty rule sets', () => {
    const merged = mergeRules([], DEFAULT_FIELD_RULES);
    expect(merged).toEqual(DEFAULT_FIELD_RULES);
  });
});

describe('YamlRuleSchema', () => {
  it('validates a valid rule', () => {
    const rule = {
      name: 'test_rule',
      description: 'Test description',
      severity: 'warning',
    };

    const result = YamlRuleSchema.safeParse(rule);
    expect(result.success).toBe(true);
  });

  it('validates rule with fix', () => {
    const rule = {
      name: 'test_rule',
      description: 'Test description',
      severity: 'critical',
      fix: {
        action: 'add_field',
        fieldName: 'Test Field',
        fieldType: 'text',
      },
    };

    const result = YamlRuleSchema.safeParse(rule);
    expect(result.success).toBe(true);
  });

  it('rejects invalid severity', () => {
    const rule = {
      name: 'test_rule',
      description: 'Test description',
      severity: 'invalid',
    };

    const result = YamlRuleSchema.safeParse(rule);
    expect(result.success).toBe(false);
  });

  it('requires name and description', () => {
    const rule = {
      severity: 'warning',
    };

    const result = YamlRuleSchema.safeParse(rule);
    expect(result.success).toBe(false);
  });
});

/**
 * Gap Detection Rules
 *
 * Story 6-6: Gap Detection (Task 2)
 *
 * Defines detection rules for identifying configuration gaps.
 * Rules are organized by category and can be extended.
 */

import { z } from 'zod';
import type {
  GapSeverity,
  FieldGapRule,
  ValidationGapRule,
  ServiceConfig,
} from './types.js';

/**
 * Schema for YAML rule definition
 */
export const YamlRuleSchema = z.object({
  name: z.string(),
  description: z.string(),
  severity: z.enum(['critical', 'warning', 'suggestion']),
  check: z.string().optional(),
  fieldTypes: z.array(z.string()).optional(),
  requiredValidation: z.record(z.unknown()).optional(),
  fix: z
    .object({
      action: z.string(),
      fieldName: z.string().optional(),
      fieldType: z.string().optional(),
      validation: z.record(z.unknown()).optional(),
    })
    .optional(),
});

export type YamlRule = z.infer<typeof YamlRuleSchema>;

/**
 * Schema for YAML rules configuration
 */
export const YamlRulesConfigSchema = z.object({
  rules: z.object({
    missing_fields: z.array(YamlRuleSchema).optional(),
    workflow_gaps: z.array(YamlRuleSchema).optional(),
    validation_gaps: z.array(YamlRuleSchema).optional(),
  }),
});

export type YamlRulesConfig = z.infer<typeof YamlRulesConfigSchema>;

/**
 * Default field gap rules
 */
export const DEFAULT_FIELD_RULES: FieldGapRule[] = [
  {
    name: 'applicant_name',
    description: 'All services should collect applicant name',
    severity: 'critical',
    check: (config: ServiceConfig) => {
      const fields = getAllFields(config);
      return fields.some(
        (f) =>
          f.name.toLowerCase().includes('name') ||
          f.name.toLowerCase().includes('applicant')
      );
    },
    fix: {
      action: 'add_field',
      params: {
        fieldName: 'Applicant Full Name',
        fieldType: 'text',
        validation: { required: true, minLength: 2 },
      },
      description: 'Add "Applicant Full Name" field',
    },
  },
  {
    name: 'contact_email',
    description: 'Services should have contact email for notifications',
    severity: 'warning',
    check: (config: ServiceConfig) => {
      const fields = getAllFields(config);
      return fields.some(
        (f) =>
          f.type === 'email' ||
          f.name.toLowerCase().includes('email') ||
          f.name.toLowerCase().includes('e-mail')
      );
    },
    fix: {
      action: 'add_field',
      params: {
        fieldName: 'Email Address',
        fieldType: 'email',
        validation: { required: true },
      },
      description: 'Add "Email Address" field',
    },
  },
  {
    name: 'contact_phone',
    description: 'Services should have a phone number for contact',
    severity: 'suggestion',
    check: (config: ServiceConfig) => {
      const fields = getAllFields(config);
      return fields.some(
        (f) =>
          f.type === 'tel' ||
          f.name.toLowerCase().includes('phone') ||
          f.name.toLowerCase().includes('mobile') ||
          f.name.toLowerCase().includes('telephone')
      );
    },
    fix: {
      action: 'add_field',
      params: {
        fieldName: 'Phone Number',
        fieldType: 'tel',
        validation: { required: false },
      },
      description: 'Add "Phone Number" field',
    },
  },
];

/**
 * Business registration specific rules
 */
export const BUSINESS_REGISTRATION_RULES: FieldGapRule[] = [
  {
    name: 'business_name',
    description: 'Business registration requires company/business name',
    severity: 'critical',
    check: (config: ServiceConfig) => {
      const fields = getAllFields(config);
      return fields.some(
        (f) =>
          f.name.toLowerCase().includes('business') ||
          f.name.toLowerCase().includes('company') ||
          f.name.toLowerCase().includes('organization') ||
          f.name.toLowerCase().includes('entity')
      );
    },
    fix: {
      action: 'add_field',
      params: {
        fieldName: 'Business Name',
        fieldType: 'text',
        validation: { required: true, minLength: 2 },
      },
      description: 'Add "Business Name" field',
    },
  },
  {
    name: 'registration_number',
    description: 'Business registration should collect registration/tax number',
    severity: 'warning',
    check: (config: ServiceConfig) => {
      const fields = getAllFields(config);
      return fields.some(
        (f) =>
          f.name.toLowerCase().includes('registration') ||
          f.name.toLowerCase().includes('tax') ||
          f.name.toLowerCase().includes('tin') ||
          f.name.toLowerCase().includes('ein')
      );
    },
    fix: {
      action: 'add_field',
      params: {
        fieldName: 'Tax Identification Number',
        fieldType: 'text',
        validation: { required: true },
      },
      description: 'Add "Tax Identification Number" field',
    },
  },
  {
    name: 'business_address',
    description: 'Business registration should collect business address',
    severity: 'warning',
    check: (config: ServiceConfig) => {
      const fields = getAllFields(config);
      return fields.some(
        (f) =>
          f.name.toLowerCase().includes('address') ||
          f.name.toLowerCase().includes('location')
      );
    },
    fix: {
      action: 'add_field',
      params: {
        fieldName: 'Business Address',
        fieldType: 'textarea',
        validation: { required: true },
      },
      description: 'Add "Business Address" field',
    },
  },
];

/**
 * Default validation gap rules
 */
export const DEFAULT_VALIDATION_RULES: ValidationGapRule[] = [
  {
    name: 'email_format',
    description: 'Email fields should have email format validation',
    severity: 'warning',
    fieldTypes: ['email'],
    requiredValidation: { pattern: 'email' },
  },
  {
    name: 'phone_format',
    description: 'Phone fields should have pattern validation',
    severity: 'suggestion',
    fieldTypes: ['tel'],
    requiredValidation: { pattern: 'phone' },
  },
  {
    name: 'text_length',
    description: 'Text fields should have length constraints',
    severity: 'suggestion',
    fieldTypes: ['text', 'textarea'],
    requiredValidation: { minLength: 1, maxLength: 1000 },
  },
  {
    name: 'number_range',
    description: 'Number fields should have range constraints',
    severity: 'suggestion',
    fieldTypes: ['number'],
    requiredValidation: { min: 0 },
  },
];

/**
 * Get rules for a specific service type
 */
export function getRulesForServiceType(serviceType: string): FieldGapRule[] {
  const rules = [...DEFAULT_FIELD_RULES];

  switch (serviceType.toLowerCase()) {
    case 'business_registration':
    case 'business':
    case 'company':
      rules.push(...BUSINESS_REGISTRATION_RULES);
      break;
    // Add more service types as needed
  }

  return rules;
}

/**
 * Get all fields from a service config
 */
function getAllFields(config: ServiceConfig): Array<{ name: string; type: string }> {
  const fields: Array<{ name: string; type: string }> = [];

  for (const form of config.forms) {
    for (const field of form.fields) {
      fields.push({ name: field.name, type: field.type });
    }
    for (const section of form.sections) {
      for (const field of section.fields) {
        fields.push({ name: field.name, type: field.type });
      }
    }
  }

  return fields;
}

/**
 * Parse YAML rules configuration
 */
export function parseRulesConfig(yamlContent: string): YamlRulesConfig {
  // This would use a YAML parser in production
  // For now, we expect JSON format
  const parsed: unknown = JSON.parse(yamlContent);
  return YamlRulesConfigSchema.parse(parsed);
}

/**
 * Convert YAML rules to FieldGapRules
 */
export function convertYamlRulesToFieldRules(yamlRules: YamlRule[]): FieldGapRule[] {
  return yamlRules.map((rule) => ({
    name: rule.name,
    description: rule.description,
    severity: rule.severity as GapSeverity,
    check: () => false, // YAML rules would need runtime evaluation
    fix: rule.fix
      ? {
          action: rule.fix.action as 'add_field',
          params: {
            fieldName: rule.fix.fieldName,
            fieldType: rule.fix.fieldType,
            validation: rule.fix.validation,
          },
          description: `Add "${rule.fix.fieldName ?? 'field'}" field`,
        }
      : undefined,
  }));
}

/**
 * Merge multiple rule sets
 */
export function mergeRules(...ruleSets: FieldGapRule[][]): FieldGapRule[] {
  const merged: FieldGapRule[] = [];
  const seen = new Set<string>();

  for (const rules of ruleSets) {
    for (const rule of rules) {
      if (!seen.has(rule.name)) {
        seen.add(rule.name);
        merged.push(rule);
      }
    }
  }

  return merged;
}

export default {
  DEFAULT_FIELD_RULES,
  BUSINESS_REGISTRATION_RULES,
  DEFAULT_VALIDATION_RULES,
  getRulesForServiceType,
  parseRulesConfig,
  convertYamlRulesToFieldRules,
  mergeRules,
};

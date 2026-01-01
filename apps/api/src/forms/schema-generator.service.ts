/**
 * Schema Generator Service
 *
 * Generates JSON Schema, UI Schema, and visibility rules from form configuration.
 * Enables JSON Forms rendering and consistent validation.
 *
 * Story 3.10: JSON Schema Generation
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import type { Form, FormField, FormSection, Prisma } from '@bpa/db';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * JSON Schema property for a single field
 */
interface JsonSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean';
  title: string;
  description?: string;
  format?: 'email' | 'date' | 'data-url';
  enum?: string[];
  enumNames?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  default?: unknown;
}

/**
 * Generated JSON Schema (Draft-07)
 */
interface GeneratedJsonSchema {
  $schema: 'http://json-schema.org/draft-07/schema#';
  type: 'object';
  title: string;
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
}

/**
 * UI Schema element for JSON Forms
 */
interface UiSchemaElement {
  type: 'Control' | 'Group' | 'VerticalLayout' | 'HorizontalLayout';
  scope?: string;
  label?: string;
  elements?: UiSchemaElement[];
  options?: {
    multi?: boolean;
    format?: string;
  };
}

/**
 * Generated UI Schema for JSON Forms layout
 */
interface GeneratedUiSchema {
  type: 'VerticalLayout';
  elements: UiSchemaElement[];
}

/**
 * Visibility rule condition
 */
interface VisibilityCondition {
  fact: string;
  operator: string;
  value: unknown;
}

/**
 * JSON Rules Engine compatible rule
 */
interface JsonRulesEngineRule {
  conditions: {
    all?: VisibilityCondition[];
    any?: VisibilityCondition[];
  };
  event: {
    type: 'visible' | 'hidden';
  };
}

/**
 * Visibility rule mapping for a field or section
 */
interface VisibilityRuleMapping {
  targetId: string;
  targetName: string;
  targetType: 'field' | 'section';
  rule: JsonRulesEngineRule;
}

/**
 * Exported visibility rules for fields and sections
 */
interface VisibilityRulesExport {
  fields: VisibilityRuleMapping[];
  sections: VisibilityRuleMapping[];
}

/**
 * Complete form schema response
 */
export interface FormSchemaResponse {
  formId: string;
  formName: string;
  version: string;
  jsonSchema: GeneratedJsonSchema;
  uiSchema: GeneratedUiSchema;
  rules: VisibilityRulesExport;
}

// Form with fields and sections for schema generation
type FormWithFieldsAndSections = Form & {
  fields: FormField[];
  sections: FormSection[];
};

// Field properties type
interface FieldProperties {
  placeholder?: string;
  helpText?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string }>;
  maxSize?: number;
  accept?: string;
}

// Visibility rule from database
interface StoredVisibilityRule {
  sourceFieldId: string;
  operator: string;
  value: unknown;
}

@Injectable()
export class SchemaGeneratorService {
  private readonly logger = new Logger(SchemaGeneratorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate complete form schema including JSON Schema, UI Schema, and visibility rules
   *
   * @param formId - ID of the form to generate schema for
   * @returns Complete form schema response
   * @throws NotFoundException if form not found
   */
  async generateFormSchema(formId: string): Promise<FormSchemaResponse> {
    this.logger.log(`Generating schema for form ${formId}`);

    // Fetch form with active fields and sections
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: {
        fields: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        sections: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID "${formId}" not found`);
    }

    // Generate all schema components
    const jsonSchema = this.buildJsonSchema(form as FormWithFieldsAndSections);
    const uiSchema = this.buildUiSchema(form as FormWithFieldsAndSections);
    const rules = this.exportVisibilityRules(form as FormWithFieldsAndSections);

    return {
      formId: form.id,
      formName: form.name,
      version: form.updatedAt.toISOString(),
      jsonSchema,
      uiSchema,
      rules,
    };
  }

  /**
   * Build JSON Schema from form configuration
   */
  private buildJsonSchema(
    form: FormWithFieldsAndSections,
  ): GeneratedJsonSchema {
    const properties: Record<string, JsonSchemaProperty> = {};
    const required: string[] = [];

    for (const field of form.fields) {
      properties[field.name] = this.fieldToJsonSchema(field);
      if (field.required) {
        required.push(field.name);
      }
    }

    return {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      title: form.name,
      properties,
      required,
    };
  }

  /**
   * Convert a form field to JSON Schema property
   */
  private fieldToJsonSchema(field: FormField): JsonSchemaProperty {
    const props = (field.properties as FieldProperties) || {};
    const baseProperty: JsonSchemaProperty = {
      type: this.getJsonSchemaType(field.type),
      title: field.label,
    };

    // Add description from helpText
    if (props.helpText) {
      baseProperty.description = props.helpText;
    }

    // Type-specific handling
    switch (field.type) {
      case 'TEXT':
        if (props.minLength !== undefined)
          baseProperty.minLength = props.minLength;
        if (props.maxLength !== undefined)
          baseProperty.maxLength = props.maxLength;
        if (props.pattern) baseProperty.pattern = props.pattern;
        break;

      case 'TEXTAREA':
        if (props.minLength !== undefined)
          baseProperty.minLength = props.minLength;
        if (props.maxLength !== undefined)
          baseProperty.maxLength = props.maxLength;
        break;

      case 'EMAIL':
        baseProperty.format = 'email';
        baseProperty.pattern = '^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$';
        break;

      case 'PHONE':
        // International phone pattern
        baseProperty.pattern = '^\\+?[0-9\\s\\-()]{7,20}$';
        break;

      case 'NUMBER':
        if (props.min !== undefined) baseProperty.minimum = props.min;
        if (props.max !== undefined) baseProperty.maximum = props.max;
        break;

      case 'DATE':
        baseProperty.format = 'date';
        break;

      case 'CHECKBOX':
        // Already boolean type
        break;

      case 'SELECT':
      case 'RADIO':
        if (props.options && Array.isArray(props.options)) {
          baseProperty.enum = props.options.map((opt) => opt.value);
          baseProperty.enumNames = props.options.map((opt) => opt.label);
        }
        break;

      case 'FILE':
        baseProperty.format = 'data-url';
        break;

      default:
        // Unknown type - default to string
        break;
    }

    // Add default value if present
    if (props.defaultValue !== undefined) {
      baseProperty.default = props.defaultValue;
    }

    return baseProperty;
  }

  /**
   * Get JSON Schema type for a field type
   */
  private getJsonSchemaType(
    fieldType: string,
  ): 'string' | 'number' | 'integer' | 'boolean' {
    switch (fieldType) {
      case 'NUMBER':
        return 'number';
      case 'CHECKBOX':
        return 'boolean';
      default:
        return 'string';
    }
  }

  /**
   * Build UI Schema for JSON Forms layout
   */
  private buildUiSchema(form: FormWithFieldsAndSections): GeneratedUiSchema {
    const elements: UiSchemaElement[] = [];

    // Build a map of section ID to fields
    const sectionFieldsMap = new Map<string | null, FormField[]>();

    for (const field of form.fields) {
      const sectionId = field.sectionId || null;
      if (!sectionFieldsMap.has(sectionId)) {
        sectionFieldsMap.set(sectionId, []);
      }
      sectionFieldsMap.get(sectionId)!.push(field);
    }

    // First, add orphaned fields (no section)
    const orphanedFields = sectionFieldsMap.get(null) || [];
    for (const field of orphanedFields) {
      elements.push(this.fieldToUiSchemaControl(field));
    }

    // Then, add sections with their fields
    for (const section of form.sections) {
      const sectionFields = sectionFieldsMap.get(section.id) || [];
      if (sectionFields.length === 0) continue;

      const groupElement: UiSchemaElement = {
        type: 'Group',
        label: section.name,
        elements: sectionFields.map((field) =>
          this.fieldToUiSchemaControl(field),
        ),
      };

      elements.push(groupElement);
    }

    return {
      type: 'VerticalLayout',
      elements,
    };
  }

  /**
   * Convert a field to a UI Schema control element
   */
  private fieldToUiSchemaControl(field: FormField): UiSchemaElement {
    const control: UiSchemaElement = {
      type: 'Control',
      scope: `#/properties/${field.name}`,
    };

    // Add options based on field type
    if (field.type === 'TEXTAREA') {
      control.options = { multi: true };
    }

    return control;
  }

  /**
   * Export visibility rules for fields and sections
   */
  private exportVisibilityRules(
    form: FormWithFieldsAndSections,
  ): VisibilityRulesExport {
    const fieldRules: VisibilityRuleMapping[] = [];
    const sectionRules: VisibilityRuleMapping[] = [];

    // Process field visibility rules
    for (const field of form.fields) {
      if (field.visibilityRule) {
        const rule = this.convertVisibilityRule(
          field.visibilityRule as Prisma.JsonValue,
          form.fields,
        );
        if (rule) {
          fieldRules.push({
            targetId: field.id,
            targetName: field.name,
            targetType: 'field',
            rule,
          });
        }
      }
    }

    // Process section visibility rules
    for (const section of form.sections) {
      if (section.visibilityRule) {
        const rule = this.convertVisibilityRule(
          section.visibilityRule as Prisma.JsonValue,
          form.fields,
        );
        if (rule) {
          sectionRules.push({
            targetId: section.id,
            targetName: section.name,
            targetType: 'section',
            rule,
          });
        }
      }
    }

    return {
      fields: fieldRules,
      sections: sectionRules,
    };
  }

  /**
   * Convert a stored visibility rule to JSON Rules Engine format
   */
  private convertVisibilityRule(
    storedRule: Prisma.JsonValue,
    fields: FormField[],
  ): JsonRulesEngineRule | null {
    if (!storedRule || typeof storedRule !== 'object') {
      return null;
    }

    const rule = storedRule as unknown as StoredVisibilityRule;

    // Find the source field to get its name (facts are referenced by field name)
    const sourceField = fields.find((f) => f.id === rule.sourceFieldId);
    if (!sourceField) {
      return null;
    }

    // Map the operator to JSON Rules Engine operator
    const operatorMap: Record<string, string> = {
      equals: 'equal',
      notEquals: 'notEqual',
      contains: 'contains',
      greaterThan: 'greaterThan',
      lessThan: 'lessThan',
      greaterThanOrEquals: 'greaterThanInclusive',
      lessThanOrEquals: 'lessThanInclusive',
      isEmpty: 'equal',
      isNotEmpty: 'notEqual',
    };

    const mappedOperator = operatorMap[rule.operator] || rule.operator;
    let conditionValue = rule.value;

    // Handle isEmpty/isNotEmpty operators
    if (rule.operator === 'isEmpty') {
      conditionValue = '';
    } else if (rule.operator === 'isNotEmpty') {
      conditionValue = '';
    }

    return {
      conditions: {
        all: [
          {
            fact: sourceField.name,
            operator: mappedOperator,
            value: conditionValue,
          },
        ],
      },
      event: {
        type: 'visible',
      },
    };
  }
}

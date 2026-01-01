/**
 * Form Schema Response DTO
 *
 * Response format for the form schema endpoint.
 * Contains JSON Schema, UI Schema, and visibility rules.
 *
 * Story 3.10: JSON Schema Generation
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * JSON Schema property for a single field
 */
class JsonSchemaPropertyDto {
  @ApiProperty({ enum: ['string', 'number', 'integer', 'boolean'] })
  type: 'string' | 'number' | 'integer' | 'boolean';

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false, enum: ['email', 'date', 'data-url'] })
  format?: 'email' | 'date' | 'data-url';

  @ApiProperty({ required: false, type: [String] })
  enum?: string[];

  @ApiProperty({ required: false, type: [String] })
  enumNames?: string[];

  @ApiProperty({ required: false })
  minLength?: number;

  @ApiProperty({ required: false })
  maxLength?: number;

  @ApiProperty({ required: false })
  minimum?: number;

  @ApiProperty({ required: false })
  maximum?: number;

  @ApiProperty({ required: false })
  pattern?: string;

  @ApiProperty({ required: false })
  default?: unknown;
}

/**
 * Generated JSON Schema (Draft-07)
 */
class GeneratedJsonSchemaDto {
  @ApiProperty({ example: 'http://json-schema.org/draft-07/schema#' })
  $schema: 'http://json-schema.org/draft-07/schema#';

  @ApiProperty({ example: 'object' })
  type: 'object';

  @ApiProperty()
  title: string;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'object' } })
  properties: Record<string, JsonSchemaPropertyDto>;

  @ApiProperty({ type: [String] })
  required: string[];
}

/**
 * UI Schema element for JSON Forms
 */
class UiSchemaElementDto {
  @ApiProperty({
    enum: ['Control', 'Group', 'VerticalLayout', 'HorizontalLayout'],
  })
  type: 'Control' | 'Group' | 'VerticalLayout' | 'HorizontalLayout';

  @ApiProperty({ required: false, example: '#/properties/fieldName' })
  scope?: string;

  @ApiProperty({ required: false })
  label?: string;

  @ApiProperty({ required: false, type: [UiSchemaElementDto] })
  elements?: UiSchemaElementDto[];

  @ApiProperty({ required: false })
  options?: {
    multi?: boolean;
    format?: string;
  };
}

/**
 * Generated UI Schema for JSON Forms layout
 */
class GeneratedUiSchemaDto {
  @ApiProperty({ example: 'VerticalLayout' })
  type: 'VerticalLayout';

  @ApiProperty({ type: [UiSchemaElementDto] })
  elements: UiSchemaElementDto[];
}

/**
 * Visibility rule condition
 */
class VisibilityConditionDto {
  @ApiProperty({ description: 'Field name to evaluate' })
  fact: string;

  @ApiProperty({ description: 'Comparison operator' })
  operator: string;

  @ApiProperty({ description: 'Value to compare against' })
  value: unknown;
}

/**
 * JSON Rules Engine compatible rule
 */
class JsonRulesEngineRuleDto {
  @ApiProperty({
    required: false,
    type: 'object',
    properties: {
      all: {
        type: 'array',
        items: { $ref: '#/components/schemas/VisibilityConditionDto' },
      },
      any: {
        type: 'array',
        items: { $ref: '#/components/schemas/VisibilityConditionDto' },
      },
    },
  })
  conditions: {
    all?: VisibilityConditionDto[];
    any?: VisibilityConditionDto[];
  };

  @ApiProperty({
    type: 'object',
    properties: {
      type: { type: 'string', enum: ['visible', 'hidden'] },
    },
  })
  event: {
    type: 'visible' | 'hidden';
  };
}

/**
 * Visibility rule mapping for a field or section
 */
class VisibilityRuleMappingDto {
  @ApiProperty({ description: 'ID of the target field or section' })
  targetId: string;

  @ApiProperty({ description: 'Name of the target field or section' })
  targetName: string;

  @ApiProperty({ enum: ['field', 'section'] })
  targetType: 'field' | 'section';

  @ApiProperty({ type: JsonRulesEngineRuleDto })
  rule: JsonRulesEngineRuleDto;
}

/**
 * Exported visibility rules for fields and sections
 */
class VisibilityRulesExportDto {
  @ApiProperty({ type: [VisibilityRuleMappingDto] })
  fields: VisibilityRuleMappingDto[];

  @ApiProperty({ type: [VisibilityRuleMappingDto] })
  sections: VisibilityRuleMappingDto[];
}

/**
 * Complete form schema response
 */
export class FormSchemaResponseDto {
  @ApiProperty({ description: 'Form ID' })
  formId: string;

  @ApiProperty({ description: 'Form name' })
  formName: string;

  @ApiProperty({
    description: 'Version timestamp (ISO 8601)',
    example: '2024-01-15T10:30:00.000Z',
  })
  version: string;

  @ApiProperty({
    type: GeneratedJsonSchemaDto,
    description: 'JSON Schema (Draft-07)',
  })
  jsonSchema: GeneratedJsonSchemaDto;

  @ApiProperty({
    type: GeneratedUiSchemaDto,
    description: 'UI Schema for JSON Forms',
  })
  uiSchema: GeneratedUiSchemaDto;

  @ApiProperty({
    type: VisibilityRulesExportDto,
    description: 'Visibility rules export',
  })
  rules: VisibilityRulesExportDto;
}

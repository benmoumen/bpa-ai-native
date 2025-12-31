import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsBoolean,
  IsInt,
  Min,
  IsUUID,
  IsObject,
  Matches,
  ValidateNested,
  IsIn,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

/**
 * DTO for a single visibility condition
 */
export class VisibilityConditionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fieldName!: string;

  @IsString()
  @IsIn([
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'greater_than',
    'less_than',
    'greater_or_equal',
    'less_or_equal',
    'is_empty',
    'is_not_empty',
  ])
  operator!: string;

  @IsOptional()
  // Value can be string, number, or boolean - validated at runtime
  value?: string | number | boolean;
}

/**
 * DTO for visibility rule configuration
 */
export class VisibilityRuleDto {
  @IsString()
  @IsIn(['always', 'conditional'])
  mode!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VisibilityConditionDto)
  conditions?: VisibilityConditionDto[];

  @IsOptional()
  @IsString()
  @IsIn(['AND', 'OR'])
  logic?: string;
}

/**
 * DTO for updating an existing form field
 */
export class UpdateFormFieldDto {
  @ApiPropertyOptional({
    description: 'Updated field type',
    example: 'number',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @ApiPropertyOptional({
    description: 'Updated label',
    example: 'Updated Full Name',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  label?: string;

  @ApiPropertyOptional({
    description: 'Updated field identifier',
    example: 'updatedName',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
    message:
      'name must start with a letter and contain only letters, numbers, and underscores',
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated section ID (set to null to remove from section)',
    example: 'clx123abc...',
  })
  @IsOptional()
  @IsUUID()
  sectionId?: string | null;

  @ApiPropertyOptional({
    description: 'Updated required status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({
    description: 'Updated type-specific properties',
    example: { placeholder: 'Enter updated name', maxLength: 200 },
  })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Visibility rule configuration',
    example: {
      mode: 'conditional',
      conditions: [{ fieldName: 'country', operator: 'equals', value: 'US' }],
      logic: 'AND',
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VisibilityRuleDto)
  visibilityRule?: VisibilityRuleDto | null;

  @ApiPropertyOptional({
    description: 'Updated display order',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the field is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

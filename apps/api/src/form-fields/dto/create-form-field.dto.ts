import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsInt,
  Min,
  IsUUID,
  IsBoolean,
  IsObject,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO for creating a new form field
 */
export class CreateFormFieldDto {
  @ApiProperty({
    description: 'Type of the field (JSON Forms type)',
    example: 'text',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type!: string;

  @ApiProperty({
    description: 'Label displayed to the user',
    example: 'Full Name',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  label!: string;

  @ApiProperty({
    description: 'Field identifier (used in form data)',
    example: 'fullName',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/^[a-zA-Z][a-zA-Z0-9_]*$/, {
    message:
      'name must start with a letter and contain only letters, numbers, and underscores',
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  @ApiPropertyOptional({
    description: 'Section ID to assign the field to',
    example: 'clx123abc...',
  })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({
    description: 'Whether the field is required',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({
    description:
      'Type-specific properties (placeholder, min, max, options, etc.)',
    example: {
      placeholder: 'Enter your full name',
      minLength: 2,
      maxLength: 100,
    },
    default: {},
  })
  @IsOptional()
  @IsObject()
  properties?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Display order within the form or section',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

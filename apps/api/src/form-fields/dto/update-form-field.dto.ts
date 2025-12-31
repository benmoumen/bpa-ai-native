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
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

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

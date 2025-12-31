import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new form section
 */
export class CreateFormSectionDto {
  @ApiProperty({
    description: 'Name of the section',
    example: 'Personal Information',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({
    description: 'Description of the section',
    example: 'Enter your personal details below',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Parent section ID for nested sections',
    example: 'clx123abc...',
  })
  @IsOptional()
  @IsUUID()
  parentSectionId?: string;

  @ApiPropertyOptional({
    description: 'Display order within the form or parent section',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

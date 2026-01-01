/**
 * Create Determinant DTO
 *
 * Validation for determinant creation requests
 */

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DeterminantTypeDto {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
}

export class CreateDeterminantDto {
  @ApiProperty({
    description: 'Name of the determinant',
    example: 'applicant_age',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Type of the determinant',
    enum: DeterminantTypeDto,
    example: 'NUMBER',
  })
  @IsEnum(DeterminantTypeDto)
  type: DeterminantTypeDto;

  @ApiPropertyOptional({
    description: 'ID of the source form field',
    example: 'clxyz123456',
  })
  @IsString()
  @IsOptional()
  sourceFieldId?: string;

  @ApiPropertyOptional({
    description: 'JSONata formula expression (for calculated determinants)',
    example: '$sum(items.price)',
  })
  @IsString()
  @IsOptional()
  formula?: string;
}

/**
 * Update Determinant DTO
 *
 * Validation for determinant update requests
 */

import { IsString, IsOptional, MaxLength, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDeterminantDto {
  @ApiPropertyOptional({
    description: 'Name of the determinant',
    example: 'applicant_age',
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'JSONata formula expression (for calculated determinants)',
    example: '$sum(items.price)',
  })
  @IsString()
  @IsOptional()
  formula?: string;

  @ApiPropertyOptional({
    description: 'Whether the determinant is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

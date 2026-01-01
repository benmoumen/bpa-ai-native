/**
 * Determinant Response DTO
 *
 * Serialization for determinant API responses
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Determinant } from '@bpa/db';

export class DeterminantResponseDto {
  @ApiProperty({ description: 'Determinant ID' })
  id: string;

  @ApiProperty({ description: 'Parent service ID' })
  serviceId: string;

  @ApiProperty({ description: 'Determinant name' })
  name: string;

  @ApiProperty({
    description: 'Determinant type',
    enum: ['STRING', 'NUMBER', 'BOOLEAN', 'DATE'],
  })
  type: string;

  @ApiPropertyOptional({ description: 'Source form field ID' })
  sourceFieldId: string | null;

  @ApiPropertyOptional({ description: 'JSONata formula expression' })
  formula: string | null;

  @ApiProperty({ description: 'Whether determinant is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Number of linked fields' })
  linkedFieldsCount?: number;

  static fromEntity(
    determinant: Determinant & { _count?: { linkedFields: number } },
  ): DeterminantResponseDto {
    const dto = new DeterminantResponseDto();
    dto.id = determinant.id;
    dto.serviceId = determinant.serviceId;
    dto.name = determinant.name;
    dto.type = determinant.type;
    dto.sourceFieldId = determinant.sourceFieldId;
    dto.formula = determinant.formula;
    dto.isActive = determinant.isActive;
    dto.createdAt = determinant.createdAt;
    dto.updatedAt = determinant.updatedAt;
    if (determinant._count) {
      dto.linkedFieldsCount = determinant._count.linkedFields;
    }
    return dto;
  }
}

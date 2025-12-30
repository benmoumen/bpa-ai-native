import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Cost } from '@bpa/db';

/**
 * DTO for cost API responses
 */
export class CostResponseDto {
  @ApiProperty({ description: 'Unique cost ID' })
  id!: string;

  @ApiProperty({ description: 'Parent registration ID' })
  registrationId!: string;

  @ApiProperty({ description: 'Display name for the cost' })
  name!: string;

  @ApiProperty({
    description: 'Cost type: FIXED or FORMULA',
    enum: ['FIXED', 'FORMULA'],
  })
  type!: string;

  @ApiPropertyOptional({ description: 'Fixed amount (when type is FIXED)' })
  fixedAmount?: number | null;

  @ApiPropertyOptional({
    description: 'JSONata formula (when type is FORMULA)',
  })
  formula?: string | null;

  @ApiProperty({ description: 'ISO 4217 currency code' })
  currency!: string;

  @ApiProperty({ description: 'Display order within the registration' })
  sortOrder!: number;

  @ApiProperty({ description: 'Whether the cost is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  /**
   * Create DTO from Prisma entity
   */
  static fromEntity(entity: Cost): CostResponseDto {
    const dto = new CostResponseDto();
    dto.id = entity.id;
    dto.registrationId = entity.registrationId;
    dto.name = entity.name;
    dto.type = entity.type;
    // Convert Decimal to number for JSON serialization
    // Prisma Decimal has a toNumber() method
    dto.fixedAmount = entity.fixedAmount
      ? typeof entity.fixedAmount === 'object' &&
        'toNumber' in entity.fixedAmount
        ? (entity.fixedAmount as { toNumber: () => number }).toNumber()
        : Number(entity.fixedAmount)
      : null;
    dto.formula = entity.formula;
    dto.currency = entity.currency;
    dto.sortOrder = entity.sortOrder;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

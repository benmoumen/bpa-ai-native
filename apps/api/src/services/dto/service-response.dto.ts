import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Service } from '@bpa/db';

/**
 * DTO for service API responses
 */
export class ServiceResponseDto {
  @ApiProperty({ description: 'Unique service ID' })
  id!: string;

  @ApiProperty({ description: 'Service name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Service description' })
  description?: string | null;

  @ApiPropertyOptional({ description: 'Service category' })
  category?: string | null;

  @ApiProperty({ description: 'Service status', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  status!: string;

  @ApiProperty({ description: 'User ID who created the service' })
  createdBy!: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  /**
   * Create DTO from Prisma entity
   */
  static fromEntity(entity: Service): ServiceResponseDto {
    const dto = new ServiceResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.category = entity.category;
    dto.status = entity.status;
    dto.createdBy = entity.createdBy;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

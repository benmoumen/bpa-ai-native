import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Registration } from '@bpa/db';

/**
 * DTO for registration API responses
 */
export class RegistrationResponseDto {
  @ApiProperty({ description: 'Unique registration ID' })
  id!: string;

  @ApiProperty({ description: 'Parent service ID' })
  serviceId!: string;

  @ApiProperty({ description: 'Registration name' })
  name!: string;

  @ApiProperty({ description: 'Short name for UI display' })
  shortName!: string;

  @ApiProperty({ description: 'Unique key within the service' })
  key!: string;

  @ApiPropertyOptional({ description: 'Registration description' })
  description?: string | null;

  @ApiProperty({ description: 'Whether the registration is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Display order within the service' })
  sortOrder!: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  /**
   * Create DTO from Prisma entity
   */
  static fromEntity(entity: Registration): RegistrationResponseDto {
    const dto = new RegistrationResponseDto();
    dto.id = entity.id;
    dto.serviceId = entity.serviceId;
    dto.name = entity.name;
    dto.shortName = entity.shortName;
    dto.key = entity.key;
    dto.description = entity.description;
    dto.isActive = entity.isActive;
    dto.sortOrder = entity.sortOrder;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

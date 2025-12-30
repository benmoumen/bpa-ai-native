import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Requirement } from '@bpa/db';

/**
 * DTO for requirement API responses
 */
export class RequirementResponseDto {
  @ApiProperty({ description: 'Unique requirement ID' })
  id!: string;

  @ApiProperty({ description: 'Requirement name' })
  name!: string;

  @ApiPropertyOptional({
    description: 'Tooltip/description for the requirement',
  })
  tooltip?: string | null;

  @ApiPropertyOptional({ description: 'Document template URL or path' })
  template?: string | null;

  @ApiProperty({ description: 'Whether the requirement is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  /**
   * Create DTO from Prisma entity
   */
  static fromEntity(entity: Requirement): RequirementResponseDto {
    const dto = new RequirementResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.tooltip = entity.tooltip;
    dto.template = entity.template;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

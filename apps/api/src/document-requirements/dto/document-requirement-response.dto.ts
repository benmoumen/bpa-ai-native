import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { DocumentRequirement, Requirement } from '@bpa/db';

/**
 * Nested requirement info in document requirement response
 */
class RequirementInfoDto {
  @ApiProperty({ description: 'Requirement ID' })
  id!: string;

  @ApiProperty({ description: 'Requirement name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Requirement tooltip' })
  tooltip?: string | null;

  @ApiPropertyOptional({ description: 'Requirement template URL' })
  template?: string | null;

  @ApiProperty({ description: 'Whether the requirement is active' })
  isActive!: boolean;
}

/**
 * DTO for document requirement API responses
 */
export class DocumentRequirementResponseDto {
  @ApiProperty({ description: 'Unique document requirement ID' })
  id!: string;

  @ApiProperty({ description: 'Parent registration ID' })
  registrationId!: string;

  @ApiProperty({ description: 'Referenced requirement ID' })
  requirementId!: string;

  @ApiPropertyOptional({ description: 'Override name for this specific usage' })
  nameOverride?: string | null;

  @ApiProperty({ description: 'Whether this document is required' })
  isRequired!: boolean;

  @ApiProperty({ description: 'Display order within the registration' })
  sortOrder!: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Referenced requirement details',
    type: RequirementInfoDto,
  })
  requirement!: RequirementInfoDto;

  /**
   * Create DTO from Prisma entity with included requirement
   */
  static fromEntity(
    entity: DocumentRequirement & {
      requirement: Pick<
        Requirement,
        'id' | 'name' | 'tooltip' | 'template' | 'isActive'
      >;
    },
  ): DocumentRequirementResponseDto {
    const dto = new DocumentRequirementResponseDto();
    dto.id = entity.id;
    dto.registrationId = entity.registrationId;
    dto.requirementId = entity.requirementId;
    dto.nameOverride = entity.nameOverride;
    dto.isRequired = entity.isRequired;
    dto.sortOrder = entity.sortOrder;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.requirement = {
      id: entity.requirement.id,
      name: entity.requirement.name,
      tooltip: entity.requirement.tooltip,
      template: entity.requirement.template,
      isActive: entity.requirement.isActive,
    };
    return dto;
  }
}

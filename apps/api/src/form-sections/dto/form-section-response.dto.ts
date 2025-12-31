import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FormSection } from '@bpa/db';

/**
 * DTO for form section API responses
 */
export class FormSectionResponseDto {
  @ApiProperty({ description: 'Unique section ID' })
  id!: string;

  @ApiProperty({ description: 'Parent form ID' })
  formId!: string;

  @ApiPropertyOptional({ description: 'Parent section ID for nested sections' })
  parentSectionId?: string | null;

  @ApiProperty({ description: 'Section name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Section description' })
  description?: string | null;

  @ApiProperty({ description: 'Display order' })
  sortOrder!: number;

  @ApiProperty({ description: 'Whether the section is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Number of child sections' })
  childSectionCount?: number;

  @ApiPropertyOptional({ description: 'Number of fields in this section' })
  fieldCount?: number;

  /**
   * Create DTO from Prisma entity
   */
  static fromEntity(
    entity: FormSection & {
      _count?: { childSections: number; fields: number };
    },
  ): FormSectionResponseDto {
    const dto = new FormSectionResponseDto();
    dto.id = entity.id;
    dto.formId = entity.formId;
    dto.parentSectionId = entity.parentSectionId;
    dto.name = entity.name;
    dto.description = entity.description;
    dto.sortOrder = entity.sortOrder;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;

    if (entity._count) {
      dto.childSectionCount = entity._count.childSections;
      dto.fieldCount = entity._count.fields;
    }

    return dto;
  }
}

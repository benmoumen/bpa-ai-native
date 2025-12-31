import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FormField, Prisma } from '@bpa/db';

/**
 * DTO for form field API responses
 */
export class FormFieldResponseDto {
  @ApiProperty({ description: 'Unique field ID' })
  id!: string;

  @ApiProperty({ description: 'Parent form ID' })
  formId!: string;

  @ApiPropertyOptional({ description: 'Section ID the field belongs to' })
  sectionId?: string | null;

  @ApiProperty({ description: 'Field type (JSON Forms type)' })
  type!: string;

  @ApiProperty({ description: 'Field label displayed to users' })
  label!: string;

  @ApiProperty({ description: 'Field identifier used in form data' })
  name!: string;

  @ApiProperty({ description: 'Whether the field is required' })
  required!: boolean;

  @ApiProperty({ description: 'Type-specific properties' })
  properties!: Prisma.JsonValue;

  @ApiProperty({ description: 'Display order' })
  sortOrder!: number;

  @ApiProperty({ description: 'Whether the field is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  /**
   * Create DTO from Prisma entity
   */
  static fromEntity(entity: FormField): FormFieldResponseDto {
    const dto = new FormFieldResponseDto();
    dto.id = entity.id;
    dto.formId = entity.formId;
    dto.sectionId = entity.sectionId;
    dto.type = entity.type;
    dto.label = entity.label;
    dto.name = entity.name;
    dto.required = entity.required;
    dto.properties = entity.properties;
    dto.sortOrder = entity.sortOrder;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

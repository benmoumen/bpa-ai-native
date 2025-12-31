import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Form } from '@bpa/db';
import { FormTypeDto } from './create-form.dto';

/**
 * DTO for form API responses
 */
export class FormResponseDto {
  @ApiProperty({ description: 'Unique form ID' })
  id!: string;

  @ApiProperty({ description: 'Parent service ID' })
  serviceId!: string;

  @ApiProperty({ description: 'Form name' })
  name!: string;

  @ApiProperty({
    description: 'Form type',
    enum: FormTypeDto,
  })
  type!: FormTypeDto;

  @ApiProperty({ description: 'Whether the form is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  @ApiPropertyOptional({ description: 'Number of sections in the form' })
  sectionCount?: number;

  @ApiPropertyOptional({ description: 'Number of fields in the form' })
  fieldCount?: number;

  /**
   * Create DTO from Prisma entity
   */
  static fromEntity(
    entity: Form & { _count?: { sections: number; fields: number } },
  ): FormResponseDto {
    const dto = new FormResponseDto();
    dto.id = entity.id;
    dto.serviceId = entity.serviceId;
    dto.name = entity.name;
    dto.type = entity.type as FormTypeDto;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;

    if (entity._count) {
      dto.sectionCount = entity._count.sections;
      dto.fieldCount = entity._count.fields;
    }

    return dto;
  }
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { WorkflowTransition } from '@bpa/db';

/**
 * DTO for workflow transition API responses
 */
export class TransitionResponseDto {
  @ApiProperty({ description: 'Unique transition ID' })
  id!: string;

  @ApiProperty({ description: 'Source role status ID' })
  fromStatusId!: string;

  @ApiProperty({ description: 'Target role ID' })
  toRoleId!: string;

  @ApiProperty({ description: 'Sort order for display' })
  sortOrder!: number;

  @ApiPropertyOptional({ description: 'Conditions for this transition' })
  conditions?: Record<string, unknown> | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  /**
   * Create DTO from Prisma entity
   */
  static fromEntity(entity: WorkflowTransition): TransitionResponseDto {
    const dto = new TransitionResponseDto();
    dto.id = entity.id;
    dto.fromStatusId = entity.fromStatusId;
    dto.toRoleId = entity.toRoleId;
    dto.sortOrder = entity.sortOrder;
    dto.conditions = entity.conditions as Record<string, unknown> | null;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

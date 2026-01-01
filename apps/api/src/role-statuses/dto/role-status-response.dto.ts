import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { RoleStatus } from '@bpa/db';
import { RoleStatusCode } from './create-role-status.dto';

/**
 * DTO for role status API responses
 */
export class RoleStatusResponseDto {
  @ApiProperty({ description: 'Unique role status ID' })
  id!: string;

  @ApiProperty({ description: 'Role ID this status belongs to' })
  roleId!: string;

  @ApiProperty({
    description: 'Status code from 4-Status Model',
    enum: RoleStatusCode,
  })
  code!: RoleStatusCode;

  @ApiProperty({ description: 'Display name' })
  name!: string;

  @ApiProperty({ description: 'Whether this is the default status' })
  isDefault!: boolean;

  @ApiProperty({ description: 'Sort order for display' })
  sortOrder!: number;

  @ApiPropertyOptional({ description: 'Conditions for showing this status' })
  conditions?: Record<string, unknown> | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  /**
   * Create DTO from Prisma entity
   */
  static fromEntity(entity: RoleStatus): RoleStatusResponseDto {
    const dto = new RoleStatusResponseDto();
    dto.id = entity.id;
    dto.roleId = entity.roleId;
    dto.code = entity.code as RoleStatusCode;
    dto.name = entity.name;
    dto.isDefault = entity.isDefault;
    dto.sortOrder = entity.sortOrder;
    dto.conditions = entity.conditions as Record<string, unknown> | null;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

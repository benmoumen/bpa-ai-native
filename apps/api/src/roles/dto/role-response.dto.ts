import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Role } from '@bpa/db';
import { RoleType } from './create-role.dto';

/**
 * DTO for role API responses
 */
export class RoleResponseDto {
  @ApiProperty({ description: 'Unique role ID' })
  id!: string;

  @ApiProperty({ description: 'Service ID this role belongs to' })
  serviceId!: string;

  @ApiProperty({
    description: 'Type of role',
    enum: RoleType,
  })
  roleType!: RoleType;

  @ApiProperty({ description: 'Role name' })
  name!: string;

  @ApiPropertyOptional({ description: 'Short name for display' })
  shortName?: string | null;

  @ApiPropertyOptional({ description: 'Role description' })
  description?: string | null;

  @ApiProperty({ description: 'Whether this is the starting role' })
  isStartRole!: boolean;

  @ApiProperty({ description: 'Sort order for display' })
  sortOrder!: number;

  @ApiProperty({ description: 'Whether role is active' })
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'Determinant-based conditions' })
  conditions?: Record<string, unknown> | null;

  // UserRole-specific fields
  @ApiPropertyOptional({ description: 'Form ID for USER roles' })
  formId?: string | null;

  // BotRole-specific fields
  @ApiPropertyOptional({ description: 'Retry enabled for BOT roles' })
  retryEnabled?: boolean | null;

  @ApiPropertyOptional({ description: 'Retry interval in minutes' })
  retryIntervalMinutes?: number | null;

  @ApiPropertyOptional({ description: 'Timeout in minutes' })
  timeoutMinutes?: number | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date;

  /**
   * Create DTO from Prisma entity
   */
  static fromEntity(entity: Role): RoleResponseDto {
    const dto = new RoleResponseDto();
    dto.id = entity.id;
    dto.serviceId = entity.serviceId;
    dto.roleType = entity.roleType as RoleType;
    dto.name = entity.name;
    dto.shortName = entity.shortName;
    dto.description = entity.description;
    dto.isStartRole = entity.isStartRole;
    dto.sortOrder = entity.sortOrder;
    dto.isActive = entity.isActive;
    dto.conditions = entity.conditions as Record<string, unknown> | null;
    dto.formId = entity.formId;
    dto.retryEnabled = entity.retryEnabled;
    dto.retryIntervalMinutes = entity.retryIntervalMinutes;
    dto.timeoutMinutes = entity.timeoutMinutes;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

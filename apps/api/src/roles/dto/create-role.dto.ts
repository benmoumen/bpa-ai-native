import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * RoleType enum matching Prisma schema
 */
export enum RoleType {
  USER = 'USER',
  BOT = 'BOT',
}

/**
 * DTO for creating a new workflow role
 */
export class CreateRoleDto {
  @ApiProperty({
    description: 'Name of the role',
    example: 'Document Verification',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'Type of role - USER for human decision, BOT for automation',
    enum: RoleType,
    example: RoleType.USER,
  })
  @IsEnum(RoleType)
  roleType!: RoleType;

  @ApiPropertyOptional({
    description: 'Short name for display',
    example: 'Doc Verify',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  shortName?: string;

  @ApiPropertyOptional({
    description: 'Description of the role',
    example: 'Verifies submitted documents for completeness',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this is the starting role in the workflow',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isStartRole?: boolean;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    default: 100,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Determinant-based conditions for role activation',
    example: { determinantId: 'abc', operator: 'equals', value: 'true' },
  })
  @IsObject()
  @IsOptional()
  conditions?: Record<string, unknown>;

  // UserRole-specific fields
  @ApiPropertyOptional({
    description: 'Form ID to display for USER roles',
  })
  @IsString()
  @IsOptional()
  formId?: string;

  // BotRole-specific fields
  @ApiPropertyOptional({
    description: 'Whether retry is enabled for BOT roles',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  retryEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Retry interval in minutes for BOT roles',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  retryIntervalMinutes?: number;

  @ApiPropertyOptional({
    description: 'Timeout in minutes for BOT roles',
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  timeoutMinutes?: number;
}

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
 * RoleStatusCode enum - 4-Status Model (FIXED, non-negotiable)
 * These codes map to legacy BPA: PENDING=0, PASSED=1, RETURNED=2, REJECTED=3
 */
export enum RoleStatusCode {
  PENDING = 'PENDING', // 0 - Waiting for decision
  PASSED = 'PASSED', // 1 - Approved, moves forward
  RETURNED = 'RETURNED', // 2 - Sent back for fixes (can retry)
  REJECTED = 'REJECTED', // 3 - Permanently rejected (terminal)
}

/**
 * DTO for creating a new role status
 */
export class CreateRoleStatusDto {
  @ApiProperty({
    description: 'Status code from 4-Status Model',
    enum: RoleStatusCode,
    example: RoleStatusCode.PENDING,
  })
  @IsEnum(RoleStatusCode)
  code!: RoleStatusCode;

  @ApiProperty({
    description: 'Display name for the status',
    example: 'Awaiting Review',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Whether this is the default status for the role',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Conditions for when to show this status option',
    example: { determinantId: 'abc', operator: 'equals', value: 'true' },
  })
  @IsObject()
  @IsOptional()
  conditions?: Record<string, unknown>;
}

import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  Min,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new workflow transition
 */
export class CreateTransitionDto {
  @ApiProperty({
    description: 'ID of the source role status',
    example: 'clxxxxx',
  })
  @IsString()
  @IsNotEmpty()
  fromStatusId!: string;

  @ApiProperty({
    description: 'ID of the target role',
    example: 'clyyyyy',
  })
  @IsString()
  @IsNotEmpty()
  toRoleId!: string;

  @ApiPropertyOptional({
    description: 'Sort order for multiple transitions from same status',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Determinant-based conditions for this transition',
    example: { determinantId: 'abc', operator: 'equals', value: 'true' },
  })
  @IsObject()
  @IsOptional()
  conditions?: Record<string, unknown>;
}

/**
 * List Determinants Query DTO
 *
 * Query parameters for listing determinants with pagination
 */

import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsEnum,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DeterminantTypeDto } from './create-determinant.dto';

export class ListDeterminantsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by active status',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by determinant type',
    enum: DeterminantTypeDto,
  })
  @IsOptional()
  @IsEnum(DeterminantTypeDto)
  type?: DeterminantTypeDto;

  @ApiPropertyOptional({
    description: 'Search by name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

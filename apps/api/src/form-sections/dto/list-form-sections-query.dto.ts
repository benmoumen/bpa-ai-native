import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsIn,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for listing form sections with pagination and filtering
 */
export class ListFormSectionsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by parent section ID (null for top-level sections)',
    example: 'clx123abc...',
  })
  @IsOptional()
  @IsUUID()
  parentSectionId?: string;

  @ApiPropertyOptional({
    description: 'Get only top-level sections (no parent)',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  @IsBoolean()
  topLevelOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: ['name', 'sortOrder', 'createdAt', 'updatedAt'],
    example: 'sortOrder',
  })
  @IsOptional()
  @IsIn(['name', 'sortOrder', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'sortOrder' | 'createdAt' | 'updatedAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'asc',
    example: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}

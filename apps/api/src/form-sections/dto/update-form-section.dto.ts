import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsBoolean,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an existing form section
 */
export class UpdateFormSectionDto {
  @ApiPropertyOptional({
    description: 'Updated name of the section',
    example: 'Updated Personal Information',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated description of the section',
    example: 'Updated description text',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated parent section ID (set to null to make top-level)',
    example: 'clx123abc...',
  })
  @IsOptional()
  @IsUUID()
  parentSectionId?: string | null;

  @ApiPropertyOptional({
    description: 'Updated display order',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the section is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

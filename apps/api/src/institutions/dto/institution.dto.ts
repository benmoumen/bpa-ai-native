import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO for creating an institution
 */
export class CreateInstitutionDto {
  @ApiProperty({
    description: 'Institution name',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'Unique institution code',
    maxLength: 50,
  })
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional({
    description: 'Country code (e.g., GN for Guinea)',
    maxLength: 10,
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  country?: string;
}

/**
 * DTO for updating an institution
 */
export class UpdateInstitutionDto {
  @ApiPropertyOptional({
    description: 'Institution name',
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Country code',
    maxLength: 10,
  })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  country?: string;

  @ApiPropertyOptional({
    description: 'Whether the institution is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

/**
 * Response DTO for institution
 */
export class InstitutionResponseDto {
  @ApiProperty({ description: 'Unique identifier' })
  id!: string;

  @ApiProperty({ description: 'Institution name' })
  name!: string;

  @ApiProperty({ description: 'Unique institution code' })
  code!: string;

  @ApiPropertyOptional({ description: 'Country code' })
  country?: string;

  @ApiProperty({ description: 'Whether the institution is active' })
  isActive!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;
}

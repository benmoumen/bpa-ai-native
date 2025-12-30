import {
  IsString,
  IsOptional,
  MaxLength,
  IsBoolean,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating an existing requirement
 */
export class UpdateRequirementDto {
  @ApiPropertyOptional({
    description: 'Updated name',
    example: 'Business Registration Certificate',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated tooltip/description',
    example: 'Official certificate from the business registry',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  tooltip?: string;

  @ApiPropertyOptional({
    description: 'Updated template URL or path',
    example: '/templates/business-registration.pdf',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  template?: string;

  @ApiPropertyOptional({
    description: 'Updated active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

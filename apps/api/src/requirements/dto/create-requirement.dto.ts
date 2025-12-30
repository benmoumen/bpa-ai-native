import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new global requirement template
 */
export class CreateRequirementDto {
  @ApiProperty({
    description: 'Name of the document requirement',
    example: 'Business Registration Certificate',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Tooltip/description shown to users',
    example: 'Official certificate from the business registry',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  tooltip?: string;

  @ApiPropertyOptional({
    description: 'URL or path to document template',
    example: '/templates/business-registration.pdf',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  template?: string;
}

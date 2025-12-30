import {
  IsString,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsInt,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for linking a requirement to a registration
 */
export class CreateDocumentRequirementDto {
  @ApiProperty({
    description: 'ID of the requirement to link',
    example: 'clb1234567890abcdef',
  })
  @IsString()
  @IsNotEmpty()
  requirementId!: string;

  @ApiPropertyOptional({
    description: 'Override name for this specific usage',
    example: 'Updated Business Registration',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameOverride?: string;

  @ApiPropertyOptional({
    description: 'Whether this document is required',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Display order within the registration',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

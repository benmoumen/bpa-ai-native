import {
  IsString,
  IsOptional,
  MaxLength,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating a document requirement link
 */
export class UpdateDocumentRequirementDto {
  @ApiPropertyOptional({
    description: 'Updated override name',
    example: 'Updated Business Registration',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nameOverride?: string;

  @ApiPropertyOptional({
    description: 'Updated required flag',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Updated display order',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

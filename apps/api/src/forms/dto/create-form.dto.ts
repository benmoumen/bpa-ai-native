import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Form type enum matching Prisma schema
 */
export enum FormTypeDto {
  APPLICANT = 'APPLICANT',
  GUIDE = 'GUIDE',
}

/**
 * DTO for creating a new form within a service
 */
export class CreateFormDto {
  @ApiProperty({
    description: 'Name of the form',
    example: 'Business License Application',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    description: 'Type of form',
    enum: FormTypeDto,
    example: FormTypeDto.APPLICANT,
  })
  @IsEnum(FormTypeDto)
  type!: FormTypeDto;

  @ApiPropertyOptional({
    description: 'Whether the form is active',
    example: true,
    default: true,
  })
  @IsOptional()
  isActive?: boolean;
}

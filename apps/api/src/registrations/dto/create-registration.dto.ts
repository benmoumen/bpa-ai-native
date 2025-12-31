import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsInt,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * DTO for creating a new registration within a service
 */
export class CreateRegistrationDto {
  @ApiProperty({
    description: 'Name of the registration',
    example: 'Business License',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    description: 'Short name for UI display',
    example: 'BIZ-LIC',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  shortName!: string;

  @ApiPropertyOptional({
    description:
      'Unique key within service (auto-generated from name if not provided)',
    example: 'business-license',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'key must contain only lowercase letters, numbers, and hyphens',
  })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  key?: string;

  @ApiPropertyOptional({
    description: 'Description of the registration',
    example: 'Apply for a new business license',
    maxLength: 2000,
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Display order within the service',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

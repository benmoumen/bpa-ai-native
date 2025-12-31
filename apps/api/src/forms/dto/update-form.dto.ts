import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FormTypeDto } from './create-form.dto';

/**
 * DTO for updating an existing form
 */
export class UpdateFormDto {
  @ApiPropertyOptional({
    description: 'Updated name of the form',
    example: 'Updated Business License Application',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated type of form',
    enum: FormTypeDto,
    example: FormTypeDto.GUIDE,
  })
  @IsOptional()
  @IsEnum(FormTypeDto)
  type?: FormTypeDto;

  @ApiPropertyOptional({
    description: 'Whether the form is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { CreateRegistrationDto } from './create-registration.dto';

/**
 * DTO for updating a registration
 * All fields are optional (partial update)
 * Note: key cannot be updated (it's part of the unique constraint)
 */
export class UpdateRegistrationDto extends PartialType(CreateRegistrationDto) {
  @ApiPropertyOptional({
    description: 'Whether the registration is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Display order within the service',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  override sortOrder?: number;

  // Note: 'key' is excluded from updates since it's part of the compound unique constraint
  // and should not be changed after creation
}

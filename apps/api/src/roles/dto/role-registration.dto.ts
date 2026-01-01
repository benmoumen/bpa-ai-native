import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for binding a registration to a role
 */
export class BindRegistrationDto {
  @ApiPropertyOptional({
    description:
      'Whether this role issues the final result for this registration',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  finalResultIssued?: boolean;
}

/**
 * DTO for updating a role-registration binding
 */
export class UpdateRoleRegistrationDto {
  @ApiProperty({
    description:
      'Whether this role issues the final result for this registration',
  })
  @IsBoolean()
  finalResultIssued!: boolean;
}

/**
 * Response DTO for role-registration binding
 */
export class RoleRegistrationResponseDto {
  @ApiProperty({ description: 'Unique identifier for the binding' })
  id!: string;

  @ApiProperty({ description: 'Role ID' })
  roleId!: string;

  @ApiProperty({ description: 'Registration ID' })
  registrationId!: string;

  @ApiProperty({ description: 'Registration name' })
  registrationName!: string;

  @ApiProperty({ description: 'Registration key' })
  registrationKey!: string;

  @ApiProperty({
    description:
      'Whether this role issues the final result for this registration',
  })
  finalResultIssued!: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: string;
}

/**
 * Response DTO for listing available registrations for binding
 */
export class RegistrationForBindingDto {
  @ApiProperty({ description: 'Registration ID' })
  id!: string;

  @ApiProperty({ description: 'Registration name' })
  name!: string;

  @ApiProperty({ description: 'Registration key' })
  key!: string;

  @ApiProperty({
    description: 'Whether this registration is bound to the role',
  })
  isBound!: boolean;

  @ApiPropertyOptional({
    description: 'Binding ID if bound',
  })
  bindingId?: string;

  @ApiPropertyOptional({
    description: 'Whether this role issues the final result (if bound)',
  })
  finalResultIssued?: boolean;
}

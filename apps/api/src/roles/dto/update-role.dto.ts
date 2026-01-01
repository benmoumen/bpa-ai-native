import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

/**
 * DTO for updating a role
 * All fields are optional (partial update)
 * roleType cannot be changed after creation
 */
export class UpdateRoleDto extends PartialType(
  OmitType(CreateRoleDto, ['roleType'] as const),
) {}

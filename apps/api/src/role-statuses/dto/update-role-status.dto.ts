import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRoleStatusDto } from './create-role-status.dto';

/**
 * DTO for updating a role status
 * All fields are optional (partial update)
 * code cannot be changed after creation
 */
export class UpdateRoleStatusDto extends PartialType(
  OmitType(CreateRoleStatusDto, ['code'] as const),
) {}

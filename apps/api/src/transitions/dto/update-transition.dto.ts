import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateTransitionDto } from './create-transition.dto';

/**
 * DTO for updating a transition
 * All fields are optional (partial update)
 * fromStatusId and toRoleId cannot be changed after creation
 */
export class UpdateTransitionDto extends PartialType(
  OmitType(CreateTransitionDto, ['fromStatusId', 'toRoleId'] as const),
) {}

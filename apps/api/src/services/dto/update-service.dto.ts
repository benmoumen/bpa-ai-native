import { PartialType } from '@nestjs/swagger';
import { CreateServiceDto } from './create-service.dto';

/**
 * DTO for updating a service
 * All fields are optional (partial update)
 *
 * NOTE: Status is NOT included here by design. Service status changes
 * must use dedicated lifecycle endpoints (publish, archive, restore)
 * to ensure proper state machine transitions and validation.
 */
export class UpdateServiceDto extends PartialType(CreateServiceDto) {}

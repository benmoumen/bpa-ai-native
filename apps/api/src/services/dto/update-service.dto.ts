import { PartialType } from '@nestjs/swagger';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ServiceStatus } from '@bpa/db';
import { CreateServiceDto } from './create-service.dto';

/**
 * DTO for updating a service
 * All fields are optional (partial update)
 * Includes status field for workflow state changes
 */
export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @ApiPropertyOptional({
    description: 'Service status',
    enum: ServiceStatus,
    example: 'PUBLISHED',
  })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus;
}

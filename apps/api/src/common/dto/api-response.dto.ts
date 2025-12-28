import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Standard API error response format
 */
export class ApiErrorDto {
  @ApiProperty({ description: 'Error code for client handling' })
  code!: string;

  @ApiProperty({ description: 'Human-readable error message' })
  message!: string;

  @ApiProperty({ description: 'Unique request ID for tracking' })
  requestId!: string;

  @ApiPropertyOptional({ description: 'Additional error details' })
  details?: Record<string, unknown>;
}

export class ApiErrorResponseDto {
  @ApiProperty({ type: ApiErrorDto })
  error!: ApiErrorDto;
}

/**
 * Standard pagination metadata
 */
export class PaginationMetaDto {
  @ApiPropertyOptional({ description: 'Total number of items' })
  total?: number;

  @ApiPropertyOptional({ description: 'Current page number' })
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  perPage?: number;

  @ApiPropertyOptional({ description: 'Response timestamp' })
  timestamp?: string;
}

/**
 * Generic API response wrapper
 * All successful responses follow this format
 */
export class ApiResponseDto<T> {
  @ApiProperty({ description: 'Response data' })
  data!: T;

  @ApiPropertyOptional({
    type: PaginationMetaDto,
    description: 'Response metadata',
  })
  meta?: PaginationMetaDto;
}

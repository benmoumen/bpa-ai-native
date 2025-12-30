/**
 * UUID Validation Pipe
 *
 * Validates that route parameters are valid UUIDs
 * Provides clear error messages for invalid UUIDs
 */

import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException(
        `${metadata.data || 'Parameter'} is required`,
      );
    }

    if (!UUID_REGEX.test(value)) {
      throw new BadRequestException(
        `${metadata.data || 'Parameter'} must be a valid UUID`,
      );
    }

    return value;
  }
}

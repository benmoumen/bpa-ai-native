import {
  ValidationPipe as NestValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';

/**
 * Default validation pipe configuration for the API.
 *
 * Features:
 * - Automatic transformation of payloads to DTO instances
 * - Whitelist mode: strips properties not defined in DTO
 * - forbidNonWhitelisted: throws error if unknown properties are present
 * - Detailed validation error messages
 */
export const validationPipeOptions: ValidationPipeOptions = {
  // Transform payloads to DTO class instances
  transform: true,

  // Transform primitive types (e.g., string "1" to number 1)
  transformOptions: {
    enableImplicitConversion: true,
  },

  // Strip properties that don't have decorators
  whitelist: true,

  // Throw error if non-whitelisted properties are present
  forbidNonWhitelisted: true,

  // Validate all properties, not just those with decorators
  skipMissingProperties: false,

  // Return detailed validation errors
  disableErrorMessages: false,

  // Stop at first error (set to false for all errors)
  stopAtFirstError: false,
};

/**
 * Creates a configured ValidationPipe instance.
 * Use this function to create the pipe with consistent settings.
 */
export function createValidationPipe(): NestValidationPipe {
  return new NestValidationPipe(validationPipeOptions);
}

/**
 * Pre-configured ValidationPipe for use with @UsePipes() decorator
 */
export class ValidationPipe extends NestValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      ...validationPipeOptions,
      ...options,
    });
  }
}

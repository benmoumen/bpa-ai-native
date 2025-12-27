/**
 * Public Route Decorator
 *
 * Mark routes as public (no authentication required)
 * Use @Public() on controllers or route handlers
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

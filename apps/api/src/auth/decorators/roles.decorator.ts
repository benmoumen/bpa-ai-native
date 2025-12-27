/**
 * Roles Decorator
 *
 * Define required roles for route access
 * Use @Roles('SERVICE_DESIGNER', 'COUNTRY_ADMIN') on routes
 */

import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '@bpa/types';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

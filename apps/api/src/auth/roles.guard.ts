/**
 * Roles Guard
 *
 * Validates user has required roles for route access
 * Use with @Roles() decorator
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser, UserRole } from '@bpa/types';
import { ROLES_KEY } from './decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No roles required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      this.logger.debug('No user found in request');
      throw new ForbiddenException('Access denied');
    }

    // Ensure roles array exists - if missing, user object is malformed
    if (!Array.isArray(user.roles)) {
      this.logger.warn(
        `User ${user.email} has malformed roles property: ${typeof user.roles}`,
      );
      throw new ForbiddenException('Invalid user context');
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!hasRole) {
      this.logger.debug(
        `User ${user.email} lacks required roles: ${requiredRoles.join(', ')}`,
      );
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}

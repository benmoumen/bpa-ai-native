/**
 * Current User Decorator
 *
 * Extract authenticated user from request
 * Use @CurrentUser() in route handlers
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '@bpa/types';

export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthUser | undefined,
    ctx: ExecutionContext,
  ): AuthUser | AuthUser[keyof AuthUser] | undefined => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    // If specific property requested, return just that
    if (data) {
      return user?.[data];
    }

    return user;
  },
);

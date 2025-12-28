/**
 * JWT Authentication Guard
 *
 * Protects routes requiring authentication
 * Use @UseGuards(JwtAuthGuard) on controllers or routes
 */

import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser | false,
    info: Error | undefined,
  ): TUser {
    // Log authentication attempts for debugging
    if (err || !user) {
      this.logger.debug(
        `Authentication failed: ${info?.message || err?.message || 'No user'}`,
      );
      throw err || new UnauthorizedException('Authentication required');
    }

    return user;
  }
}

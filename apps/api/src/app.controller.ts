import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public, CurrentUser } from './auth';
import type { AuthUser } from '@bpa/types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get current authenticated user info
   * Requires valid JWT token
   */
  @Get('me')
  getMe(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}

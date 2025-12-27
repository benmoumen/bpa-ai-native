import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule, JwtAuthGuard, RolesGuard } from './auth';

@Module({
  imports: [
    // Global configuration from environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Authentication module
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global JWT auth guard - all routes protected by default
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global roles guard for role-based access
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

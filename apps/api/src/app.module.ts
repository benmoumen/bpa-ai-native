import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule, JwtAuthGuard, RolesGuard } from './auth';
import { PrismaModule } from './prisma';
import { HealthModule } from './health';
import { ServicesModule } from './services';
import { RegistrationsModule } from './registrations';

@Module({
  imports: [
    // Global configuration from environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Database module (global)
    PrismaModule,
    // Authentication module
    AuthModule,
    // Health check module
    HealthModule,
    // Services module
    ServicesModule,
    // Registrations module
    RegistrationsModule,
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

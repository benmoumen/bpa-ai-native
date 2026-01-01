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
import { TemplatesModule } from './templates';
import { RequirementsModule } from './requirements';
import { DocumentRequirementsModule } from './document-requirements';
import { CostsModule } from './costs';
import { FormsModule } from './forms';
import { FormSectionsModule } from './form-sections';
import { FormFieldsModule } from './form-fields';
import { DeterminantsModule } from './determinants';

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
    // Templates module (public read-only)
    TemplatesModule,
    // Requirements module (global requirement library)
    RequirementsModule,
    // Document Requirements module (link requirements to registrations)
    DocumentRequirementsModule,
    // Costs module (registration costs)
    CostsModule,
    // Forms module
    FormsModule,
    // Form Sections module
    FormSectionsModule,
    // Form Fields module
    FormFieldsModule,
    // Determinants module
    DeterminantsModule,
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

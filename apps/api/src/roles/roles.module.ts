import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { WorkflowValidationService } from './workflow-validation.service';
import { RoleRegistrationsService } from './role-registrations.service';
import {
  RoleRegistrationsController,
  RoleRegistrationBindingsController,
} from './role-registrations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    RolesController,
    RoleRegistrationsController,
    RoleRegistrationBindingsController,
  ],
  providers: [
    RolesService,
    WorkflowValidationService,
    RoleRegistrationsService,
  ],
  exports: [RolesService, WorkflowValidationService, RoleRegistrationsService],
})
export class RolesModule {}

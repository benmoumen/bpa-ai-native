import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { WorkflowValidationService } from './workflow-validation.service';
import { RoleRegistrationsService } from './role-registrations.service';
import { RoleInstitutionsService } from './role-institutions.service';
import {
  RoleRegistrationsController,
  RoleRegistrationBindingsController,
} from './role-registrations.controller';
import { RoleInstitutionsController } from './role-institutions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    RolesController,
    RoleRegistrationsController,
    RoleRegistrationBindingsController,
    RoleInstitutionsController,
  ],
  providers: [
    RolesService,
    WorkflowValidationService,
    RoleRegistrationsService,
    RoleInstitutionsService,
  ],
  exports: [
    RolesService,
    WorkflowValidationService,
    RoleRegistrationsService,
    RoleInstitutionsService,
  ],
})
export class RolesModule {}

import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { WorkflowValidationService } from './workflow-validation.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RolesController],
  providers: [RolesService, WorkflowValidationService],
  exports: [RolesService, WorkflowValidationService],
})
export class RolesModule {}

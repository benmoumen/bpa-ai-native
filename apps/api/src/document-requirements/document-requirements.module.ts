/**
 * Document Requirements Module
 *
 * Provides CRUD operations for linking global Requirements to Registrations.
 * All endpoints protected by JWT authentication (global guard).
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { DocumentRequirementsController } from './document-requirements.controller';
import { DocumentRequirementsService } from './document-requirements.service';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentRequirementsController],
  providers: [DocumentRequirementsService],
  exports: [DocumentRequirementsService],
})
export class DocumentRequirementsModule {}

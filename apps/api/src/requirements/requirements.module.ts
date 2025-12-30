/**
 * Requirements Module
 *
 * Provides CRUD operations for global document requirement templates.
 * All endpoints protected by JWT authentication (global guard).
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { RequirementsController } from './requirements.controller';
import { RequirementsService } from './requirements.service';

@Module({
  imports: [PrismaModule],
  controllers: [RequirementsController],
  providers: [RequirementsService],
  exports: [RequirementsService],
})
export class RequirementsModule {}

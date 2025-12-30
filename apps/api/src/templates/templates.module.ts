/**
 * Templates Module
 *
 * Provides read-only operations for ServiceTemplate entities
 * Templates are public (no authentication required)
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

@Module({
  imports: [PrismaModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}

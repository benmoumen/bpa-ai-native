/**
 * Forms Module
 *
 * Provides CRUD operations for Form entities within Services
 * All endpoints protected by JWT authentication (global guard)
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { FormsController } from './forms.controller';
import { FormsService } from './forms.service';

@Module({
  imports: [PrismaModule],
  controllers: [FormsController],
  providers: [FormsService],
  exports: [FormsService],
})
export class FormsModule {}

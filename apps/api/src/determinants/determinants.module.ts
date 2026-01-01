/**
 * Determinants Module
 *
 * Provides CRUD operations for Determinant entities within Services
 * All endpoints protected by JWT authentication (global guard)
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { DeterminantsController } from './determinants.controller';
import { DeterminantsService } from './determinants.service';

@Module({
  imports: [PrismaModule],
  controllers: [DeterminantsController],
  providers: [DeterminantsService],
  exports: [DeterminantsService],
})
export class DeterminantsModule {}

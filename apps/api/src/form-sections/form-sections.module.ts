/**
 * FormSections Module
 *
 * Provides CRUD operations for FormSection entities within Forms
 * All endpoints protected by JWT authentication (global guard)
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { FormSectionsController } from './form-sections.controller';
import { FormSectionsService } from './form-sections.service';

@Module({
  imports: [PrismaModule],
  controllers: [FormSectionsController],
  providers: [FormSectionsService],
  exports: [FormSectionsService],
})
export class FormSectionsModule {}

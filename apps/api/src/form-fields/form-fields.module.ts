/**
 * FormFields Module
 *
 * Provides CRUD operations for FormField entities within Forms
 * All endpoints protected by JWT authentication (global guard)
 */

import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { FormFieldsController } from './form-fields.controller';
import { FormFieldsService } from './form-fields.service';

@Module({
  imports: [PrismaModule],
  controllers: [FormFieldsController],
  providers: [FormFieldsService],
  exports: [FormFieldsService],
})
export class FormFieldsModule {}

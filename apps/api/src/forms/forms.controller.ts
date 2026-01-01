/**
 * Forms Controller
 *
 * REST API endpoints for Form CRUD operations
 * All endpoints protected by JWT authentication (global guard)
 *
 * Endpoint structure:
 * - POST   /api/services/:serviceId/forms     - Create form within service
 * - GET    /api/services/:serviceId/forms     - List forms for service
 * - GET    /api/forms/:id                     - Get single form
 * - PATCH  /api/forms/:id                     - Update form
 * - DELETE /api/forms/:id                     - Soft delete form
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { AuthUser } from '@bpa/types';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { ListFormsQueryDto } from './dto/list-forms-query.dto';
import { FormResponseDto } from './dto/form-response.dto';
import { FormSchemaResponseDto } from './dto/form-schema-response.dto';
import { SchemaGeneratorService } from './schema-generator.service';
import { CurrentUser } from '../auth';
import { ParseUUIDPipe } from '../common';

@ApiTags('Forms')
@ApiBearerAuth()
@Controller()
export class FormsController {
  constructor(
    private readonly formsService: FormsService,
    private readonly schemaGeneratorService: SchemaGeneratorService,
  ) {}

  @Post('services/:serviceId/forms')
  @ApiOperation({ summary: 'Create a new form within a service' })
  @ApiParam({ name: 'serviceId', description: 'Parent service ID' })
  @ApiResponse({
    status: 201,
    description: 'Form created successfully',
    type: FormResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({
    status: 409,
    description: 'Form name already exists in this service',
  })
  async create(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() dto: CreateFormDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormResponseDto> {
    const form = await this.formsService.create(serviceId, dto, user.id);
    return FormResponseDto.fromEntity(form);
  }

  @Get('services/:serviceId/forms')
  @ApiOperation({ summary: 'List forms for a service with pagination' })
  @ApiParam({ name: 'serviceId', description: 'Parent service ID' })
  @ApiResponse({
    status: 200,
    description: 'List of forms',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findAllByService(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Query() query: ListFormsQueryDto,
  ): Promise<{
    data: FormResponseDto[];
    meta: {
      total: number;
      page: number;
      perPage: number;
      hasNext: boolean;
    };
  }> {
    const result = await this.formsService.findAllByService(serviceId, query);

    return {
      data: result.forms.map((f) => FormResponseDto.fromEntity(f)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.limit,
        hasNext: result.hasNext,
      },
    };
  }

  @Get('forms/:id')
  @ApiOperation({ summary: 'Get a form by ID' })
  @ApiParam({ name: 'id', description: 'Form ID' })
  @ApiResponse({
    status: 200,
    description: 'Form found',
    type: FormResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FormResponseDto> {
    const form = await this.formsService.findOne(id);
    return FormResponseDto.fromEntity(form);
  }

  @Get('forms/:id/schema')
  @ApiOperation({
    summary: 'Get JSON Schema, UI Schema, and visibility rules for a form',
    description:
      'Generates and returns the JSON Schema (Draft-07), UI Schema for JSON Forms, and visibility rules in JSON Rules Engine format.',
  })
  @ApiParam({ name: 'id', description: 'Form ID' })
  @ApiResponse({
    status: 200,
    description: 'Form schema generated successfully',
    type: FormSchemaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async getSchema(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FormSchemaResponseDto> {
    return this.schemaGeneratorService.generateFormSchema(id);
  }

  @Patch('forms/:id')
  @ApiOperation({ summary: 'Update a form' })
  @ApiParam({ name: 'id', description: 'Form ID' })
  @ApiResponse({
    status: 200,
    description: 'Form updated successfully',
    type: FormResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of parent service' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  @ApiResponse({
    status: 409,
    description: 'Form name already exists in this service',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFormDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormResponseDto> {
    const form = await this.formsService.update(id, dto, user.id);
    return FormResponseDto.fromEntity(form);
  }

  @Delete('forms/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a form (soft delete)' })
  @ApiParam({ name: 'id', description: 'Form ID' })
  @ApiResponse({
    status: 200,
    description: 'Form deactivated successfully',
    type: FormResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of parent service' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<FormResponseDto> {
    const form = await this.formsService.remove(id, user.id);
    return FormResponseDto.fromEntity(form);
  }
}

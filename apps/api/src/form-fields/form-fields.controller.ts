/**
 * FormFields Controller
 *
 * REST API endpoints for FormField CRUD operations
 * All endpoints protected by JWT authentication (global guard)
 *
 * Endpoint structure:
 * - POST   /api/forms/:formId/fields     - Create field within form
 * - GET    /api/forms/:formId/fields     - List fields for form
 * - GET    /api/form-fields/:id          - Get single field
 * - PATCH  /api/form-fields/:id          - Update field
 * - DELETE /api/form-fields/:id          - Soft delete field
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
import { FormFieldsService } from './form-fields.service';
import { CreateFormFieldDto } from './dto/create-form-field.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';
import { ListFormFieldsQueryDto } from './dto/list-form-fields-query.dto';
import { FormFieldResponseDto } from './dto/form-field-response.dto';
import { CurrentUser } from '../auth';
import { ParseUUIDPipe } from '../common';

@ApiTags('Form Fields')
@ApiBearerAuth()
@Controller()
export class FormFieldsController {
  constructor(private readonly formFieldsService: FormFieldsService) {}

  @Post('forms/:formId/fields')
  @ApiOperation({ summary: 'Create a new field within a form' })
  @ApiParam({ name: 'formId', description: 'Parent form ID' })
  @ApiResponse({
    status: 201,
    description: 'Field created successfully',
    type: FormFieldResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Form or section not found' })
  @ApiResponse({
    status: 409,
    description: 'Field name already exists in this form',
  })
  async create(
    @Param('formId', ParseUUIDPipe) formId: string,
    @Body() dto: CreateFormFieldDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormFieldResponseDto> {
    const field = await this.formFieldsService.create(formId, dto, user.id);
    return FormFieldResponseDto.fromEntity(field);
  }

  @Get('forms/:formId/fields')
  @ApiOperation({ summary: 'List fields for a form with pagination' })
  @ApiParam({ name: 'formId', description: 'Parent form ID' })
  @ApiResponse({
    status: 200,
    description: 'List of fields',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async findAllByForm(
    @Param('formId', ParseUUIDPipe) formId: string,
    @Query() query: ListFormFieldsQueryDto,
  ): Promise<{
    data: FormFieldResponseDto[];
    meta: {
      total: number;
      page: number;
      perPage: number;
      hasNext: boolean;
    };
  }> {
    const result = await this.formFieldsService.findAllByForm(formId, query);

    return {
      data: result.fields.map((f) => FormFieldResponseDto.fromEntity(f)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.limit,
        hasNext: result.hasNext,
      },
    };
  }

  @Get('form-fields/:id')
  @ApiOperation({ summary: 'Get a field by ID' })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({
    status: 200,
    description: 'Field found',
    type: FormFieldResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FormFieldResponseDto> {
    const field = await this.formFieldsService.findOne(id);
    return FormFieldResponseDto.fromEntity(field);
  }

  @Patch('form-fields/:id')
  @ApiOperation({ summary: 'Update a field' })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({
    status: 200,
    description: 'Field updated successfully',
    type: FormFieldResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of parent service' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  @ApiResponse({
    status: 409,
    description: 'Field name already exists in this form',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFormFieldDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormFieldResponseDto> {
    const field = await this.formFieldsService.update(id, dto, user.id);
    return FormFieldResponseDto.fromEntity(field);
  }

  @Delete('form-fields/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a field (soft delete)' })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({
    status: 200,
    description: 'Field deactivated successfully',
    type: FormFieldResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of parent service' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<FormFieldResponseDto> {
    const field = await this.formFieldsService.remove(id, user.id);
    return FormFieldResponseDto.fromEntity(field);
  }
}

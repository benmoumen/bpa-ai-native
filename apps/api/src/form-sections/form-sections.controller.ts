/**
 * FormSections Controller
 *
 * REST API endpoints for FormSection CRUD operations
 * All endpoints protected by JWT authentication (global guard)
 *
 * Endpoint structure:
 * - POST   /api/forms/:formId/sections     - Create section within form
 * - GET    /api/forms/:formId/sections     - List sections for form
 * - GET    /api/form-sections/:id          - Get single section
 * - PATCH  /api/form-sections/:id          - Update section
 * - DELETE /api/form-sections/:id          - Soft delete section
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
import { FormSectionsService } from './form-sections.service';
import { CreateFormSectionDto } from './dto/create-form-section.dto';
import { UpdateFormSectionDto } from './dto/update-form-section.dto';
import { ListFormSectionsQueryDto } from './dto/list-form-sections-query.dto';
import { FormSectionResponseDto } from './dto/form-section-response.dto';
import { CurrentUser } from '../auth';
import { ParseUUIDPipe } from '../common';

@ApiTags('Form Sections')
@ApiBearerAuth()
@Controller()
export class FormSectionsController {
  constructor(private readonly formSectionsService: FormSectionsService) {}

  @Post('forms/:formId/sections')
  @ApiOperation({ summary: 'Create a new section within a form' })
  @ApiParam({ name: 'formId', description: 'Parent form ID' })
  @ApiResponse({
    status: 201,
    description: 'Section created successfully',
    type: FormSectionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Form or parent section not found' })
  async create(
    @Param('formId', ParseUUIDPipe) formId: string,
    @Body() dto: CreateFormSectionDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormSectionResponseDto> {
    const section = await this.formSectionsService.create(formId, dto, user.id);
    return FormSectionResponseDto.fromEntity(section);
  }

  @Get('forms/:formId/sections')
  @ApiOperation({ summary: 'List sections for a form with pagination' })
  @ApiParam({ name: 'formId', description: 'Parent form ID' })
  @ApiResponse({
    status: 200,
    description: 'List of sections',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Form not found' })
  async findAllByForm(
    @Param('formId', ParseUUIDPipe) formId: string,
    @Query() query: ListFormSectionsQueryDto,
  ): Promise<{
    data: FormSectionResponseDto[];
    meta: {
      total: number;
      page: number;
      perPage: number;
      hasNext: boolean;
    };
  }> {
    const result = await this.formSectionsService.findAllByForm(formId, query);

    return {
      data: result.sections.map((s) => FormSectionResponseDto.fromEntity(s)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.limit,
        hasNext: result.hasNext,
      },
    };
  }

  @Get('form-sections/:id')
  @ApiOperation({ summary: 'Get a section by ID' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiResponse({
    status: 200,
    description: 'Section found',
    type: FormSectionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FormSectionResponseDto> {
    const section = await this.formSectionsService.findOne(id);
    return FormSectionResponseDto.fromEntity(section);
  }

  @Patch('form-sections/:id')
  @ApiOperation({ summary: 'Update a section' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiResponse({
    status: 200,
    description: 'Section updated successfully',
    type: FormSectionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of parent service' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFormSectionDto,
    @CurrentUser() user: AuthUser,
  ): Promise<FormSectionResponseDto> {
    const section = await this.formSectionsService.update(id, dto, user.id);
    return FormSectionResponseDto.fromEntity(section);
  }

  @Delete('form-sections/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a section (soft delete)' })
  @ApiParam({ name: 'id', description: 'Section ID' })
  @ApiResponse({
    status: 200,
    description: 'Section deactivated successfully',
    type: FormSectionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of parent service' })
  @ApiResponse({ status: 404, description: 'Section not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<FormSectionResponseDto> {
    const section = await this.formSectionsService.remove(id, user.id);
    return FormSectionResponseDto.fromEntity(section);
  }
}

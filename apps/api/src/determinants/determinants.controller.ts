/**
 * Determinants Controller
 *
 * REST API endpoints for Determinant CRUD operations
 * All endpoints protected by JWT authentication (global guard)
 *
 * Endpoint structure:
 * - POST   /api/services/:serviceId/determinants     - Create determinant within service
 * - GET    /api/services/:serviceId/determinants     - List determinants for service
 * - GET    /api/determinants/:id                     - Get single determinant
 * - PATCH  /api/determinants/:id                     - Update determinant
 * - DELETE /api/determinants/:id                     - Soft delete determinant
 * - POST   /api/form-fields/:fieldId/link-determinant - Link field to determinant
 * - DELETE /api/form-fields/:fieldId/link-determinant - Unlink field from determinant
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
import { DeterminantsService } from './determinants.service';
import { CreateDeterminantDto } from './dto/create-determinant.dto';
import { UpdateDeterminantDto } from './dto/update-determinant.dto';
import { ListDeterminantsQueryDto } from './dto/list-determinants-query.dto';
import { DeterminantResponseDto } from './dto/determinant-response.dto';
import { CurrentUser } from '../auth';
import { ParseUUIDPipe } from '../common';

class LinkDeterminantDto {
  determinantId: string;
}

@ApiTags('Determinants')
@ApiBearerAuth()
@Controller()
export class DeterminantsController {
  constructor(private readonly determinantsService: DeterminantsService) {}

  @Post('services/:serviceId/determinants')
  @ApiOperation({ summary: 'Create a new determinant within a service' })
  @ApiParam({ name: 'serviceId', description: 'Parent service ID' })
  @ApiResponse({
    status: 201,
    description: 'Determinant created successfully',
    type: DeterminantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({
    status: 409,
    description: 'Determinant name already exists in this service',
  })
  async create(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() dto: CreateDeterminantDto,
    @CurrentUser() user: AuthUser,
  ): Promise<DeterminantResponseDto> {
    const determinant = await this.determinantsService.create(
      serviceId,
      dto,
      user.id,
    );
    return DeterminantResponseDto.fromEntity(determinant);
  }

  @Get('services/:serviceId/determinants')
  @ApiOperation({ summary: 'List determinants for a service with pagination' })
  @ApiParam({ name: 'serviceId', description: 'Parent service ID' })
  @ApiResponse({
    status: 200,
    description: 'List of determinants',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findAllByService(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Query() query: ListDeterminantsQueryDto,
  ): Promise<{
    data: DeterminantResponseDto[];
    meta: {
      total: number;
      page: number;
      perPage: number;
      hasNext: boolean;
    };
  }> {
    const result = await this.determinantsService.findAllByService(
      serviceId,
      query,
    );

    return {
      data: result.determinants.map((d) =>
        DeterminantResponseDto.fromEntity(d),
      ),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.limit,
        hasNext: result.hasNext,
      },
    };
  }

  @Get('determinants/:id')
  @ApiOperation({ summary: 'Get a determinant by ID' })
  @ApiParam({ name: 'id', description: 'Determinant ID' })
  @ApiResponse({
    status: 200,
    description: 'Determinant found',
    type: DeterminantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Determinant not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeterminantResponseDto> {
    const determinant = await this.determinantsService.findOne(id);
    return DeterminantResponseDto.fromEntity(determinant);
  }

  @Patch('determinants/:id')
  @ApiOperation({ summary: 'Update a determinant' })
  @ApiParam({ name: 'id', description: 'Determinant ID' })
  @ApiResponse({
    status: 200,
    description: 'Determinant updated successfully',
    type: DeterminantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of parent service' })
  @ApiResponse({ status: 404, description: 'Determinant not found' })
  @ApiResponse({
    status: 409,
    description: 'Determinant name already exists in this service',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDeterminantDto,
    @CurrentUser() user: AuthUser,
  ): Promise<DeterminantResponseDto> {
    const determinant = await this.determinantsService.update(id, dto, user.id);
    return DeterminantResponseDto.fromEntity(determinant);
  }

  @Delete('determinants/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a determinant (soft delete)' })
  @ApiParam({ name: 'id', description: 'Determinant ID' })
  @ApiResponse({
    status: 200,
    description: 'Determinant deactivated successfully',
    type: DeterminantResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of parent service' })
  @ApiResponse({ status: 404, description: 'Determinant not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<DeterminantResponseDto> {
    const determinant = await this.determinantsService.remove(id, user.id);
    return DeterminantResponseDto.fromEntity(determinant);
  }

  @Post('form-fields/:fieldId/link-determinant')
  @ApiOperation({ summary: 'Link a form field to a determinant' })
  @ApiParam({ name: 'fieldId', description: 'Form field ID' })
  @ApiResponse({
    status: 200,
    description: 'Field linked to determinant successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of parent service' })
  @ApiResponse({ status: 404, description: 'Field or determinant not found' })
  async linkFieldToDeterminant(
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Body() dto: LinkDeterminantDto,
    @CurrentUser() user: AuthUser,
  ): Promise<{
    field: { id: string; determinantId: string | null };
    determinant: DeterminantResponseDto;
  }> {
    const result = await this.determinantsService.linkFieldToDeterminant(
      fieldId,
      dto.determinantId,
      user.id,
    );
    return {
      field: result.field,
      determinant: DeterminantResponseDto.fromEntity(result.determinant),
    };
  }

  @Delete('form-fields/:fieldId/link-determinant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink a form field from its determinant' })
  @ApiParam({ name: 'fieldId', description: 'Form field ID' })
  @ApiResponse({
    status: 200,
    description: 'Field unlinked from determinant successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of parent service' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  async unlinkFieldFromDeterminant(
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ id: string; determinantId: string | null }> {
    return this.determinantsService.unlinkFieldFromDeterminant(
      fieldId,
      user.id,
    );
  }
}

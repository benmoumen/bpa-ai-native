/**
 * Services Controller
 *
 * REST API endpoints for Service CRUD operations
 * All endpoints protected by JWT authentication (global guard)
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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ListServicesQueryDto } from './dto/list-services-query.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { CurrentUser } from '../auth';
import { ParseUUIDPipe } from '../common';

@ApiTags('Services')
@ApiBearerAuth()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() dto: CreateServiceDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ServiceResponseDto> {
    const service = await this.servicesService.create(dto, user.id);
    return ServiceResponseDto.fromEntity(service);
  }

  @Get()
  @ApiOperation({ summary: 'List services with pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of services',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: ListServicesQueryDto): Promise<{
    data: ServiceResponseDto[];
    meta: {
      total: number;
      page: number;
      perPage: number;
      hasNext: boolean;
    };
  }> {
    const result = await this.servicesService.findAll(query);

    return {
      data: result.services.map((s) => ServiceResponseDto.fromEntity(s)),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.limit,
        hasNext: result.hasNext,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a service by ID' })
  @ApiParam({ name: 'id', description: 'Service ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Service found',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ServiceResponseDto> {
    const service = await this.servicesService.findOne(id);
    return ServiceResponseDto.fromEntity(service);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a service' })
  @ApiParam({ name: 'id', description: 'Service ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ServiceResponseDto> {
    const service = await this.servicesService.update(id, dto, user.id);
    return ServiceResponseDto.fromEntity(service);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a service (soft delete)' })
  @ApiParam({ name: 'id', description: 'Service ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Service archived successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ServiceResponseDto> {
    const service = await this.servicesService.remove(id, user.id);
    return ServiceResponseDto.fromEntity(service);
  }

  @Delete(':id/permanent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Permanently delete a DRAFT service',
    description:
      'Permanently removes a service from the database. Only services with DRAFT status can be permanently deleted. This action cannot be undone.',
  })
  @ApiParam({ name: 'id', description: 'Service ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Service permanently deleted',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the deleted service' },
        deleted: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or service is not in DRAFT status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async deletePermanently(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ id: string; deleted: true }> {
    return this.servicesService.deletePermanently(id, user.id);
  }

  @Post(':id/duplicate')
  @ApiOperation({
    summary: 'Duplicate an existing service',
    description:
      'Creates a copy of the specified service with name "[Original Name] (Copy)" and status DRAFT. The duplicate is independent from the original.',
  })
  @ApiParam({ name: 'id', description: 'ID of the service to duplicate (UUID)' })
  @ApiResponse({
    status: 201,
    description: 'Service duplicated successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Source service not found' })
  async duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ServiceResponseDto> {
    const service = await this.servicesService.duplicate(id, user.id);
    return ServiceResponseDto.fromEntity(service);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publish a DRAFT service',
    description:
      'Transitions a service from DRAFT to PUBLISHED status. Only DRAFT services can be published. Published services are available to applicants.',
  })
  @ApiParam({ name: 'id', description: 'Service ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Service published successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID or service is not in DRAFT status or validation failed',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ServiceResponseDto> {
    const service = await this.servicesService.publish(id, user.id);
    return ServiceResponseDto.fromEntity(service);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archive a PUBLISHED service',
    description:
      'Transitions a service from PUBLISHED to ARCHIVED status. Only PUBLISHED services can be archived. Archived services are no longer available to new applicants, but existing applications continue processing.',
  })
  @ApiParam({ name: 'id', description: 'Service ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Service archived successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID or service is not in PUBLISHED status',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ServiceResponseDto> {
    const service = await this.servicesService.archive(id, user.id);
    return ServiceResponseDto.fromEntity(service);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Restore an ARCHIVED service to DRAFT',
    description:
      'Transitions a service from ARCHIVED to DRAFT status. Only ARCHIVED services can be restored. Restored services can be modified and republished.',
  })
  @ApiParam({ name: 'id', description: 'Service ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Service restored to DRAFT successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID or service is not in ARCHIVED status',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ServiceResponseDto> {
    const service = await this.servicesService.restore(id, user.id);
    return ServiceResponseDto.fromEntity(service);
  }
}

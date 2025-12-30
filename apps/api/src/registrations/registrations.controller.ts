/**
 * Registrations Controller
 *
 * REST API endpoints for Registration CRUD operations
 * All endpoints protected by JWT authentication (global guard)
 *
 * Endpoint structure:
 * - POST   /api/services/:serviceId/registrations     - Create registration within service
 * - GET    /api/services/:serviceId/registrations     - List registrations for service
 * - GET    /api/registrations/:id                     - Get single registration
 * - PATCH  /api/registrations/:id                     - Update registration
 * - DELETE /api/registrations/:id                     - Soft delete registration
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
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { ListRegistrationsQueryDto } from './dto/list-registrations-query.dto';
import { RegistrationResponseDto } from './dto/registration-response.dto';
import { CurrentUser } from '../auth';
import { ParseUUIDPipe } from '../common';

@ApiTags('Registrations')
@ApiBearerAuth()
@Controller()
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post('services/:serviceId/registrations')
  @ApiOperation({ summary: 'Create a new registration within a service' })
  @ApiParam({ name: 'serviceId', description: 'Parent service ID' })
  @ApiResponse({
    status: 201,
    description: 'Registration created successfully',
    type: RegistrationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({
    status: 409,
    description: 'Registration key already exists in this service',
  })
  async create(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() dto: CreateRegistrationDto,
    @CurrentUser() user: AuthUser,
  ): Promise<RegistrationResponseDto> {
    const registration = await this.registrationsService.create(
      serviceId,
      dto,
      user.id,
    );
    return RegistrationResponseDto.fromEntity(registration);
  }

  @Get('services/:serviceId/registrations')
  @ApiOperation({ summary: 'List registrations for a service with pagination' })
  @ApiParam({ name: 'serviceId', description: 'Parent service ID' })
  @ApiResponse({
    status: 200,
    description: 'List of registrations',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findAllByService(
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Query() query: ListRegistrationsQueryDto,
  ): Promise<{
    data: RegistrationResponseDto[];
    meta: {
      total: number;
      page: number;
      perPage: number;
      hasNext: boolean;
    };
  }> {
    const result = await this.registrationsService.findAllByService(
      serviceId,
      query,
    );

    return {
      data: result.registrations.map((r) =>
        RegistrationResponseDto.fromEntity(r),
      ),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.limit,
        hasNext: result.hasNext,
      },
    };
  }

  @Get('registrations/:id')
  @ApiOperation({ summary: 'Get a registration by ID' })
  @ApiParam({ name: 'id', description: 'Registration ID' })
  @ApiResponse({
    status: 200,
    description: 'Registration found',
    type: RegistrationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RegistrationResponseDto> {
    const registration = await this.registrationsService.findOne(id);
    return RegistrationResponseDto.fromEntity(registration);
  }

  @Patch('registrations/:id')
  @ApiOperation({ summary: 'Update a registration' })
  @ApiParam({ name: 'id', description: 'Registration ID' })
  @ApiResponse({
    status: 200,
    description: 'Registration updated successfully',
    type: RegistrationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of parent service' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRegistrationDto,
    @CurrentUser() user: AuthUser,
  ): Promise<RegistrationResponseDto> {
    const registration = await this.registrationsService.update(
      id,
      dto,
      user.id,
    );
    return RegistrationResponseDto.fromEntity(registration);
  }

  @Delete('registrations/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a registration (soft delete)' })
  @ApiParam({ name: 'id', description: 'Registration ID' })
  @ApiResponse({
    status: 200,
    description: 'Registration deactivated successfully',
    type: RegistrationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of parent service' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<RegistrationResponseDto> {
    const registration = await this.registrationsService.remove(id, user.id);
    return RegistrationResponseDto.fromEntity(registration);
  }
}

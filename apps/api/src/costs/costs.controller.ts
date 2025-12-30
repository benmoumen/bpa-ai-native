/**
 * Costs Controller
 *
 * REST API endpoints for managing costs within registrations.
 * All endpoints protected by JWT authentication (global guard).
 *
 * Endpoint structure:
 * - POST   /api/registrations/:registrationId/costs     - Create a cost
 * - GET    /api/registrations/:registrationId/costs     - List costs
 * - PATCH  /api/registrations/:registrationId/costs/:id - Update a cost
 * - DELETE /api/registrations/:registrationId/costs/:id - Delete a cost
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
import { CostsService } from './costs.service';
import { CreateCostDto } from './dto/create-cost.dto';
import { UpdateCostDto } from './dto/update-cost.dto';
import { CostResponseDto } from './dto/cost-response.dto';
import { CurrentUser } from '../auth';
import { ParseUUIDPipe } from '../common';

@ApiTags('Costs')
@ApiBearerAuth()
@Controller('registrations/:registrationId/costs')
export class CostsController {
  constructor(private readonly costsService: CostsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a cost for a registration' })
  @ApiParam({ name: 'registrationId', description: 'Parent registration ID' })
  @ApiResponse({
    status: 201,
    description: 'Cost created successfully',
    type: CostResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async create(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() dto: CreateCostDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CostResponseDto> {
    const cost = await this.costsService.create(registrationId, dto, user.id);
    return CostResponseDto.fromEntity(cost);
  }

  @Get()
  @ApiOperation({ summary: 'List costs for a registration' })
  @ApiParam({ name: 'registrationId', description: 'Parent registration ID' })
  @ApiResponse({
    status: 200,
    description: 'List of costs',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async findAllByRegistration(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
  ): Promise<{
    data: CostResponseDto[];
    meta: { total: number };
  }> {
    const result =
      await this.costsService.findAllByRegistration(registrationId);

    return {
      data: result.costs.map((cost) => CostResponseDto.fromEntity(cost)),
      meta: {
        total: result.total,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a cost by ID' })
  @ApiParam({ name: 'registrationId', description: 'Parent registration ID' })
  @ApiParam({ name: 'id', description: 'Cost ID' })
  @ApiResponse({
    status: 200,
    description: 'Cost found',
    type: CostResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Cost not found' })
  async findOne(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CostResponseDto> {
    const cost = await this.costsService.findOne(id, registrationId);
    return CostResponseDto.fromEntity(cost);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cost' })
  @ApiParam({ name: 'registrationId', description: 'Parent registration ID' })
  @ApiParam({ name: 'id', description: 'Cost ID' })
  @ApiResponse({
    status: 200,
    description: 'Cost updated successfully',
    type: CostResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Cost not found' })
  async update(
    @Param('registrationId', ParseUUIDPipe) _registrationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCostDto,
    @CurrentUser() user: AuthUser,
  ): Promise<CostResponseDto> {
    const cost = await this.costsService.update(id, dto, user.id);
    return CostResponseDto.fromEntity(cost);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a cost' })
  @ApiParam({ name: 'registrationId', description: 'Parent registration ID' })
  @ApiParam({ name: 'id', description: 'Cost ID' })
  @ApiResponse({
    status: 200,
    description: 'Cost deleted successfully',
    type: CostResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Cost not found' })
  async remove(
    @Param('registrationId', ParseUUIDPipe) _registrationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<CostResponseDto> {
    const cost = await this.costsService.remove(id, user.id);
    return CostResponseDto.fromEntity(cost);
  }
}

/**
 * Requirements Controller
 *
 * REST API endpoints for global document requirement template CRUD operations.
 * All endpoints protected by JWT authentication (global guard).
 *
 * Endpoint structure:
 * - POST   /api/requirements     - Create requirement
 * - GET    /api/requirements     - List requirements (paginated)
 * - GET    /api/requirements/:id - Get single requirement
 * - PATCH  /api/requirements/:id - Update requirement
 * - DELETE /api/requirements/:id - Soft delete requirement
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
import { RequirementsService } from './requirements.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { ListRequirementsQueryDto } from './dto/list-requirements-query.dto';
import { RequirementResponseDto } from './dto/requirement-response.dto';
import { ParseUUIDPipe } from '../common';

@ApiTags('Requirements')
@ApiBearerAuth()
@Controller('requirements')
export class RequirementsController {
  constructor(private readonly requirementsService: RequirementsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new global document requirement template',
  })
  @ApiResponse({
    status: 201,
    description: 'Requirement created successfully',
    type: RequirementResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Body() dto: CreateRequirementDto,
  ): Promise<RequirementResponseDto> {
    const requirement = await this.requirementsService.create(dto);
    return RequirementResponseDto.fromEntity(requirement);
  }

  @Get()
  @ApiOperation({ summary: 'List all requirement templates with pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of requirements',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: ListRequirementsQueryDto): Promise<{
    data: RequirementResponseDto[];
    meta: {
      total: number;
      page: number;
      perPage: number;
      hasNext: boolean;
    };
  }> {
    const result = await this.requirementsService.findAll(query);

    return {
      data: result.requirements.map((r) =>
        RequirementResponseDto.fromEntity(r),
      ),
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.limit,
        hasNext: result.hasNext,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a requirement by ID' })
  @ApiParam({ name: 'id', description: 'Requirement ID' })
  @ApiResponse({
    status: 200,
    description: 'Requirement found',
    type: RequirementResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RequirementResponseDto> {
    const requirement = await this.requirementsService.findOne(id);
    return RequirementResponseDto.fromEntity(requirement);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a requirement' })
  @ApiParam({ name: 'id', description: 'Requirement ID' })
  @ApiResponse({
    status: 200,
    description: 'Requirement updated successfully',
    type: RequirementResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRequirementDto,
  ): Promise<RequirementResponseDto> {
    const requirement = await this.requirementsService.update(id, dto);
    return RequirementResponseDto.fromEntity(requirement);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a requirement (soft delete)' })
  @ApiParam({ name: 'id', description: 'Requirement ID' })
  @ApiResponse({
    status: 200,
    description: 'Requirement deactivated successfully',
    type: RequirementResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RequirementResponseDto> {
    const requirement = await this.requirementsService.remove(id);
    return RequirementResponseDto.fromEntity(requirement);
  }
}

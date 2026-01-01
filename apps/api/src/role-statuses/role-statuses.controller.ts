import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { RoleStatusesService } from './role-statuses.service';
import {
  CreateRoleStatusDto,
  UpdateRoleStatusDto,
  RoleStatusResponseDto,
} from './dto';

@ApiTags('role-statuses')
@ApiBearerAuth()
@Controller('roles/:roleId/statuses')
export class RoleStatusesController {
  constructor(private readonly roleStatusesService: RoleStatusesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new status for a role' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 201,
    description: 'Status created successfully',
    type: RoleStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 409, description: 'Status code already exists' })
  create(
    @Param('roleId') roleId: string,
    @Body() dto: CreateRoleStatusDto,
  ): Promise<RoleStatusResponseDto> {
    return this.roleStatusesService.create(roleId, dto);
  }

  @Post('defaults')
  @ApiOperation({ summary: 'Create default 4-status set for a role' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 201,
    description: 'Default statuses created',
    type: [RoleStatusResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  createDefaults(
    @Param('roleId') roleId: string,
  ): Promise<RoleStatusResponseDto[]> {
    return this.roleStatusesService.createDefaults(roleId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all statuses for a role' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'List of statuses',
    type: [RoleStatusResponseDto],
  })
  findAll(@Param('roleId') roleId: string): Promise<RoleStatusResponseDto[]> {
    return this.roleStatusesService.findAll(roleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a status by ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiParam({ name: 'id', description: 'Status ID' })
  @ApiResponse({
    status: 200,
    description: 'Status found',
    type: RoleStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Status not found' })
  findOne(@Param('id') id: string): Promise<RoleStatusResponseDto> {
    return this.roleStatusesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a status' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiParam({ name: 'id', description: 'Status ID' })
  @ApiResponse({
    status: 200,
    description: 'Status updated',
    type: RoleStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Status not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleStatusDto,
  ): Promise<RoleStatusResponseDto> {
    return this.roleStatusesService.update(id, dto);
  }

  @Post(':id/default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a status as the default' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiParam({ name: 'id', description: 'Status ID' })
  @ApiResponse({
    status: 200,
    description: 'Status set as default',
    type: RoleStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Status not found' })
  setDefault(@Param('id') id: string): Promise<RoleStatusResponseDto> {
    return this.roleStatusesService.setDefault(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a status' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiParam({ name: 'id', description: 'Status ID' })
  @ApiResponse({ status: 204, description: 'Status deleted' })
  @ApiResponse({ status: 404, description: 'Status not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.roleStatusesService.remove(id);
  }
}

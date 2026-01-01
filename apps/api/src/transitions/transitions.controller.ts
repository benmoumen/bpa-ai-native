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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TransitionsService } from './transitions.service';
import {
  CreateTransitionDto,
  UpdateTransitionDto,
  TransitionResponseDto,
} from './dto';

@ApiTags('transitions')
@ApiBearerAuth()
@Controller('transitions')
export class TransitionsController {
  constructor(private readonly transitionsService: TransitionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workflow transition' })
  @ApiResponse({
    status: 201,
    description: 'Transition created successfully',
    type: TransitionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Source status or target role not found',
  })
  @ApiResponse({ status: 409, description: 'Transition already exists' })
  create(@Body() dto: CreateTransitionDto): Promise<TransitionResponseDto> {
    return this.transitionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get transitions by service ID' })
  @ApiQuery({ name: 'serviceId', required: true, description: 'Service ID' })
  @ApiResponse({
    status: 200,
    description: 'List of transitions',
    type: [TransitionResponseDto],
  })
  findByService(
    @Query('serviceId') serviceId: string,
  ): Promise<TransitionResponseDto[]> {
    return this.transitionsService.findByService(serviceId);
  }

  @Get('from-status/:statusId')
  @ApiOperation({ summary: 'Get transitions from a specific status' })
  @ApiParam({ name: 'statusId', description: 'Source status ID' })
  @ApiResponse({
    status: 200,
    description: 'List of transitions',
    type: [TransitionResponseDto],
  })
  findFromStatus(
    @Param('statusId') statusId: string,
  ): Promise<TransitionResponseDto[]> {
    return this.transitionsService.findFromStatus(statusId);
  }

  @Get('to-role/:roleId')
  @ApiOperation({ summary: 'Get transitions to a specific role' })
  @ApiParam({ name: 'roleId', description: 'Target role ID' })
  @ApiResponse({
    status: 200,
    description: 'List of transitions',
    type: [TransitionResponseDto],
  })
  findToRole(
    @Param('roleId') roleId: string,
  ): Promise<TransitionResponseDto[]> {
    return this.transitionsService.findToRole(roleId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transition by ID' })
  @ApiParam({ name: 'id', description: 'Transition ID' })
  @ApiResponse({
    status: 200,
    description: 'Transition found',
    type: TransitionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transition not found' })
  findOne(@Param('id') id: string): Promise<TransitionResponseDto> {
    return this.transitionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a transition' })
  @ApiParam({ name: 'id', description: 'Transition ID' })
  @ApiResponse({
    status: 200,
    description: 'Transition updated',
    type: TransitionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transition not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTransitionDto,
  ): Promise<TransitionResponseDto> {
    return this.transitionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a transition' })
  @ApiParam({ name: 'id', description: 'Transition ID' })
  @ApiResponse({ status: 204, description: 'Transition deleted' })
  @ApiResponse({ status: 404, description: 'Transition not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.transitionsService.remove(id);
  }
}

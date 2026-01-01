import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InstitutionsService } from './institutions.service';
import {
  CreateInstitutionDto,
  UpdateInstitutionDto,
  InstitutionResponseDto,
} from './dto/institution.dto';

@ApiTags('Institutions')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all institutions' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Include inactive institutions',
  })
  @ApiResponse({
    status: 200,
    description: 'List of institutions',
    type: [InstitutionResponseDto],
  })
  findAll(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<InstitutionResponseDto[]> {
    return this.institutionsService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get institution by ID' })
  @ApiResponse({
    status: 200,
    description: 'Institution details',
    type: InstitutionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Institution not found',
  })
  findOne(@Param('id') id: string): Promise<InstitutionResponseDto> {
    return this.institutionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new institution' })
  @ApiResponse({
    status: 201,
    description: 'Institution created',
    type: InstitutionResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Institution with code already exists',
  })
  create(@Body() dto: CreateInstitutionDto): Promise<InstitutionResponseDto> {
    return this.institutionsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an institution' })
  @ApiResponse({
    status: 200,
    description: 'Institution updated',
    type: InstitutionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Institution not found',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInstitutionDto,
  ): Promise<InstitutionResponseDto> {
    return this.institutionsService.update(id, dto);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed demo institutions' })
  @ApiResponse({
    status: 201,
    description: 'Demo institutions seeded',
    type: [InstitutionResponseDto],
  })
  seedDemo(): Promise<InstitutionResponseDto[]> {
    return this.institutionsService.seedDemoInstitutions();
  }
}

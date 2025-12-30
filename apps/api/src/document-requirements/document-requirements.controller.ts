/**
 * Document Requirements Controller
 *
 * REST API endpoints for linking Requirements to Registrations.
 * All endpoints protected by JWT authentication (global guard).
 *
 * Endpoint structure:
 * - POST   /api/registrations/:registrationId/documents     - Add document requirement
 * - GET    /api/registrations/:registrationId/documents     - List document requirements
 * - PATCH  /api/registrations/:registrationId/documents/:id - Update document requirement
 * - DELETE /api/registrations/:registrationId/documents/:id - Remove document requirement
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
import { DocumentRequirementsService } from './document-requirements.service';
import { CreateDocumentRequirementDto } from './dto/create-document-requirement.dto';
import { UpdateDocumentRequirementDto } from './dto/update-document-requirement.dto';
import { DocumentRequirementResponseDto } from './dto/document-requirement-response.dto';
import { CurrentUser } from '../auth';
import { ParseUUIDPipe } from '../common';

@ApiTags('Document Requirements')
@ApiBearerAuth()
@Controller('registrations/:registrationId/documents')
export class DocumentRequirementsController {
  constructor(
    private readonly documentRequirementsService: DocumentRequirementsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Add a document requirement to a registration' })
  @ApiParam({ name: 'registrationId', description: 'Parent registration ID' })
  @ApiResponse({
    status: 201,
    description: 'Document requirement added successfully',
    type: DocumentRequirementResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({
    status: 404,
    description: 'Registration or requirement not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Requirement already linked to registration',
  })
  async create(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() dto: CreateDocumentRequirementDto,
    @CurrentUser() user: AuthUser,
  ): Promise<DocumentRequirementResponseDto> {
    const documentRequirement = await this.documentRequirementsService.create(
      registrationId,
      dto,
      user.id,
    );
    return DocumentRequirementResponseDto.fromEntity(documentRequirement);
  }

  @Get()
  @ApiOperation({ summary: 'List document requirements for a registration' })
  @ApiParam({ name: 'registrationId', description: 'Parent registration ID' })
  @ApiResponse({
    status: 200,
    description: 'List of document requirements',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async findAllByRegistration(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
  ): Promise<{
    data: DocumentRequirementResponseDto[];
    meta: { total: number };
  }> {
    const result =
      await this.documentRequirementsService.findAllByRegistration(
        registrationId,
      );

    return {
      data: result.documentRequirements.map((dr) =>
        DocumentRequirementResponseDto.fromEntity(dr),
      ),
      meta: {
        total: result.total,
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document requirement by ID' })
  @ApiParam({ name: 'registrationId', description: 'Parent registration ID' })
  @ApiParam({ name: 'id', description: 'Document requirement ID' })
  @ApiResponse({
    status: 200,
    description: 'Document requirement found',
    type: DocumentRequirementResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Document requirement not found' })
  async findOne(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DocumentRequirementResponseDto> {
    const documentRequirement =
      await this.documentRequirementsService.findOne(id, registrationId);
    return DocumentRequirementResponseDto.fromEntity(documentRequirement);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a document requirement' })
  @ApiParam({ name: 'registrationId', description: 'Parent registration ID' })
  @ApiParam({ name: 'id', description: 'Document requirement ID' })
  @ApiResponse({
    status: 200,
    description: 'Document requirement updated successfully',
    type: DocumentRequirementResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Document requirement not found' })
  async update(
    @Param('registrationId', ParseUUIDPipe) _registrationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDocumentRequirementDto,
    @CurrentUser() user: AuthUser,
  ): Promise<DocumentRequirementResponseDto> {
    const documentRequirement = await this.documentRequirementsService.update(
      id,
      dto,
      user.id,
    );
    return DocumentRequirementResponseDto.fromEntity(documentRequirement);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a document requirement from registration' })
  @ApiParam({ name: 'registrationId', description: 'Parent registration ID' })
  @ApiParam({ name: 'id', description: 'Document requirement ID' })
  @ApiResponse({
    status: 200,
    description: 'Document requirement removed successfully',
    type: DocumentRequirementResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID format' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not owner of service' })
  @ApiResponse({ status: 404, description: 'Document requirement not found' })
  async remove(
    @Param('registrationId', ParseUUIDPipe) _registrationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ): Promise<DocumentRequirementResponseDto> {
    const documentRequirement = await this.documentRequirementsService.remove(
      id,
      user.id,
    );
    return DocumentRequirementResponseDto.fromEntity(documentRequirement);
  }
}

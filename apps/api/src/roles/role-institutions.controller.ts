import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RoleInstitutionsService } from './role-institutions.service';
import {
  RoleInstitutionResponseDto,
  InstitutionForAssignmentDto,
} from './dto/role-institution.dto';

@ApiTags('Role Institutions')
@Controller('services/:serviceId/roles/:roleId/institutions')
export class RoleInstitutionsController {
  constructor(
    private readonly roleInstitutionsService: RoleInstitutionsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all institutions with assignment status for a role',
  })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'List of institutions with assignment status',
    type: [InstitutionForAssignmentDto],
  })
  getInstitutionsForRole(
    @Param('serviceId') serviceId: string,
    @Param('roleId') roleId: string,
  ): Promise<InstitutionForAssignmentDto[]> {
    return this.roleInstitutionsService.getInstitutionsForRole(
      serviceId,
      roleId,
    );
  }

  @Get('assignments')
  @ApiOperation({ summary: 'List only assigned institutions for a role' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'List of assigned institutions',
    type: [RoleInstitutionResponseDto],
  })
  getAssignmentsForRole(
    @Param('serviceId') serviceId: string,
    @Param('roleId') roleId: string,
  ): Promise<RoleInstitutionResponseDto[]> {
    return this.roleInstitutionsService.getAssignmentsForRole(
      serviceId,
      roleId,
    );
  }

  @Post(':institutionId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign an institution to a role' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiParam({ name: 'institutionId', description: 'Institution ID to assign' })
  @ApiResponse({
    status: 201,
    description: 'Institution assigned to role',
    type: RoleInstitutionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Role or institution not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Institution already assigned to role',
  })
  assignInstitution(
    @Param('serviceId') serviceId: string,
    @Param('roleId') roleId: string,
    @Param('institutionId') institutionId: string,
  ): Promise<RoleInstitutionResponseDto> {
    return this.roleInstitutionsService.assignInstitution(
      serviceId,
      roleId,
      institutionId,
    );
  }

  @Delete(':institutionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unassign an institution from a role' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiParam({
    name: 'institutionId',
    description: 'Institution ID to unassign',
  })
  @ApiResponse({
    status: 204,
    description: 'Institution unassigned from role',
  })
  @ApiResponse({
    status: 404,
    description: 'Role or assignment not found',
  })
  unassignInstitution(
    @Param('serviceId') serviceId: string,
    @Param('roleId') roleId: string,
    @Param('institutionId') institutionId: string,
  ): Promise<void> {
    return this.roleInstitutionsService.unassignInstitution(
      serviceId,
      roleId,
      institutionId,
    );
  }
}

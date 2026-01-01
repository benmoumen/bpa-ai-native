import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { RoleRegistrationsService } from './role-registrations.service';
import {
  BindRegistrationDto,
  UpdateRoleRegistrationDto,
  RoleRegistrationResponseDto,
  RegistrationForBindingDto,
} from './dto/role-registration.dto';

@ApiTags('Role Registrations')
@Controller('services/:serviceId/roles/:roleId/registrations')
export class RoleRegistrationsController {
  constructor(
    private readonly roleRegistrationsService: RoleRegistrationsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List all registrations with binding status for a role',
  })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'List of registrations with binding status',
    type: [RegistrationForBindingDto],
  })
  getRegistrationsForRole(
    @Param('serviceId') serviceId: string,
    @Param('roleId') roleId: string,
  ): Promise<RegistrationForBindingDto[]> {
    return this.roleRegistrationsService.getRegistrationsForRole(
      serviceId,
      roleId,
    );
  }

  @Get('bindings')
  @ApiOperation({ summary: 'List only bound registrations for a role' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiResponse({
    status: 200,
    description: 'List of bound registrations',
    type: [RoleRegistrationResponseDto],
  })
  getBindingsForRole(
    @Param('serviceId') serviceId: string,
    @Param('roleId') roleId: string,
  ): Promise<RoleRegistrationResponseDto[]> {
    return this.roleRegistrationsService.getBindingsForRole(serviceId, roleId);
  }

  @Post(':registrationId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Bind a registration to a role' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiParam({ name: 'registrationId', description: 'Registration ID to bind' })
  @ApiResponse({
    status: 201,
    description: 'Registration bound to role',
    type: RoleRegistrationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Role or registration not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Registration already bound to role',
  })
  bindRegistration(
    @Param('serviceId') serviceId: string,
    @Param('roleId') roleId: string,
    @Param('registrationId') registrationId: string,
    @Body() dto: BindRegistrationDto,
  ): Promise<RoleRegistrationResponseDto> {
    return this.roleRegistrationsService.bindRegistration(
      serviceId,
      roleId,
      registrationId,
      dto.finalResultIssued ?? false,
    );
  }

  @Delete(':registrationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unbind a registration from a role' })
  @ApiParam({ name: 'serviceId', description: 'Service ID' })
  @ApiParam({ name: 'roleId', description: 'Role ID' })
  @ApiParam({
    name: 'registrationId',
    description: 'Registration ID to unbind',
  })
  @ApiResponse({
    status: 204,
    description: 'Registration unbound from role',
  })
  @ApiResponse({
    status: 404,
    description: 'Role or binding not found',
  })
  unbindRegistration(
    @Param('serviceId') serviceId: string,
    @Param('roleId') roleId: string,
    @Param('registrationId') registrationId: string,
  ): Promise<void> {
    return this.roleRegistrationsService.unbindRegistration(
      serviceId,
      roleId,
      registrationId,
    );
  }
}

@ApiTags('Role Registrations')
@Controller('role-registrations')
export class RoleRegistrationBindingsController {
  constructor(
    private readonly roleRegistrationsService: RoleRegistrationsService,
  ) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role-registration binding' })
  @ApiParam({ name: 'id', description: 'Binding ID' })
  @ApiResponse({
    status: 200,
    description: 'Binding updated',
    type: RoleRegistrationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Binding not found',
  })
  updateBinding(
    @Param('id') id: string,
    @Body() dto: UpdateRoleRegistrationDto,
  ): Promise<RoleRegistrationResponseDto> {
    return this.roleRegistrationsService.updateBinding(
      id,
      dto.finalResultIssued,
    );
  }
}

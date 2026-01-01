import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RoleRegistrationResponseDto,
  RegistrationForBindingDto,
} from './dto/role-registration.dto';

@Injectable()
export class RoleRegistrationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all registrations in the service with their binding status for a role
   */
  async getRegistrationsForRole(
    serviceId: string,
    roleId: string,
  ): Promise<RegistrationForBindingDto[]> {
    // Verify role exists and belongs to service
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, serviceId },
    });

    if (!role) {
      throw new NotFoundException(
        `Role ${roleId} not found in service ${serviceId}`,
      );
    }

    // Get all registrations in the service
    const registrations = await this.prisma.registration.findMany({
      where: { serviceId },
      orderBy: { createdAt: 'asc' },
    });

    // Get existing bindings for this role
    const bindings = await this.prisma.roleRegistration.findMany({
      where: { roleId },
    });

    const bindingMap = new Map(bindings.map((b) => [b.registrationId, b]));

    return registrations.map((reg) => {
      const binding = bindingMap.get(reg.id);
      return {
        id: reg.id,
        name: reg.name,
        key: reg.key,
        isBound: !!binding,
        bindingId: binding?.id,
        finalResultIssued: binding?.finalResultIssued,
      };
    });
  }

  /**
   * Get bindings for a role
   */
  async getBindingsForRole(
    serviceId: string,
    roleId: string,
  ): Promise<RoleRegistrationResponseDto[]> {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, serviceId },
    });

    if (!role) {
      throw new NotFoundException(
        `Role ${roleId} not found in service ${serviceId}`,
      );
    }

    const bindings = await this.prisma.roleRegistration.findMany({
      where: { roleId },
      include: {
        registration: {
          select: { name: true, key: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return bindings.map((b) => ({
      id: b.id,
      roleId: b.roleId,
      registrationId: b.registrationId,
      registrationName: b.registration.name,
      registrationKey: b.registration.key,
      finalResultIssued: b.finalResultIssued,
      createdAt: b.createdAt.toISOString(),
    }));
  }

  /**
   * Bind a registration to a role
   */
  async bindRegistration(
    serviceId: string,
    roleId: string,
    registrationId: string,
    finalResultIssued: boolean = false,
  ): Promise<RoleRegistrationResponseDto> {
    // Verify role exists and belongs to service
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, serviceId },
    });

    if (!role) {
      throw new NotFoundException(
        `Role ${roleId} not found in service ${serviceId}`,
      );
    }

    // Verify registration exists and belongs to service
    const registration = await this.prisma.registration.findFirst({
      where: { id: registrationId, serviceId },
    });

    if (!registration) {
      throw new NotFoundException(
        `Registration ${registrationId} not found in service ${serviceId}`,
      );
    }

    // Check if binding already exists
    const existing = await this.prisma.roleRegistration.findUnique({
      where: {
        roleId_registrationId: { roleId, registrationId },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Registration ${registrationId} is already bound to role ${roleId}`,
      );
    }

    const binding = await this.prisma.roleRegistration.create({
      data: {
        roleId,
        registrationId,
        finalResultIssued,
      },
      include: {
        registration: {
          select: { name: true, key: true },
        },
      },
    });

    return {
      id: binding.id,
      roleId: binding.roleId,
      registrationId: binding.registrationId,
      registrationName: binding.registration.name,
      registrationKey: binding.registration.key,
      finalResultIssued: binding.finalResultIssued,
      createdAt: binding.createdAt.toISOString(),
    };
  }

  /**
   * Unbind a registration from a role
   */
  async unbindRegistration(
    serviceId: string,
    roleId: string,
    registrationId: string,
  ): Promise<void> {
    // Verify role exists and belongs to service
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, serviceId },
    });

    if (!role) {
      throw new NotFoundException(
        `Role ${roleId} not found in service ${serviceId}`,
      );
    }

    const binding = await this.prisma.roleRegistration.findUnique({
      where: {
        roleId_registrationId: { roleId, registrationId },
      },
    });

    if (!binding) {
      throw new NotFoundException(
        `Binding not found for registration ${registrationId} and role ${roleId}`,
      );
    }

    await this.prisma.roleRegistration.delete({
      where: { id: binding.id },
    });
  }

  /**
   * Update a role-registration binding
   */
  async updateBinding(
    bindingId: string,
    finalResultIssued: boolean,
  ): Promise<RoleRegistrationResponseDto> {
    const binding = await this.prisma.roleRegistration.findUnique({
      where: { id: bindingId },
    });

    if (!binding) {
      throw new NotFoundException(`Binding ${bindingId} not found`);
    }

    const updated = await this.prisma.roleRegistration.update({
      where: { id: bindingId },
      data: { finalResultIssued },
      include: {
        registration: {
          select: { name: true, key: true },
        },
      },
    });

    return {
      id: updated.id,
      roleId: updated.roleId,
      registrationId: updated.registrationId,
      registrationName: updated.registration.name,
      registrationKey: updated.registration.key,
      finalResultIssued: updated.finalResultIssued,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}

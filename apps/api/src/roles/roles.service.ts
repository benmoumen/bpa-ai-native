import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@bpa/db';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto, RoleResponseDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new role within a service
   */
  async create(
    serviceId: string,
    dto: CreateRoleDto,
  ): Promise<RoleResponseDto> {
    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    const role = await this.prisma.role.create({
      data: {
        serviceId,
        roleType: dto.roleType,
        name: dto.name,
        shortName: dto.shortName,
        description: dto.description,
        isStartRole: dto.isStartRole ?? false,
        sortOrder: dto.sortOrder ?? 100,
        conditions: dto.conditions as Prisma.InputJsonValue | undefined,
        formId: dto.formId,
        retryEnabled: dto.retryEnabled,
        retryIntervalMinutes: dto.retryIntervalMinutes,
        timeoutMinutes: dto.timeoutMinutes,
      },
    });

    return RoleResponseDto.fromEntity(role);
  }

  /**
   * Find all roles for a service
   */
  async findAll(serviceId: string): Promise<RoleResponseDto[]> {
    const roles = await this.prisma.role.findMany({
      where: { serviceId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return roles.map((role) => RoleResponseDto.fromEntity(role));
  }

  /**
   * Find a single role by ID
   */
  async findOne(id: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return RoleResponseDto.fromEntity(role);
  }

  /**
   * Update a role
   */
  async update(id: string, dto: UpdateRoleDto): Promise<RoleResponseDto> {
    // Verify role exists
    await this.findOne(id);

    const role = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        shortName: dto.shortName,
        description: dto.description,
        isStartRole: dto.isStartRole,
        sortOrder: dto.sortOrder,
        conditions: dto.conditions as Prisma.InputJsonValue | undefined,
        formId: dto.formId,
        retryEnabled: dto.retryEnabled,
        retryIntervalMinutes: dto.retryIntervalMinutes,
        timeoutMinutes: dto.timeoutMinutes,
      },
    });

    return RoleResponseDto.fromEntity(role);
  }

  /**
   * Soft delete a role (set isActive = false)
   */
  async remove(id: string): Promise<void> {
    // Verify role exists
    await this.findOne(id);

    await this.prisma.role.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Get the start role for a service
   */
  async findStartRole(serviceId: string): Promise<RoleResponseDto | null> {
    const role = await this.prisma.role.findFirst({
      where: { serviceId, isStartRole: true, isActive: true },
    });

    return role ? RoleResponseDto.fromEntity(role) : null;
  }

  /**
   * Set a role as the start role (unsets others)
   */
  async setStartRole(id: string): Promise<RoleResponseDto> {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    // Unset all other start roles in the same service
    await this.prisma.role.updateMany({
      where: { serviceId: role.serviceId, isStartRole: true },
      data: { isStartRole: false },
    });

    // Set this role as start
    const updated = await this.prisma.role.update({
      where: { id },
      data: { isStartRole: true },
    });

    return RoleResponseDto.fromEntity(updated);
  }
}

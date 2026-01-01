import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@bpa/db';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRoleStatusDto,
  UpdateRoleStatusDto,
  RoleStatusResponseDto,
} from './dto';

@Injectable()
export class RoleStatusesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new status for a role
   */
  async create(
    roleId: string,
    dto: CreateRoleStatusDto,
  ): Promise<RoleStatusResponseDto> {
    // Verify role exists
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Check for duplicate code within the same role
    const existing = await this.prisma.roleStatus.findFirst({
      where: { roleId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException(
        `Status with code ${dto.code} already exists for this role`,
      );
    }

    const status = await this.prisma.roleStatus.create({
      data: {
        roleId,
        code: dto.code,
        name: dto.name,
        isDefault: dto.isDefault ?? false,
        sortOrder: dto.sortOrder ?? 0,
        conditions: dto.conditions as Prisma.InputJsonValue | undefined,
      },
    });

    return RoleStatusResponseDto.fromEntity(status);
  }

  /**
   * Find all statuses for a role
   */
  async findAll(roleId: string): Promise<RoleStatusResponseDto[]> {
    const statuses = await this.prisma.roleStatus.findMany({
      where: { roleId },
      orderBy: { sortOrder: 'asc' },
    });

    return statuses.map((status) => RoleStatusResponseDto.fromEntity(status));
  }

  /**
   * Find a single status by ID
   */
  async findOne(id: string): Promise<RoleStatusResponseDto> {
    const status = await this.prisma.roleStatus.findUnique({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException(`RoleStatus with ID ${id} not found`);
    }

    return RoleStatusResponseDto.fromEntity(status);
  }

  /**
   * Update a role status
   */
  async update(
    id: string,
    dto: UpdateRoleStatusDto,
  ): Promise<RoleStatusResponseDto> {
    // Verify status exists
    await this.findOne(id);

    const status = await this.prisma.roleStatus.update({
      where: { id },
      data: {
        name: dto.name,
        isDefault: dto.isDefault,
        sortOrder: dto.sortOrder,
        conditions: dto.conditions as Prisma.InputJsonValue | undefined,
      },
    });

    return RoleStatusResponseDto.fromEntity(status);
  }

  /**
   * Delete a role status
   */
  async remove(id: string): Promise<void> {
    // Verify status exists
    await this.findOne(id);

    await this.prisma.roleStatus.delete({
      where: { id },
    });
  }

  /**
   * Set a status as default (unsets others in same role)
   */
  async setDefault(id: string): Promise<RoleStatusResponseDto> {
    const status = await this.prisma.roleStatus.findUnique({
      where: { id },
    });

    if (!status) {
      throw new NotFoundException(`RoleStatus with ID ${id} not found`);
    }

    // Unset all other defaults in the same role
    await this.prisma.roleStatus.updateMany({
      where: { roleId: status.roleId, isDefault: true },
      data: { isDefault: false },
    });

    // Set this status as default
    const updated = await this.prisma.roleStatus.update({
      where: { id },
      data: { isDefault: true },
    });

    return RoleStatusResponseDto.fromEntity(updated);
  }

  /**
   * Create default 4-status set for a role
   */
  async createDefaults(roleId: string): Promise<RoleStatusResponseDto[]> {
    const defaults = [
      { code: 'PENDING' as const, name: 'Pending', isDefault: true },
      { code: 'PASSED' as const, name: 'Approved', isDefault: false },
      { code: 'RETURNED' as const, name: 'Returned', isDefault: false },
      { code: 'REJECTED' as const, name: 'Rejected', isDefault: false },
    ];

    const created = await this.prisma.$transaction(
      defaults.map((d, idx) =>
        this.prisma.roleStatus.create({
          data: {
            roleId,
            code: d.code,
            name: d.name,
            isDefault: d.isDefault,
            sortOrder: idx,
          },
        }),
      ),
    );

    return created.map((status) => RoleStatusResponseDto.fromEntity(status));
  }
}

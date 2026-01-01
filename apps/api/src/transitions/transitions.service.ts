import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@bpa/db';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTransitionDto,
  UpdateTransitionDto,
  TransitionResponseDto,
} from './dto';

@Injectable()
export class TransitionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new workflow transition
   */
  async create(dto: CreateTransitionDto): Promise<TransitionResponseDto> {
    // Verify source status exists
    const fromStatus = await this.prisma.roleStatus.findUnique({
      where: { id: dto.fromStatusId },
    });
    if (!fromStatus) {
      throw new NotFoundException(
        `RoleStatus with ID ${dto.fromStatusId} not found`,
      );
    }

    // Verify target role exists
    const toRole = await this.prisma.role.findUnique({
      where: { id: dto.toRoleId },
    });
    if (!toRole) {
      throw new NotFoundException(`Role with ID ${dto.toRoleId} not found`);
    }

    // Check for duplicate transition
    const existing = await this.prisma.workflowTransition.findUnique({
      where: {
        fromStatusId_toRoleId: {
          fromStatusId: dto.fromStatusId,
          toRoleId: dto.toRoleId,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Transition from status ${dto.fromStatusId} to role ${dto.toRoleId} already exists`,
      );
    }

    const transition = await this.prisma.workflowTransition.create({
      data: {
        fromStatusId: dto.fromStatusId,
        toRoleId: dto.toRoleId,
        sortOrder: dto.sortOrder ?? 0,
        conditions: dto.conditions as Prisma.InputJsonValue | undefined,
      },
    });

    return TransitionResponseDto.fromEntity(transition);
  }

  /**
   * Find all transitions from a specific status
   */
  async findFromStatus(statusId: string): Promise<TransitionResponseDto[]> {
    const transitions = await this.prisma.workflowTransition.findMany({
      where: { fromStatusId: statusId },
      orderBy: { sortOrder: 'asc' },
    });

    return transitions.map((t) => TransitionResponseDto.fromEntity(t));
  }

  /**
   * Find all transitions to a specific role
   */
  async findToRole(roleId: string): Promise<TransitionResponseDto[]> {
    const transitions = await this.prisma.workflowTransition.findMany({
      where: { toRoleId: roleId },
      orderBy: { sortOrder: 'asc' },
    });

    return transitions.map((t) => TransitionResponseDto.fromEntity(t));
  }

  /**
   * Find all transitions for a service (via roles)
   */
  async findByService(serviceId: string): Promise<TransitionResponseDto[]> {
    const transitions = await this.prisma.workflowTransition.findMany({
      where: {
        fromStatus: {
          role: { serviceId },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return transitions.map((t) => TransitionResponseDto.fromEntity(t));
  }

  /**
   * Find a single transition by ID
   */
  async findOne(id: string): Promise<TransitionResponseDto> {
    const transition = await this.prisma.workflowTransition.findUnique({
      where: { id },
    });

    if (!transition) {
      throw new NotFoundException(`WorkflowTransition with ID ${id} not found`);
    }

    return TransitionResponseDto.fromEntity(transition);
  }

  /**
   * Update a transition
   */
  async update(
    id: string,
    dto: UpdateTransitionDto,
  ): Promise<TransitionResponseDto> {
    // Verify transition exists
    await this.findOne(id);

    const transition = await this.prisma.workflowTransition.update({
      where: { id },
      data: {
        sortOrder: dto.sortOrder,
        conditions: dto.conditions as Prisma.InputJsonValue | undefined,
      },
    });

    return TransitionResponseDto.fromEntity(transition);
  }

  /**
   * Delete a transition
   */
  async remove(id: string): Promise<void> {
    // Verify transition exists
    await this.findOne(id);

    await this.prisma.workflowTransition.delete({
      where: { id },
    });
  }
}

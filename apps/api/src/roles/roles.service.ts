import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, RoleStatusCode } from '@bpa/db';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
  WorkflowGraphDto,
  WorkflowNodeDto,
  WorkflowEdgeDto,
} from './dto';

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

  /**
   * Get workflow graph data for React Flow visualization
   */
  async getWorkflowGraph(serviceId: string): Promise<WorkflowGraphDto> {
    // Fetch all roles with their statuses and transitions
    const roles = await this.prisma.role.findMany({
      where: { serviceId, isActive: true },
      include: {
        form: { select: { name: true } },
        statuses: {
          include: {
            transitions: {
              include: {
                toRole: { select: { id: true } },
              },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Build nodes with auto-layout positions (dagre-style left-to-right)
    const nodes: WorkflowNodeDto[] = [];
    const edges: WorkflowEdgeDto[] = [];

    // Simple layout: arrange in grid, start role first
    const sortedRoles = [...roles].sort((a, b) => {
      if (a.isStartRole) return -1;
      if (b.isStartRole) return 1;
      return a.sortOrder - b.sortOrder;
    });

    const nodeWidth = 200;
    const nodeHeight = 100;
    const horizontalGap = 150;
    const verticalGap = 100;
    const nodesPerRow = 4;

    sortedRoles.forEach((role, index) => {
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;

      nodes.push({
        id: role.id,
        type: 'roleNode',
        data: {
          name: role.name,
          roleType: role.roleType as 'USER' | 'BOT',
          actorType:
            (role.actorType as 'APPLICANT' | 'OPERATOR' | 'SYSTEM') ||
            'OPERATOR',
          formName: role.form?.name,
          statuses: role.statuses.map((s) => ({
            id: s.id,
            code: s.code,
            name: s.name,
          })),
          isStartRole: role.isStartRole,
        },
        position: {
          x: col * (nodeWidth + horizontalGap),
          y: row * (nodeHeight + verticalGap),
        },
      });

      // Build edges from transitions
      for (const status of role.statuses) {
        // Skip PENDING status as it doesn't create transitions
        if (status.code === RoleStatusCode.PENDING) continue;

        for (const transition of status.transitions) {
          const conditionSummary = this.summarizeConditions(
            transition.conditions,
          );

          edges.push({
            id: transition.id,
            source: role.id,
            target: transition.toRoleId,
            label: status.code,
            data: {
              statusCode: status.code,
              conditionSummary,
            },
          });
        }
      }
    });

    return { nodes, edges };
  }

  /**
   * Summarize conditions JSON into human-readable string
   */
  private summarizeConditions(
    conditions: Prisma.JsonValue,
  ): string | undefined {
    if (!conditions || typeof conditions !== 'object') {
      return undefined;
    }

    const cond = conditions as Record<string, unknown>;

    // Handle common condition patterns
    if (
      cond.determinantId &&
      typeof cond.determinantId === 'string' &&
      cond.value !== undefined
    ) {
      const valueStr =
        typeof cond.value === 'string' || typeof cond.value === 'number'
          ? String(cond.value)
          : JSON.stringify(cond.value);
      return `When ${cond.determinantId} = ${valueStr}`;
    }

    if (cond.expression && typeof cond.expression === 'string') {
      // Truncate long expressions
      const expr = cond.expression;
      return expr.length > 30 ? `${expr.slice(0, 30)}...` : expr;
    }

    if (Array.isArray(cond.conditions) && cond.conditions.length > 0) {
      return `${cond.conditions.length} conditions`;
    }

    return 'Conditional';
  }
}

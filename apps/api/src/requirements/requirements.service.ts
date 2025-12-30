/**
 * Requirements Service
 *
 * Business logic for global document requirement template CRUD operations.
 * Uses Prisma for database access.
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
import type { Requirement, Prisma } from '@bpa/db';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { ListRequirementsQueryDto } from './dto/list-requirements-query.dto';

export interface PaginatedRequirements {
  requirements: Requirement[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

@Injectable()
export class RequirementsService {
  private readonly logger = new Logger(RequirementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new global requirement template
   */
  async create(dto: CreateRequirementDto): Promise<Requirement> {
    this.logger.log(`Creating requirement "${dto.name}"`);

    return this.prisma.requirement.create({
      data: {
        name: dto.name,
        tooltip: dto.tooltip,
        template: dto.template,
        isActive: true,
      },
    });
  }

  /**
   * Find all requirements with pagination and filtering
   */
  async findAll(
    query: ListRequirementsQueryDto,
  ): Promise<PaginatedRequirements> {
    const { page = 1, limit = 20, isActive, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.RequirementWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tooltip: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause - default to name ascending
    const orderBy: Prisma.RequirementOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.name = 'asc';
    }

    // Execute queries in parallel
    const [requirements, total] = await Promise.all([
      this.prisma.requirement.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.requirement.count({ where }),
    ]);

    const hasNext = skip + requirements.length < total;

    return {
      requirements,
      total,
      page,
      limit,
      hasNext,
    };
  }

  /**
   * Find one requirement by ID
   */
  async findOne(id: string): Promise<Requirement> {
    const requirement = await this.prisma.requirement.findUnique({
      where: { id },
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement with ID "${id}" not found`);
    }

    return requirement;
  }

  /**
   * Update a requirement
   */
  async update(id: string, dto: UpdateRequirementDto): Promise<Requirement> {
    this.logger.log(`Updating requirement ${id}`);

    // First verify the requirement exists
    await this.findOne(id);

    // Build update data, excluding undefined values
    const updateData: Prisma.RequirementUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.tooltip !== undefined) {
      updateData.tooltip = dto.tooltip;
    }
    if (dto.template !== undefined) {
      updateData.template = dto.template;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    return this.prisma.requirement.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Soft delete a requirement (set isActive to false)
   */
  async remove(id: string): Promise<Requirement> {
    this.logger.log(`Deactivating requirement ${id}`);

    // First verify the requirement exists
    await this.findOne(id);

    return this.prisma.requirement.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

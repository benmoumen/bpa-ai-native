/**
 * Costs Service
 *
 * Business logic for managing costs associated with registrations.
 * Uses Prisma for database access.
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import jsonata from 'jsonata';
import { PrismaService } from '../prisma';
import type { Cost, Prisma } from '@bpa/db';
import { CreateCostDto, CostTypeEnum } from './dto/create-cost.dto';
import { UpdateCostDto } from './dto/update-cost.dto';

export interface PaginatedCosts {
  costs: Cost[];
  total: number;
}

@Injectable()
export class CostsService {
  private readonly logger = new Logger(CostsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate JSONata formula syntax
   * @param formula - JSONata expression to validate
   * @throws BadRequestException if formula has invalid syntax
   */
  private validateJsonataFormula(formula: string): void {
    try {
      jsonata(formula);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown syntax error';
      throw new BadRequestException(
        `Invalid JSONata formula syntax: ${message}`,
      );
    }
  }

  /**
   * Validate cost type consistency
   */
  private validateCostType(
    type: CostTypeEnum,
    fixedAmount?: number,
    formula?: string,
  ): void {
    if (
      type === CostTypeEnum.FIXED &&
      (fixedAmount === undefined || fixedAmount === null)
    ) {
      throw new BadRequestException(
        'fixedAmount is required when type is FIXED',
      );
    }
    if (type === CostTypeEnum.FORMULA && (!formula || formula.trim() === '')) {
      throw new BadRequestException('formula is required when type is FORMULA');
    }
    // Validate JSONata syntax for FORMULA type
    if (type === CostTypeEnum.FORMULA && formula) {
      this.validateJsonataFormula(formula);
    }
  }

  /**
   * Create a new cost within a registration
   *
   * @param registrationId - ID of the parent registration
   * @param dto - Cost data
   * @param userId - ID of the user creating the cost (for authorization)
   * @throws NotFoundException if registration not found
   * @throws ForbiddenException if user is not the service owner
   * @throws BadRequestException if cost type validation fails
   */
  async create(
    registrationId: string,
    dto: CreateCostDto,
    userId: string,
  ): Promise<Cost> {
    this.logger.log(
      `Creating cost for registration ${registrationId} by user ${userId}`,
    );

    // Validate cost type consistency
    this.validateCostType(dto.type, dto.fixedAmount, dto.formula);

    // Verify registration exists and check ownership via parent service
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: {
        service: {
          select: { createdBy: true },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException(
        `Registration with ID "${registrationId}" not found`,
      );
    }

    if (registration.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to add costs to this registration',
      );
    }

    return this.prisma.cost.create({
      data: {
        registrationId,
        name: dto.name,
        type: dto.type,
        fixedAmount: dto.type === CostTypeEnum.FIXED ? dto.fixedAmount : null,
        formula: dto.type === CostTypeEnum.FORMULA ? dto.formula : null,
        currency: dto.currency ?? 'USD',
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  /**
   * Find all costs for a registration
   */
  async findAllByRegistration(registrationId: string): Promise<PaginatedCosts> {
    // Verify registration exists
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException(
        `Registration with ID "${registrationId}" not found`,
      );
    }

    const costs = await this.prisma.cost.findMany({
      where: { registrationId },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      costs,
      total: costs.length,
    };
  }

  /**
   * Find one cost by ID
   *
   * @param id - Cost ID
   * @param registrationId - Optional registration ID to verify the cost belongs to this registration
   * @throws NotFoundException if cost not found or doesn't belong to specified registration
   */
  async findOne(id: string, registrationId?: string): Promise<Cost> {
    const cost = await this.prisma.cost.findUnique({
      where: { id },
    });

    if (!cost) {
      throw new NotFoundException(`Cost with ID "${id}" not found`);
    }

    // If registrationId is provided, verify the cost belongs to it
    if (registrationId && cost.registrationId !== registrationId) {
      throw new NotFoundException(
        `Cost with ID "${id}" not found in registration "${registrationId}"`,
      );
    }

    return cost;
  }

  /**
   * Update a cost
   *
   * @param id - Cost ID
   * @param dto - Update data
   * @param userId - ID of the user making the update (for authorization)
   * @throws NotFoundException if cost not found
   * @throws ForbiddenException if user is not the owner of the parent service
   * @throws BadRequestException if cost type validation fails
   */
  async update(id: string, dto: UpdateCostDto, userId: string): Promise<Cost> {
    this.logger.log(`Updating cost ${id} by user ${userId}`);

    // First verify the cost exists and check ownership via parent service
    const cost = await this.prisma.cost.findUnique({
      where: { id },
      include: {
        registration: {
          include: {
            service: {
              select: { createdBy: true },
            },
          },
        },
      },
    });

    if (!cost) {
      throw new NotFoundException(`Cost with ID "${id}" not found`);
    }

    if (cost.registration.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this cost',
      );
    }

    // Determine the effective type for validation
    const effectiveType = dto.type ?? (cost.type as CostTypeEnum);
    // Handle Prisma Decimal conversion
    const costFixedAmount = cost.fixedAmount
      ? typeof cost.fixedAmount === 'object' && 'toNumber' in cost.fixedAmount
        ? (cost.fixedAmount as { toNumber: () => number }).toNumber()
        : Number(cost.fixedAmount)
      : undefined;
    const effectiveFixedAmount = dto.fixedAmount ?? costFixedAmount;
    const effectiveFormula = dto.formula ?? cost.formula ?? undefined;

    // Validate if type is being changed or type-specific fields are updated
    if (
      dto.type !== undefined ||
      dto.fixedAmount !== undefined ||
      dto.formula !== undefined
    ) {
      this.validateCostType(
        effectiveType,
        effectiveFixedAmount,
        effectiveFormula,
      );
    }

    // Build update data, excluding undefined values
    const updateData: Prisma.CostUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.type !== undefined) {
      updateData.type = dto.type;
      // Clear the non-applicable field when type changes
      if (dto.type === CostTypeEnum.FIXED) {
        updateData.formula = null;
      } else {
        updateData.fixedAmount = null;
      }
    }
    if (dto.fixedAmount !== undefined) {
      updateData.fixedAmount = dto.fixedAmount;
    }
    if (dto.formula !== undefined) {
      updateData.formula = dto.formula;
    }
    if (dto.currency !== undefined) {
      updateData.currency = dto.currency;
    }
    if (dto.sortOrder !== undefined) {
      updateData.sortOrder = dto.sortOrder;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    return this.prisma.cost.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a cost (hard delete)
   *
   * @param id - Cost ID
   * @param userId - ID of the user making the deletion (for authorization)
   * @throws NotFoundException if cost not found
   * @throws ForbiddenException if user is not the owner of the parent service
   */
  async remove(id: string, userId: string): Promise<Cost> {
    this.logger.log(`Removing cost ${id} by user ${userId}`);

    // First verify the cost exists and check ownership via parent service
    const cost = await this.prisma.cost.findUnique({
      where: { id },
      include: {
        registration: {
          include: {
            service: {
              select: { createdBy: true },
            },
          },
        },
      },
    });

    if (!cost) {
      throw new NotFoundException(`Cost with ID "${id}" not found`);
    }

    if (cost.registration.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this cost',
      );
    }

    await this.prisma.cost.delete({
      where: { id },
    });

    // Return the cost data before deletion
    return {
      id: cost.id,
      registrationId: cost.registrationId,
      name: cost.name,
      type: cost.type,
      fixedAmount: cost.fixedAmount,
      formula: cost.formula,
      currency: cost.currency,
      sortOrder: cost.sortOrder,
      isActive: cost.isActive,
      createdAt: cost.createdAt,
      updatedAt: cost.updatedAt,
    };
  }
}

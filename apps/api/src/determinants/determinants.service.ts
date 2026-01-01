/**
 * Determinants Service
 *
 * Business logic for Determinant CRUD operations
 * Uses Prisma for database access
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import type { Determinant, Prisma } from '@bpa/db';
import { CreateDeterminantDto } from './dto/create-determinant.dto';
import { UpdateDeterminantDto } from './dto/update-determinant.dto';
import { ListDeterminantsQueryDto } from './dto/list-determinants-query.dto';

export interface PaginatedDeterminants {
  determinants: (Determinant & { _count: { linkedFields: number } })[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

@Injectable()
export class DeterminantsService {
  private readonly logger = new Logger(DeterminantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new determinant within a service
   *
   * @param serviceId - ID of the parent service
   * @param dto - Determinant data
   * @param userId - ID of the user creating the determinant (for authorization)
   * @throws NotFoundException if service not found
   * @throws ForbiddenException if user is not the service owner
   * @throws ConflictException if determinant name already exists in this service
   */
  async create(
    serviceId: string,
    dto: CreateDeterminantDto,
    userId: string,
  ): Promise<Determinant> {
    this.logger.log(
      `Creating determinant "${dto.name}" for service ${serviceId} by user ${userId}`,
    );

    // Verify service exists and check ownership
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, createdBy: true },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID "${serviceId}" not found`);
    }

    if (service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to create determinants for this service',
      );
    }

    // Check if determinant name already exists for this service
    const existingDeterminant = await this.prisma.determinant.findUnique({
      where: {
        serviceId_name: {
          serviceId,
          name: dto.name,
        },
      },
    });

    if (existingDeterminant) {
      throw new ConflictException(
        `Determinant with name "${dto.name}" already exists in this service`,
      );
    }

    // Validate sourceFieldId if provided
    if (dto.sourceFieldId) {
      const field = await this.prisma.formField.findUnique({
        where: { id: dto.sourceFieldId },
        include: { form: { select: { serviceId: true } } },
      });

      if (!field) {
        throw new NotFoundException(
          `Form field with ID "${dto.sourceFieldId}" not found`,
        );
      }

      if (field.form.serviceId !== serviceId) {
        throw new ForbiddenException(
          'Source field must belong to a form in the same service',
        );
      }
    }

    return this.prisma.determinant.create({
      data: {
        serviceId,
        name: dto.name,
        type: dto.type,
        sourceFieldId: dto.sourceFieldId,
        formula: dto.formula,
        isActive: true,
      },
    });
  }

  /**
   * Find all determinants for a service with pagination and filtering
   */
  async findAllByService(
    serviceId: string,
    query: ListDeterminantsQueryDto,
  ): Promise<PaginatedDeterminants> {
    const { page = 1, limit = 20, isActive, type, search } = query;
    const skip = (page - 1) * limit;

    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID "${serviceId}" not found`);
    }

    // Build where clause
    const where: Prisma.DeterminantWhereInput = {
      serviceId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Execute queries in parallel
    const [determinants, total] = await Promise.all([
      this.prisma.determinant.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              linkedFields: true,
            },
          },
        },
      }),
      this.prisma.determinant.count({ where }),
    ]);

    const hasNext = skip + determinants.length < total;

    return {
      determinants,
      total,
      page,
      limit,
      hasNext,
    };
  }

  /**
   * Find one determinant by ID
   */
  async findOne(
    id: string,
  ): Promise<Determinant & { _count: { linkedFields: number } }> {
    const determinant = await this.prisma.determinant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            linkedFields: true,
          },
        },
      },
    });

    if (!determinant) {
      throw new NotFoundException(`Determinant with ID "${id}" not found`);
    }

    return determinant;
  }

  /**
   * Update a determinant
   *
   * @param id - Determinant ID
   * @param dto - Update data
   * @param userId - ID of the user making the update (for authorization)
   * @throws NotFoundException if determinant not found
   * @throws ForbiddenException if user is not the owner of the parent service
   * @throws ConflictException if new name already exists in this service
   */
  async update(
    id: string,
    dto: UpdateDeterminantDto,
    userId: string,
  ): Promise<Determinant> {
    this.logger.log(`Updating determinant ${id} by user ${userId}`);

    // First verify the determinant exists and check ownership via parent service
    const determinant = await this.prisma.determinant.findUnique({
      where: { id },
      include: {
        service: {
          select: { createdBy: true },
        },
      },
    });

    if (!determinant) {
      throw new NotFoundException(`Determinant with ID "${id}" not found`);
    }

    if (determinant.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this determinant',
      );
    }

    // If name is being updated, check for conflicts
    if (dto.name && dto.name !== determinant.name) {
      const existingDeterminant = await this.prisma.determinant.findUnique({
        where: {
          serviceId_name: {
            serviceId: determinant.serviceId,
            name: dto.name,
          },
        },
      });

      if (existingDeterminant) {
        throw new ConflictException(
          `Determinant with name "${dto.name}" already exists in this service`,
        );
      }
    }

    // Build update data, excluding undefined values
    const updateData: Prisma.DeterminantUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.formula !== undefined) {
      updateData.formula = dto.formula;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    return this.prisma.determinant.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Soft delete a determinant (set isActive to false)
   *
   * @param id - Determinant ID
   * @param userId - ID of the user making the deletion (for authorization)
   * @throws NotFoundException if determinant not found
   * @throws ForbiddenException if user is not the owner of the parent service
   */
  async remove(id: string, userId: string): Promise<Determinant> {
    this.logger.log(`Deactivating determinant ${id} by user ${userId}`);

    // First verify the determinant exists and check ownership via parent service
    const determinant = await this.prisma.determinant.findUnique({
      where: { id },
      include: {
        service: {
          select: { createdBy: true },
        },
      },
    });

    if (!determinant) {
      throw new NotFoundException(`Determinant with ID "${id}" not found`);
    }

    if (determinant.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this determinant',
      );
    }

    return this.prisma.determinant.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Link a form field to a determinant
   *
   * @param fieldId - Form field ID
   * @param determinantId - Determinant ID
   * @param userId - ID of the user making the link (for authorization)
   */
  async linkFieldToDeterminant(
    fieldId: string,
    determinantId: string,
    userId: string,
  ): Promise<{
    field: { id: string; determinantId: string | null };
    determinant: Determinant;
  }> {
    this.logger.log(
      `Linking field ${fieldId} to determinant ${determinantId} by user ${userId}`,
    );

    // Verify field exists and get its service
    const field = await this.prisma.formField.findUnique({
      where: { id: fieldId },
      include: {
        form: {
          include: {
            service: { select: { createdBy: true } },
          },
        },
      },
    });

    if (!field) {
      throw new NotFoundException(`Form field with ID "${fieldId}" not found`);
    }

    if (field.form.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to link this field',
      );
    }

    // Verify determinant exists and belongs to the same service
    const determinant = await this.prisma.determinant.findUnique({
      where: { id: determinantId },
    });

    if (!determinant) {
      throw new NotFoundException(
        `Determinant with ID "${determinantId}" not found`,
      );
    }

    if (determinant.serviceId !== field.form.serviceId) {
      throw new ForbiddenException(
        'Determinant must belong to the same service as the field',
      );
    }

    // Update the field with the determinant link
    const updatedField = await this.prisma.formField.update({
      where: { id: fieldId },
      data: { determinantId },
      select: { id: true, determinantId: true },
    });

    return { field: updatedField, determinant };
  }

  /**
   * Unlink a form field from its determinant
   *
   * @param fieldId - Form field ID
   * @param userId - ID of the user making the unlink (for authorization)
   */
  async unlinkFieldFromDeterminant(
    fieldId: string,
    userId: string,
  ): Promise<{ id: string; determinantId: string | null }> {
    this.logger.log(
      `Unlinking field ${fieldId} from determinant by user ${userId}`,
    );

    // Verify field exists and get its service
    const field = await this.prisma.formField.findUnique({
      where: { id: fieldId },
      include: {
        form: {
          include: {
            service: { select: { createdBy: true } },
          },
        },
      },
    });

    if (!field) {
      throw new NotFoundException(`Form field with ID "${fieldId}" not found`);
    }

    if (field.form.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to unlink this field',
      );
    }

    return this.prisma.formField.update({
      where: { id: fieldId },
      data: { determinantId: null },
      select: { id: true, determinantId: true },
    });
  }
}

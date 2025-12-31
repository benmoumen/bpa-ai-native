/**
 * Forms Service
 *
 * Business logic for Form CRUD operations
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
import type { Form, Prisma } from '@bpa/db';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { ListFormsQueryDto } from './dto/list-forms-query.dto';

export interface PaginatedForms {
  forms: (Form & { _count: { sections: number; fields: number } })[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new form within a service
   *
   * @param serviceId - ID of the parent service
   * @param dto - Form data
   * @param userId - ID of the user creating the form (for authorization)
   * @throws NotFoundException if service not found
   * @throws ForbiddenException if user is not the service owner
   * @throws ConflictException if form name already exists in this service
   */
  async create(
    serviceId: string,
    dto: CreateFormDto,
    userId: string,
  ): Promise<Form> {
    this.logger.log(
      `Creating form "${dto.name}" for service ${serviceId} by user ${userId}`,
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
        'You do not have permission to create forms for this service',
      );
    }

    // Check if form name already exists for this service
    const existingForm = await this.prisma.form.findUnique({
      where: {
        serviceId_name: {
          serviceId,
          name: dto.name,
        },
      },
    });

    if (existingForm) {
      throw new ConflictException(
        `Form with name "${dto.name}" already exists in this service`,
      );
    }

    return this.prisma.form.create({
      data: {
        serviceId,
        name: dto.name,
        type: dto.type,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Find all forms for a service with pagination and filtering
   */
  async findAllByService(
    serviceId: string,
    query: ListFormsQueryDto,
  ): Promise<PaginatedForms> {
    const { page = 1, limit = 20, isActive, type, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID "${serviceId}" not found`);
    }

    // Build where clause
    const where: Prisma.FormWhereInput = {
      serviceId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (type) {
      where.type = type;
    }

    // Build orderBy clause - default to createdAt descending
    const orderBy: Prisma.FormOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Execute queries in parallel
    const [forms, total] = await Promise.all([
      this.prisma.form.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              sections: true,
              fields: true,
            },
          },
        },
      }),
      this.prisma.form.count({ where }),
    ]);

    const hasNext = skip + forms.length < total;

    return {
      forms,
      total,
      page,
      limit,
      hasNext,
    };
  }

  /**
   * Find one form by ID
   */
  async findOne(
    id: string,
  ): Promise<Form & { _count: { sections: number; fields: number } }> {
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sections: true,
            fields: true,
          },
        },
      },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID "${id}" not found`);
    }

    return form;
  }

  /**
   * Update a form
   *
   * @param id - Form ID
   * @param dto - Update data
   * @param userId - ID of the user making the update (for authorization)
   * @throws NotFoundException if form not found
   * @throws ForbiddenException if user is not the owner of the parent service
   * @throws ConflictException if new name already exists in this service
   */
  async update(id: string, dto: UpdateFormDto, userId: string): Promise<Form> {
    this.logger.log(`Updating form ${id} by user ${userId}`);

    // First verify the form exists and check ownership via parent service
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: {
        service: {
          select: { createdBy: true },
        },
      },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID "${id}" not found`);
    }

    if (form.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this form',
      );
    }

    // If name is being updated, check for conflicts
    if (dto.name && dto.name !== form.name) {
      const existingForm = await this.prisma.form.findUnique({
        where: {
          serviceId_name: {
            serviceId: form.serviceId,
            name: dto.name,
          },
        },
      });

      if (existingForm) {
        throw new ConflictException(
          `Form with name "${dto.name}" already exists in this service`,
        );
      }
    }

    // Build update data, excluding undefined values
    const updateData: Prisma.FormUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.type !== undefined) {
      updateData.type = dto.type;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    return this.prisma.form.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Soft delete a form (set isActive to false)
   *
   * @param id - Form ID
   * @param userId - ID of the user making the deletion (for authorization)
   * @throws NotFoundException if form not found
   * @throws ForbiddenException if user is not the owner of the parent service
   */
  async remove(id: string, userId: string): Promise<Form> {
    this.logger.log(`Deactivating form ${id} by user ${userId}`);

    // First verify the form exists and check ownership via parent service
    const form = await this.prisma.form.findUnique({
      where: { id },
      include: {
        service: {
          select: { createdBy: true },
        },
      },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID "${id}" not found`);
    }

    if (form.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this form',
      );
    }

    return this.prisma.form.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}

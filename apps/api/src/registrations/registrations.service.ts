/**
 * Registrations Service
 *
 * Business logic for Registration CRUD operations
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
import type { Registration, Prisma } from '@bpa/db';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { ListRegistrationsQueryDto } from './dto/list-registrations-query.dto';

export interface PaginatedRegistrations {
  registrations: Registration[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

/**
 * Generate a URL-friendly key from a name
 * Converts to lowercase, replaces spaces with hyphens, removes special chars
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50); // Enforce max length
}

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new registration within a service
   *
   * @param serviceId - ID of the parent service
   * @param dto - Registration data
   * @param userId - ID of the user creating the registration (for authorization)
   * @throws NotFoundException if service not found
   * @throws ForbiddenException if user is not the service owner
   */
  async create(
    serviceId: string,
    dto: CreateRegistrationDto,
    userId: string,
  ): Promise<Registration> {
    this.logger.log(
      `Creating registration "${dto.name}" for service ${serviceId} by user ${userId}`,
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
        'You do not have permission to create registrations for this service',
      );
    }

    // Generate key from name if not provided
    const key = dto.key || slugify(dto.name);

    // Check if key already exists for this service
    const existingRegistration = await this.prisma.registration.findUnique({
      where: {
        serviceId_key: {
          serviceId,
          key,
        },
      },
    });

    if (existingRegistration) {
      throw new ConflictException(
        `Registration with key "${key}" already exists in this service`,
      );
    }

    return this.prisma.registration.create({
      data: {
        serviceId,
        name: dto.name,
        shortName: dto.shortName,
        key,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
      },
    });
  }

  /**
   * Find all registrations for a service with pagination and filtering
   */
  async findAllByService(
    serviceId: string,
    query: ListRegistrationsQueryDto,
  ): Promise<PaginatedRegistrations> {
    const { page = 1, limit = 20, isActive, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID "${serviceId}" not found`);
    }

    // Build where clause
    const where: Prisma.RegistrationWhereInput = {
      serviceId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause - default to sortOrder ascending for registrations
    const orderBy: Prisma.RegistrationOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.sortOrder = 'asc';
    }

    // Execute queries in parallel
    const [registrations, total] = await Promise.all([
      this.prisma.registration.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.registration.count({ where }),
    ]);

    const hasNext = skip + registrations.length < total;

    return {
      registrations,
      total,
      page,
      limit,
      hasNext,
    };
  }

  /**
   * Find one registration by ID
   */
  async findOne(id: string): Promise<Registration> {
    const registration = await this.prisma.registration.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new NotFoundException(`Registration with ID "${id}" not found`);
    }

    return registration;
  }

  /**
   * Update a registration
   * Note: key cannot be updated as it's part of the unique constraint
   *
   * @param id - Registration ID
   * @param dto - Update data
   * @param userId - ID of the user making the update (for authorization)
   * @throws NotFoundException if registration not found
   * @throws ForbiddenException if user is not the owner of the parent service
   */
  async update(
    id: string,
    dto: UpdateRegistrationDto,
    userId: string,
  ): Promise<Registration> {
    this.logger.log(`Updating registration ${id} by user ${userId}`);

    // First verify the registration exists and check ownership via parent service
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        service: {
          select: { createdBy: true },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException(`Registration with ID "${id}" not found`);
    }

    if (registration.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this registration',
      );
    }

    // Build update data, excluding undefined values and key
    const updateData: Prisma.RegistrationUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.shortName !== undefined) {
      updateData.shortName = dto.shortName;
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }
    if (dto.sortOrder !== undefined) {
      updateData.sortOrder = dto.sortOrder;
    }

    // Registration existence already verified above
    return this.prisma.registration.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Soft delete a registration (set isActive to false)
   *
   * @param id - Registration ID
   * @param userId - ID of the user making the deletion (for authorization)
   * @throws NotFoundException if registration not found
   * @throws ForbiddenException if user is not the owner of the parent service
   */
  async remove(id: string, userId: string): Promise<Registration> {
    this.logger.log(`Deactivating registration ${id} by user ${userId}`);

    // First verify the registration exists and check ownership via parent service
    const registration = await this.prisma.registration.findUnique({
      where: { id },
      include: {
        service: {
          select: { createdBy: true },
        },
      },
    });

    if (!registration) {
      throw new NotFoundException(`Registration with ID "${id}" not found`);
    }

    if (registration.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this registration',
      );
    }

    // Registration existence already verified above
    return this.prisma.registration.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}

/**
 * Services Service
 *
 * Business logic for Service CRUD operations
 * Uses Prisma for database access
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { TemplatesService } from '../templates';
import { ServiceStatus, type Service, type Prisma } from '@bpa/db';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ListServicesQueryDto } from './dto/list-services-query.dto';

export interface PaginatedServices {
  services: Service[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly templatesService: TemplatesService,
  ) {}

  /**
   * Create a new service
   */
  async create(dto: CreateServiceDto, userId: string): Promise<Service> {
    this.logger.log(`Creating service "${dto.name}" for user ${userId}`);

    return this.prisma.service.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        status: ServiceStatus.DRAFT,
        createdBy: userId,
      },
    });
  }

  /**
   * Find all services with pagination and filtering
   */
  async findAll(query: ListServicesQueryDto): Promise<PaginatedServices> {
    const { page = 1, limit = 20, status, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ServiceWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    const orderBy: Prisma.ServiceOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Execute queries in parallel
    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.service.count({ where }),
    ]);

    const hasNext = skip + services.length < total;

    return {
      services,
      total,
      page,
      limit,
      hasNext,
    };
  }

  /**
   * Find one service by ID
   */
  async findOne(id: string): Promise<Service> {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }

    return service;
  }

  /**
   * Update a service (metadata only, not status)
   * Status changes must use dedicated lifecycle endpoints
   *
   * @param id - Service ID
   * @param dto - Update data (name, description, category)
   * @param userId - ID of the user making the update (for authorization)
   * @throws NotFoundException if service not found
   * @throws ForbiddenException if user is not the service owner
   */
  async update(
    id: string,
    dto: UpdateServiceDto,
    userId: string,
  ): Promise<Service> {
    this.logger.log(`Updating service ${id} by user ${userId}`);

    // First verify ownership
    const service = await this.prisma.service.findUnique({
      where: { id },
      select: { createdBy: true },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }

    if (service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this service',
      );
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
      },
    });
  }

  /**
   * Soft delete a service (set status to ARCHIVED)
   *
   * @param id - Service ID
   * @param userId - ID of the user making the request (for authorization)
   * @throws NotFoundException if service not found
   * @throws ForbiddenException if user is not the service owner
   */
  async remove(id: string, userId: string): Promise<Service> {
    this.logger.log(`Archiving service ${id} by user ${userId}`);

    // Verify ownership
    const service = await this.prisma.service.findUnique({
      where: { id },
      select: { createdBy: true },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }

    if (service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to archive this service',
      );
    }

    return this.prisma.service.update({
      where: { id },
      data: {
        status: ServiceStatus.ARCHIVED,
      },
    });
  }

  /**
   * Permanently delete a service (only allowed for DRAFT status)
   *
   * Uses transaction with conditional delete to prevent race conditions.
   *
   * @param id - Service ID
   * @param userId - ID of the user making the request (for authorization)
   * @throws NotFoundException if service not found
   * @throws ForbiddenException if user is not the service owner
   * @throws BadRequestException if service is not in DRAFT status
   */
  async deletePermanently(
    id: string,
    userId: string,
  ): Promise<{ id: string; deleted: true }> {
    this.logger.log(`Permanently deleting service ${id} by user ${userId}`);

    return this.prisma.$transaction(async (tx) => {
      // Atomic conditional delete - only succeeds if all conditions are met
      const deleted = await tx.service.deleteMany({
        where: {
          id,
          createdBy: userId,
          status: ServiceStatus.DRAFT,
        },
      });

      if (deleted.count === 0) {
        // Determine the specific error by checking what condition failed
        const service = await tx.service.findUnique({
          where: { id },
          select: { status: true, createdBy: true },
        });

        if (!service) {
          throw new NotFoundException(`Service with ID "${id}" not found`);
        }

        if (service.createdBy !== userId) {
          throw new ForbiddenException(
            'You do not have permission to delete this service',
          );
        }

        // Must be wrong status
        throw new BadRequestException(
          `Cannot permanently delete service with status "${service.status}". Only DRAFT services can be permanently deleted.`,
        );
      }

      this.logger.log(`Service ${id} permanently deleted`);
      return { id, deleted: true as const };
    });
  }

  /**
   * Duplicate an existing service
   *
   * Creates a copy of the service with:
   * - Name: "[Original Name] (Copy)"
   * - Status: DRAFT
   * - All configuration copied (currently just metadata)
   *
   * @param id - ID of the service to duplicate
   * @param userId - ID of the user performing the duplication
   * @returns The newly created duplicate service
   */
  async duplicate(id: string, userId: string): Promise<Service> {
    this.logger.log(`Duplicating service ${id} for user ${userId}`);

    // Fetch the original service
    const original = await this.findOne(id);

    // Create the duplicate with modified name and DRAFT status
    const duplicate = await this.prisma.service.create({
      data: {
        name: `${original.name} (Copy)`,
        description: original.description,
        category: original.category,
        status: ServiceStatus.DRAFT,
        createdBy: userId,
      },
    });

    this.logger.log(
      `Created duplicate service ${duplicate.id} from original ${id}`,
    );

    return duplicate;
  }

  /**
   * Create a new service from a template
   *
   * Uses the template's metadata and configuration to bootstrap a new service.
   * The created service is always in DRAFT status.
   *
   * @param templateId - ID of the template to use
   * @param userId - ID of the user creating the service
   * @returns The newly created service
   * @throws NotFoundException if template not found
   */
  async createFromTemplate(
    templateId: string,
    userId: string,
  ): Promise<Service> {
    this.logger.log(
      `Creating service from template ${templateId} for user ${userId}`,
    );

    // Fetch the template (throws NotFoundException if not found)
    const template = await this.templatesService.findOne(templateId);

    // Create the service with template metadata
    const service = await this.prisma.service.create({
      data: {
        name: `${template.name} (Copy)`,
        description: template.description,
        category: template.category,
        status: ServiceStatus.DRAFT,
        createdBy: userId,
      },
    });

    this.logger.log(
      `Created service ${service.id} from template ${templateId}`,
    );

    return service;
  }

  /**
   * Publish a service (DRAFT -> PUBLISHED)
   *
   * State machine transition:
   * - Only DRAFT services can be published
   * - Placeholder validation (always passes for now)
   *
   * Uses transaction with conditional update to prevent race conditions.
   *
   * @param id - Service ID
   * @param userId - ID of the user making the request (for authorization)
   * @throws NotFoundException if service not found
   * @throws ForbiddenException if user is not the service owner
   * @throws BadRequestException if service is not in DRAFT status
   */
  async publish(id: string, userId: string): Promise<Service> {
    this.logger.log(`Publishing service ${id} by user ${userId}`);

    // Placeholder validation - always passes for now
    // TODO: Add real validation (forms, roles, registrations, etc.)
    const isValid = true;
    if (!isValid) {
      throw new BadRequestException(
        'Service does not pass validation. Please ensure all required configurations are complete.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Atomic conditional update - only succeeds if all conditions are met
      const updated = await tx.service.updateMany({
        where: {
          id,
          createdBy: userId,
          status: ServiceStatus.DRAFT,
        },
        data: { status: ServiceStatus.PUBLISHED },
      });

      if (updated.count === 0) {
        // Determine the specific error by checking what condition failed
        const service = await tx.service.findUnique({
          where: { id },
          select: { status: true, createdBy: true },
        });

        if (!service) {
          throw new NotFoundException(`Service with ID "${id}" not found`);
        }

        if (service.createdBy !== userId) {
          throw new ForbiddenException(
            'You do not have permission to publish this service',
          );
        }

        // Must be wrong status
        throw new BadRequestException(
          `Cannot publish service with status "${service.status}". Only DRAFT services can be published.`,
        );
      }

      return tx.service.findUniqueOrThrow({ where: { id } });
    });
  }

  /**
   * Archive a service (PUBLISHED -> ARCHIVED)
   *
   * State machine transition:
   * - Only PUBLISHED services can be archived
   * - Archived services are no longer available to new applicants
   * - Existing applications continue processing
   *
   * Uses transaction with conditional update to prevent race conditions.
   *
   * @param id - Service ID
   * @param userId - ID of the user making the request (for authorization)
   * @throws NotFoundException if service not found
   * @throws ForbiddenException if user is not the service owner
   * @throws BadRequestException if service is not in PUBLISHED status
   */
  async archive(id: string, userId: string): Promise<Service> {
    this.logger.log(`Archiving service ${id} by user ${userId}`);

    return this.prisma.$transaction(async (tx) => {
      // Atomic conditional update - only succeeds if all conditions are met
      const updated = await tx.service.updateMany({
        where: {
          id,
          createdBy: userId,
          status: ServiceStatus.PUBLISHED,
        },
        data: { status: ServiceStatus.ARCHIVED },
      });

      if (updated.count === 0) {
        // Determine the specific error by checking what condition failed
        const service = await tx.service.findUnique({
          where: { id },
          select: { status: true, createdBy: true },
        });

        if (!service) {
          throw new NotFoundException(`Service with ID "${id}" not found`);
        }

        if (service.createdBy !== userId) {
          throw new ForbiddenException(
            'You do not have permission to archive this service',
          );
        }

        // Must be wrong status
        throw new BadRequestException(
          `Cannot archive service with status "${service.status}". Only PUBLISHED services can be archived.`,
        );
      }

      return tx.service.findUniqueOrThrow({ where: { id } });
    });
  }

  /**
   * Restore a service (ARCHIVED -> DRAFT)
   *
   * State machine transition:
   * - Only ARCHIVED services can be restored
   * - Restored service returns to DRAFT for modification
   *
   * Uses transaction with conditional update to prevent race conditions.
   *
   * @param id - Service ID
   * @param userId - ID of the user making the request (for authorization)
   * @throws NotFoundException if service not found
   * @throws ForbiddenException if user is not the service owner
   * @throws BadRequestException if service is not in ARCHIVED status
   */
  async restore(id: string, userId: string): Promise<Service> {
    this.logger.log(`Restoring service ${id} by user ${userId}`);

    return this.prisma.$transaction(async (tx) => {
      // Atomic conditional update - only succeeds if all conditions are met
      const updated = await tx.service.updateMany({
        where: {
          id,
          createdBy: userId,
          status: ServiceStatus.ARCHIVED,
        },
        data: { status: ServiceStatus.DRAFT },
      });

      if (updated.count === 0) {
        // Determine the specific error by checking what condition failed
        const service = await tx.service.findUnique({
          where: { id },
          select: { status: true, createdBy: true },
        });

        if (!service) {
          throw new NotFoundException(`Service with ID "${id}" not found`);
        }

        if (service.createdBy !== userId) {
          throw new ForbiddenException(
            'You do not have permission to restore this service',
          );
        }

        // Must be wrong status
        throw new BadRequestException(
          `Cannot restore service with status "${service.status}". Only ARCHIVED services can be restored.`,
        );
      }

      return tx.service.findUniqueOrThrow({ where: { id } });
    });
  }
}

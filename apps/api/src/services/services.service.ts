/**
 * Services Service
 *
 * Business logic for Service CRUD operations
 * Uses Prisma for database access
 */

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma';
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

  constructor(private readonly prisma: PrismaService) {}

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
   * Update a service
   */
  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    // Verify service exists
    await this.findOne(id);

    this.logger.log(`Updating service ${id}`);

    return this.prisma.service.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        status: dto.status,
      },
    });
  }

  /**
   * Soft delete a service (set status to ARCHIVED)
   */
  async remove(id: string): Promise<Service> {
    // Verify service exists
    await this.findOne(id);

    this.logger.log(`Archiving service ${id}`);

    return this.prisma.service.update({
      where: { id },
      data: {
        status: ServiceStatus.ARCHIVED,
      },
    });
  }
}

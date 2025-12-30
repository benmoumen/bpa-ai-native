/**
 * Templates Service
 *
 * Business logic for ServiceTemplate CRUD operations
 * Templates are pre-defined service configurations for quick-start creation
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import type { ServiceTemplate, Prisma } from '@bpa/db';
import { ListTemplatesQueryDto } from './dto/list-templates-query.dto';

export interface PaginatedTemplates {
  templates: ServiceTemplate[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all templates with pagination and filtering
   * Templates are public (no authentication required for read)
   */
  async findAll(query: ListTemplatesQueryDto): Promise<PaginatedTemplates> {
    const { page = 1, limit = 20, category, search, isActive } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ServiceTemplateWhereInput = {};

    // Default to active templates only
    if (isActive !== undefined) {
      where.isActive = isActive;
    } else {
      where.isActive = true;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute queries in parallel
    const [templates, total] = await Promise.all([
      this.prisma.serviceTemplate.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.serviceTemplate.count({ where }),
    ]);

    const hasNext = skip + templates.length < total;

    return {
      templates,
      total,
      page,
      limit,
      hasNext,
    };
  }

  /**
   * Find one template by ID
   */
  async findOne(id: string): Promise<ServiceTemplate> {
    const template = await this.prisma.serviceTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID "${id}" not found`);
    }

    return template;
  }

  /**
   * Get unique categories for filtering
   */
  async getCategories(): Promise<string[]> {
    const result = await this.prisma.serviceTemplate.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return result.map((r) => r.category);
  }
}

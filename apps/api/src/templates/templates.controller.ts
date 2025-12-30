/**
 * Templates Controller
 *
 * REST API endpoints for ServiceTemplate operations
 * Templates are public (no authentication required for listing)
 */

import { Controller, Get, Param, Query } from '@nestjs/common';
import { TemplatesService, PaginatedTemplates } from './templates.service';
import { ListTemplatesQueryDto } from './dto/list-templates-query.dto';
import { Public } from '../auth/decorators/public.decorator';
import type { ServiceTemplate } from '@bpa/db';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  /**
   * GET /api/v1/templates
   * List all active templates with optional filtering
   *
   * This endpoint is public - no authentication required
   */
  @Get()
  @Public()
  async findAll(@Query() query: ListTemplatesQueryDto): Promise<{
    data: ServiceTemplate[];
    meta: { total: number; page: number; perPage: number; hasNext: boolean };
  }> {
    const result: PaginatedTemplates =
      await this.templatesService.findAll(query);

    return {
      data: result.templates,
      meta: {
        total: result.total,
        page: result.page,
        perPage: result.limit,
        hasNext: result.hasNext,
      },
    };
  }

  /**
   * GET /api/v1/templates/categories
   * List unique template categories for filtering
   *
   * This endpoint is public - no authentication required
   */
  @Get('categories')
  @Public()
  async getCategories(): Promise<{ data: string[] }> {
    const categories = await this.templatesService.getCategories();
    return { data: categories };
  }

  /**
   * GET /api/v1/templates/:id
   * Get a single template by ID
   *
   * This endpoint is public - no authentication required
   */
  @Get(':id')
  @Public()
  async findOne(@Param('id') id: string): Promise<ServiceTemplate> {
    return this.templatesService.findOne(id);
  }
}

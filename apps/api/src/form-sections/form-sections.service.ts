/**
 * FormSections Service
 *
 * Business logic for FormSection CRUD operations
 * Uses Prisma for database access
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import type { FormSection, Prisma } from '@bpa/db';
import { CreateFormSectionDto } from './dto/create-form-section.dto';
import { UpdateFormSectionDto } from './dto/update-form-section.dto';
import { ListFormSectionsQueryDto } from './dto/list-form-sections-query.dto';

export interface PaginatedFormSections {
  sections: (FormSection & {
    _count: { childSections: number; fields: number };
  })[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

@Injectable()
export class FormSectionsService {
  private readonly logger = new Logger(FormSectionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new section within a form
   *
   * @param formId - ID of the parent form
   * @param dto - Section data
   * @param userId - ID of the user creating the section (for authorization)
   * @throws NotFoundException if form not found
   * @throws ForbiddenException if user is not the service owner
   * @throws BadRequestException if parent section doesn't belong to same form
   */
  async create(
    formId: string,
    dto: CreateFormSectionDto,
    userId: string,
  ): Promise<FormSection> {
    this.logger.log(
      `Creating section "${dto.name}" for form ${formId} by user ${userId}`,
    );

    // Verify form exists and check ownership via parent service
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
      include: {
        service: {
          select: { createdBy: true },
        },
      },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID "${formId}" not found`);
    }

    if (form.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to create sections for this form',
      );
    }

    // If parent section is provided, verify it belongs to the same form
    if (dto.parentSectionId) {
      const parentSection = await this.prisma.formSection.findUnique({
        where: { id: dto.parentSectionId },
      });

      if (!parentSection) {
        throw new NotFoundException(
          `Parent section with ID "${dto.parentSectionId}" not found`,
        );
      }

      if (parentSection.formId !== formId) {
        throw new BadRequestException(
          'Parent section must belong to the same form',
        );
      }
    }

    return this.prisma.formSection.create({
      data: {
        formId,
        name: dto.name,
        description: dto.description,
        parentSectionId: dto.parentSectionId,
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
      },
    });
  }

  /**
   * Find all sections for a form with pagination and filtering
   */
  async findAllByForm(
    formId: string,
    query: ListFormSectionsQueryDto,
  ): Promise<PaginatedFormSections> {
    const {
      page = 1,
      limit = 20,
      isActive,
      parentSectionId,
      topLevelOnly,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page - 1) * limit;

    // Verify form exists
    const form = await this.prisma.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      throw new NotFoundException(`Form with ID "${formId}" not found`);
    }

    // Build where clause
    const where: Prisma.FormSectionWhereInput = {
      formId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (parentSectionId) {
      where.parentSectionId = parentSectionId;
    } else if (topLevelOnly) {
      where.parentSectionId = null;
    }

    // Build orderBy clause - default to sortOrder ascending
    const orderBy: Prisma.FormSectionOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.sortOrder = 'asc';
    }

    // Execute queries in parallel
    const [sections, total] = await Promise.all([
      this.prisma.formSection.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              childSections: true,
              fields: true,
            },
          },
        },
      }),
      this.prisma.formSection.count({ where }),
    ]);

    const hasNext = skip + sections.length < total;

    return {
      sections,
      total,
      page,
      limit,
      hasNext,
    };
  }

  /**
   * Find one section by ID
   */
  async findOne(
    id: string,
  ): Promise<
    FormSection & { _count: { childSections: number; fields: number } }
  > {
    const section = await this.prisma.formSection.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            childSections: true,
            fields: true,
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID "${id}" not found`);
    }

    return section;
  }

  /**
   * Update a section
   *
   * @param id - Section ID
   * @param dto - Update data
   * @param userId - ID of the user making the update (for authorization)
   * @throws NotFoundException if section not found
   * @throws ForbiddenException if user is not the owner of the parent service
   * @throws BadRequestException if new parent creates a circular reference
   */
  async update(
    id: string,
    dto: UpdateFormSectionDto,
    userId: string,
  ): Promise<FormSection> {
    this.logger.log(`Updating section ${id} by user ${userId}`);

    // First verify the section exists and check ownership via parent service
    const section = await this.prisma.formSection.findUnique({
      where: { id },
      include: {
        form: {
          include: {
            service: {
              select: { createdBy: true },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID "${id}" not found`);
    }

    if (section.form.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this section',
      );
    }

    // If parent section is being changed, verify no circular reference
    if (dto.parentSectionId !== undefined && dto.parentSectionId !== null) {
      // Cannot set parent to self
      if (dto.parentSectionId === id) {
        throw new BadRequestException('A section cannot be its own parent');
      }

      const parentSection = await this.prisma.formSection.findUnique({
        where: { id: dto.parentSectionId },
      });

      if (!parentSection) {
        throw new NotFoundException(
          `Parent section with ID "${dto.parentSectionId}" not found`,
        );
      }

      if (parentSection.formId !== section.formId) {
        throw new BadRequestException(
          'Parent section must belong to the same form',
        );
      }

      // Check for circular reference (is the new parent a descendant of this section?)
      const isDescendant = await this.isDescendant(dto.parentSectionId, id);
      if (isDescendant) {
        throw new BadRequestException(
          'Cannot set parent to a descendant section (circular reference)',
        );
      }
    }

    // Build update data, excluding undefined values
    const updateData: Prisma.FormSectionUpdateInput = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.description !== undefined) {
      updateData.description = dto.description;
    }
    if (dto.parentSectionId !== undefined) {
      updateData.parentSection =
        dto.parentSectionId === null
          ? { disconnect: true }
          : { connect: { id: dto.parentSectionId } };
    }
    if (dto.sortOrder !== undefined) {
      updateData.sortOrder = dto.sortOrder;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    return this.prisma.formSection.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Soft delete a section (set isActive to false)
   *
   * @param id - Section ID
   * @param userId - ID of the user making the deletion (for authorization)
   * @throws NotFoundException if section not found
   * @throws ForbiddenException if user is not the owner of the parent service
   */
  async remove(id: string, userId: string): Promise<FormSection> {
    this.logger.log(`Deactivating section ${id} by user ${userId}`);

    // First verify the section exists and check ownership via parent service
    const section = await this.prisma.formSection.findUnique({
      where: { id },
      include: {
        form: {
          include: {
            service: {
              select: { createdBy: true },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID "${id}" not found`);
    }

    if (section.form.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this section',
      );
    }

    return this.prisma.formSection.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Check if sectionId is a descendant of ancestorId
   */
  private async isDescendant(
    sectionId: string,
    ancestorId: string,
  ): Promise<boolean> {
    let currentId: string | null = sectionId;

    while (currentId) {
      const section: { parentSectionId: string | null } | null =
        await this.prisma.formSection.findUnique({
          where: { id: currentId },
          select: { parentSectionId: true },
        });

      if (!section) break;

      if (section.parentSectionId === ancestorId) {
        return true;
      }

      currentId = section.parentSectionId;
    }

    return false;
  }
}

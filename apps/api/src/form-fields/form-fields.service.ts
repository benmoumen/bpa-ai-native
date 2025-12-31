/**
 * FormFields Service
 *
 * Business logic for FormField CRUD operations
 * Uses Prisma for database access
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { type FormField, Prisma } from '@bpa/db';
import { CreateFormFieldDto } from './dto/create-form-field.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';
import { ListFormFieldsQueryDto } from './dto/list-form-fields-query.dto';

export interface PaginatedFormFields {
  fields: FormField[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

@Injectable()
export class FormFieldsService {
  private readonly logger = new Logger(FormFieldsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new field within a form
   *
   * @param formId - ID of the parent form
   * @param dto - Field data
   * @param userId - ID of the user creating the field (for authorization)
   * @throws NotFoundException if form not found
   * @throws ForbiddenException if user is not the service owner
   * @throws ConflictException if field name already exists in this form
   * @throws BadRequestException if section doesn't belong to same form
   */
  async create(
    formId: string,
    dto: CreateFormFieldDto,
    userId: string,
  ): Promise<FormField> {
    this.logger.log(
      `Creating field "${dto.name}" for form ${formId} by user ${userId}`,
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
        'You do not have permission to create fields for this form',
      );
    }

    // Check if field name already exists for this form
    const existingField = await this.prisma.formField.findUnique({
      where: {
        formId_name: {
          formId,
          name: dto.name,
        },
      },
    });

    if (existingField) {
      throw new ConflictException(
        `Field with name "${dto.name}" already exists in this form`,
      );
    }

    // If section is provided, verify it belongs to the same form
    if (dto.sectionId) {
      const section = await this.prisma.formSection.findUnique({
        where: { id: dto.sectionId },
      });

      if (!section) {
        throw new NotFoundException(
          `Section with ID "${dto.sectionId}" not found`,
        );
      }

      if (section.formId !== formId) {
        throw new BadRequestException('Section must belong to the same form');
      }
    }

    return this.prisma.formField.create({
      data: {
        formId,
        sectionId: dto.sectionId,
        type: dto.type,
        label: dto.label,
        name: dto.name,
        required: dto.required ?? false,
        properties: (dto.properties ?? {}) as Prisma.InputJsonValue,
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
      },
    });
  }

  /**
   * Find all fields for a form with pagination and filtering
   */
  async findAllByForm(
    formId: string,
    query: ListFormFieldsQueryDto,
  ): Promise<PaginatedFormFields> {
    const {
      page = 1,
      limit = 50,
      isActive,
      sectionId,
      noSection,
      type,
      required,
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
    const where: Prisma.FormFieldWhereInput = {
      formId,
    };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (sectionId) {
      where.sectionId = sectionId;
    } else if (noSection) {
      where.sectionId = null;
    }

    if (type) {
      where.type = type;
    }

    if (required !== undefined) {
      where.required = required;
    }

    // Build orderBy clause - default to sortOrder ascending
    const orderBy: Prisma.FormFieldOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'asc';
    } else {
      orderBy.sortOrder = 'asc';
    }

    // Execute queries in parallel
    const [fields, total] = await Promise.all([
      this.prisma.formField.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.formField.count({ where }),
    ]);

    const hasNext = skip + fields.length < total;

    return {
      fields,
      total,
      page,
      limit,
      hasNext,
    };
  }

  /**
   * Find one field by ID
   */
  async findOne(id: string): Promise<FormField> {
    const field = await this.prisma.formField.findUnique({
      where: { id },
    });

    if (!field) {
      throw new NotFoundException(`Field with ID "${id}" not found`);
    }

    return field;
  }

  /**
   * Update a field
   *
   * @param id - Field ID
   * @param dto - Update data
   * @param userId - ID of the user making the update (for authorization)
   * @throws NotFoundException if field not found
   * @throws ForbiddenException if user is not the owner of the parent service
   * @throws ConflictException if new name already exists in this form
   * @throws BadRequestException if new section doesn't belong to same form
   */
  async update(
    id: string,
    dto: UpdateFormFieldDto,
    userId: string,
  ): Promise<FormField> {
    this.logger.log(`Updating field ${id} by user ${userId}`);

    // First verify the field exists and check ownership via parent service
    const field = await this.prisma.formField.findUnique({
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

    if (!field) {
      throw new NotFoundException(`Field with ID "${id}" not found`);
    }

    if (field.form.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this field',
      );
    }

    // If name is being changed, check for conflicts
    if (dto.name && dto.name !== field.name) {
      const existingField = await this.prisma.formField.findUnique({
        where: {
          formId_name: {
            formId: field.formId,
            name: dto.name,
          },
        },
      });

      if (existingField) {
        throw new ConflictException(
          `Field with name "${dto.name}" already exists in this form`,
        );
      }
    }

    // If section is being changed, verify it belongs to the same form
    if (dto.sectionId !== undefined && dto.sectionId !== null) {
      const section = await this.prisma.formSection.findUnique({
        where: { id: dto.sectionId },
      });

      if (!section) {
        throw new NotFoundException(
          `Section with ID "${dto.sectionId}" not found`,
        );
      }

      if (section.formId !== field.formId) {
        throw new BadRequestException('Section must belong to the same form');
      }
    }

    // Build update data, excluding undefined values
    const updateData: Prisma.FormFieldUpdateInput = {};

    if (dto.type !== undefined) {
      updateData.type = dto.type;
    }
    if (dto.label !== undefined) {
      updateData.label = dto.label;
    }
    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }
    if (dto.sectionId !== undefined) {
      updateData.section =
        dto.sectionId === null
          ? { disconnect: true }
          : { connect: { id: dto.sectionId } };
    }
    if (dto.required !== undefined) {
      updateData.required = dto.required;
    }
    if (dto.properties !== undefined) {
      updateData.properties = dto.properties as Prisma.InputJsonValue;
    }
    if (dto.visibilityRule !== undefined) {
      updateData.visibilityRule =
        dto.visibilityRule === null
          ? Prisma.DbNull
          : (dto.visibilityRule as unknown as Prisma.InputJsonValue);
    }
    if (dto.sortOrder !== undefined) {
      updateData.sortOrder = dto.sortOrder;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    return this.prisma.formField.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Soft delete a field (set isActive to false)
   *
   * @param id - Field ID
   * @param userId - ID of the user making the deletion (for authorization)
   * @throws NotFoundException if field not found
   * @throws ForbiddenException if user is not the owner of the parent service
   */
  async remove(id: string, userId: string): Promise<FormField> {
    this.logger.log(`Deactivating field ${id} by user ${userId}`);

    // First verify the field exists and check ownership via parent service
    const field = await this.prisma.formField.findUnique({
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

    if (!field) {
      throw new NotFoundException(`Field with ID "${id}" not found`);
    }

    if (field.form.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this field',
      );
    }

    return this.prisma.formField.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }
}

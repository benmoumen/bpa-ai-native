/**
 * Document Requirements Service
 *
 * Business logic for linking global Requirements to specific Registrations.
 * Uses Prisma for database access.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import type { DocumentRequirement, Prisma } from '@bpa/db';
import { CreateDocumentRequirementDto } from './dto/create-document-requirement.dto';
import { UpdateDocumentRequirementDto } from './dto/update-document-requirement.dto';

export interface DocumentRequirementWithRequirement extends DocumentRequirement {
  requirement: {
    id: string;
    name: string;
    tooltip: string | null;
    template: string | null;
    isActive: boolean;
  };
}

export interface PaginatedDocumentRequirements {
  documentRequirements: DocumentRequirementWithRequirement[];
  total: number;
}

@Injectable()
export class DocumentRequirementsService {
  private readonly logger = new Logger(DocumentRequirementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new document requirement within a registration
   *
   * @param registrationId - ID of the parent registration
   * @param dto - Document requirement data
   * @param userId - ID of the user creating the document requirement (for authorization)
   * @throws NotFoundException if registration or requirement not found
   * @throws ForbiddenException if user is not the service owner
   * @throws ConflictException if requirement already linked to registration
   */
  async create(
    registrationId: string,
    dto: CreateDocumentRequirementDto,
    userId: string,
  ): Promise<DocumentRequirementWithRequirement> {
    this.logger.log(
      `Creating document requirement for registration ${registrationId} by user ${userId}`,
    );

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
        'You do not have permission to add document requirements to this registration',
      );
    }

    // Verify requirement exists
    const requirement = await this.prisma.requirement.findUnique({
      where: { id: dto.requirementId },
    });

    if (!requirement) {
      throw new NotFoundException(
        `Requirement with ID "${dto.requirementId}" not found`,
      );
    }

    // Check if requirement already linked to this registration
    const existingLink = await this.prisma.documentRequirement.findUnique({
      where: {
        registrationId_requirementId: {
          registrationId,
          requirementId: dto.requirementId,
        },
      },
    });

    if (existingLink) {
      throw new ConflictException(
        `Requirement "${requirement.name}" is already linked to this registration`,
      );
    }

    return this.prisma.documentRequirement.create({
      data: {
        registrationId,
        requirementId: dto.requirementId,
        nameOverride: dto.nameOverride,
        isRequired: dto.isRequired ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        requirement: {
          select: {
            id: true,
            name: true,
            tooltip: true,
            template: true,
            isActive: true,
          },
        },
      },
    });
  }

  /**
   * Find all document requirements for a registration
   */
  async findAllByRegistration(
    registrationId: string,
  ): Promise<PaginatedDocumentRequirements> {
    // Verify registration exists
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException(
        `Registration with ID "${registrationId}" not found`,
      );
    }

    const documentRequirements = await this.prisma.documentRequirement.findMany(
      {
        where: { registrationId },
        orderBy: { sortOrder: 'asc' },
        include: {
          requirement: {
            select: {
              id: true,
              name: true,
              tooltip: true,
              template: true,
              isActive: true,
            },
          },
        },
      },
    );

    return {
      documentRequirements,
      total: documentRequirements.length,
    };
  }

  /**
   * Find one document requirement by ID
   *
   * @param id - Document requirement ID
   * @param registrationId - Optional registration ID to verify the document requirement belongs to this registration
   * @throws NotFoundException if document requirement not found or doesn't belong to specified registration
   */
  async findOne(
    id: string,
    registrationId?: string,
  ): Promise<DocumentRequirementWithRequirement> {
    const documentRequirement =
      await this.prisma.documentRequirement.findUnique({
        where: { id },
        include: {
          requirement: {
            select: {
              id: true,
              name: true,
              tooltip: true,
              template: true,
              isActive: true,
            },
          },
        },
      });

    if (!documentRequirement) {
      throw new NotFoundException(
        `Document requirement with ID "${id}" not found`,
      );
    }

    // If registrationId is provided, verify the document requirement belongs to it
    if (registrationId && documentRequirement.registrationId !== registrationId) {
      throw new NotFoundException(
        `Document requirement with ID "${id}" not found in registration "${registrationId}"`,
      );
    }

    return documentRequirement;
  }

  /**
   * Update a document requirement
   *
   * @param id - Document requirement ID
   * @param dto - Update data
   * @param userId - ID of the user making the update (for authorization)
   * @throws NotFoundException if document requirement not found
   * @throws ForbiddenException if user is not the owner of the parent service
   */
  async update(
    id: string,
    dto: UpdateDocumentRequirementDto,
    userId: string,
  ): Promise<DocumentRequirementWithRequirement> {
    this.logger.log(`Updating document requirement ${id} by user ${userId}`);

    // First verify the document requirement exists and check ownership via parent service
    const documentRequirement =
      await this.prisma.documentRequirement.findUnique({
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

    if (!documentRequirement) {
      throw new NotFoundException(
        `Document requirement with ID "${id}" not found`,
      );
    }

    if (documentRequirement.registration.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this document requirement',
      );
    }

    // Build update data, excluding undefined values
    const updateData: Prisma.DocumentRequirementUpdateInput = {};

    if (dto.nameOverride !== undefined) {
      updateData.nameOverride = dto.nameOverride;
    }
    if (dto.isRequired !== undefined) {
      updateData.isRequired = dto.isRequired;
    }
    if (dto.sortOrder !== undefined) {
      updateData.sortOrder = dto.sortOrder;
    }

    return this.prisma.documentRequirement.update({
      where: { id },
      data: updateData,
      include: {
        requirement: {
          select: {
            id: true,
            name: true,
            tooltip: true,
            template: true,
            isActive: true,
          },
        },
      },
    });
  }

  /**
   * Delete a document requirement (hard delete - removes the link)
   *
   * @param id - Document requirement ID
   * @param userId - ID of the user making the deletion (for authorization)
   * @throws NotFoundException if document requirement not found
   * @throws ForbiddenException if user is not the owner of the parent service
   */
  async remove(
    id: string,
    userId: string,
  ): Promise<DocumentRequirementWithRequirement> {
    this.logger.log(`Removing document requirement ${id} by user ${userId}`);

    // First verify the document requirement exists and check ownership via parent service
    const documentRequirement =
      await this.prisma.documentRequirement.findUnique({
        where: { id },
        include: {
          registration: {
            include: {
              service: {
                select: { createdBy: true },
              },
            },
          },
          requirement: {
            select: {
              id: true,
              name: true,
              tooltip: true,
              template: true,
              isActive: true,
            },
          },
        },
      });

    if (!documentRequirement) {
      throw new NotFoundException(
        `Document requirement with ID "${id}" not found`,
      );
    }

    if (documentRequirement.registration.service.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this document requirement',
      );
    }

    // Hard delete - removes the link between requirement and registration
    await this.prisma.documentRequirement.delete({
      where: { id },
    });

    return documentRequirement;
  }
}

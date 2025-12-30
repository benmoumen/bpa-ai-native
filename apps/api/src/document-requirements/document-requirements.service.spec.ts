/**
 * DocumentRequirementsService Unit Tests
 *
 * Tests for the business logic layer of linking requirements to registrations.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DocumentRequirementsService } from './document-requirements.service';
import { PrismaService } from '../prisma';
import { CreateDocumentRequirementDto } from './dto/create-document-requirement.dto';
import { UpdateDocumentRequirementDto } from './dto/update-document-requirement.dto';

describe('DocumentRequirementsService', () => {
  let service: DocumentRequirementsService;

  // Mock data
  const mockUserId = 'user-456';

  const mockRegistration = {
    id: 'reg-123',
    serviceId: 'service-123',
    name: 'Business License Registration',
    service: {
      createdBy: mockUserId,
    },
  };

  const mockRequirement = {
    id: 'req-789',
    name: 'ID Document',
    tooltip: 'Valid government ID',
    template: 'https://example.com/id-template.pdf',
    isActive: true,
  };

  const mockDocumentRequirement = {
    id: 'docreq-123',
    registrationId: 'reg-123',
    requirementId: 'req-789',
    nameOverride: null,
    isRequired: true,
    sortOrder: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    requirement: mockRequirement,
  };

  const mockDocumentRequirementWithRegistration = {
    ...mockDocumentRequirement,
    registration: {
      service: {
        createdBy: mockUserId,
      },
    },
  };

  const mockPrismaService = {
    registration: {
      findUnique: jest.fn(),
    },
    requirement: {
      findUnique: jest.fn(),
    },
    documentRequirement: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentRequirementsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DocumentRequirementsService>(
      DocumentRequirementsService,
    );

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateDocumentRequirementDto = {
      requirementId: 'req-789',
      nameOverride: 'Custom ID Document',
      isRequired: true,
      sortOrder: 1,
    };

    it('should link a requirement to a registration', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );
      mockPrismaService.requirement.findUnique.mockResolvedValue(
        mockRequirement,
      );
      mockPrismaService.documentRequirement.findUnique.mockResolvedValue(null);
      mockPrismaService.documentRequirement.create.mockResolvedValue({
        ...mockDocumentRequirement,
        nameOverride: 'Custom ID Document',
        sortOrder: 1,
      });

      const result = await service.create('reg-123', createDto, mockUserId);

      expect(result.registrationId).toBe('reg-123');
      expect(result.requirementId).toBe('req-789');
      expect(mockPrismaService.registration.findUnique).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        include: {
          service: {
            select: { createdBy: true },
          },
        },
      });
      expect(mockPrismaService.requirement.findUnique).toHaveBeenCalledWith({
        where: { id: 'req-789' },
      });
    });

    it('should throw NotFoundException when registration does not exist', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(null);

      await expect(
        service.create('non-existent', createDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create('non-existent', createDto, mockUserId),
      ).rejects.toThrow('Registration with ID "non-existent" not found');
    });

    it('should throw ForbiddenException when user is not service owner', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );

      await expect(
        service.create('reg-123', createDto, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create('reg-123', createDto, 'other-user'),
      ).rejects.toThrow(
        'You do not have permission to add document requirements to this registration',
      );
    });

    it('should throw NotFoundException when requirement does not exist', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );
      mockPrismaService.requirement.findUnique.mockResolvedValue(null);

      await expect(
        service.create('reg-123', createDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create('reg-123', createDto, mockUserId),
      ).rejects.toThrow('Requirement with ID "req-789" not found');
    });

    it('should throw ConflictException when requirement already linked', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );
      mockPrismaService.requirement.findUnique.mockResolvedValue(
        mockRequirement,
      );
      mockPrismaService.documentRequirement.findUnique.mockResolvedValue(
        mockDocumentRequirement,
      );

      await expect(
        service.create('reg-123', createDto, mockUserId),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create('reg-123', createDto, mockUserId),
      ).rejects.toThrow(
        'Requirement "ID Document" is already linked to this registration',
      );
    });

    it('should use default values when optional fields not provided', async () => {
      const minimalDto: CreateDocumentRequirementDto = {
        requirementId: 'req-789',
      };

      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );
      mockPrismaService.requirement.findUnique.mockResolvedValue(
        mockRequirement,
      );
      mockPrismaService.documentRequirement.findUnique.mockResolvedValue(null);
      mockPrismaService.documentRequirement.create.mockResolvedValue(
        mockDocumentRequirement,
      );

      await service.create('reg-123', minimalDto, mockUserId);

      expect(mockPrismaService.documentRequirement.create).toHaveBeenCalledWith(
        {
          data: {
            registrationId: 'reg-123',
            requirementId: 'req-789',
            nameOverride: undefined,
            isRequired: true,
            sortOrder: 0,
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
        },
      );
    });
  });

  describe('findAllByRegistration', () => {
    it('should return all document requirements for a registration', async () => {
      const documentRequirements = [mockDocumentRequirement];
      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );
      mockPrismaService.documentRequirement.findMany.mockResolvedValue(
        documentRequirements,
      );

      const result = await service.findAllByRegistration('reg-123');

      expect(result).toEqual({
        documentRequirements,
        total: 1,
      });
      expect(
        mockPrismaService.documentRequirement.findMany,
      ).toHaveBeenCalledWith({
        where: { registrationId: 'reg-123' },
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
      });
    });

    it('should throw NotFoundException when registration does not exist', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(null);

      await expect(
        service.findAllByRegistration('non-existent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findAllByRegistration('non-existent'),
      ).rejects.toThrow('Registration with ID "non-existent" not found');
    });
  });

  describe('findOne', () => {
    it('should return a document requirement by id', async () => {
      mockPrismaService.documentRequirement.findUnique.mockResolvedValue(
        mockDocumentRequirement,
      );

      const result = await service.findOne('docreq-123');

      expect(result).toEqual(mockDocumentRequirement);
      expect(
        mockPrismaService.documentRequirement.findUnique,
      ).toHaveBeenCalledWith({
        where: { id: 'docreq-123' },
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
    });

    it('should throw NotFoundException when document requirement does not exist', async () => {
      mockPrismaService.documentRequirement.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Document requirement with ID "non-existent" not found',
      );
    });
  });

  describe('update', () => {
    it('should update a document requirement', async () => {
      const dto: UpdateDocumentRequirementDto = {
        nameOverride: 'Updated Document',
        isRequired: false,
        sortOrder: 5,
      };
      const updatedDocReq = { ...mockDocumentRequirement, ...dto };

      mockPrismaService.documentRequirement.findUnique.mockResolvedValue(
        mockDocumentRequirementWithRegistration,
      );
      mockPrismaService.documentRequirement.update.mockResolvedValue(
        updatedDocReq,
      );

      const result = await service.update('docreq-123', dto, mockUserId);

      expect(result.nameOverride).toBe('Updated Document');
      expect(result.isRequired).toBe(false);
      expect(mockPrismaService.documentRequirement.update).toHaveBeenCalledWith(
        {
          where: { id: 'docreq-123' },
          data: {
            nameOverride: dto.nameOverride,
            isRequired: dto.isRequired,
            sortOrder: dto.sortOrder,
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
        },
      );
    });

    it('should throw NotFoundException when document requirement does not exist', async () => {
      mockPrismaService.documentRequirement.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { nameOverride: 'Test' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('non-existent', { nameOverride: 'Test' }, mockUserId),
      ).rejects.toThrow(
        'Document requirement with ID "non-existent" not found',
      );
    });

    it('should throw ForbiddenException when user is not service owner', async () => {
      mockPrismaService.documentRequirement.findUnique.mockResolvedValue(
        mockDocumentRequirementWithRegistration,
      );

      await expect(
        service.update('docreq-123', { nameOverride: 'Test' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update('docreq-123', { nameOverride: 'Test' }, 'other-user'),
      ).rejects.toThrow(
        'You do not have permission to update this document requirement',
      );
    });

    it('should handle partial updates', async () => {
      const dto: UpdateDocumentRequirementDto = {
        sortOrder: 10,
      };

      mockPrismaService.documentRequirement.findUnique.mockResolvedValue(
        mockDocumentRequirementWithRegistration,
      );
      mockPrismaService.documentRequirement.update.mockResolvedValue({
        ...mockDocumentRequirement,
        sortOrder: 10,
      });

      await service.update('docreq-123', dto, mockUserId);

      expect(mockPrismaService.documentRequirement.update).toHaveBeenCalledWith(
        {
          where: { id: 'docreq-123' },
          data: {
            sortOrder: 10,
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
        },
      );
    });
  });

  describe('remove', () => {
    it('should hard delete a document requirement', async () => {
      mockPrismaService.documentRequirement.findUnique.mockResolvedValue({
        ...mockDocumentRequirementWithRegistration,
        requirement: mockRequirement,
      });
      mockPrismaService.documentRequirement.delete.mockResolvedValue(
        mockDocumentRequirement,
      );

      const result = await service.remove('docreq-123', mockUserId);

      expect(result.id).toBe('docreq-123');
      expect(mockPrismaService.documentRequirement.delete).toHaveBeenCalledWith(
        {
          where: { id: 'docreq-123' },
        },
      );
    });

    it('should throw NotFoundException when document requirement does not exist', async () => {
      mockPrismaService.documentRequirement.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('non-existent', mockUserId)).rejects.toThrow(
        'Document requirement with ID "non-existent" not found',
      );
    });

    it('should throw ForbiddenException when user is not service owner', async () => {
      mockPrismaService.documentRequirement.findUnique.mockResolvedValue({
        ...mockDocumentRequirementWithRegistration,
        requirement: mockRequirement,
      });

      await expect(service.remove('docreq-123', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.remove('docreq-123', 'other-user')).rejects.toThrow(
        'You do not have permission to delete this document requirement',
      );
    });
  });
});

/**
 * FormSectionsService Unit Tests
 *
 * Tests for the business logic layer of FormSection CRUD operations.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { FormSectionsService } from './form-sections.service';
import { PrismaService } from '../prisma';
import { CreateFormSectionDto } from './dto/create-form-section.dto';
import { UpdateFormSectionDto } from './dto/update-form-section.dto';

describe('FormSectionsService', () => {
  let service: FormSectionsService;

  // Mock data
  const mockUserId = 'user-456';

  const mockForm = {
    id: 'form-123',
    serviceId: 'service-123',
    name: 'Application Form',
    type: 'APPLICANT',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    service: {
      createdBy: mockUserId,
    },
  };

  const mockSection = {
    id: 'section-123',
    formId: 'form-123',
    parentSectionId: null,
    name: 'Personal Information',
    description: 'Enter your personal details',
    sortOrder: 0,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockSectionWithCounts = {
    ...mockSection,
    _count: {
      childSections: 2,
      fields: 5,
    },
  };

  const mockSectionWithForm = {
    ...mockSection,
    form: {
      service: {
        createdBy: mockUserId,
      },
    },
  };

  const mockPrismaService = {
    form: {
      findUnique: jest.fn(),
    },
    formSection: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FormSectionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FormSectionsService>(FormSectionsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateFormSectionDto = {
      name: 'Personal Information',
      description: 'Enter your personal details',
    };

    it('should create a new section', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formSection.create.mockResolvedValue(mockSection);

      const result = await service.create('form-123', createDto, mockUserId);

      expect(result).toEqual(mockSection);
      expect(mockPrismaService.form.findUnique).toHaveBeenCalledWith({
        where: { id: 'form-123' },
        include: {
          service: {
            select: { createdBy: true },
          },
        },
      });
      expect(mockPrismaService.formSection.create).toHaveBeenCalledWith({
        data: {
          formId: 'form-123',
          name: createDto.name,
          description: createDto.description,
          parentSectionId: undefined,
          sortOrder: 0,
          isActive: true,
        },
      });
    });

    it('should create a nested section', async () => {
      const nestedDto: CreateFormSectionDto = {
        ...createDto,
        parentSectionId: 'parent-section-123',
      };
      const parentSection = { ...mockSection, id: 'parent-section-123' };

      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formSection.findUnique.mockResolvedValue(parentSection);
      mockPrismaService.formSection.create.mockResolvedValue({
        ...mockSection,
        parentSectionId: 'parent-section-123',
      });

      const result = await service.create('form-123', nestedDto, mockUserId);

      expect(result.parentSectionId).toBe('parent-section-123');
    });

    it('should throw NotFoundException when form does not exist', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(null);

      await expect(
        service.create('non-existent', createDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create('non-existent', createDto, mockUserId),
      ).rejects.toThrow('Form with ID "non-existent" not found');
    });

    it('should throw ForbiddenException when user is not service owner', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);

      await expect(
        service.create('form-123', createDto, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create('form-123', createDto, 'other-user'),
      ).rejects.toThrow(
        'You do not have permission to create sections for this form',
      );
    });

    it('should throw NotFoundException when parent section does not exist', async () => {
      const dtoWithParent: CreateFormSectionDto = {
        ...createDto,
        parentSectionId: 'non-existent',
      };

      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formSection.findUnique.mockResolvedValue(null);

      await expect(
        service.create('form-123', dtoWithParent, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when parent section belongs to different form', async () => {
      const dtoWithParent: CreateFormSectionDto = {
        ...createDto,
        parentSectionId: 'other-form-section',
      };
      const otherFormSection = {
        ...mockSection,
        id: 'other-form-section',
        formId: 'other-form-123',
      };

      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formSection.findUnique.mockResolvedValue(
        otherFormSection,
      );

      await expect(
        service.create('form-123', dtoWithParent, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create('form-123', dtoWithParent, mockUserId),
      ).rejects.toThrow('Parent section must belong to the same form');
    });
  });

  describe('findAllByForm', () => {
    it('should return paginated sections with defaults', async () => {
      const sections = [mockSectionWithCounts];
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formSection.findMany.mockResolvedValue(sections);
      mockPrismaService.formSection.count.mockResolvedValue(1);

      const result = await service.findAllByForm('form-123', {});

      expect(result).toEqual({
        sections,
        total: 1,
        page: 1,
        limit: 20,
        hasNext: false,
      });
      expect(mockPrismaService.formSection.findMany).toHaveBeenCalledWith({
        where: { formId: 'form-123' },
        orderBy: { sortOrder: 'asc' },
        skip: 0,
        take: 20,
        include: {
          _count: {
            select: {
              childSections: true,
              fields: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when form does not exist', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(null);

      await expect(service.findAllByForm('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should filter by topLevelOnly', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formSection.findMany.mockResolvedValue([]);
      mockPrismaService.formSection.count.mockResolvedValue(0);

      await service.findAllByForm('form-123', { topLevelOnly: true });

      expect(mockPrismaService.formSection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { formId: 'form-123', parentSectionId: null },
        }),
      );
    });

    it('should filter by parentSectionId', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formSection.findMany.mockResolvedValue([]);
      mockPrismaService.formSection.count.mockResolvedValue(0);

      await service.findAllByForm('form-123', {
        parentSectionId: 'parent-123',
      });

      expect(mockPrismaService.formSection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { formId: 'form-123', parentSectionId: 'parent-123' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a section by id', async () => {
      mockPrismaService.formSection.findUnique.mockResolvedValue(
        mockSectionWithCounts,
      );

      const result = await service.findOne('section-123');

      expect(result).toEqual(mockSectionWithCounts);
    });

    it('should throw NotFoundException when section does not exist', async () => {
      mockPrismaService.formSection.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Section with ID "non-existent" not found',
      );
    });
  });

  describe('update', () => {
    it('should update a section', async () => {
      const dto: UpdateFormSectionDto = {
        name: 'Updated Section',
        description: 'Updated Description',
      };
      const updatedSection = { ...mockSection, ...dto };

      mockPrismaService.formSection.findUnique.mockResolvedValue({
        ...mockSection,
        form: {
          service: { createdBy: mockUserId },
        },
      });
      mockPrismaService.formSection.update.mockResolvedValue(updatedSection);

      const result = await service.update('section-123', dto, mockUserId);

      expect(result.name).toBe('Updated Section');
    });

    it('should throw NotFoundException when updating non-existent section', async () => {
      mockPrismaService.formSection.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not parent service owner', async () => {
      mockPrismaService.formSection.findUnique.mockResolvedValue({
        ...mockSection,
        form: {
          service: { createdBy: mockUserId },
        },
      });

      await expect(
        service.update('section-123', { name: 'New Name' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when setting parent to self', async () => {
      mockPrismaService.formSection.findUnique.mockResolvedValue({
        ...mockSection,
        form: {
          service: { createdBy: mockUserId },
        },
      });

      await expect(
        service.update(
          'section-123',
          { parentSectionId: 'section-123' },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(
          'section-123',
          { parentSectionId: 'section-123' },
          mockUserId,
        ),
      ).rejects.toThrow('A section cannot be its own parent');
    });
  });

  describe('remove', () => {
    it('should soft delete by setting isActive to false', async () => {
      const deactivatedSection = {
        ...mockSection,
        isActive: false,
      };

      mockPrismaService.formSection.findUnique.mockResolvedValue({
        ...mockSection,
        form: {
          service: { createdBy: mockUserId },
        },
      });
      mockPrismaService.formSection.update.mockResolvedValue(deactivatedSection);

      const result = await service.remove('section-123', mockUserId);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.formSection.update).toHaveBeenCalledWith({
        where: { id: 'section-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when deleting non-existent section', async () => {
      mockPrismaService.formSection.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not parent service owner', async () => {
      mockPrismaService.formSection.findUnique.mockResolvedValue({
        ...mockSection,
        form: {
          service: { createdBy: mockUserId },
        },
      });

      await expect(service.remove('section-123', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

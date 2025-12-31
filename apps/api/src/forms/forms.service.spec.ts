/**
 * FormsService Unit Tests
 *
 * Tests for the business logic layer of Form CRUD operations.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { PrismaService } from '../prisma';
import { CreateFormDto, FormTypeDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';

describe('FormsService', () => {
  let service: FormsService;

  // Mock data
  const mockUserId = 'user-456';

  const mockService = {
    id: 'service-123',
    name: 'Test Service',
    description: 'Test Description',
    category: 'Business',
    status: 'DRAFT',
    createdBy: mockUserId,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockForm = {
    id: 'form-123',
    serviceId: 'service-123',
    name: 'Application Form',
    type: 'APPLICANT',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockFormWithCounts = {
    ...mockForm,
    _count: {
      sections: 2,
      fields: 5,
    },
  };

  const mockFormWithService = {
    ...mockForm,
    service: {
      createdBy: mockUserId,
    },
  };

  const mockPrismaService = {
    service: {
      findUnique: jest.fn(),
    },
    form: {
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
        FormsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FormsService>(FormsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateFormDto = {
      name: 'Application Form',
      type: FormTypeDto.APPLICANT,
    };

    it('should create a new form', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.form.findUnique.mockResolvedValue(null);
      mockPrismaService.form.create.mockResolvedValue(mockForm);

      const result = await service.create('service-123', createDto, mockUserId);

      expect(result).toEqual(mockForm);
      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({
        where: { id: 'service-123' },
        select: { id: true, createdBy: true },
      });
      expect(mockPrismaService.form.create).toHaveBeenCalledWith({
        data: {
          serviceId: 'service-123',
          name: createDto.name,
          type: createDto.type,
          isActive: true,
        },
      });
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(
        service.create('non-existent', createDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create('non-existent', createDto, mockUserId),
      ).rejects.toThrow('Service with ID "non-existent" not found');
    });

    it('should throw ForbiddenException when user is not service owner', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      await expect(
        service.create('service-123', createDto, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create('service-123', createDto, 'other-user'),
      ).rejects.toThrow(
        'You do not have permission to create forms for this service',
      );
    });

    it('should throw ConflictException when form name already exists in service', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);

      await expect(
        service.create('service-123', createDto, mockUserId),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create('service-123', createDto, mockUserId),
      ).rejects.toThrow(
        'Form with name "Application Form" already exists in this service',
      );
    });

    it('should use provided isActive value', async () => {
      const dtoWithInactive: CreateFormDto = {
        ...createDto,
        isActive: false,
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.form.findUnique.mockResolvedValue(null);
      mockPrismaService.form.create.mockResolvedValue({
        ...mockForm,
        isActive: false,
      });

      await service.create('service-123', dtoWithInactive, mockUserId);

      expect(mockPrismaService.form.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isActive: false,
        }),
      });
    });
  });

  describe('findAllByService', () => {
    it('should return paginated forms with defaults', async () => {
      const forms = [mockFormWithCounts];
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.form.findMany.mockResolvedValue(forms);
      mockPrismaService.form.count.mockResolvedValue(1);

      const result = await service.findAllByService('service-123', {});

      expect(result).toEqual({
        forms,
        total: 1,
        page: 1,
        limit: 20,
        hasNext: false,
      });
      expect(mockPrismaService.form.findMany).toHaveBeenCalledWith({
        where: { serviceId: 'service-123' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: {
          _count: {
            select: {
              sections: true,
              fields: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(
        service.findAllByService('non-existent', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should filter by isActive', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.form.findMany.mockResolvedValue([]);
      mockPrismaService.form.count.mockResolvedValue(0);

      await service.findAllByService('service-123', { isActive: true });

      expect(mockPrismaService.form.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { serviceId: 'service-123', isActive: true },
        }),
      );
    });

    it('should filter by type', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.form.findMany.mockResolvedValue([]);
      mockPrismaService.form.count.mockResolvedValue(0);

      await service.findAllByService('service-123', {
        type: FormTypeDto.APPLICANT,
      });

      expect(mockPrismaService.form.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { serviceId: 'service-123', type: 'APPLICANT' },
        }),
      );
    });

    it('should apply pagination correctly', async () => {
      const manyForms = Array(20)
        .fill(null)
        .map((_, i) => ({ ...mockFormWithCounts, id: `form-${i}` }));
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.form.findMany.mockResolvedValue(manyForms);
      mockPrismaService.form.count.mockResolvedValue(50);

      const result = await service.findAllByService('service-123', {
        page: 2,
        limit: 20,
      });

      expect(result.hasNext).toBe(true);
      expect(result.page).toBe(2);
      expect(mockPrismaService.form.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        }),
      );
    });

    it('should apply custom sorting', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.form.findMany.mockResolvedValue([]);
      mockPrismaService.form.count.mockResolvedValue(0);

      await service.findAllByService('service-123', {
        sortBy: 'name',
        sortOrder: 'desc',
      });

      expect(mockPrismaService.form.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a form by id', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockFormWithCounts);

      const result = await service.findOne('form-123');

      expect(result).toEqual(mockFormWithCounts);
      expect(mockPrismaService.form.findUnique).toHaveBeenCalledWith({
        where: { id: 'form-123' },
        include: {
          _count: {
            select: {
              sections: true,
              fields: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException when form does not exist', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Form with ID "non-existent" not found',
      );
    });
  });

  describe('update', () => {
    it('should update a form', async () => {
      const dto: UpdateFormDto = {
        name: 'Updated Form',
        type: FormTypeDto.GUIDE,
      };
      const updatedForm = { ...mockForm, ...dto };

      mockPrismaService.form.findUnique
        .mockResolvedValueOnce(mockFormWithService)
        .mockResolvedValueOnce(null);
      mockPrismaService.form.update.mockResolvedValue(updatedForm);

      const result = await service.update('form-123', dto, mockUserId);

      expect(result.name).toBe('Updated Form');
      expect(mockPrismaService.form.update).toHaveBeenCalledWith({
        where: { id: 'form-123' },
        data: {
          name: dto.name,
          type: dto.type,
        },
      });
    });

    it('should throw NotFoundException when updating non-existent form', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('non-existent', { name: 'New Name' }, mockUserId),
      ).rejects.toThrow('Form with ID "non-existent" not found');
    });

    it('should throw ForbiddenException when user is not parent service owner', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockFormWithService);

      await expect(
        service.update('form-123', { name: 'New Name' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update('form-123', { name: 'New Name' }, 'other-user'),
      ).rejects.toThrow('You do not have permission to update this form');
    });

    it('should throw ConflictException when new name already exists', async () => {
      mockPrismaService.form.findUnique
        .mockResolvedValueOnce(mockFormWithService)
        .mockResolvedValueOnce({ id: 'other-form', name: 'Existing Form' });

      await expect(
        service.update('form-123', { name: 'Existing Form' }, mockUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should handle partial updates', async () => {
      const dto: UpdateFormDto = {
        isActive: false,
      };

      mockPrismaService.form.findUnique.mockResolvedValue(mockFormWithService);
      mockPrismaService.form.update.mockResolvedValue({
        ...mockForm,
        isActive: false,
      });

      const result = await service.update('form-123', dto, mockUserId);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.form.update).toHaveBeenCalledWith({
        where: { id: 'form-123' },
        data: {
          isActive: false,
        },
      });
    });
  });

  describe('remove', () => {
    it('should soft delete by setting isActive to false', async () => {
      const deactivatedForm = {
        ...mockForm,
        isActive: false,
      };

      mockPrismaService.form.findUnique.mockResolvedValue(mockFormWithService);
      mockPrismaService.form.update.mockResolvedValue(deactivatedForm);

      const result = await service.remove('form-123', mockUserId);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.form.update).toHaveBeenCalledWith({
        where: { id: 'form-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when deleting non-existent form', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('non-existent', mockUserId)).rejects.toThrow(
        'Form with ID "non-existent" not found',
      );
    });

    it('should throw ForbiddenException when user is not parent service owner', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockFormWithService);

      await expect(service.remove('form-123', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.remove('form-123', 'other-user')).rejects.toThrow(
        'You do not have permission to delete this form',
      );
    });
  });
});

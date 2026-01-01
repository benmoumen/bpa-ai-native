/**
 * DeterminantsService Unit Tests
 *
 * Tests for the business logic layer of Determinant CRUD operations.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DeterminantsService } from './determinants.service';
import { PrismaService } from '../prisma';
import {
  CreateDeterminantDto,
  DeterminantTypeDto,
} from './dto/create-determinant.dto';
import { UpdateDeterminantDto } from './dto/update-determinant.dto';

describe('DeterminantsService', () => {
  let service: DeterminantsService;

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

  const mockDeterminant = {
    id: 'determinant-123',
    serviceId: 'service-123',
    name: 'applicant_age',
    type: 'NUMBER',
    sourceFieldId: null,
    formula: null,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockDeterminantWithCounts = {
    ...mockDeterminant,
    _count: {
      linkedFields: 2,
    },
  };

  const mockDeterminantWithService = {
    ...mockDeterminant,
    service: {
      createdBy: mockUserId,
    },
  };

  const mockFormField = {
    id: 'field-123',
    formId: 'form-123',
    type: 'NUMBER',
    name: 'age',
    form: {
      serviceId: 'service-123',
      service: {
        createdBy: mockUserId,
      },
    },
  };

  const mockPrismaService = {
    service: {
      findUnique: jest.fn(),
    },
    determinant: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    formField: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeterminantsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DeterminantsService>(DeterminantsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateDeterminantDto = {
      name: 'applicant_age',
      type: DeterminantTypeDto.NUMBER,
    };

    it('should create a determinant successfully', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.determinant.findUnique.mockResolvedValue(null);
      mockPrismaService.determinant.create.mockResolvedValue(mockDeterminant);

      const result = await service.create('service-123', createDto, mockUserId);

      expect(result).toEqual(mockDeterminant);
      expect(mockPrismaService.determinant.create).toHaveBeenCalledWith({
        data: {
          serviceId: 'service-123',
          name: 'applicant_age',
          type: 'NUMBER',
          sourceFieldId: undefined,
          formula: undefined,
          isActive: true,
        },
      });
    });

    it('should throw NotFoundException if service not found', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(
        service.create('service-123', createDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not service owner', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({
        ...mockService,
        createdBy: 'other-user',
      });

      await expect(
        service.create('service-123', createDto, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if determinant name already exists', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.determinant.findUnique.mockResolvedValue(
        mockDeterminant,
      );

      await expect(
        service.create('service-123', createDto, mockUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should create determinant with sourceFieldId', async () => {
      const createDtoWithSource: CreateDeterminantDto = {
        ...createDto,
        sourceFieldId: 'field-123',
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.determinant.findUnique.mockResolvedValue(null);
      mockPrismaService.formField.findUnique.mockResolvedValue(mockFormField);
      mockPrismaService.determinant.create.mockResolvedValue({
        ...mockDeterminant,
        sourceFieldId: 'field-123',
      });

      const result = await service.create(
        'service-123',
        createDtoWithSource,
        mockUserId,
      );

      expect(result.sourceFieldId).toBe('field-123');
    });

    it('should throw NotFoundException if source field not found', async () => {
      const createDtoWithSource: CreateDeterminantDto = {
        ...createDto,
        sourceFieldId: 'field-123',
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.determinant.findUnique.mockResolvedValue(null);
      mockPrismaService.formField.findUnique.mockResolvedValue(null);

      await expect(
        service.create('service-123', createDtoWithSource, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllByService', () => {
    it('should return paginated determinants', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.determinant.findMany.mockResolvedValue([
        mockDeterminantWithCounts,
      ]);
      mockPrismaService.determinant.count.mockResolvedValue(1);

      const result = await service.findAllByService('service-123', {
        page: 1,
        limit: 20,
      });

      expect(result.determinants).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.hasNext).toBe(false);
    });

    it('should throw NotFoundException if service not found', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(
        service.findAllByService('service-123', { page: 1, limit: 20 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should filter by type', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.determinant.findMany.mockResolvedValue([
        mockDeterminantWithCounts,
      ]);
      mockPrismaService.determinant.count.mockResolvedValue(1);

      await service.findAllByService('service-123', {
        page: 1,
        limit: 20,
        type: DeterminantTypeDto.NUMBER,
      });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      const expectedCall = expect.objectContaining({
        where: expect.objectContaining({
          type: 'NUMBER',
        }),
      });
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(mockPrismaService.determinant.findMany).toHaveBeenCalledWith(
        expectedCall,
      );
    });

    it('should filter by search term', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.determinant.findMany.mockResolvedValue([]);
      mockPrismaService.determinant.count.mockResolvedValue(0);

      await service.findAllByService('service-123', {
        page: 1,
        limit: 20,
        search: 'age',
      });

      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      const expectedCall = expect.objectContaining({
        where: expect.objectContaining({
          name: {
            contains: 'age',
            mode: 'insensitive',
          },
        }),
      });
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
      expect(mockPrismaService.determinant.findMany).toHaveBeenCalledWith(
        expectedCall,
      );
    });
  });

  describe('findOne', () => {
    it('should return a determinant by ID', async () => {
      mockPrismaService.determinant.findUnique.mockResolvedValue(
        mockDeterminantWithCounts,
      );

      const result = await service.findOne('determinant-123');

      expect(result).toEqual(mockDeterminantWithCounts);
    });

    it('should throw NotFoundException if determinant not found', async () => {
      mockPrismaService.determinant.findUnique.mockResolvedValue(null);

      await expect(service.findOne('determinant-123')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateDeterminantDto = {
      name: 'updated_name',
    };

    it('should update a determinant successfully', async () => {
      mockPrismaService.determinant.findUnique
        .mockResolvedValueOnce(mockDeterminantWithService)
        .mockResolvedValueOnce(null); // For name conflict check
      mockPrismaService.determinant.update.mockResolvedValue({
        ...mockDeterminant,
        name: 'updated_name',
      });

      const result = await service.update(
        'determinant-123',
        updateDto,
        mockUserId,
      );

      expect(result.name).toBe('updated_name');
    });

    it('should throw NotFoundException if determinant not found', async () => {
      mockPrismaService.determinant.findUnique.mockResolvedValue(null);

      await expect(
        service.update('determinant-123', updateDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not service owner', async () => {
      mockPrismaService.determinant.findUnique.mockResolvedValue({
        ...mockDeterminantWithService,
        service: { createdBy: 'other-user' },
      });

      await expect(
        service.update('determinant-123', updateDto, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if new name already exists', async () => {
      mockPrismaService.determinant.findUnique
        .mockResolvedValueOnce(mockDeterminantWithService)
        .mockResolvedValueOnce({ id: 'other-determinant' }); // Existing with same name

      await expect(
        service.update('determinant-123', updateDto, mockUserId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should deactivate a determinant successfully', async () => {
      mockPrismaService.determinant.findUnique.mockResolvedValue(
        mockDeterminantWithService,
      );
      mockPrismaService.determinant.update.mockResolvedValue({
        ...mockDeterminant,
        isActive: false,
      });

      const result = await service.remove('determinant-123', mockUserId);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.determinant.update).toHaveBeenCalledWith({
        where: { id: 'determinant-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException if determinant not found', async () => {
      mockPrismaService.determinant.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('determinant-123', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not service owner', async () => {
      mockPrismaService.determinant.findUnique.mockResolvedValue({
        ...mockDeterminantWithService,
        service: { createdBy: 'other-user' },
      });

      await expect(
        service.remove('determinant-123', mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('linkFieldToDeterminant', () => {
    it('should link a field to a determinant successfully', async () => {
      mockPrismaService.formField.findUnique.mockResolvedValue(mockFormField);
      mockPrismaService.determinant.findUnique.mockResolvedValue(
        mockDeterminant,
      );
      mockPrismaService.formField.update.mockResolvedValue({
        id: 'field-123',
        determinantId: 'determinant-123',
      });

      const result = await service.linkFieldToDeterminant(
        'field-123',
        'determinant-123',
        mockUserId,
      );

      expect(result.field.determinantId).toBe('determinant-123');
      expect(result.determinant).toEqual(mockDeterminant);
    });

    it('should throw NotFoundException if field not found', async () => {
      mockPrismaService.formField.findUnique.mockResolvedValue(null);

      await expect(
        service.linkFieldToDeterminant(
          'field-123',
          'determinant-123',
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if determinant not found', async () => {
      mockPrismaService.formField.findUnique.mockResolvedValue(mockFormField);
      mockPrismaService.determinant.findUnique.mockResolvedValue(null);

      await expect(
        service.linkFieldToDeterminant(
          'field-123',
          'determinant-123',
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if determinant is from different service', async () => {
      mockPrismaService.formField.findUnique.mockResolvedValue(mockFormField);
      mockPrismaService.determinant.findUnique.mockResolvedValue({
        ...mockDeterminant,
        serviceId: 'other-service',
      });

      await expect(
        service.linkFieldToDeterminant(
          'field-123',
          'determinant-123',
          mockUserId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('unlinkFieldFromDeterminant', () => {
    it('should unlink a field from its determinant', async () => {
      mockPrismaService.formField.findUnique.mockResolvedValue(mockFormField);
      mockPrismaService.formField.update.mockResolvedValue({
        id: 'field-123',
        determinantId: null,
      });

      const result = await service.unlinkFieldFromDeterminant(
        'field-123',
        mockUserId,
      );

      expect(result.determinantId).toBeNull();
    });

    it('should throw NotFoundException if field not found', async () => {
      mockPrismaService.formField.findUnique.mockResolvedValue(null);

      await expect(
        service.unlinkFieldFromDeterminant('field-123', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not service owner', async () => {
      mockPrismaService.formField.findUnique.mockResolvedValue({
        ...mockFormField,
        form: {
          ...mockFormField.form,
          service: { createdBy: 'other-user' },
        },
      });

      await expect(
        service.unlinkFieldFromDeterminant('field-123', mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

/**
 * RequirementsService Unit Tests
 *
 * Tests for the business logic layer of Requirement CRUD operations.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RequirementsService } from './requirements.service';
import { PrismaService } from '../prisma';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';

describe('RequirementsService', () => {
  let service: RequirementsService;

  // Mock data
  const mockRequirement = {
    id: 'req-123',
    name: 'Business License',
    tooltip: 'Required for all businesses',
    template: 'https://example.com/template.pdf',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockPrismaService = {
    requirement: {
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
        RequirementsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RequirementsService>(RequirementsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateRequirementDto = {
      name: 'Business License',
      tooltip: 'Required for all businesses',
      template: 'https://example.com/template.pdf',
    };

    it('should create a new requirement', async () => {
      mockPrismaService.requirement.create.mockResolvedValue(mockRequirement);

      const result = await service.create(createDto);

      expect(result).toEqual(mockRequirement);
      expect(mockPrismaService.requirement.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          tooltip: createDto.tooltip,
          template: createDto.template,
          isActive: true,
        },
      });
    });

    it('should create requirement without optional fields', async () => {
      const minimalDto: CreateRequirementDto = {
        name: 'Minimal Requirement',
      };

      mockPrismaService.requirement.create.mockResolvedValue({
        ...mockRequirement,
        name: 'Minimal Requirement',
        tooltip: null,
        template: null,
      });

      await service.create(minimalDto);

      expect(mockPrismaService.requirement.create).toHaveBeenCalledWith({
        data: {
          name: 'Minimal Requirement',
          tooltip: undefined,
          template: undefined,
          isActive: true,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated requirements with defaults', async () => {
      const requirements = [mockRequirement];
      mockPrismaService.requirement.findMany.mockResolvedValue(requirements);
      mockPrismaService.requirement.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({
        requirements,
        total: 1,
        page: 1,
        limit: 20,
        hasNext: false,
      });
      expect(mockPrismaService.requirement.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { name: 'asc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by isActive', async () => {
      mockPrismaService.requirement.findMany.mockResolvedValue([]);
      mockPrismaService.requirement.count.mockResolvedValue(0);

      await service.findAll({ isActive: true });

      expect(mockPrismaService.requirement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        }),
      );
    });

    it('should filter by search term', async () => {
      mockPrismaService.requirement.findMany.mockResolvedValue([]);
      mockPrismaService.requirement.count.mockResolvedValue(0);

      await service.findAll({ search: 'license' });

      expect(mockPrismaService.requirement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'license', mode: 'insensitive' } },
              { tooltip: { contains: 'license', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should apply pagination correctly', async () => {
      const manyRequirements = Array(20)
        .fill(null)
        .map((_, i) => ({ ...mockRequirement, id: `req-${i}` }));
      mockPrismaService.requirement.findMany.mockResolvedValue(
        manyRequirements,
      );
      mockPrismaService.requirement.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 2, limit: 20 });

      expect(result.hasNext).toBe(true);
      expect(result.page).toBe(2);
      expect(mockPrismaService.requirement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        }),
      );
    });

    it('should apply custom sorting', async () => {
      mockPrismaService.requirement.findMany.mockResolvedValue([]);
      mockPrismaService.requirement.count.mockResolvedValue(0);

      await service.findAll({ sortBy: 'createdAt', sortOrder: 'desc' });

      expect(mockPrismaService.requirement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a requirement by id', async () => {
      mockPrismaService.requirement.findUnique.mockResolvedValue(
        mockRequirement,
      );

      const result = await service.findOne('req-123');

      expect(result).toEqual(mockRequirement);
      expect(mockPrismaService.requirement.findUnique).toHaveBeenCalledWith({
        where: { id: 'req-123' },
      });
    });

    it('should throw NotFoundException when requirement does not exist', async () => {
      mockPrismaService.requirement.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Requirement with ID "non-existent" not found',
      );
    });
  });

  describe('update', () => {
    it('should update a requirement', async () => {
      const dto: UpdateRequirementDto = {
        name: 'Updated License',
        tooltip: 'Updated tooltip',
      };
      const updatedRequirement = { ...mockRequirement, ...dto };

      mockPrismaService.requirement.findUnique
        .mockResolvedValueOnce(mockRequirement) // First call for existence check
        .mockResolvedValueOnce(null); // Second call for duplicate name check
      mockPrismaService.requirement.update.mockResolvedValue(
        updatedRequirement,
      );

      const result = await service.update('req-123', dto);

      expect(result.name).toBe('Updated License');
      expect(mockPrismaService.requirement.update).toHaveBeenCalledWith({
        where: { id: 'req-123' },
        data: {
          name: dto.name,
          tooltip: dto.tooltip,
        },
      });
    });

    it('should throw NotFoundException when updating non-existent requirement', async () => {
      mockPrismaService.requirement.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow('Requirement with ID "non-existent" not found');
    });

    it('should handle partial updates', async () => {
      const dto: UpdateRequirementDto = {
        isActive: false,
      };

      mockPrismaService.requirement.findUnique.mockResolvedValue(
        mockRequirement,
      );
      mockPrismaService.requirement.update.mockResolvedValue({
        ...mockRequirement,
        isActive: false,
      });

      const result = await service.update('req-123', dto);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.requirement.update).toHaveBeenCalledWith({
        where: { id: 'req-123' },
        data: {
          isActive: false,
        },
      });
    });
  });

  describe('remove', () => {
    it('should soft delete by setting isActive to false', async () => {
      const deactivatedRequirement = {
        ...mockRequirement,
        isActive: false,
      };

      mockPrismaService.requirement.findUnique.mockResolvedValue(
        mockRequirement,
      );
      mockPrismaService.requirement.update.mockResolvedValue(
        deactivatedRequirement,
      );

      const result = await service.remove('req-123');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.requirement.update).toHaveBeenCalledWith({
        where: { id: 'req-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when deleting non-existent requirement', async () => {
      mockPrismaService.requirement.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('non-existent')).rejects.toThrow(
        'Requirement with ID "non-existent" not found',
      );
    });
  });
});

/**
 * ServicesService Unit Tests
 *
 * Tests for the business logic layer of Service CRUD operations.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma';
import { ServiceStatus } from '@bpa/db';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

describe('ServicesService', () => {
  let service: ServicesService;
  let prismaService: PrismaService;

  // Mock service data
  const mockService = {
    id: 'service-123',
    name: 'Test Service',
    description: 'Test Description',
    category: 'Business',
    status: ServiceStatus.DRAFT,
    createdBy: 'user-456',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockPrismaService = {
    service: {
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
        ServicesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new service', async () => {
      const dto: CreateServiceDto = {
        name: 'Test Service',
        description: 'Test Description',
        category: 'Business',
      };
      const userId = 'user-456';

      mockPrismaService.service.create.mockResolvedValue(mockService);

      const result = await service.create(dto, userId);

      expect(result).toEqual(mockService);
      expect(mockPrismaService.service.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: dto.description,
          category: dto.category,
          status: ServiceStatus.DRAFT,
          createdBy: userId,
        },
      });
    });

    it('should create a service with only required fields', async () => {
      const dto: CreateServiceDto = {
        name: 'Minimal Service',
      };
      const userId = 'user-789';

      const minimalService = {
        ...mockService,
        id: 'service-minimal',
        name: 'Minimal Service',
        description: undefined,
        category: undefined,
      };
      mockPrismaService.service.create.mockResolvedValue(minimalService);

      const result = await service.create(dto, userId);

      expect(result.name).toBe('Minimal Service');
      expect(mockPrismaService.service.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: undefined,
          category: undefined,
          status: ServiceStatus.DRAFT,
          createdBy: userId,
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated services with defaults', async () => {
      const services = [mockService];
      mockPrismaService.service.findMany.mockResolvedValue(services);
      mockPrismaService.service.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({
        services,
        total: 1,
        page: 1,
        limit: 20,
        hasNext: false,
      });
      expect(mockPrismaService.service.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by status', async () => {
      mockPrismaService.service.findMany.mockResolvedValue([]);
      mockPrismaService.service.count.mockResolvedValue(0);

      await service.findAll({ status: ServiceStatus.PUBLISHED });

      expect(mockPrismaService.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: ServiceStatus.PUBLISHED },
        }),
      );
    });

    it('should filter by search term', async () => {
      mockPrismaService.service.findMany.mockResolvedValue([]);
      mockPrismaService.service.count.mockResolvedValue(0);

      await service.findAll({ search: 'business' });

      expect(mockPrismaService.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'business', mode: 'insensitive' } },
              { description: { contains: 'business', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should apply pagination correctly', async () => {
      const manyServices = Array(20)
        .fill(null)
        .map((_, i) => ({ ...mockService, id: `service-${i}` }));
      mockPrismaService.service.findMany.mockResolvedValue(manyServices);
      mockPrismaService.service.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 2, limit: 20 });

      expect(result.hasNext).toBe(true);
      expect(result.page).toBe(2);
      expect(mockPrismaService.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        }),
      );
    });

    it('should apply custom sorting', async () => {
      mockPrismaService.service.findMany.mockResolvedValue([]);
      mockPrismaService.service.count.mockResolvedValue(0);

      await service.findAll({ sortBy: 'name', sortOrder: 'asc' });

      expect(mockPrismaService.service.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);

      const result = await service.findOne('service-123');

      expect(result).toEqual(mockService);
      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({
        where: { id: 'service-123' },
      });
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Service with ID "non-existent" not found',
      );
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      const dto: UpdateServiceDto = {
        name: 'Updated Name',
        description: 'Updated Description',
      };
      const updatedService = { ...mockService, ...dto };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.service.update.mockResolvedValue(updatedService);

      const result = await service.update('service-123', dto);

      expect(result.name).toBe('Updated Name');
      expect(mockPrismaService.service.update).toHaveBeenCalledWith({
        where: { id: 'service-123' },
        data: {
          name: dto.name,
          description: dto.description,
          category: undefined,
        },
      });
    });

    it('should throw NotFoundException when updating non-existent service', async () => {
      // Mock Prisma throwing P2025 error (record not found)
      const prismaError = new Error('Record not found');
      (prismaError as Error & { code: string }).code = 'P2025';
      mockPrismaService.service.update.mockRejectedValue(prismaError);

      await expect(
        service.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle partial updates', async () => {
      const dto: UpdateServiceDto = {
        name: 'Only Name Updated',
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.service.update.mockResolvedValue({
        ...mockService,
        name: dto.name,
      });

      const result = await service.update('service-123', dto);

      expect(result.name).toBe('Only Name Updated');
      expect(mockPrismaService.service.update).toHaveBeenCalledWith({
        where: { id: 'service-123' },
        data: {
          name: dto.name,
          description: undefined,
          category: undefined,
        },
      });
    });
  });

  describe('remove', () => {
    it('should soft delete by setting status to ARCHIVED', async () => {
      const archivedService = {
        ...mockService,
        status: ServiceStatus.ARCHIVED,
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.service.update.mockResolvedValue(archivedService);

      const result = await service.remove('service-123');

      expect(result.status).toBe(ServiceStatus.ARCHIVED);
      expect(mockPrismaService.service.update).toHaveBeenCalledWith({
        where: { id: 'service-123' },
        data: { status: ServiceStatus.ARCHIVED },
      });
    });

    it('should throw NotFoundException when deleting non-existent service', async () => {
      // Mock Prisma throwing P2025 error (record not found)
      const prismaError = new Error('Record not found');
      (prismaError as Error & { code: string }).code = 'P2025';
      mockPrismaService.service.update.mockRejectedValue(prismaError);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

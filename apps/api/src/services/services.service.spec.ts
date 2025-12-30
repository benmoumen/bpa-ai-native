/**
 * ServicesService Unit Tests
 *
 * Tests for the business logic layer of Service CRUD operations.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ServicesService } from './services.service';
import { PrismaService } from '../prisma';
import { TemplatesService } from '../templates';
import { ServiceStatus } from '@bpa/db';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

describe('ServicesService', () => {
  let service: ServicesService;
  let prismaService: PrismaService;
  let templatesService: TemplatesService;

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

  // Mock template data
  const mockTemplate = {
    id: 'template-123',
    name: 'Business Registration',
    description: 'Standard template for business registration',
    category: 'Business',
    previewImageUrl: null,
    formCount: 3,
    workflowSteps: 4,
    config: { forms: ['form1'], workflow: ['step1'] },
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  // Transaction client methods (used inside $transaction callbacks)
  const mockTxService = {
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
  };

  const mockPrismaService = {
    service: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    // Transaction mock - executes callback with transaction client
    $transaction: jest.fn((callback: (tx: unknown) => Promise<unknown>) =>
      callback({ service: mockTxService }),
    ),
  };

  const mockTemplatesService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TemplatesService,
          useValue: mockTemplatesService,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    prismaService = module.get<PrismaService>(PrismaService);
    templatesService = module.get<TemplatesService>(TemplatesService);

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

      const result = await service.update('service-123', dto, 'user-456');

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
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }, 'user-456'),
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

      const result = await service.update('service-123', dto, 'user-456');

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

      const result = await service.remove('service-123', 'user-456');

      expect(result.status).toBe(ServiceStatus.ARCHIVED);
      expect(mockPrismaService.service.update).toHaveBeenCalledWith({
        where: { id: 'service-123' },
        data: { status: ServiceStatus.ARCHIVED },
      });
    });

    it('should throw NotFoundException when deleting non-existent service', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', 'user-456')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deletePermanently', () => {
    it('should permanently delete a DRAFT service', async () => {
      // Transaction succeeds - deleteMany returns count: 1
      mockTxService.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.deletePermanently('service-123', 'user-456');

      expect(result).toEqual({ id: 'service-123', deleted: true });
      expect(mockTxService.deleteMany).toHaveBeenCalledWith({
        where: {
          id: 'service-123',
          createdBy: 'user-456',
          status: ServiceStatus.DRAFT,
        },
      });
    });

    it('should throw NotFoundException when service does not exist', async () => {
      // Transaction fails - deleteMany returns count: 0
      mockTxService.deleteMany.mockResolvedValue({ count: 0 });
      // Error check finds no service
      mockTxService.findUnique.mockResolvedValue(null);

      await expect(
        service.deletePermanently('non-existent', 'user-456'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.deletePermanently('non-existent', 'user-456'),
      ).rejects.toThrow('Service with ID "non-existent" not found');
    });

    it('should throw BadRequestException when service is PUBLISHED', async () => {
      // Transaction fails - deleteMany returns count: 0
      mockTxService.deleteMany.mockResolvedValue({ count: 0 });
      // Error check finds PUBLISHED service
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.PUBLISHED,
        createdBy: 'user-456',
      });

      await expect(
        service.deletePermanently('service-123', 'user-456'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.deletePermanently('service-123', 'user-456'),
      ).rejects.toThrow(
        'Cannot permanently delete service with status "PUBLISHED". Only DRAFT services can be permanently deleted.',
      );
    });

    it('should throw BadRequestException when service is ARCHIVED', async () => {
      // Transaction fails - deleteMany returns count: 0
      mockTxService.deleteMany.mockResolvedValue({ count: 0 });
      // Error check finds ARCHIVED service
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.ARCHIVED,
        createdBy: 'user-456',
      });

      await expect(
        service.deletePermanently('service-123', 'user-456'),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.deletePermanently('service-123', 'user-456'),
      ).rejects.toThrow(
        'Cannot permanently delete service with status "ARCHIVED". Only DRAFT services can be permanently deleted.',
      );
    });
  });

  describe('duplicate', () => {
    it('should create a duplicate of an existing service', async () => {
      const duplicateService = {
        ...mockService,
        id: 'service-duplicate',
        name: 'Test Service (Copy)',
        createdBy: 'user-789',
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.service.create.mockResolvedValue(duplicateService);

      const result = await service.duplicate('service-123', 'user-789');

      expect(result).toEqual(duplicateService);
      expect(result.name).toBe('Test Service (Copy)');
      expect(result.status).toBe(ServiceStatus.DRAFT);
      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({
        where: { id: 'service-123' },
      });
      expect(mockPrismaService.service.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Service (Copy)',
          description: mockService.description,
          category: mockService.category,
          status: ServiceStatus.DRAFT,
          createdBy: 'user-789',
        },
      });
    });

    it('should duplicate a PUBLISHED service as DRAFT', async () => {
      const publishedService = {
        ...mockService,
        status: ServiceStatus.PUBLISHED,
      };
      const duplicateService = {
        ...mockService,
        id: 'service-duplicate',
        name: 'Test Service (Copy)',
        status: ServiceStatus.DRAFT,
        createdBy: 'user-789',
      };

      mockPrismaService.service.findUnique.mockResolvedValue(publishedService);
      mockPrismaService.service.create.mockResolvedValue(duplicateService);

      const result = await service.duplicate('service-123', 'user-789');

      expect(result.status).toBe(ServiceStatus.DRAFT);
    });

    it('should duplicate an ARCHIVED service as DRAFT', async () => {
      const archivedService = {
        ...mockService,
        status: ServiceStatus.ARCHIVED,
      };
      const duplicateService = {
        ...mockService,
        id: 'service-duplicate',
        name: 'Test Service (Copy)',
        status: ServiceStatus.DRAFT,
        createdBy: 'user-789',
      };

      mockPrismaService.service.findUnique.mockResolvedValue(archivedService);
      mockPrismaService.service.create.mockResolvedValue(duplicateService);

      const result = await service.duplicate('service-123', 'user-789');

      expect(result.status).toBe(ServiceStatus.DRAFT);
    });

    it('should throw NotFoundException when duplicating non-existent service', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(
        service.duplicate('non-existent', 'user-789'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.duplicate('non-existent', 'user-789'),
      ).rejects.toThrow('Service with ID "non-existent" not found');
      expect(mockPrismaService.service.create).not.toHaveBeenCalled();
    });

    it('should preserve description and category in duplicate', async () => {
      const serviceWithDetails = {
        ...mockService,
        description: 'Detailed description',
        category: 'Finance',
      };
      const duplicateService = {
        ...serviceWithDetails,
        id: 'service-duplicate',
        name: 'Test Service (Copy)',
        createdBy: 'user-789',
      };

      mockPrismaService.service.findUnique.mockResolvedValue(
        serviceWithDetails,
      );
      mockPrismaService.service.create.mockResolvedValue(duplicateService);

      await service.duplicate('service-123', 'user-789');

      expect(mockPrismaService.service.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: 'Detailed description',
          category: 'Finance',
        }),
      });
    });

    it('should handle service with null description and category', async () => {
      const minimalService = {
        ...mockService,
        description: null,
        category: null,
      };
      const duplicateService = {
        ...minimalService,
        id: 'service-duplicate',
        name: 'Test Service (Copy)',
        createdBy: 'user-789',
      };

      mockPrismaService.service.findUnique.mockResolvedValue(minimalService);
      mockPrismaService.service.create.mockResolvedValue(duplicateService);

      await service.duplicate('service-123', 'user-789');

      expect(mockPrismaService.service.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: null,
          category: null,
        }),
      });
    });
  });

  describe('publish', () => {
    it('should publish a DRAFT service', async () => {
      const publishedService = {
        ...mockService,
        status: ServiceStatus.PUBLISHED,
      };

      // Transaction succeeds - atomic update worked
      mockTxService.updateMany.mockResolvedValue({ count: 1 });
      mockTxService.findUniqueOrThrow.mockResolvedValue(publishedService);

      const result = await service.publish('service-123', 'user-456');

      expect(result.status).toBe(ServiceStatus.PUBLISHED);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when service does not exist', async () => {
      // Transaction fails - no matching record, then lookup confirms not found
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue(null);

      await expect(service.publish('non-existent', 'user-456')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when publishing a PUBLISHED service', async () => {
      // Transaction fails - status doesn't match, then lookup confirms wrong status
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.PUBLISHED,
        createdBy: 'user-456',
      });

      await expect(service.publish('service-123', 'user-456')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.publish('service-123', 'user-456')).rejects.toThrow(
        'Cannot publish service with status "PUBLISHED". Only DRAFT services can be published.',
      );
    });

    it('should throw BadRequestException when publishing an ARCHIVED service', async () => {
      // Transaction fails - status doesn't match, then lookup confirms wrong status
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.ARCHIVED,
        createdBy: 'user-456',
      });

      await expect(service.publish('service-123', 'user-456')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.publish('service-123', 'user-456')).rejects.toThrow(
        'Cannot publish service with status "ARCHIVED". Only DRAFT services can be published.',
      );
    });
  });

  describe('archive', () => {
    it('should archive a PUBLISHED service', async () => {
      const archivedService = {
        ...mockService,
        status: ServiceStatus.ARCHIVED,
      };

      // Transaction succeeds - atomic update worked
      mockTxService.updateMany.mockResolvedValue({ count: 1 });
      mockTxService.findUniqueOrThrow.mockResolvedValue(archivedService);

      const result = await service.archive('service-123', 'user-456');

      expect(result.status).toBe(ServiceStatus.ARCHIVED);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when service does not exist', async () => {
      // Transaction fails - no matching record, then lookup confirms not found
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue(null);

      await expect(service.archive('non-existent', 'user-456')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when archiving a DRAFT service', async () => {
      // Transaction fails - status doesn't match, then lookup confirms wrong status
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.DRAFT,
        createdBy: 'user-456',
      });

      await expect(service.archive('service-123', 'user-456')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.archive('service-123', 'user-456')).rejects.toThrow(
        'Cannot archive service with status "DRAFT". Only PUBLISHED services can be archived.',
      );
    });

    it('should throw BadRequestException when archiving an ARCHIVED service', async () => {
      // Transaction fails - status doesn't match, then lookup confirms wrong status
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.ARCHIVED,
        createdBy: 'user-456',
      });

      await expect(service.archive('service-123', 'user-456')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.archive('service-123', 'user-456')).rejects.toThrow(
        'Cannot archive service with status "ARCHIVED". Only PUBLISHED services can be archived.',
      );
    });
  });

  describe('restore', () => {
    it('should restore an ARCHIVED service to DRAFT', async () => {
      const draftService = { ...mockService, status: ServiceStatus.DRAFT };

      // Transaction succeeds - atomic update worked
      mockTxService.updateMany.mockResolvedValue({ count: 1 });
      mockTxService.findUniqueOrThrow.mockResolvedValue(draftService);

      const result = await service.restore('service-123', 'user-456');

      expect(result.status).toBe(ServiceStatus.DRAFT);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException when service does not exist', async () => {
      // Transaction fails - no matching record, then lookup confirms not found
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue(null);

      await expect(service.restore('non-existent', 'user-456')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when restoring a DRAFT service', async () => {
      // Transaction fails - status doesn't match, then lookup confirms wrong status
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.DRAFT,
        createdBy: 'user-456',
      });

      await expect(service.restore('service-123', 'user-456')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.restore('service-123', 'user-456')).rejects.toThrow(
        'Cannot restore service with status "DRAFT". Only ARCHIVED services can be restored.',
      );
    });

    it('should throw BadRequestException when restoring a PUBLISHED service', async () => {
      // Transaction fails - status doesn't match, then lookup confirms wrong status
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.PUBLISHED,
        createdBy: 'user-456',
      });

      await expect(service.restore('service-123', 'user-456')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.restore('service-123', 'user-456')).rejects.toThrow(
        'Cannot restore service with status "PUBLISHED". Only ARCHIVED services can be restored.',
      );
    });
  });

  describe('createFromTemplate', () => {
    it('should create a service from a template', async () => {
      const serviceFromTemplate = {
        ...mockService,
        id: 'service-from-template',
        name: 'Business Registration (Copy)',
        description: 'Standard template for business registration',
        category: 'Business',
        createdBy: 'user-789',
      };

      mockTemplatesService.findOne.mockResolvedValue(mockTemplate);
      mockPrismaService.service.create.mockResolvedValue(serviceFromTemplate);

      const result = await service.createFromTemplate(
        'template-123',
        'user-789',
      );

      expect(result).toEqual(serviceFromTemplate);
      expect(result.name).toBe('Business Registration (Copy)');
      expect(result.status).toBe(ServiceStatus.DRAFT);
      expect(mockTemplatesService.findOne).toHaveBeenCalledWith('template-123');
      expect(mockPrismaService.service.create).toHaveBeenCalledWith({
        data: {
          name: 'Business Registration (Copy)',
          description: mockTemplate.description,
          category: mockTemplate.category,
          status: ServiceStatus.DRAFT,
          createdBy: 'user-789',
        },
      });
    });

    it('should throw NotFoundException when template does not exist', async () => {
      mockTemplatesService.findOne.mockRejectedValue(
        new NotFoundException('Template with ID "non-existent" not found'),
      );

      await expect(
        service.createFromTemplate('non-existent', 'user-789'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createFromTemplate('non-existent', 'user-789'),
      ).rejects.toThrow('Template with ID "non-existent" not found');
      expect(mockPrismaService.service.create).not.toHaveBeenCalled();
    });

    it('should handle template with null description', async () => {
      const templateNoDesc = {
        ...mockTemplate,
        description: null,
      };
      const serviceFromTemplate = {
        ...mockService,
        id: 'service-from-template',
        name: 'Business Registration (Copy)',
        description: null,
        category: 'Business',
        createdBy: 'user-789',
      };

      mockTemplatesService.findOne.mockResolvedValue(templateNoDesc);
      mockPrismaService.service.create.mockResolvedValue(serviceFromTemplate);

      await service.createFromTemplate('template-123', 'user-789');

      expect(mockPrismaService.service.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: null,
        }),
      });
    });

    it('should always create with DRAFT status', async () => {
      const serviceFromTemplate = {
        ...mockService,
        id: 'service-from-template',
        name: 'Business Registration (Copy)',
        status: ServiceStatus.DRAFT,
        createdBy: 'user-789',
      };

      mockTemplatesService.findOne.mockResolvedValue(mockTemplate);
      mockPrismaService.service.create.mockResolvedValue(serviceFromTemplate);

      const result = await service.createFromTemplate(
        'template-123',
        'user-789',
      );

      expect(result.status).toBe(ServiceStatus.DRAFT);
      expect(mockPrismaService.service.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: ServiceStatus.DRAFT,
        }),
      });
    });
  });

  describe('State Machine Integration', () => {
    it('should allow full lifecycle: DRAFT -> PUBLISHED -> ARCHIVED -> DRAFT', async () => {
      // Start with DRAFT
      const draftService = { ...mockService, status: ServiceStatus.DRAFT };
      const publishedService = {
        ...mockService,
        status: ServiceStatus.PUBLISHED,
      };
      const archivedService = {
        ...mockService,
        status: ServiceStatus.ARCHIVED,
      };
      const restoredService = { ...mockService, status: ServiceStatus.DRAFT };

      // DRAFT -> PUBLISHED (via transaction)
      mockTxService.updateMany.mockResolvedValue({ count: 1 });
      mockTxService.findUniqueOrThrow.mockResolvedValue(publishedService);
      const published = await service.publish('service-123', 'user-456');
      expect(published.status).toBe(ServiceStatus.PUBLISHED);

      // PUBLISHED -> ARCHIVED (via transaction)
      jest.clearAllMocks();
      mockTxService.updateMany.mockResolvedValue({ count: 1 });
      mockTxService.findUniqueOrThrow.mockResolvedValue(archivedService);
      const archived = await service.archive('service-123', 'user-456');
      expect(archived.status).toBe(ServiceStatus.ARCHIVED);

      // ARCHIVED -> DRAFT (via transaction)
      jest.clearAllMocks();
      mockTxService.updateMany.mockResolvedValue({ count: 1 });
      mockTxService.findUniqueOrThrow.mockResolvedValue(restoredService);
      const restored = await service.restore('service-123', 'user-456');
      expect(restored.status).toBe(ServiceStatus.DRAFT);
    });

    it('should prevent invalid transitions: DRAFT cannot be archived', async () => {
      // Transaction fails - status doesn't match (archive requires PUBLISHED)
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.DRAFT,
        createdBy: 'user-456',
      });

      await expect(service.archive('service-123', 'user-456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should prevent invalid transitions: DRAFT cannot be restored', async () => {
      // Transaction fails - status doesn't match (restore requires ARCHIVED)
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.DRAFT,
        createdBy: 'user-456',
      });

      await expect(service.restore('service-123', 'user-456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should prevent invalid transitions: PUBLISHED cannot be published again', async () => {
      // Transaction fails - status doesn't match (publish requires DRAFT)
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.PUBLISHED,
        createdBy: 'user-456',
      });

      await expect(service.publish('service-123', 'user-456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should prevent invalid transitions: PUBLISHED cannot be restored', async () => {
      // Transaction fails - status doesn't match (restore requires ARCHIVED)
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.PUBLISHED,
        createdBy: 'user-456',
      });

      await expect(service.restore('service-123', 'user-456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should prevent invalid transitions: ARCHIVED cannot be published', async () => {
      // Transaction fails - status doesn't match (publish requires DRAFT)
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.ARCHIVED,
        createdBy: 'user-456',
      });

      await expect(service.publish('service-123', 'user-456')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should prevent invalid transitions: ARCHIVED cannot be archived again', async () => {
      // Transaction fails - status doesn't match (archive requires PUBLISHED)
      mockTxService.updateMany.mockResolvedValue({ count: 0 });
      mockTxService.findUnique.mockResolvedValue({
        status: ServiceStatus.ARCHIVED,
        createdBy: 'user-456',
      });

      await expect(service.archive('service-123', 'user-456')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

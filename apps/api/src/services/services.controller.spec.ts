/**
 * ServicesController Unit Tests
 *
 * Tests for the REST API endpoints of Service CRUD operations.
 * Uses Jest mocks to isolate from service layer.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService, PaginatedServices } from './services.service';
import { ServiceStatus } from '@bpa/db';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import type { AuthUser } from '@bpa/types';

describe('ServicesController', () => {
  let controller: ServicesController;

  // Mock user
  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    keycloakId: 'kc-123',
    roles: ['SERVICE_DESIGNER'],
    countryCode: 'SV',
  };

  // Mock service data
  const mockService = {
    id: 'service-123',
    name: 'Test Service',
    description: 'Test Description',
    category: 'Business',
    status: ServiceStatus.DRAFT,
    createdBy: 'user-123',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockServicesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    deletePermanently: jest.fn(),
    duplicate: jest.fn(),
    publish: jest.fn(),
    archive: jest.fn(),
    restore: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new service', async () => {
      const dto: CreateServiceDto = {
        name: 'New Service',
        description: 'New Description',
        category: 'Registration',
      };

      mockServicesService.create.mockResolvedValue({
        ...mockService,
        ...dto,
        id: 'service-new',
      });

      const result = await controller.create(dto, mockUser);

      expect(result.name).toBe('New Service');
      expect(result.description).toBe('New Description');
      expect(mockServicesService.create).toHaveBeenCalledWith(dto, 'user-123');
    });

    it('should use authenticated user id for createdBy', async () => {
      const dto: CreateServiceDto = { name: 'Test' };
      mockServicesService.create.mockResolvedValue(mockService);

      await controller.create(dto, mockUser);

      expect(mockServicesService.create).toHaveBeenCalledWith(dto, mockUser.id);
    });
  });

  describe('findAll', () => {
    it('should return paginated services', async () => {
      const paginatedResult: PaginatedServices = {
        services: [mockService],
        total: 1,
        page: 1,
        limit: 20,
        hasNext: false,
      };
      mockServicesService.findAll.mockResolvedValue(paginatedResult);

      const result = await controller.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Test Service');
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        perPage: 20,
        hasNext: false,
      });
    });

    it('should pass query parameters to service', async () => {
      const query = {
        page: 2,
        limit: 10,
        status: ServiceStatus.PUBLISHED,
        search: 'test',
      };

      mockServicesService.findAll.mockResolvedValue({
        services: [],
        total: 0,
        page: 2,
        limit: 10,
        hasNext: false,
      });

      await controller.findAll(query);

      expect(mockServicesService.findAll).toHaveBeenCalledWith(query);
    });

    it('should return empty data when no services found', async () => {
      mockServicesService.findAll.mockResolvedValue({
        services: [],
        total: 0,
        page: 1,
        limit: 20,
        hasNext: false,
      });

      const result = await controller.findAll({});

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a service by id', async () => {
      mockServicesService.findOne.mockResolvedValue(mockService);

      const result = await controller.findOne('service-123');

      expect(result.id).toBe('service-123');
      expect(result.name).toBe('Test Service');
      expect(mockServicesService.findOne).toHaveBeenCalledWith('service-123');
    });

    it('should propagate NotFoundException from service', async () => {
      mockServicesService.findOne.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a service', async () => {
      const dto: UpdateServiceDto = {
        name: 'Updated Name',
      };

      mockServicesService.update.mockResolvedValue({
        ...mockService,
        name: 'Updated Name',
      });

      const result = await controller.update('service-123', dto, mockUser);

      expect(result.name).toBe('Updated Name');
      expect(mockServicesService.update).toHaveBeenCalledWith(
        'service-123',
        dto,
        'user-123',
      );
    });

    it('should propagate NotFoundException when service not found', async () => {
      mockServicesService.update.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(
        controller.update('non-existent', { name: 'New Name' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should archive a service', async () => {
      mockServicesService.remove.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.ARCHIVED,
      });

      const result = await controller.remove('service-123', mockUser);

      expect(result.status).toBe(ServiceStatus.ARCHIVED);
      expect(mockServicesService.remove).toHaveBeenCalledWith(
        'service-123',
        'user-123',
      );
    });

    it('should propagate NotFoundException when service not found', async () => {
      mockServicesService.remove.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(controller.remove('non-existent', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deletePermanently', () => {
    it('should permanently delete a DRAFT service', async () => {
      mockServicesService.deletePermanently.mockResolvedValue({
        id: 'service-123',
        deleted: true,
      });

      const result = await controller.deletePermanently(
        'service-123',
        mockUser,
      );

      expect(result).toEqual({ id: 'service-123', deleted: true });
      expect(mockServicesService.deletePermanently).toHaveBeenCalledWith(
        'service-123',
        'user-123',
      );
    });

    it('should propagate NotFoundException when service not found', async () => {
      mockServicesService.deletePermanently.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(
        controller.deletePermanently('non-existent', mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate BadRequestException when service is not DRAFT', async () => {
      mockServicesService.deletePermanently.mockRejectedValue(
        new BadRequestException(
          'Cannot permanently delete service with status "PUBLISHED". Only DRAFT services can be permanently deleted.',
        ),
      );

      await expect(
        controller.deletePermanently('service-123', mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('duplicate', () => {
    it('should duplicate a service', async () => {
      mockServicesService.duplicate.mockResolvedValue({
        ...mockService,
        id: 'service-copy',
        name: 'Test Service (Copy)',
      });

      const result = await controller.duplicate('service-123', mockUser);

      expect(result.name).toBe('Test Service (Copy)');
      expect(mockServicesService.duplicate).toHaveBeenCalledWith(
        'service-123',
        'user-123',
      );
    });

    it('should propagate NotFoundException when source service not found', async () => {
      mockServicesService.duplicate.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(
        controller.duplicate('non-existent', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('should publish a DRAFT service', async () => {
      mockServicesService.publish.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.PUBLISHED,
      });

      const result = await controller.publish('service-123', mockUser);

      expect(result.status).toBe(ServiceStatus.PUBLISHED);
      expect(mockServicesService.publish).toHaveBeenCalledWith(
        'service-123',
        'user-123',
      );
    });

    it('should propagate BadRequestException when service is not DRAFT', async () => {
      mockServicesService.publish.mockRejectedValue(
        new BadRequestException(
          'Cannot publish service with status "PUBLISHED"',
        ),
      );

      await expect(controller.publish('service-123', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('archive', () => {
    it('should archive a PUBLISHED service', async () => {
      mockServicesService.archive.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.ARCHIVED,
      });

      const result = await controller.archive('service-123', mockUser);

      expect(result.status).toBe(ServiceStatus.ARCHIVED);
      expect(mockServicesService.archive).toHaveBeenCalledWith(
        'service-123',
        'user-123',
      );
    });

    it('should propagate BadRequestException when service is not PUBLISHED', async () => {
      mockServicesService.archive.mockRejectedValue(
        new BadRequestException('Cannot archive service with status "DRAFT"'),
      );

      await expect(controller.archive('service-123', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('restore', () => {
    it('should restore an ARCHIVED service to DRAFT', async () => {
      mockServicesService.restore.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.DRAFT,
      });

      const result = await controller.restore('service-123', mockUser);

      expect(result.status).toBe(ServiceStatus.DRAFT);
      expect(mockServicesService.restore).toHaveBeenCalledWith(
        'service-123',
        'user-123',
      );
    });

    it('should propagate BadRequestException when service is not ARCHIVED', async () => {
      mockServicesService.restore.mockRejectedValue(
        new BadRequestException('Cannot restore service with status "DRAFT"'),
      );

      await expect(controller.restore('service-123', mockUser)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});

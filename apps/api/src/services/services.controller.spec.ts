/**
 * ServicesController Unit Tests
 *
 * Tests for the REST API endpoints of Service CRUD operations.
 * Uses Jest mocks to isolate from service layer.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService, PaginatedServices } from './services.service';
import { ServiceStatus } from '@bpa/db';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import type { AuthUser } from '@bpa/types';

describe('ServicesController', () => {
  let controller: ServicesController;
  let servicesService: ServicesService;

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
    servicesService = module.get<ServicesService>(ServicesService);

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

      const result = await controller.update('service-123', dto);

      expect(result.name).toBe('Updated Name');
      expect(mockServicesService.update).toHaveBeenCalledWith(
        'service-123',
        dto,
      );
    });

    it('should propagate NotFoundException when service not found', async () => {
      mockServicesService.update.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(
        controller.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should archive a service', async () => {
      mockServicesService.remove.mockResolvedValue({
        ...mockService,
        status: ServiceStatus.ARCHIVED,
      });

      const result = await controller.remove('service-123');

      expect(result.status).toBe(ServiceStatus.ARCHIVED);
      expect(mockServicesService.remove).toHaveBeenCalledWith('service-123');
    });

    it('should propagate NotFoundException when service not found', async () => {
      mockServicesService.remove.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(controller.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

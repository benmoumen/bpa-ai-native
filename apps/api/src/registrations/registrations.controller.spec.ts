/**
 * RegistrationsController Unit Tests
 *
 * Tests for the REST API endpoints of Registration CRUD operations.
 * Uses Jest mocks to isolate from service layer.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { RegistrationsController } from './registrations.controller';
import {
  RegistrationsService,
  PaginatedRegistrations,
} from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import type { AuthUser } from '@bpa/types';

describe('RegistrationsController', () => {
  let controller: RegistrationsController;

  // Mock user
  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    keycloakId: 'kc-123',
    roles: ['SERVICE_DESIGNER'],
    countryCode: 'SV',
  };

  // Mock registration data
  const mockRegistration = {
    id: 'reg-123',
    serviceId: 'service-123',
    name: 'Business License',
    shortName: 'BIZ-LIC',
    key: 'business-license',
    description: 'Apply for a business license',
    isActive: true,
    sortOrder: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockRegistrationsService = {
    create: jest.fn(),
    findAllByService: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationsController],
      providers: [
        {
          provide: RegistrationsService,
          useValue: mockRegistrationsService,
        },
      ],
    }).compile();

    controller = module.get<RegistrationsController>(RegistrationsController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new registration', async () => {
      const dto: CreateRegistrationDto = {
        name: 'New Registration',
        shortName: 'NEW-REG',
        description: 'New Registration Description',
      };

      mockRegistrationsService.create.mockResolvedValue({
        ...mockRegistration,
        ...dto,
        id: 'reg-new',
        key: 'new-registration',
      });

      const result = await controller.create('service-123', dto, mockUser);

      expect(result.name).toBe('New Registration');
      expect(result.shortName).toBe('NEW-REG');
      expect(mockRegistrationsService.create).toHaveBeenCalledWith(
        'service-123',
        dto,
        'user-123',
      );
    });

    it('should use authenticated user id for authorization', async () => {
      const dto: CreateRegistrationDto = { name: 'Test', shortName: 'TST' };
      mockRegistrationsService.create.mockResolvedValue(mockRegistration);

      await controller.create('service-123', dto, mockUser);

      expect(mockRegistrationsService.create).toHaveBeenCalledWith(
        'service-123',
        dto,
        mockUser.id,
      );
    });

    it('should propagate NotFoundException when service not found', async () => {
      mockRegistrationsService.create.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(
        controller.create(
          'non-existent',
          {
            name: 'Test',
            shortName: 'TST',
          },
          mockUser,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when user is not service owner', async () => {
      mockRegistrationsService.create.mockRejectedValue(
        new ForbiddenException(
          'You do not have permission to create registrations for this service',
        ),
      );

      await expect(
        controller.create(
          'service-123',
          {
            name: 'Test',
            shortName: 'TST',
          },
          mockUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should propagate ConflictException when key already exists', async () => {
      mockRegistrationsService.create.mockRejectedValue(
        new ConflictException('Registration key already exists'),
      );

      await expect(
        controller.create(
          'service-123',
          {
            name: 'Duplicate',
            shortName: 'DUP',
            key: 'existing-key',
          },
          mockUser,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllByService', () => {
    it('should return paginated registrations', async () => {
      const paginatedResult: PaginatedRegistrations = {
        registrations: [mockRegistration],
        total: 1,
        page: 1,
        limit: 20,
        hasNext: false,
      };
      mockRegistrationsService.findAllByService.mockResolvedValue(
        paginatedResult,
      );

      const result = await controller.findAllByService('service-123', {});

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Business License');
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
        isActive: true,
        search: 'test',
      };

      mockRegistrationsService.findAllByService.mockResolvedValue({
        registrations: [],
        total: 0,
        page: 2,
        limit: 10,
        hasNext: false,
      });

      await controller.findAllByService('service-123', query);

      expect(mockRegistrationsService.findAllByService).toHaveBeenCalledWith(
        'service-123',
        query,
      );
    });

    it('should return empty data when no registrations found', async () => {
      mockRegistrationsService.findAllByService.mockResolvedValue({
        registrations: [],
        total: 0,
        page: 1,
        limit: 20,
        hasNext: false,
      });

      const result = await controller.findAllByService('service-123', {});

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should propagate NotFoundException when service not found', async () => {
      mockRegistrationsService.findAllByService.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(
        controller.findAllByService('non-existent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a registration by id', async () => {
      mockRegistrationsService.findOne.mockResolvedValue(mockRegistration);

      const result = await controller.findOne('reg-123');

      expect(result.id).toBe('reg-123');
      expect(result.name).toBe('Business License');
      expect(mockRegistrationsService.findOne).toHaveBeenCalledWith('reg-123');
    });

    it('should propagate NotFoundException from service', async () => {
      mockRegistrationsService.findOne.mockRejectedValue(
        new NotFoundException('Registration not found'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a registration', async () => {
      const dto: UpdateRegistrationDto = {
        name: 'Updated Name',
      };

      mockRegistrationsService.update.mockResolvedValue({
        ...mockRegistration,
        name: 'Updated Name',
      });

      const result = await controller.update('reg-123', dto, mockUser);

      expect(result.name).toBe('Updated Name');
      expect(mockRegistrationsService.update).toHaveBeenCalledWith(
        'reg-123',
        dto,
        mockUser.id,
      );
    });

    it('should propagate NotFoundException when registration not found', async () => {
      mockRegistrationsService.update.mockRejectedValue(
        new NotFoundException('Registration not found'),
      );

      await expect(
        controller.update('non-existent', { name: 'New Name' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when user is not parent service owner', async () => {
      mockRegistrationsService.update.mockRejectedValue(
        new ForbiddenException(
          'You do not have permission to update this registration',
        ),
      );

      await expect(
        controller.update('reg-123', { name: 'New Name' }, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update isActive status', async () => {
      const dto: UpdateRegistrationDto = {
        isActive: false,
      };

      mockRegistrationsService.update.mockResolvedValue({
        ...mockRegistration,
        isActive: false,
      });

      const result = await controller.update('reg-123', dto, mockUser);

      expect(result.isActive).toBe(false);
    });
  });

  describe('remove', () => {
    it('should deactivate a registration', async () => {
      mockRegistrationsService.remove.mockResolvedValue({
        ...mockRegistration,
        isActive: false,
      });

      const result = await controller.remove('reg-123', mockUser);

      expect(result.isActive).toBe(false);
      expect(mockRegistrationsService.remove).toHaveBeenCalledWith(
        'reg-123',
        mockUser.id,
      );
    });

    it('should propagate NotFoundException when registration not found', async () => {
      mockRegistrationsService.remove.mockRejectedValue(
        new NotFoundException('Registration not found'),
      );

      await expect(controller.remove('non-existent', mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should propagate ForbiddenException when user is not parent service owner', async () => {
      mockRegistrationsService.remove.mockRejectedValue(
        new ForbiddenException(
          'You do not have permission to delete this registration',
        ),
      );

      await expect(controller.remove('reg-123', mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

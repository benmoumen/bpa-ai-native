/**
 * RegistrationsService Unit Tests
 *
 * Tests for the business logic layer of Registration CRUD operations.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { PrismaService } from '../prisma';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';

describe('RegistrationsService', () => {
  let service: RegistrationsService;

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

  // Mock registration with service relation (for update/remove ownership checks)
  const mockRegistrationWithService = {
    ...mockRegistration,
    service: {
      createdBy: mockUserId,
    },
  };

  const mockPrismaService = {
    service: {
      findUnique: jest.fn(),
    },
    registration: {
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
        RegistrationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RegistrationsService>(RegistrationsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateRegistrationDto = {
      name: 'Business License',
      shortName: 'BIZ-LIC',
      key: 'business-license',
      description: 'Apply for a business license',
    };

    it('should create a new registration', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.registration.findUnique.mockResolvedValue(null);
      mockPrismaService.registration.create.mockResolvedValue(mockRegistration);

      const result = await service.create('service-123', createDto, mockUserId);

      expect(result).toEqual(mockRegistration);
      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({
        where: { id: 'service-123' },
        select: { id: true, createdBy: true },
      });
      expect(mockPrismaService.registration.create).toHaveBeenCalledWith({
        data: {
          serviceId: 'service-123',
          name: createDto.name,
          shortName: createDto.shortName,
          key: createDto.key,
          description: createDto.description,
          sortOrder: 0,
          isActive: true,
        },
      });
    });

    it('should auto-generate key from name if not provided', async () => {
      const dtoWithoutKey: CreateRegistrationDto = {
        name: 'Import Export License',
        shortName: 'IMP-EXP',
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.registration.findUnique.mockResolvedValue(null);
      mockPrismaService.registration.create.mockResolvedValue({
        ...mockRegistration,
        name: 'Import Export License',
        shortName: 'IMP-EXP',
        key: 'import-export-license',
      });

      await service.create('service-123', dtoWithoutKey, mockUserId);

      expect(mockPrismaService.registration.findUnique).toHaveBeenCalledWith({
        where: {
          serviceId_key: {
            serviceId: 'service-123',
            key: 'import-export-license',
          },
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
        'You do not have permission to create registrations for this service',
      );
    });

    it('should throw ConflictException when key already exists in service', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );

      await expect(
        service.create('service-123', createDto, mockUserId),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create('service-123', createDto, mockUserId),
      ).rejects.toThrow(
        'Registration with key "business-license" already exists in this service',
      );
    });

    it('should use provided sortOrder', async () => {
      const dtoWithSortOrder: CreateRegistrationDto = {
        ...createDto,
        sortOrder: 5,
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.registration.findUnique.mockResolvedValue(null);
      mockPrismaService.registration.create.mockResolvedValue({
        ...mockRegistration,
        sortOrder: 5,
      });

      await service.create('service-123', dtoWithSortOrder, mockUserId);

      expect(mockPrismaService.registration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sortOrder: 5,
        }),
      });
    });
  });

  describe('findAllByService', () => {
    it('should return paginated registrations with defaults', async () => {
      const registrations = [mockRegistration];
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.registration.findMany.mockResolvedValue(registrations);
      mockPrismaService.registration.count.mockResolvedValue(1);

      const result = await service.findAllByService('service-123', {});

      expect(result).toEqual({
        registrations,
        total: 1,
        page: 1,
        limit: 20,
        hasNext: false,
      });
      expect(mockPrismaService.registration.findMany).toHaveBeenCalledWith({
        where: { serviceId: 'service-123' },
        orderBy: { sortOrder: 'asc' },
        skip: 0,
        take: 20,
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
      mockPrismaService.registration.findMany.mockResolvedValue([]);
      mockPrismaService.registration.count.mockResolvedValue(0);

      await service.findAllByService('service-123', { isActive: true });

      expect(mockPrismaService.registration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { serviceId: 'service-123', isActive: true },
        }),
      );
    });

    it('should filter by search term', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.registration.findMany.mockResolvedValue([]);
      mockPrismaService.registration.count.mockResolvedValue(0);

      await service.findAllByService('service-123', { search: 'license' });

      expect(mockPrismaService.registration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            serviceId: 'service-123',
            OR: [
              { name: { contains: 'license', mode: 'insensitive' } },
              { description: { contains: 'license', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should apply pagination correctly', async () => {
      const manyRegistrations = Array(20)
        .fill(null)
        .map((_, i) => ({ ...mockRegistration, id: `reg-${i}` }));
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.registration.findMany.mockResolvedValue(
        manyRegistrations,
      );
      mockPrismaService.registration.count.mockResolvedValue(50);

      const result = await service.findAllByService('service-123', {
        page: 2,
        limit: 20,
      });

      expect(result.hasNext).toBe(true);
      expect(result.page).toBe(2);
      expect(mockPrismaService.registration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        }),
      );
    });

    it('should apply custom sorting', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.registration.findMany.mockResolvedValue([]);
      mockPrismaService.registration.count.mockResolvedValue(0);

      await service.findAllByService('service-123', {
        sortBy: 'name',
        sortOrder: 'desc',
      });

      expect(mockPrismaService.registration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: 'desc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a registration by id', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );

      const result = await service.findOne('reg-123');

      expect(result).toEqual(mockRegistration);
      expect(mockPrismaService.registration.findUnique).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
      });
    });

    it('should throw NotFoundException when registration does not exist', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Registration with ID "non-existent" not found',
      );
    });
  });

  describe('update', () => {
    it('should update a registration', async () => {
      const dto: UpdateRegistrationDto = {
        name: 'Updated License',
        description: 'Updated Description',
      };
      const updatedRegistration = { ...mockRegistration, ...dto };

      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistrationWithService,
      );
      mockPrismaService.registration.update.mockResolvedValue(
        updatedRegistration,
      );

      const result = await service.update('reg-123', dto, mockUserId);

      expect(result.name).toBe('Updated License');
      expect(mockPrismaService.registration.findUnique).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        include: {
          service: {
            select: { createdBy: true },
          },
        },
      });
      expect(mockPrismaService.registration.update).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        data: {
          name: dto.name,
          description: dto.description,
        },
      });
    });

    it('should throw NotFoundException when updating non-existent registration', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('non-existent', { name: 'New Name' }, mockUserId),
      ).rejects.toThrow('Registration with ID "non-existent" not found');
    });

    it('should throw ForbiddenException when user is not parent service owner', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistrationWithService,
      );

      await expect(
        service.update('reg-123', { name: 'New Name' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update('reg-123', { name: 'New Name' }, 'other-user'),
      ).rejects.toThrow(
        'You do not have permission to update this registration',
      );
    });

    it('should handle partial updates', async () => {
      const dto: UpdateRegistrationDto = {
        isActive: false,
      };

      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistrationWithService,
      );
      mockPrismaService.registration.update.mockResolvedValue({
        ...mockRegistration,
        isActive: false,
      });

      const result = await service.update('reg-123', dto, mockUserId);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.registration.update).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        data: {
          isActive: false,
        },
      });
    });

    it('should update sortOrder', async () => {
      const dto: UpdateRegistrationDto = {
        sortOrder: 10,
      };

      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistrationWithService,
      );
      mockPrismaService.registration.update.mockResolvedValue({
        ...mockRegistration,
        sortOrder: 10,
      });

      await service.update('reg-123', dto, mockUserId);

      expect(mockPrismaService.registration.update).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        data: {
          sortOrder: 10,
        },
      });
    });
  });

  describe('remove', () => {
    it('should soft delete by setting isActive to false', async () => {
      const deactivatedRegistration = {
        ...mockRegistration,
        isActive: false,
      };

      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistrationWithService,
      );
      mockPrismaService.registration.update.mockResolvedValue(
        deactivatedRegistration,
      );

      const result = await service.remove('reg-123', mockUserId);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.registration.findUnique).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        include: {
          service: {
            select: { createdBy: true },
          },
        },
      });
      expect(mockPrismaService.registration.update).toHaveBeenCalledWith({
        where: { id: 'reg-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when deleting non-existent registration', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('non-existent', mockUserId)).rejects.toThrow(
        'Registration with ID "non-existent" not found',
      );
    });

    it('should throw ForbiddenException when user is not parent service owner', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistrationWithService,
      );

      await expect(service.remove('reg-123', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.remove('reg-123', 'other-user')).rejects.toThrow(
        'You do not have permission to delete this registration',
      );
    });
  });
});

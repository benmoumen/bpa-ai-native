/**
 * RolesService Unit Tests
 *
 * Tests for the workflow role management business logic.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RolesService } from './roles.service';
import { PrismaService } from '../prisma';
import { RoleType } from './dto';

describe('RolesService', () => {
  let service: RolesService;

  // Mock role data
  const mockRole = {
    id: 'role-123',
    serviceId: 'service-456',
    roleType: 'USER' as const,
    name: 'Document Verification',
    shortName: 'Doc Verify',
    description: 'Verifies submitted documents',
    isStartRole: true,
    sortOrder: 100,
    isActive: true,
    conditions: null,
    formId: 'form-789',
    retryEnabled: null,
    retryIntervalMinutes: null,
    timeoutMinutes: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockService = {
    id: 'service-456',
    name: 'Test Service',
  };

  const mockPrismaService = {
    service: {
      findUnique: jest.fn(),
    },
    role: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new role', async () => {
      const dto = {
        name: 'Document Verification',
        roleType: RoleType.USER,
        shortName: 'Doc Verify',
        description: 'Verifies submitted documents',
        isStartRole: true,
        formId: 'form-789',
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.role.create.mockResolvedValue(mockRole);

      const result = await service.create('service-456', dto);

      expect(result.id).toBe('role-123');
      expect(result.name).toBe('Document Verification');
      expect(result.roleType).toBe(RoleType.USER);
      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({
        where: { id: 'service-456' },
      });
    });

    it('should create a BOT role with retry settings', async () => {
      const botRole = {
        ...mockRole,
        roleType: 'BOT' as const,
        formId: null,
        retryEnabled: true,
        retryIntervalMinutes: 5,
        timeoutMinutes: 30,
      };

      const dto = {
        name: 'Payment Gateway',
        roleType: RoleType.BOT,
        retryEnabled: true,
        retryIntervalMinutes: 5,
        timeoutMinutes: 30,
      };

      mockPrismaService.service.findUnique.mockResolvedValue(mockService);
      mockPrismaService.role.create.mockResolvedValue(botRole);

      const result = await service.create('service-456', dto);

      expect(result.roleType).toBe(RoleType.BOT);
      expect(result.retryEnabled).toBe(true);
      expect(result.retryIntervalMinutes).toBe(5);
    });

    it('should throw NotFoundException when service does not exist', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(
        service.create('non-existent', {
          name: 'Role',
          roleType: RoleType.USER,
        }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create('non-existent', {
          name: 'Role',
          roleType: RoleType.USER,
        }),
      ).rejects.toThrow('Service with ID non-existent not found');
    });
  });

  describe('findAll', () => {
    it('should return all active roles for a service', async () => {
      const roles = [
        mockRole,
        { ...mockRole, id: 'role-456', name: 'Approval' },
      ];
      mockPrismaService.role.findMany.mockResolvedValue(roles);

      const result = await service.findAll('service-456');

      expect(result).toHaveLength(2);
      expect(mockPrismaService.role.findMany).toHaveBeenCalledWith({
        where: { serviceId: 'service-456', isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should return empty array when no roles exist', async () => {
      mockPrismaService.role.findMany.mockResolvedValue([]);

      const result = await service.findAll('service-456');

      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('should return a role by ID', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);

      const result = await service.findOne('role-123');

      expect(result.id).toBe('role-123');
      expect(mockPrismaService.role.findUnique).toHaveBeenCalledWith({
        where: { id: 'role-123' },
      });
    });

    it('should throw NotFoundException when role does not exist', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Role with ID non-existent not found',
      );
    });
  });

  describe('update', () => {
    it('should update a role', async () => {
      const updatedRole = {
        ...mockRole,
        name: 'Updated Name',
        description: 'Updated description',
      };

      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.role.update.mockResolvedValue(updatedRole);

      const result = await service.update('role-123', {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(result.name).toBe('Updated Name');
      expect(result.description).toBe('Updated description');
    });

    it('should throw NotFoundException when updating non-existent role', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft delete a role', async () => {
      const deactivatedRole = { ...mockRole, isActive: false };

      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.role.update.mockResolvedValue(deactivatedRole);

      await service.remove('role-123');

      expect(mockPrismaService.role.update).toHaveBeenCalledWith({
        where: { id: 'role-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when deleting non-existent role', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findStartRole', () => {
    it('should return the start role for a service', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(mockRole);

      const result = await service.findStartRole('service-456');

      expect(result).not.toBeNull();
      expect(result?.isStartRole).toBe(true);
      expect(mockPrismaService.role.findFirst).toHaveBeenCalledWith({
        where: { serviceId: 'service-456', isStartRole: true, isActive: true },
      });
    });

    it('should return null when no start role exists', async () => {
      mockPrismaService.role.findFirst.mockResolvedValue(null);

      const result = await service.findStartRole('service-456');

      expect(result).toBeNull();
    });
  });

  describe('setStartRole', () => {
    it('should set a role as the start role and unset others', async () => {
      const updatedRole = { ...mockRole, isStartRole: true };

      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.role.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.role.update.mockResolvedValue(updatedRole);

      const result = await service.setStartRole('role-123');

      expect(result.isStartRole).toBe(true);
      expect(mockPrismaService.role.updateMany).toHaveBeenCalledWith({
        where: { serviceId: 'service-456', isStartRole: true },
        data: { isStartRole: false },
      });
      expect(mockPrismaService.role.update).toHaveBeenCalledWith({
        where: { id: 'role-123' },
        data: { isStartRole: true },
      });
    });

    it('should throw NotFoundException when role does not exist', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(service.setStartRole('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

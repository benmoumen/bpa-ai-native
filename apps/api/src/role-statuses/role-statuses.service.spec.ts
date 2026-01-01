/**
 * RoleStatusesService Unit Tests
 *
 * Tests for the 4-Status Model implementation.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { RoleStatusesService } from './role-statuses.service';
import { PrismaService } from '../prisma';
import { RoleStatusCode } from './dto';

describe('RoleStatusesService', () => {
  let service: RoleStatusesService;

  // Mock role status data
  const mockRoleStatus = {
    id: 'status-123',
    roleId: 'role-456',
    code: 'PENDING' as const,
    name: 'Awaiting Review',
    isDefault: true,
    sortOrder: 0,
    conditions: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockRole = {
    id: 'role-456',
    name: 'Document Verification',
  };

  const mockPrismaService = {
    role: {
      findUnique: jest.fn(),
    },
    roleStatus: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleStatusesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RoleStatusesService>(RoleStatusesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new status', async () => {
      const dto = {
        code: RoleStatusCode.PENDING,
        name: 'Awaiting Review',
        isDefault: true,
      };

      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.roleStatus.findFirst.mockResolvedValue(null);
      mockPrismaService.roleStatus.create.mockResolvedValue(mockRoleStatus);

      const result = await service.create('role-456', dto);

      expect(result.id).toBe('status-123');
      expect(result.code).toBe(RoleStatusCode.PENDING);
      expect(result.name).toBe('Awaiting Review');
    });

    it('should throw NotFoundException when role does not exist', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(
        service.create('non-existent', {
          code: RoleStatusCode.PENDING,
          name: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when status code already exists for role', async () => {
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.roleStatus.findFirst.mockResolvedValue(mockRoleStatus);

      await expect(
        service.create('role-456', {
          code: RoleStatusCode.PENDING,
          name: 'Another Pending',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return all statuses for a role', async () => {
      const statuses = [
        mockRoleStatus,
        {
          ...mockRoleStatus,
          id: 'status-456',
          code: 'PASSED' as const,
          name: 'Approved',
        },
      ];
      mockPrismaService.roleStatus.findMany.mockResolvedValue(statuses);

      const result = await service.findAll('role-456');

      expect(result).toHaveLength(2);
      expect(mockPrismaService.roleStatus.findMany).toHaveBeenCalledWith({
        where: { roleId: 'role-456' },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a status by ID', async () => {
      mockPrismaService.roleStatus.findUnique.mockResolvedValue(mockRoleStatus);

      const result = await service.findOne('status-123');

      expect(result.id).toBe('status-123');
    });

    it('should throw NotFoundException when status does not exist', async () => {
      mockPrismaService.roleStatus.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a status', async () => {
      const updatedStatus = { ...mockRoleStatus, name: 'Updated Name' };

      mockPrismaService.roleStatus.findUnique.mockResolvedValue(mockRoleStatus);
      mockPrismaService.roleStatus.update.mockResolvedValue(updatedStatus);

      const result = await service.update('status-123', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException when updating non-existent status', async () => {
      mockPrismaService.roleStatus.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a status', async () => {
      mockPrismaService.roleStatus.findUnique.mockResolvedValue(mockRoleStatus);
      mockPrismaService.roleStatus.delete.mockResolvedValue(mockRoleStatus);

      await service.remove('status-123');

      expect(mockPrismaService.roleStatus.delete).toHaveBeenCalledWith({
        where: { id: 'status-123' },
      });
    });

    it('should throw NotFoundException when deleting non-existent status', async () => {
      mockPrismaService.roleStatus.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setDefault', () => {
    it('should set a status as default and unset others', async () => {
      const updatedStatus = { ...mockRoleStatus, isDefault: true };

      mockPrismaService.roleStatus.findUnique.mockResolvedValue(mockRoleStatus);
      mockPrismaService.roleStatus.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.roleStatus.update.mockResolvedValue(updatedStatus);

      const result = await service.setDefault('status-123');

      expect(result.isDefault).toBe(true);
      expect(mockPrismaService.roleStatus.updateMany).toHaveBeenCalledWith({
        where: { roleId: 'role-456', isDefault: true },
        data: { isDefault: false },
      });
    });

    it('should throw NotFoundException when status does not exist', async () => {
      mockPrismaService.roleStatus.findUnique.mockResolvedValue(null);

      await expect(service.setDefault('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createDefaults', () => {
    it('should create all 4 default statuses', async () => {
      const defaultStatuses = [
        {
          ...mockRoleStatus,
          code: 'PENDING' as const,
          name: 'Pending',
          isDefault: true,
        },
        {
          ...mockRoleStatus,
          id: 'status-2',
          code: 'PASSED' as const,
          name: 'Approved',
          isDefault: false,
        },
        {
          ...mockRoleStatus,
          id: 'status-3',
          code: 'RETURNED' as const,
          name: 'Returned',
          isDefault: false,
        },
        {
          ...mockRoleStatus,
          id: 'status-4',
          code: 'REJECTED' as const,
          name: 'Rejected',
          isDefault: false,
        },
      ];

      mockPrismaService.$transaction.mockResolvedValue(defaultStatuses);

      const result = await service.createDefaults('role-456');

      expect(result).toHaveLength(4);
      expect(result.map((s) => s.code)).toEqual([
        RoleStatusCode.PENDING,
        RoleStatusCode.PASSED,
        RoleStatusCode.RETURNED,
        RoleStatusCode.REJECTED,
      ]);
      expect(
        result.find((s) => s.code === RoleStatusCode.PENDING)?.isDefault,
      ).toBe(true);
    });
  });

  describe('4-Status Model Validation', () => {
    it('should only allow valid status codes', () => {
      const validCodes = Object.values(RoleStatusCode);
      expect(validCodes).toEqual(['PENDING', 'PASSED', 'RETURNED', 'REJECTED']);
    });
  });
});

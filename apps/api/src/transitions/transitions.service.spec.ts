/**
 * TransitionsService Unit Tests
 *
 * Tests for workflow transition management.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { TransitionsService } from './transitions.service';
import { PrismaService } from '../prisma';

describe('TransitionsService', () => {
  let service: TransitionsService;

  // Mock transition data
  const mockTransition = {
    id: 'transition-123',
    fromStatusId: 'status-456',
    toRoleId: 'role-789',
    sortOrder: 0,
    conditions: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockRoleStatus = {
    id: 'status-456',
    roleId: 'role-123',
    code: 'PASSED',
    name: 'Approved',
  };

  const mockRole = {
    id: 'role-789',
    name: 'Final Approval',
  };

  const mockPrismaService = {
    roleStatus: {
      findUnique: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    workflowTransition: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransitionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransitionsService>(TransitionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new transition', async () => {
      const dto = {
        fromStatusId: 'status-456',
        toRoleId: 'role-789',
        sortOrder: 0,
      };

      mockPrismaService.roleStatus.findUnique.mockResolvedValue(mockRoleStatus);
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.workflowTransition.findUnique.mockResolvedValue(null);
      mockPrismaService.workflowTransition.create.mockResolvedValue(
        mockTransition,
      );

      const result = await service.create(dto);

      expect(result.id).toBe('transition-123');
      expect(result.fromStatusId).toBe('status-456');
      expect(result.toRoleId).toBe('role-789');
    });

    it('should throw NotFoundException when source status does not exist', async () => {
      mockPrismaService.roleStatus.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          fromStatusId: 'non-existent',
          toRoleId: 'role-789',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when target role does not exist', async () => {
      mockPrismaService.roleStatus.findUnique.mockResolvedValue(mockRoleStatus);
      mockPrismaService.role.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          fromStatusId: 'status-456',
          toRoleId: 'non-existent',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when transition already exists', async () => {
      mockPrismaService.roleStatus.findUnique.mockResolvedValue(mockRoleStatus);
      mockPrismaService.role.findUnique.mockResolvedValue(mockRole);
      mockPrismaService.workflowTransition.findUnique.mockResolvedValue(
        mockTransition,
      );

      await expect(
        service.create({
          fromStatusId: 'status-456',
          toRoleId: 'role-789',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findFromStatus', () => {
    it('should return all transitions from a status', async () => {
      const transitions = [
        mockTransition,
        { ...mockTransition, id: 'transition-456', toRoleId: 'role-999' },
      ];
      mockPrismaService.workflowTransition.findMany.mockResolvedValue(
        transitions,
      );

      const result = await service.findFromStatus('status-456');

      expect(result).toHaveLength(2);
      expect(
        mockPrismaService.workflowTransition.findMany,
      ).toHaveBeenCalledWith({
        where: { fromStatusId: 'status-456' },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('findToRole', () => {
    it('should return all transitions to a role', async () => {
      const transitions = [mockTransition];
      mockPrismaService.workflowTransition.findMany.mockResolvedValue(
        transitions,
      );

      const result = await service.findToRole('role-789');

      expect(result).toHaveLength(1);
      expect(
        mockPrismaService.workflowTransition.findMany,
      ).toHaveBeenCalledWith({
        where: { toRoleId: 'role-789' },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('findByService', () => {
    it('should return all transitions for a service', async () => {
      const transitions = [mockTransition];
      mockPrismaService.workflowTransition.findMany.mockResolvedValue(
        transitions,
      );

      const result = await service.findByService('service-123');

      expect(result).toHaveLength(1);
      expect(
        mockPrismaService.workflowTransition.findMany,
      ).toHaveBeenCalledWith({
        where: {
          fromStatus: {
            role: { serviceId: 'service-123' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a transition by ID', async () => {
      mockPrismaService.workflowTransition.findUnique.mockResolvedValue(
        mockTransition,
      );

      const result = await service.findOne('transition-123');

      expect(result.id).toBe('transition-123');
    });

    it('should throw NotFoundException when transition does not exist', async () => {
      mockPrismaService.workflowTransition.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a transition', async () => {
      const updatedTransition = { ...mockTransition, sortOrder: 10 };

      mockPrismaService.workflowTransition.findUnique.mockResolvedValue(
        mockTransition,
      );
      mockPrismaService.workflowTransition.update.mockResolvedValue(
        updatedTransition,
      );

      const result = await service.update('transition-123', { sortOrder: 10 });

      expect(result.sortOrder).toBe(10);
    });

    it('should throw NotFoundException when updating non-existent transition', async () => {
      mockPrismaService.workflowTransition.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { sortOrder: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a transition', async () => {
      mockPrismaService.workflowTransition.findUnique.mockResolvedValue(
        mockTransition,
      );
      mockPrismaService.workflowTransition.delete.mockResolvedValue(
        mockTransition,
      );

      await service.remove('transition-123');

      expect(mockPrismaService.workflowTransition.delete).toHaveBeenCalledWith({
        where: { id: 'transition-123' },
      });
    });

    it('should throw NotFoundException when deleting non-existent transition', async () => {
      mockPrismaService.workflowTransition.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Workflow Routing', () => {
    it('should support multiple transitions from a single status (branching)', async () => {
      const transitions = [
        { ...mockTransition, id: 't1', toRoleId: 'role-A' },
        { ...mockTransition, id: 't2', toRoleId: 'role-B' },
        { ...mockTransition, id: 't3', toRoleId: 'role-C' },
      ];
      mockPrismaService.workflowTransition.findMany.mockResolvedValue(
        transitions,
      );

      const result = await service.findFromStatus('status-456');

      expect(result).toHaveLength(3);
      expect(result.map((t) => t.toRoleId)).toEqual([
        'role-A',
        'role-B',
        'role-C',
      ]);
    });

    it('should support multiple transitions to a single role (converging)', async () => {
      const transitions = [
        { ...mockTransition, id: 't1', fromStatusId: 'status-A' },
        { ...mockTransition, id: 't2', fromStatusId: 'status-B' },
      ];
      mockPrismaService.workflowTransition.findMany.mockResolvedValue(
        transitions,
      );

      const result = await service.findToRole('role-789');

      expect(result).toHaveLength(2);
    });
  });
});

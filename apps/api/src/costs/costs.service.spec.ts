/**
 * CostsService Unit Tests
 *
 * Tests for the business logic layer of Cost CRUD operations.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CostsService } from './costs.service';
import { PrismaService } from '../prisma';
import { CreateCostDto, CostTypeEnum } from './dto/create-cost.dto';
import { UpdateCostDto } from './dto/update-cost.dto';

// Mock Decimal class for tests
class MockDecimal {
  private value: number;
  constructor(value: number) {
    this.value = value;
  }
  toNumber() {
    return this.value;
  }
}

describe('CostsService', () => {
  let service: CostsService;

  // Mock data
  const mockUserId = 'user-456';

  const mockRegistration = {
    id: 'reg-123',
    serviceId: 'service-123',
    name: 'Business License Registration',
    service: {
      createdBy: mockUserId,
    },
  };

  const mockCost = {
    id: 'cost-123',
    registrationId: 'reg-123',
    name: 'Registration Fee',
    type: 'FIXED',
    fixedAmount: new MockDecimal(100.0),
    formula: null,
    currency: 'USD',
    sortOrder: 0,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockCostWithRegistration = {
    ...mockCost,
    registration: {
      service: {
        createdBy: mockUserId,
      },
    },
  };

  const mockPrismaService = {
    registration: {
      findUnique: jest.fn(),
    },
    cost: {
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
        CostsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CostsService>(CostsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createFixedDto: CreateCostDto = {
      name: 'Registration Fee',
      type: CostTypeEnum.FIXED,
      fixedAmount: 100.0,
      currency: 'USD',
      sortOrder: 0,
    };

    const createFormulaDto: CreateCostDto = {
      name: 'Variable Fee',
      type: CostTypeEnum.FORMULA,
      formula: '$sum(items.price) * 0.1',
      currency: 'USD',
      sortOrder: 1,
    };

    it('should create a fixed cost', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );
      mockPrismaService.cost.create.mockResolvedValue(mockCost);

      const result = await service.create(
        'reg-123',
        createFixedDto,
        mockUserId,
      );

      expect(result).toEqual(mockCost);
      expect(mockPrismaService.cost.create).toHaveBeenCalledWith({
        data: {
          registrationId: 'reg-123',
          name: 'Registration Fee',
          type: 'FIXED',
          fixedAmount: 100.0,
          formula: null,
          currency: 'USD',
          sortOrder: 0,
        },
      });
    });

    it('should create a formula-based cost', async () => {
      const formulaCost = {
        ...mockCost,
        type: 'FORMULA',
        fixedAmount: null,
        formula: '$sum(items.price) * 0.1',
      };

      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );
      mockPrismaService.cost.create.mockResolvedValue(formulaCost);

      const result = await service.create(
        'reg-123',
        createFormulaDto,
        mockUserId,
      );

      expect(result.type).toBe('FORMULA');
      expect(mockPrismaService.cost.create).toHaveBeenCalledWith({
        data: {
          registrationId: 'reg-123',
          name: 'Variable Fee',
          type: 'FORMULA',
          fixedAmount: null,
          formula: '$sum(items.price) * 0.1',
          currency: 'USD',
          sortOrder: 1,
        },
      });
    });

    it('should throw NotFoundException when registration does not exist', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(null);

      await expect(
        service.create('non-existent', createFixedDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create('non-existent', createFixedDto, mockUserId),
      ).rejects.toThrow('Registration with ID "non-existent" not found');
    });

    it('should throw ForbiddenException when user is not service owner', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );

      await expect(
        service.create('reg-123', createFixedDto, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create('reg-123', createFixedDto, 'other-user'),
      ).rejects.toThrow(
        'You do not have permission to add costs to this registration',
      );
    });

    it('should throw BadRequestException when FIXED type has no amount', async () => {
      const invalidDto: CreateCostDto = {
        name: 'Invalid Fee',
        type: CostTypeEnum.FIXED,
        // Missing fixedAmount
      };

      await expect(
        service.create('reg-123', invalidDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create('reg-123', invalidDto, mockUserId),
      ).rejects.toThrow('fixedAmount is required when type is FIXED');
    });

    it('should throw BadRequestException when FORMULA type has no formula', async () => {
      const invalidDto: CreateCostDto = {
        name: 'Invalid Fee',
        type: CostTypeEnum.FORMULA,
        // Missing formula
      };

      await expect(
        service.create('reg-123', invalidDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create('reg-123', invalidDto, mockUserId),
      ).rejects.toThrow('formula is required when type is FORMULA');
    });

    it('should use default currency when not provided', async () => {
      const dtoWithoutCurrency: CreateCostDto = {
        name: 'Registration Fee',
        type: CostTypeEnum.FIXED,
        fixedAmount: 100.0,
      };

      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );
      mockPrismaService.cost.create.mockResolvedValue(mockCost);

      await service.create('reg-123', dtoWithoutCurrency, mockUserId);

      expect(mockPrismaService.cost.create).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          currency: 'USD',
        }),
      });
    });

    it('should throw BadRequestException for invalid JSONata formula syntax', async () => {
      const invalidFormulaDto: CreateCostDto = {
        name: 'Invalid Formula Fee',
        type: CostTypeEnum.FORMULA,
        formula: '$sum(items.price * ', // Missing closing parenthesis
      };

      await expect(
        service.create('reg-123', invalidFormulaDto, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create('reg-123', invalidFormulaDto, mockUserId),
      ).rejects.toThrow(/Invalid JSONata formula syntax/);
    });

    it('should accept valid complex JSONata formulas', async () => {
      const complexFormulaDto: CreateCostDto = {
        name: 'Complex Formula Fee',
        type: CostTypeEnum.FORMULA,
        formula: '$sum(items.(price * quantity)) + $count(items) * 5',
        currency: 'EUR',
      };

      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );
      mockPrismaService.cost.create.mockResolvedValue({
        ...mockCost,
        type: 'FORMULA',
        fixedAmount: null,
        formula: complexFormulaDto.formula,
      });

      const result = await service.create(
        'reg-123',
        complexFormulaDto,
        mockUserId,
      );

      expect(result.type).toBe('FORMULA');
      expect(mockPrismaService.cost.create).toHaveBeenCalled();
    });
  });

  describe('findAllByRegistration', () => {
    it('should return all costs for a registration', async () => {
      const costs = [mockCost];
      mockPrismaService.registration.findUnique.mockResolvedValue(
        mockRegistration,
      );
      mockPrismaService.cost.findMany.mockResolvedValue(costs);

      const result = await service.findAllByRegistration('reg-123');

      expect(result).toEqual({
        costs,
        total: 1,
      });
      expect(mockPrismaService.cost.findMany).toHaveBeenCalledWith({
        where: { registrationId: 'reg-123' },
        orderBy: { sortOrder: 'asc' },
      });
    });

    it('should throw NotFoundException when registration does not exist', async () => {
      mockPrismaService.registration.findUnique.mockResolvedValue(null);

      await expect(
        service.findAllByRegistration('non-existent'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findAllByRegistration('non-existent'),
      ).rejects.toThrow('Registration with ID "non-existent" not found');
    });
  });

  describe('findOne', () => {
    it('should return a cost by id', async () => {
      mockPrismaService.cost.findUnique.mockResolvedValue(mockCost);

      const result = await service.findOne('cost-123');

      expect(result).toEqual(mockCost);
      expect(mockPrismaService.cost.findUnique).toHaveBeenCalledWith({
        where: { id: 'cost-123' },
      });
    });

    it('should throw NotFoundException when cost does not exist', async () => {
      mockPrismaService.cost.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Cost with ID "non-existent" not found',
      );
    });
  });

  describe('update', () => {
    it('should update a cost', async () => {
      const dto: UpdateCostDto = {
        name: 'Updated Fee',
        fixedAmount: 150.0,
      };
      const updatedCost = {
        ...mockCost,
        name: 'Updated Fee',
        fixedAmount: new MockDecimal(150.0),
      };

      mockPrismaService.cost.findUnique.mockResolvedValue(
        mockCostWithRegistration,
      );
      mockPrismaService.cost.update.mockResolvedValue(updatedCost);

      const result = await service.update('cost-123', dto, mockUserId);

      expect(result.name).toBe('Updated Fee');
      expect(mockPrismaService.cost.update).toHaveBeenCalledWith({
        where: { id: 'cost-123' },
        data: {
          name: 'Updated Fee',
          fixedAmount: 150.0,
        },
      });
    });

    it('should throw NotFoundException when cost does not exist', async () => {
      mockPrismaService.cost.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'Test' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('non-existent', { name: 'Test' }, mockUserId),
      ).rejects.toThrow('Cost with ID "non-existent" not found');
    });

    it('should throw ForbiddenException when user is not service owner', async () => {
      mockPrismaService.cost.findUnique.mockResolvedValue(
        mockCostWithRegistration,
      );

      await expect(
        service.update('cost-123', { name: 'Test' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update('cost-123', { name: 'Test' }, 'other-user'),
      ).rejects.toThrow('You do not have permission to update this cost');
    });

    it('should update type from FIXED to FORMULA and clear fixedAmount', async () => {
      const dto: UpdateCostDto = {
        type: CostTypeEnum.FORMULA,
        formula: '$quantity * 10',
      };

      mockPrismaService.cost.findUnique.mockResolvedValue(
        mockCostWithRegistration,
      );
      mockPrismaService.cost.update.mockResolvedValue({
        ...mockCost,
        type: 'FORMULA',
        fixedAmount: null,
        formula: '$quantity * 10',
      });

      await service.update('cost-123', dto, mockUserId);

      expect(mockPrismaService.cost.update).toHaveBeenCalledWith({
        where: { id: 'cost-123' },
        data: {
          type: 'FORMULA',
          fixedAmount: null,
          formula: '$quantity * 10',
        },
      });
    });

    it('should handle partial updates', async () => {
      const dto: UpdateCostDto = {
        sortOrder: 10,
      };

      mockPrismaService.cost.findUnique.mockResolvedValue(
        mockCostWithRegistration,
      );
      mockPrismaService.cost.update.mockResolvedValue({
        ...mockCost,
        sortOrder: 10,
      });

      await service.update('cost-123', dto, mockUserId);

      expect(mockPrismaService.cost.update).toHaveBeenCalledWith({
        where: { id: 'cost-123' },
        data: {
          sortOrder: 10,
        },
      });
    });

    it('should toggle isActive status', async () => {
      const dto: UpdateCostDto = {
        isActive: false,
      };

      mockPrismaService.cost.findUnique.mockResolvedValue(
        mockCostWithRegistration,
      );
      mockPrismaService.cost.update.mockResolvedValue({
        ...mockCost,
        isActive: false,
      });

      const result = await service.update('cost-123', dto, mockUserId);

      expect(result.isActive).toBe(false);
    });

    it('should throw BadRequestException when updating with invalid JSONata formula', async () => {
      const dto: UpdateCostDto = {
        type: CostTypeEnum.FORMULA,
        formula: 'invalid ( syntax ]]',
      };

      mockPrismaService.cost.findUnique.mockResolvedValue(
        mockCostWithRegistration,
      );

      await expect(service.update('cost-123', dto, mockUserId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.update('cost-123', dto, mockUserId)).rejects.toThrow(
        /Invalid JSONata formula syntax/,
      );
    });
  });

  describe('remove', () => {
    it('should hard delete a cost', async () => {
      mockPrismaService.cost.findUnique.mockResolvedValue(
        mockCostWithRegistration,
      );
      mockPrismaService.cost.delete.mockResolvedValue(mockCost);

      const result = await service.remove('cost-123', mockUserId);

      expect(result.id).toBe('cost-123');
      expect(mockPrismaService.cost.delete).toHaveBeenCalledWith({
        where: { id: 'cost-123' },
      });
    });

    it('should throw NotFoundException when cost does not exist', async () => {
      mockPrismaService.cost.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('non-existent', mockUserId)).rejects.toThrow(
        'Cost with ID "non-existent" not found',
      );
    });

    it('should throw ForbiddenException when user is not service owner', async () => {
      mockPrismaService.cost.findUnique.mockResolvedValue(
        mockCostWithRegistration,
      );

      await expect(service.remove('cost-123', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.remove('cost-123', 'other-user')).rejects.toThrow(
        'You do not have permission to delete this cost',
      );
    });
  });
});

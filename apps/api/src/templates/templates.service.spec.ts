/**
 * TemplatesService Unit Tests
 *
 * Tests for the business logic layer of ServiceTemplate operations.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../prisma';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let prismaService: PrismaService;

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

  const mockPrismaService = {
    serviceTemplate: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated templates with defaults', async () => {
      const templates = [mockTemplate];
      mockPrismaService.serviceTemplate.findMany.mockResolvedValue(templates);
      mockPrismaService.serviceTemplate.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result).toEqual({
        templates,
        total: 1,
        page: 1,
        limit: 20,
        hasNext: false,
      });
      expect(mockPrismaService.serviceTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        skip: 0,
        take: 20,
      });
    });

    it('should filter by category', async () => {
      mockPrismaService.serviceTemplate.findMany.mockResolvedValue([]);
      mockPrismaService.serviceTemplate.count.mockResolvedValue(0);

      await service.findAll({ category: 'Trade' });

      expect(mockPrismaService.serviceTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, category: 'Trade' },
        }),
      );
    });

    it('should filter by search term', async () => {
      mockPrismaService.serviceTemplate.findMany.mockResolvedValue([]);
      mockPrismaService.serviceTemplate.count.mockResolvedValue(0);

      await service.findAll({ search: 'business' });

      expect(mockPrismaService.serviceTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            OR: [
              { name: { contains: 'business', mode: 'insensitive' } },
              { description: { contains: 'business', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should apply pagination correctly', async () => {
      const manyTemplates = Array(20)
        .fill(null)
        .map((_, i) => ({ ...mockTemplate, id: `template-${i}` }));
      mockPrismaService.serviceTemplate.findMany.mockResolvedValue(
        manyTemplates,
      );
      mockPrismaService.serviceTemplate.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 2, limit: 20 });

      expect(result.hasNext).toBe(true);
      expect(result.page).toBe(2);
      expect(mockPrismaService.serviceTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        }),
      );
    });

    it('should include inactive templates when explicitly requested', async () => {
      mockPrismaService.serviceTemplate.findMany.mockResolvedValue([]);
      mockPrismaService.serviceTemplate.count.mockResolvedValue(0);

      await service.findAll({ isActive: false });

      expect(mockPrismaService.serviceTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: false },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a template by id', async () => {
      mockPrismaService.serviceTemplate.findUnique.mockResolvedValue(
        mockTemplate,
      );

      const result = await service.findOne('template-123');

      expect(result).toEqual(mockTemplate);
      expect(mockPrismaService.serviceTemplate.findUnique).toHaveBeenCalledWith(
        {
          where: { id: 'template-123' },
        },
      );
    });

    it('should throw NotFoundException when template does not exist', async () => {
      mockPrismaService.serviceTemplate.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Template with ID "non-existent" not found',
      );
    });
  });

  describe('getCategories', () => {
    it('should return unique categories', async () => {
      mockPrismaService.serviceTemplate.findMany.mockResolvedValue([
        { category: 'Business' },
        { category: 'Trade' },
        { category: 'Licensing' },
      ]);

      const result = await service.getCategories();

      expect(result).toEqual(['Business', 'Trade', 'Licensing']);
      expect(mockPrismaService.serviceTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        select: { category: true },
        distinct: ['category'],
      });
    });

    it('should return empty array when no templates exist', async () => {
      mockPrismaService.serviceTemplate.findMany.mockResolvedValue([]);

      const result = await service.getCategories();

      expect(result).toEqual([]);
    });
  });
});

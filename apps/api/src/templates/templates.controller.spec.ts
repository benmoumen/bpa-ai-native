/**
 * TemplatesController Unit Tests
 *
 * Tests for the REST API layer of ServiceTemplate operations.
 * Uses Jest mocks to isolate from service layer.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

describe('TemplatesController', () => {
  let controller: TemplatesController;
  let templatesService: TemplatesService;

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

  const mockTemplatesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    getCategories: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [
        {
          provide: TemplatesService,
          useValue: mockTemplatesService,
        },
      ],
    }).compile();

    controller = module.get<TemplatesController>(TemplatesController);
    templatesService = module.get<TemplatesService>(TemplatesService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated templates', async () => {
      const templates = [mockTemplate];
      mockTemplatesService.findAll.mockResolvedValue({
        templates,
        total: 1,
        page: 1,
        limit: 20,
        hasNext: false,
      });

      const result = await controller.findAll({});

      expect(result).toEqual({
        data: templates,
        meta: {
          total: 1,
          page: 1,
          perPage: 20,
          hasNext: false,
        },
      });
      expect(mockTemplatesService.findAll).toHaveBeenCalledWith({});
    });

    it('should pass query parameters to service', async () => {
      mockTemplatesService.findAll.mockResolvedValue({
        templates: [],
        total: 0,
        page: 2,
        limit: 10,
        hasNext: false,
      });

      await controller.findAll({ page: 2, limit: 10, category: 'Trade' });

      expect(mockTemplatesService.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        category: 'Trade',
      });
    });
  });

  describe('getCategories', () => {
    it('should return list of categories', async () => {
      const categories = ['Business', 'Trade', 'Licensing'];
      mockTemplatesService.getCategories.mockResolvedValue(categories);

      const result = await controller.getCategories();

      expect(result).toEqual({ data: categories });
      expect(mockTemplatesService.getCategories).toHaveBeenCalled();
    });

    it('should return empty array when no categories', async () => {
      mockTemplatesService.getCategories.mockResolvedValue([]);

      const result = await controller.getCategories();

      expect(result).toEqual({ data: [] });
    });
  });

  describe('findOne', () => {
    it('should return a template by id', async () => {
      mockTemplatesService.findOne.mockResolvedValue(mockTemplate);

      const result = await controller.findOne('template-123');

      expect(result).toEqual(mockTemplate);
      expect(mockTemplatesService.findOne).toHaveBeenCalledWith('template-123');
    });

    it('should propagate NotFoundException from service', async () => {
      mockTemplatesService.findOne.mockRejectedValue(
        new NotFoundException('Template with ID "non-existent" not found'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

/**
 * FormFieldsService Unit Tests
 *
 * Tests for the business logic layer of FormField CRUD operations.
 * Uses Jest mocks to isolate from database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { FormFieldsService } from './form-fields.service';
import { PrismaService } from '../prisma';
import { CreateFormFieldDto } from './dto/create-form-field.dto';
import { UpdateFormFieldDto } from './dto/update-form-field.dto';

describe('FormFieldsService', () => {
  let service: FormFieldsService;

  // Mock data
  const mockUserId = 'user-456';

  const mockForm = {
    id: 'form-123',
    serviceId: 'service-123',
    name: 'Application Form',
    type: 'APPLICANT',
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    service: {
      createdBy: mockUserId,
    },
  };

  const mockSection = {
    id: 'section-123',
    formId: 'form-123',
    name: 'Personal Information',
    sortOrder: 0,
    isActive: true,
  };

  const mockField = {
    id: 'field-123',
    formId: 'form-123',
    sectionId: 'section-123',
    type: 'text',
    label: 'Full Name',
    name: 'fullName',
    required: true,
    properties: { placeholder: 'Enter your name' },
    sortOrder: 0,
    isActive: true,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockFieldWithForm = {
    ...mockField,
    form: {
      service: {
        createdBy: mockUserId,
      },
    },
  };

  const mockPrismaService = {
    form: {
      findUnique: jest.fn(),
    },
    formSection: {
      findUnique: jest.fn(),
    },
    formField: {
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
        FormFieldsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FormFieldsService>(FormFieldsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateFormFieldDto = {
      type: 'text',
      label: 'Full Name',
      name: 'fullName',
      required: true,
      properties: { placeholder: 'Enter your name' },
    };

    it('should create a new field', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formField.findUnique.mockResolvedValue(null);
      mockPrismaService.formField.create.mockResolvedValue(mockField);

      const result = await service.create('form-123', createDto, mockUserId);

      expect(result).toEqual(mockField);
      expect(mockPrismaService.form.findUnique).toHaveBeenCalledWith({
        where: { id: 'form-123' },
        include: {
          service: {
            select: { createdBy: true },
          },
        },
      });
      expect(mockPrismaService.formField.create).toHaveBeenCalledWith({
        data: {
          formId: 'form-123',
          sectionId: undefined,
          type: createDto.type,
          label: createDto.label,
          name: createDto.name,
          required: createDto.required,
          properties: createDto.properties,
          sortOrder: 0,
          isActive: true,
        },
      });
    });

    it('should create a field with section', async () => {
      const dtoWithSection: CreateFormFieldDto = {
        ...createDto,
        sectionId: 'section-123',
      };

      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formField.findUnique.mockResolvedValue(null);
      mockPrismaService.formSection.findUnique.mockResolvedValue(mockSection);
      mockPrismaService.formField.create.mockResolvedValue(mockField);

      const result = await service.create(
        'form-123',
        dtoWithSection,
        mockUserId,
      );

      expect(result.sectionId).toBe('section-123');
    });

    it('should throw NotFoundException when form does not exist', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(null);

      await expect(
        service.create('non-existent', createDto, mockUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.create('non-existent', createDto, mockUserId),
      ).rejects.toThrow('Form with ID "non-existent" not found');
    });

    it('should throw ForbiddenException when user is not service owner', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);

      await expect(
        service.create('form-123', createDto, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.create('form-123', createDto, 'other-user'),
      ).rejects.toThrow(
        'You do not have permission to create fields for this form',
      );
    });

    it('should throw ConflictException when field name already exists in form', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formField.findUnique.mockResolvedValue(mockField);

      await expect(
        service.create('form-123', createDto, mockUserId),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.create('form-123', createDto, mockUserId),
      ).rejects.toThrow(
        'Field with name "fullName" already exists in this form',
      );
    });

    it('should throw NotFoundException when section does not exist', async () => {
      const dtoWithSection: CreateFormFieldDto = {
        ...createDto,
        sectionId: 'non-existent',
      };

      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formField.findUnique.mockResolvedValue(null);
      mockPrismaService.formSection.findUnique.mockResolvedValue(null);

      await expect(
        service.create('form-123', dtoWithSection, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when section belongs to different form', async () => {
      const dtoWithSection: CreateFormFieldDto = {
        ...createDto,
        sectionId: 'other-form-section',
      };
      const otherFormSection = {
        ...mockSection,
        id: 'other-form-section',
        formId: 'other-form-123',
      };

      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formField.findUnique.mockResolvedValue(null);
      mockPrismaService.formSection.findUnique.mockResolvedValue(
        otherFormSection,
      );

      await expect(
        service.create('form-123', dtoWithSection, mockUserId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create('form-123', dtoWithSection, mockUserId),
      ).rejects.toThrow('Section must belong to the same form');
    });
  });

  describe('findAllByForm', () => {
    it('should return paginated fields with defaults', async () => {
      const fields = [mockField];
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formField.findMany.mockResolvedValue(fields);
      mockPrismaService.formField.count.mockResolvedValue(1);

      const result = await service.findAllByForm('form-123', {});

      expect(result).toEqual({
        fields,
        total: 1,
        page: 1,
        limit: 50,
        hasNext: false,
      });
      expect(mockPrismaService.formField.findMany).toHaveBeenCalledWith({
        where: { formId: 'form-123' },
        orderBy: { sortOrder: 'asc' },
        skip: 0,
        take: 50,
      });
    });

    it('should throw NotFoundException when form does not exist', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(null);

      await expect(service.findAllByForm('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should filter by sectionId', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formField.findMany.mockResolvedValue([]);
      mockPrismaService.formField.count.mockResolvedValue(0);

      await service.findAllByForm('form-123', { sectionId: 'section-123' });

      expect(mockPrismaService.formField.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { formId: 'form-123', sectionId: 'section-123' },
        }),
      );
    });

    it('should filter by noSection', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formField.findMany.mockResolvedValue([]);
      mockPrismaService.formField.count.mockResolvedValue(0);

      await service.findAllByForm('form-123', { noSection: true });

      expect(mockPrismaService.formField.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { formId: 'form-123', sectionId: null },
        }),
      );
    });

    it('should filter by type', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formField.findMany.mockResolvedValue([]);
      mockPrismaService.formField.count.mockResolvedValue(0);

      await service.findAllByForm('form-123', { type: 'text' });

      expect(mockPrismaService.formField.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { formId: 'form-123', type: 'text' },
        }),
      );
    });

    it('should filter by required', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);
      mockPrismaService.formField.findMany.mockResolvedValue([]);
      mockPrismaService.formField.count.mockResolvedValue(0);

      await service.findAllByForm('form-123', { required: true });

      expect(mockPrismaService.formField.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { formId: 'form-123', required: true },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a field by id', async () => {
      mockPrismaService.formField.findUnique.mockResolvedValue(mockField);

      const result = await service.findOne('field-123');

      expect(result).toEqual(mockField);
    });

    it('should throw NotFoundException when field does not exist', async () => {
      mockPrismaService.formField.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Field with ID "non-existent" not found',
      );
    });
  });

  describe('update', () => {
    it('should update a field', async () => {
      const dto: UpdateFormFieldDto = {
        label: 'Updated Label',
        required: false,
      };
      const updatedField = { ...mockField, ...dto };

      mockPrismaService.formField.findUnique.mockResolvedValue(
        mockFieldWithForm,
      );
      mockPrismaService.formField.update.mockResolvedValue(updatedField);

      const result = await service.update('field-123', dto, mockUserId);

      expect(result.label).toBe('Updated Label');
      expect(result.required).toBe(false);
    });

    it('should throw NotFoundException when updating non-existent field', async () => {
      mockPrismaService.formField.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { label: 'New Label' }, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not parent service owner', async () => {
      mockPrismaService.formField.findUnique.mockResolvedValue(
        mockFieldWithForm,
      );

      await expect(
        service.update('field-123', { label: 'New Label' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when new name already exists', async () => {
      mockPrismaService.formField.findUnique
        .mockResolvedValueOnce(mockFieldWithForm)
        .mockResolvedValueOnce({ id: 'other-field', name: 'existingName' });

      await expect(
        service.update('field-123', { name: 'existingName' }, mockUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when new section belongs to different form', async () => {
      const otherFormSection = {
        ...mockSection,
        formId: 'other-form-123',
      };

      mockPrismaService.formField.findUnique.mockResolvedValue(
        mockFieldWithForm,
      );
      mockPrismaService.formSection.findUnique.mockResolvedValue(
        otherFormSection,
      );

      await expect(
        service.update('field-123', { sectionId: 'other-section' }, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete by setting isActive to false', async () => {
      const deactivatedField = {
        ...mockField,
        isActive: false,
      };

      mockPrismaService.formField.findUnique.mockResolvedValue(
        mockFieldWithForm,
      );
      mockPrismaService.formField.update.mockResolvedValue(deactivatedField);

      const result = await service.remove('field-123', mockUserId);

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.formField.update).toHaveBeenCalledWith({
        where: { id: 'field-123' },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException when deleting non-existent field', async () => {
      mockPrismaService.formField.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent', mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not parent service owner', async () => {
      mockPrismaService.formField.findUnique.mockResolvedValue(
        mockFieldWithForm,
      );

      await expect(service.remove('field-123', 'other-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

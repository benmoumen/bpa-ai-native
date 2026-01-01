/**
 * Schema Generator Service Tests
 *
 * Story 3.10: JSON Schema Generation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SchemaGeneratorService } from './schema-generator.service';
import { PrismaService } from '../prisma';

describe('SchemaGeneratorService', () => {
  let service: SchemaGeneratorService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let prismaService: PrismaService;

  const mockForm = {
    id: 'form-123',
    serviceId: 'service-123',
    name: 'Test Form',
    type: 'APPLICANT',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15T10:30:00.000Z'),
    fields: [],
    sections: [],
  };

  const mockPrismaService = {
    form: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchemaGeneratorService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SchemaGeneratorService>(SchemaGeneratorService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateFormSchema', () => {
    it('should throw NotFoundException when form does not exist', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(null);

      await expect(service.generateFormSchema('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should generate empty schema for form with no fields', async () => {
      mockPrismaService.form.findUnique.mockResolvedValue(mockForm);

      const result = await service.generateFormSchema('form-123');

      expect(result).toEqual({
        formId: 'form-123',
        formName: 'Test Form',
        version: '2024-01-15T10:30:00.000Z',
        jsonSchema: {
          $schema: 'http://json-schema.org/draft-07/schema#',
          type: 'object',
          title: 'Test Form',
          properties: {},
          required: [],
        },
        uiSchema: {
          type: 'VerticalLayout',
          elements: [],
        },
        rules: {
          fields: [],
          sections: [],
        },
      });
    });

    it('should generate correct JSON Schema for TEXT field', async () => {
      const formWithTextField = {
        ...mockForm,
        fields: [
          {
            id: 'field-1',
            formId: 'form-123',
            sectionId: null,
            type: 'TEXT',
            label: 'First Name',
            name: 'firstName',
            required: true,
            properties: {
              minLength: 2,
              maxLength: 50,
              helpText: 'Enter your first name',
            },
            visibilityRule: null,
            sortOrder: 0,
            isActive: true,
            determinantId: null,
          },
        ],
      };

      mockPrismaService.form.findUnique.mockResolvedValue(formWithTextField);

      const result = await service.generateFormSchema('form-123');

      expect(result.jsonSchema.properties['firstName']).toEqual({
        type: 'string',
        title: 'First Name',
        description: 'Enter your first name',
        minLength: 2,
        maxLength: 50,
      });
      expect(result.jsonSchema.required).toContain('firstName');
    });

    it('should generate correct JSON Schema for NUMBER field', async () => {
      const formWithNumberField = {
        ...mockForm,
        fields: [
          {
            id: 'field-1',
            formId: 'form-123',
            sectionId: null,
            type: 'NUMBER',
            label: 'Age',
            name: 'age',
            required: false,
            properties: {
              min: 0,
              max: 120,
            },
            visibilityRule: null,
            sortOrder: 0,
            isActive: true,
            determinantId: null,
          },
        ],
      };

      mockPrismaService.form.findUnique.mockResolvedValue(formWithNumberField);

      const result = await service.generateFormSchema('form-123');

      expect(result.jsonSchema.properties['age']).toEqual({
        type: 'number',
        title: 'Age',
        minimum: 0,
        maximum: 120,
      });
      expect(result.jsonSchema.required).not.toContain('age');
    });

    it('should generate correct JSON Schema for EMAIL field', async () => {
      const formWithEmailField = {
        ...mockForm,
        fields: [
          {
            id: 'field-1',
            formId: 'form-123',
            sectionId: null,
            type: 'EMAIL',
            label: 'Email Address',
            name: 'email',
            required: true,
            properties: {},
            visibilityRule: null,
            sortOrder: 0,
            isActive: true,
            determinantId: null,
          },
        ],
      };

      mockPrismaService.form.findUnique.mockResolvedValue(formWithEmailField);

      const result = await service.generateFormSchema('form-123');

      expect(result.jsonSchema.properties['email']).toEqual({
        type: 'string',
        title: 'Email Address',
        format: 'email',
        pattern: '^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$',
      });
    });

    it('should generate correct JSON Schema for CHECKBOX field', async () => {
      const formWithCheckboxField = {
        ...mockForm,
        fields: [
          {
            id: 'field-1',
            formId: 'form-123',
            sectionId: null,
            type: 'CHECKBOX',
            label: 'Accept Terms',
            name: 'acceptTerms',
            required: true,
            properties: {},
            visibilityRule: null,
            sortOrder: 0,
            isActive: true,
            determinantId: null,
          },
        ],
      };

      mockPrismaService.form.findUnique.mockResolvedValue(
        formWithCheckboxField,
      );

      const result = await service.generateFormSchema('form-123');

      expect(result.jsonSchema.properties['acceptTerms']).toEqual({
        type: 'boolean',
        title: 'Accept Terms',
      });
    });

    it('should generate correct JSON Schema for SELECT field with options', async () => {
      const formWithSelectField = {
        ...mockForm,
        fields: [
          {
            id: 'field-1',
            formId: 'form-123',
            sectionId: null,
            type: 'SELECT',
            label: 'Country',
            name: 'country',
            required: true,
            properties: {
              options: [
                { value: 'us', label: 'United States' },
                { value: 'uk', label: 'United Kingdom' },
                { value: 'ca', label: 'Canada' },
              ],
            },
            visibilityRule: null,
            sortOrder: 0,
            isActive: true,
            determinantId: null,
          },
        ],
      };

      mockPrismaService.form.findUnique.mockResolvedValue(formWithSelectField);

      const result = await service.generateFormSchema('form-123');

      expect(result.jsonSchema.properties['country']).toEqual({
        type: 'string',
        title: 'Country',
        enum: ['us', 'uk', 'ca'],
        enumNames: ['United States', 'United Kingdom', 'Canada'],
      });
    });

    it('should generate correct JSON Schema for DATE field', async () => {
      const formWithDateField = {
        ...mockForm,
        fields: [
          {
            id: 'field-1',
            formId: 'form-123',
            sectionId: null,
            type: 'DATE',
            label: 'Birth Date',
            name: 'birthDate',
            required: false,
            properties: {},
            visibilityRule: null,
            sortOrder: 0,
            isActive: true,
            determinantId: null,
          },
        ],
      };

      mockPrismaService.form.findUnique.mockResolvedValue(formWithDateField);

      const result = await service.generateFormSchema('form-123');

      expect(result.jsonSchema.properties['birthDate']).toEqual({
        type: 'string',
        title: 'Birth Date',
        format: 'date',
      });
    });

    it('should generate correct JSON Schema for FILE field', async () => {
      const formWithFileField = {
        ...mockForm,
        fields: [
          {
            id: 'field-1',
            formId: 'form-123',
            sectionId: null,
            type: 'FILE',
            label: 'Upload Document',
            name: 'document',
            required: false,
            properties: {},
            visibilityRule: null,
            sortOrder: 0,
            isActive: true,
            determinantId: null,
          },
        ],
      };

      mockPrismaService.form.findUnique.mockResolvedValue(formWithFileField);

      const result = await service.generateFormSchema('form-123');

      expect(result.jsonSchema.properties['document']).toEqual({
        type: 'string',
        title: 'Upload Document',
        format: 'data-url',
      });
    });

    it('should generate correct UI Schema with sections', async () => {
      const formWithSections = {
        ...mockForm,
        fields: [
          {
            id: 'field-1',
            formId: 'form-123',
            sectionId: 'section-1',
            type: 'TEXT',
            label: 'First Name',
            name: 'firstName',
            required: true,
            properties: {},
            visibilityRule: null,
            sortOrder: 0,
            isActive: true,
            determinantId: null,
          },
          {
            id: 'field-2',
            formId: 'form-123',
            sectionId: 'section-1',
            type: 'TEXT',
            label: 'Last Name',
            name: 'lastName',
            required: true,
            properties: {},
            visibilityRule: null,
            sortOrder: 1,
            isActive: true,
            determinantId: null,
          },
          {
            id: 'field-3',
            formId: 'form-123',
            sectionId: null,
            type: 'EMAIL',
            label: 'Email',
            name: 'email',
            required: true,
            properties: {},
            visibilityRule: null,
            sortOrder: 0,
            isActive: true,
            determinantId: null,
          },
        ],
        sections: [
          {
            id: 'section-1',
            formId: 'form-123',
            name: 'Personal Information',
            description: 'Your personal details',
            sortOrder: 0,
            visibilityRule: null,
            isActive: true,
          },
        ],
      };

      mockPrismaService.form.findUnique.mockResolvedValue(formWithSections);

      const result = await service.generateFormSchema('form-123');

      // Should have orphaned field first, then section group
      expect(result.uiSchema.elements).toHaveLength(2);

      // First element should be the orphaned email field
      expect(result.uiSchema.elements[0]).toEqual({
        type: 'Control',
        scope: '#/properties/email',
      });

      // Second element should be the section group
      expect(result.uiSchema.elements[1].type).toBe('Group');
      expect(result.uiSchema.elements[1].label).toBe('Personal Information');
      expect(result.uiSchema.elements[1].elements).toHaveLength(2);
    });

    it('should add multi option for TEXTAREA in UI Schema', async () => {
      const formWithTextareaField = {
        ...mockForm,
        fields: [
          {
            id: 'field-1',
            formId: 'form-123',
            sectionId: null,
            type: 'TEXTAREA',
            label: 'Description',
            name: 'description',
            required: false,
            properties: {},
            visibilityRule: null,
            sortOrder: 0,
            isActive: true,
            determinantId: null,
          },
        ],
      };

      mockPrismaService.form.findUnique.mockResolvedValue(
        formWithTextareaField,
      );

      const result = await service.generateFormSchema('form-123');

      expect(result.uiSchema.elements[0]).toEqual({
        type: 'Control',
        scope: '#/properties/description',
        options: { multi: true },
      });
    });

    it('should export visibility rules for fields', async () => {
      const formWithVisibilityRules = {
        ...mockForm,
        fields: [
          {
            id: 'field-1',
            formId: 'form-123',
            sectionId: null,
            type: 'SELECT',
            label: 'Has Dependents',
            name: 'hasDependents',
            required: false,
            properties: {
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
            },
            visibilityRule: null,
            sortOrder: 0,
            isActive: true,
            determinantId: null,
          },
          {
            id: 'field-2',
            formId: 'form-123',
            sectionId: null,
            type: 'NUMBER',
            label: 'Number of Dependents',
            name: 'numDependents',
            required: false,
            properties: {},
            visibilityRule: {
              sourceFieldId: 'field-1',
              operator: 'equals',
              value: 'yes',
            },
            sortOrder: 1,
            isActive: true,
            determinantId: null,
          },
        ],
      };

      mockPrismaService.form.findUnique.mockResolvedValue(
        formWithVisibilityRules,
      );

      const result = await service.generateFormSchema('form-123');

      expect(result.rules.fields).toHaveLength(1);
      expect(result.rules.fields[0]).toEqual({
        targetId: 'field-2',
        targetName: 'numDependents',
        targetType: 'field',
        rule: {
          conditions: {
            all: [
              {
                fact: 'hasDependents',
                operator: 'equal',
                value: 'yes',
              },
            ],
          },
          event: {
            type: 'visible',
          },
        },
      });
    });

    it('should export visibility rules for sections', async () => {
      const formWithSectionVisibilityRules = {
        ...mockForm,
        fields: [
          {
            id: 'field-1',
            formId: 'form-123',
            sectionId: null,
            type: 'CHECKBOX',
            label: 'Show Details',
            name: 'showDetails',
            required: false,
            properties: {},
            visibilityRule: null,
            sortOrder: 0,
            isActive: true,
            determinantId: null,
          },
        ],
        sections: [
          {
            id: 'section-1',
            formId: 'form-123',
            name: 'Additional Details',
            description: null,
            sortOrder: 0,
            visibilityRule: {
              sourceFieldId: 'field-1',
              operator: 'equals',
              value: true,
            },
            isActive: true,
          },
        ],
      };

      mockPrismaService.form.findUnique.mockResolvedValue(
        formWithSectionVisibilityRules,
      );

      const result = await service.generateFormSchema('form-123');

      expect(result.rules.sections).toHaveLength(1);
      expect(result.rules.sections[0]).toEqual({
        targetId: 'section-1',
        targetName: 'Additional Details',
        targetType: 'section',
        rule: {
          conditions: {
            all: [
              {
                fact: 'showDetails',
                operator: 'equal',
                value: true,
              },
            ],
          },
          event: {
            type: 'visible',
          },
        },
      });
    });

    it('should include version from form updatedAt timestamp', async () => {
      const formWithUpdatedAt = {
        ...mockForm,
        updatedAt: new Date('2024-06-15T14:45:30.123Z'),
      };

      mockPrismaService.form.findUnique.mockResolvedValue(formWithUpdatedAt);

      const result = await service.generateFormSchema('form-123');

      expect(result.version).toBe('2024-06-15T14:45:30.123Z');
    });

    it('should include default value when present', async () => {
      const formWithDefault = {
        ...mockForm,
        fields: [
          {
            id: 'field-1',
            formId: 'form-123',
            sectionId: null,
            type: 'TEXT',
            label: 'Country Code',
            name: 'countryCode',
            required: false,
            properties: {
              defaultValue: 'US',
            },
            visibilityRule: null,
            sortOrder: 0,
            isActive: true,
            determinantId: null,
          },
        ],
      };

      mockPrismaService.form.findUnique.mockResolvedValue(formWithDefault);

      const result = await service.generateFormSchema('form-123');

      expect(result.jsonSchema.properties['countryCode'].default).toBe('US');
    });
  });
});

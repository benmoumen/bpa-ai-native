/**
 * Refinement Tools Tests
 *
 * Story 6-5: Iterative Refinement (Task 4)
 */

import { describe, it, expect } from 'vitest';
import {
  createRefinementTools,
  getRefinementToolMetadata,
  isRefinementTool,
  requiresConfirmation,
  refineFormFieldSchema,
  refineSectionSchema,
  refineValidationSchema,
  refineWorkflowStepSchema,
  undoRefinementSchema,
} from './refinement.js';

describe('createRefinementTools', () => {
  it('creates all refinement tools', () => {
    const tools = createRefinementTools();

    expect(tools.size).toBe(5);
    expect(tools.has('refineFormField')).toBe(true);
    expect(tools.has('refineSection')).toBe(true);
    expect(tools.has('refineValidation')).toBe(true);
    expect(tools.has('refineWorkflowStep')).toBe(true);
    expect(tools.has('undoRefinement')).toBe(true);
  });

  it('each tool has proper structure', () => {
    const tools = createRefinementTools();

    for (const [name, tool] of tools) {
      expect(tool.description).toBeDefined();
      expect(typeof tool.description).toBe('string');
      expect(tool.parameters).toBeDefined();
      expect(tool.execute).toBeDefined();
      expect(typeof tool.execute).toBe('function');
      expect(tool.metadata).toBeDefined();
      expect(tool.metadata.name).toBe(name);
    }
  });

  it('tools have correct mutates flag', () => {
    const tools = createRefinementTools();

    for (const tool of tools.values()) {
      expect(tool.metadata.mutates).toBe(true);
    }
  });

  it('tools have client-side path prefix', () => {
    const tools = createRefinementTools();

    for (const tool of tools.values()) {
      expect(tool.metadata.path).toMatch(/^\/client\/refinement\//);
    }
  });

  it('execute functions return placeholder response', async () => {
    const tools = createRefinementTools();
    const refineField = tools.get('refineFormField');

    expect(refineField).toBeDefined();
    expect(refineField?.execute).toBeDefined();
    if (!refineField?.execute) return;

    const result = await refineField.execute({ action: 'add', fieldName: 'test', fieldType: 'text' });

    expect(result).toEqual({
      success: true,
      message: 'This tool is executed client-side',
    });
  });
});

describe('getRefinementToolMetadata', () => {
  it('returns metadata for all 5 tools', () => {
    const metadata = getRefinementToolMetadata();

    expect(metadata).toHaveLength(5);
    expect(metadata.map((m) => m.name)).toEqual([
      'refineFormField',
      'refineSection',
      'refineValidation',
      'refineWorkflowStep',
      'undoRefinement',
    ]);
  });

  it('each metadata has required fields', () => {
    const metadata = getRefinementToolMetadata();

    for (const m of metadata) {
      expect(m.name).toBeDefined();
      expect(m.description).toBeDefined();
      expect(typeof m.mutates).toBe('boolean');
      expect(m.scope).toBeDefined();
      expect(typeof m.requiresConfirmation).toBe('boolean');
      expect(m.method).toBeDefined();
      expect(m.path).toBeDefined();
      expect(Array.isArray(m.tags)).toBe(true);
    }
  });
});

describe('isRefinementTool', () => {
  it('returns true for refinement tools', () => {
    expect(isRefinementTool('refineFormField')).toBe(true);
    expect(isRefinementTool('refineSection')).toBe(true);
    expect(isRefinementTool('refineValidation')).toBe(true);
    expect(isRefinementTool('refineWorkflowStep')).toBe(true);
    expect(isRefinementTool('undoRefinement')).toBe(true);
  });

  it('returns false for non-refinement tools', () => {
    expect(isRefinementTool('createService')).toBe(false);
    expect(isRefinementTool('listForms')).toBe(false);
    expect(isRefinementTool('generateForm')).toBe(false);
    expect(isRefinementTool('')).toBe(false);
  });
});

describe('requiresConfirmation', () => {
  it('returns true for remove actions', () => {
    expect(requiresConfirmation('refineFormField', { action: 'remove' })).toBe(true);
    expect(requiresConfirmation('refineSection', { action: 'remove' })).toBe(true);
    expect(requiresConfirmation('refineWorkflowStep', { action: 'remove' })).toBe(true);
  });

  it('returns tool default for add/modify actions', () => {
    // refineFormField has requiresConfirmation: true
    expect(requiresConfirmation('refineFormField', { action: 'add' })).toBe(true);
    expect(requiresConfirmation('refineFormField', { action: 'modify' })).toBe(true);

    // refineValidation has requiresConfirmation: false
    expect(requiresConfirmation('refineValidation', {})).toBe(false);

    // undoRefinement has requiresConfirmation: false
    expect(requiresConfirmation('undoRefinement', {})).toBe(false);
  });

  it('returns false for unknown tools', () => {
    expect(requiresConfirmation('unknownTool', { action: 'add' })).toBe(false);
  });
});

describe('refineFormFieldSchema', () => {
  it('validates add action', () => {
    const result = refineFormFieldSchema.safeParse({
      action: 'add',
      fieldName: 'phone',
      fieldType: 'tel',
      sectionId: 'contact',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.action).toBe('add');
      expect(result.data.fieldName).toBe('phone');
      expect(result.data.fieldType).toBe('tel');
    }
  });

  it('validates modify action', () => {
    const result = refineFormFieldSchema.safeParse({
      action: 'modify',
      fieldId: 'f_123',
      fieldName: 'phone',
      newName: 'mobile',
      newType: 'tel',
    });

    expect(result.success).toBe(true);
  });

  it('validates remove action', () => {
    const result = refineFormFieldSchema.safeParse({
      action: 'remove',
      fieldId: 'f_123',
      fieldName: 'fax',
    });

    expect(result.success).toBe(true);
  });

  it('validates all field types', () => {
    const fieldTypes = ['text', 'email', 'tel', 'number', 'date', 'select', 'checkbox', 'textarea', 'file'];

    for (const fieldType of fieldTypes) {
      const result = refineFormFieldSchema.safeParse({
        action: 'add',
        fieldName: 'test',
        fieldType,
      });
      expect(result.success).toBe(true);
    }
  });

  it('validates validation rules', () => {
    const result = refineFormFieldSchema.safeParse({
      action: 'add',
      fieldName: 'email',
      fieldType: 'email',
      validation: {
        required: true,
        minLength: 5,
        maxLength: 100,
        pattern: '^[a-z]+$',
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.validation?.required).toBe(true);
      expect(result.data.validation?.minLength).toBe(5);
    }
  });

  it('rejects invalid action', () => {
    const result = refineFormFieldSchema.safeParse({
      action: 'invalid',
      fieldName: 'test',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid field type', () => {
    const result = refineFormFieldSchema.safeParse({
      action: 'add',
      fieldName: 'test',
      fieldType: 'invalid',
    });

    expect(result.success).toBe(false);
  });
});

describe('refineSectionSchema', () => {
  it('validates add action', () => {
    const result = refineSectionSchema.safeParse({
      action: 'add',
      sectionName: 'Contact Information',
      formId: 'form_123',
      position: 0,
    });

    expect(result.success).toBe(true);
  });

  it('validates modify action', () => {
    const result = refineSectionSchema.safeParse({
      action: 'modify',
      sectionId: 'sec_123',
      sectionName: 'Contact',
      newName: 'Contact Details',
      description: 'Updated description',
    });

    expect(result.success).toBe(true);
  });

  it('validates remove action', () => {
    const result = refineSectionSchema.safeParse({
      action: 'remove',
      sectionId: 'sec_123',
      sectionName: 'Old Section',
    });

    expect(result.success).toBe(true);
  });
});

describe('refineValidationSchema', () => {
  it('validates full validation update', () => {
    const result = refineValidationSchema.safeParse({
      fieldId: 'f_123',
      validation: {
        required: true,
        minLength: 10,
        maxLength: 500,
        min: 0,
        max: 100,
        pattern: '^\\d+$',
      },
      merge: false,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.merge).toBe(false);
    }
  });

  it('defaults merge to true', () => {
    const result = refineValidationSchema.safeParse({
      fieldId: 'f_123',
      validation: { required: true },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.merge).toBe(true);
    }
  });

  it('requires fieldId', () => {
    const result = refineValidationSchema.safeParse({
      validation: { required: true },
    });

    expect(result.success).toBe(false);
  });
});

describe('refineWorkflowStepSchema', () => {
  it('validates add action', () => {
    const result = refineWorkflowStepSchema.safeParse({
      action: 'add',
      stepName: 'Review',
      stepType: 'manual',
      roleId: 'role_reviewer',
      formId: 'form_review',
      position: 2,
    });

    expect(result.success).toBe(true);
  });

  it('validates step types', () => {
    const manualResult = refineWorkflowStepSchema.safeParse({
      action: 'add',
      stepName: 'Manual Step',
      stepType: 'manual',
    });

    const autoResult = refineWorkflowStepSchema.safeParse({
      action: 'add',
      stepName: 'Auto Step',
      stepType: 'automatic',
    });

    expect(manualResult.success).toBe(true);
    expect(autoResult.success).toBe(true);
  });

  it('rejects invalid step type', () => {
    const result = refineWorkflowStepSchema.safeParse({
      action: 'add',
      stepName: 'Invalid Step',
      stepType: 'invalid',
    });

    expect(result.success).toBe(false);
  });
});

describe('undoRefinementSchema', () => {
  it('validates count', () => {
    const result = undoRefinementSchema.safeParse({
      count: 3,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(3);
    }
  });

  it('defaults count to 1', () => {
    const result = undoRefinementSchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(1);
    }
  });

  it('rejects count less than 1', () => {
    const result = undoRefinementSchema.safeParse({
      count: 0,
    });

    expect(result.success).toBe(false);
  });

  it('rejects count greater than 10', () => {
    const result = undoRefinementSchema.safeParse({
      count: 11,
    });

    expect(result.success).toBe(false);
  });
});

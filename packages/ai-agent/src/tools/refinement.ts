/**
 * Refinement Tools
 *
 * Story 6-5: Iterative Refinement (Task 4)
 *
 * Tools for refining generated service configurations.
 * These tools operate on in-memory configuration and are executed client-side.
 */

import { z } from 'zod';
import type { BPATool, ToolMetadata } from './types.js';

/**
 * Field type enum for validation
 */
const FieldTypeEnum = z.enum([
  'text',
  'email',
  'tel',
  'number',
  'date',
  'select',
  'checkbox',
  'textarea',
  'file',
]);

/**
 * Common validation schema
 */
const ValidationSchema = z.object({
  required: z.boolean().optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
});

/**
 * Tool: refineFormField
 *
 * Add, modify, or remove form fields in the generated configuration.
 */
export const refineFormFieldSchema = z.object({
  action: z.enum(['add', 'modify', 'remove']).describe('The refinement action to perform'),
  fieldId: z.string().optional().describe('ID of the field to modify/remove (required for modify/remove)'),
  fieldName: z.string().describe('Name/label of the field'),
  fieldType: FieldTypeEnum.optional().describe('Type of the field (required for add)'),
  sectionId: z.string().optional().describe('ID of the section to add the field to'),
  validation: ValidationSchema.optional().describe('Validation rules for the field'),
  position: z.number().int().min(0).optional().describe('Position in the section (for add/modify)'),
  newName: z.string().optional().describe('New name for the field (for modify)'),
  newType: FieldTypeEnum.optional().describe('New type for the field (for modify)'),
});

export type RefineFormFieldParams = z.infer<typeof refineFormFieldSchema>;

const refineFormFieldMetadata: ToolMetadata = {
  name: 'refineFormField',
  description: 'Add, modify, or remove form fields in the service configuration',
  mutates: true,
  scope: 'form',
  requiresConfirmation: true, // Requires confirmation for destructive operations
  method: 'PATCH',
  path: '/client/refinement/field',
  tags: ['refinement', 'form'],
};

/**
 * Tool: refineSection
 *
 * Add, modify, or remove form sections.
 */
export const refineSectionSchema = z.object({
  action: z.enum(['add', 'modify', 'remove']).describe('The refinement action to perform'),
  sectionId: z.string().optional().describe('ID of the section (required for modify/remove)'),
  sectionName: z.string().describe('Name/title of the section'),
  formId: z.string().optional().describe('ID of the form to add section to (required for add)'),
  position: z.number().int().min(0).optional().describe('Position in the form (for add/modify)'),
  newName: z.string().optional().describe('New name for the section (for modify)'),
  description: z.string().optional().describe('Section description'),
});

export type RefineSectionParams = z.infer<typeof refineSectionSchema>;

const refineSectionMetadata: ToolMetadata = {
  name: 'refineSection',
  description: 'Add, modify, or remove form sections in the service configuration',
  mutates: true,
  scope: 'form',
  requiresConfirmation: true,
  method: 'PATCH',
  path: '/client/refinement/section',
  tags: ['refinement', 'form'],
};

/**
 * Tool: refineValidation
 *
 * Update field validation rules.
 */
export const refineValidationSchema = z.object({
  fieldId: z.string().describe('ID of the field to update validation for'),
  validation: ValidationSchema.describe('New validation rules'),
  merge: z.boolean().default(true).describe('Whether to merge with existing rules or replace'),
});

export type RefineValidationParams = z.infer<typeof refineValidationSchema>;

const refineValidationMetadata: ToolMetadata = {
  name: 'refineValidation',
  description: 'Update field validation rules',
  mutates: true,
  scope: 'form',
  requiresConfirmation: false, // Less destructive, doesn't need confirmation
  method: 'PATCH',
  path: '/client/refinement/validation',
  tags: ['refinement', 'form', 'validation'],
};

/**
 * Tool: refineWorkflowStep
 *
 * Modify workflow steps and transitions.
 */
export const refineWorkflowStepSchema = z.object({
  action: z.enum(['add', 'modify', 'remove']).describe('The refinement action to perform'),
  stepId: z.string().optional().describe('ID of the step (required for modify/remove)'),
  stepName: z.string().describe('Name of the step'),
  stepType: z.enum(['manual', 'automatic']).optional().describe('Type of step (required for add)'),
  roleId: z.string().optional().describe('ID of the role assigned to the step'),
  formId: z.string().optional().describe('ID of the form associated with the step'),
  position: z.number().int().min(0).optional().describe('Position in workflow sequence'),
});

export type RefineWorkflowStepParams = z.infer<typeof refineWorkflowStepSchema>;

const refineWorkflowStepMetadata: ToolMetadata = {
  name: 'refineWorkflowStep',
  description: 'Add, modify, or remove workflow steps',
  mutates: true,
  scope: 'workflow',
  requiresConfirmation: true,
  method: 'PATCH',
  path: '/client/refinement/workflow-step',
  tags: ['refinement', 'workflow'],
};

/**
 * Tool: undoRefinement
 *
 * Undo the last refinement operation(s).
 */
export const undoRefinementSchema = z.object({
  count: z.number().int().min(1).max(10).default(1).describe('Number of operations to undo'),
});

export type UndoRefinementParams = z.infer<typeof undoRefinementSchema>;

const undoRefinementMetadata: ToolMetadata = {
  name: 'undoRefinement',
  description: 'Undo the last refinement operation(s)',
  mutates: true,
  scope: 'global',
  requiresConfirmation: false,
  method: 'POST',
  path: '/client/refinement/undo',
  tags: ['refinement', 'undo'],
};

/**
 * Create refinement tools
 *
 * These tools are client-side and don't make HTTP requests.
 * The execute function is a placeholder - actual execution happens in the UI.
 */
export function createRefinementTools(): Map<string, BPATool> {
  const tools = new Map<string, BPATool>();

  // Note: execute functions are placeholders - real execution handled by UI
  const placeholderExecute = (): Promise<{ success: boolean; message: string }> =>
    Promise.resolve({
      success: true,
      message: 'This tool is executed client-side',
    });

  tools.set('refineFormField', {
    description: refineFormFieldMetadata.description,
    parameters: refineFormFieldSchema,
    execute: placeholderExecute,
    metadata: refineFormFieldMetadata,
  });

  tools.set('refineSection', {
    description: refineSectionMetadata.description,
    parameters: refineSectionSchema,
    execute: placeholderExecute,
    metadata: refineSectionMetadata,
  });

  tools.set('refineValidation', {
    description: refineValidationMetadata.description,
    parameters: refineValidationSchema,
    execute: placeholderExecute,
    metadata: refineValidationMetadata,
  });

  tools.set('refineWorkflowStep', {
    description: refineWorkflowStepMetadata.description,
    parameters: refineWorkflowStepSchema,
    execute: placeholderExecute,
    metadata: refineWorkflowStepMetadata,
  });

  tools.set('undoRefinement', {
    description: undoRefinementMetadata.description,
    parameters: undoRefinementSchema,
    execute: placeholderExecute,
    metadata: undoRefinementMetadata,
  });

  return tools;
}

/**
 * Get refinement tool metadata list
 */
export function getRefinementToolMetadata(): ToolMetadata[] {
  return [
    refineFormFieldMetadata,
    refineSectionMetadata,
    refineValidationMetadata,
    refineWorkflowStepMetadata,
    undoRefinementMetadata,
  ];
}

/**
 * Check if a tool name is a refinement tool
 */
export function isRefinementTool(toolName: string): boolean {
  const refinementTools = [
    'refineFormField',
    'refineSection',
    'refineValidation',
    'refineWorkflowStep',
    'undoRefinement',
  ];
  return refinementTools.includes(toolName);
}

/**
 * Check if a refinement operation requires confirmation
 */
export function requiresConfirmation(
  toolName: string,
  params: Record<string, unknown>,
): boolean {
  // Remove operations always require confirmation
  if (params.action === 'remove') {
    return true;
  }

  // Check tool metadata
  const metadata = getRefinementToolMetadata().find((m) => m.name === toolName);
  return metadata?.requiresConfirmation ?? false;
}

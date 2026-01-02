/**
 * Gap Detection Types
 *
 * Story 6-6: Gap Detection (Task 1)
 *
 * Types for gap analysis, detection rules, and fix generation.
 */

import { z } from 'zod';

/**
 * Gap severity levels
 */
export type GapSeverity = 'critical' | 'warning' | 'suggestion';

/**
 * Gap type enumeration
 */
export type GapType =
  | 'MISSING_FIELD'
  | 'ORPHAN_STEP'
  | 'MISSING_TRANSITION'
  | 'MISSING_VALIDATION'
  | 'INVALID_SEQUENCE'
  | 'MISSING_END_STATE'
  | 'MISSING_START_STATE';

/**
 * Entity types that can have gaps
 */
export type GapEntityType = 'form' | 'field' | 'workflow' | 'step' | 'section';

/**
 * Location of a detected gap
 */
export interface GapLocation {
  entityType: GapEntityType;
  entityId?: string;
  entityName?: string;
  parentId?: string;
  parentName?: string;
}

/**
 * Fix action types
 */
export type GapFixAction =
  | 'add_field'
  | 'add_validation'
  | 'add_transition'
  | 'remove_step'
  | 'set_terminal'
  | 'add_start_state';

/**
 * A proposed fix for a gap
 */
export interface GapFix {
  action: GapFixAction;
  params: Record<string, unknown>;
  description: string;
}

/**
 * A detected gap in the configuration
 */
export interface Gap {
  id: string;
  type: GapType;
  severity: GapSeverity;
  message: string;
  suggestion: string;
  location: GapLocation;
  fix?: GapFix;
}

/**
 * Gap report containing categorized gaps
 */
export interface GapReport {
  /** Report generation timestamp */
  timestamp: number;
  /** Total number of gaps found */
  totalGaps: number;
  /** Critical gaps that must be fixed */
  criticalGaps: Gap[];
  /** Warning gaps that should be fixed */
  warningGaps: Gap[];
  /** Suggestion gaps for improvement */
  suggestionGaps: Gap[];
  /** Summary message */
  summary: string;
}

/**
 * Field configuration for gap analysis
 */
export interface FieldConfig {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  sectionId?: string;
}

/**
 * Section configuration for gap analysis
 */
export interface SectionConfig {
  id: string;
  name: string;
  fields: FieldConfig[];
}

/**
 * Form configuration for gap analysis
 */
export interface FormConfig {
  id: string;
  name: string;
  type?: string;
  sections: SectionConfig[];
  fields: FieldConfig[];
}

/**
 * Workflow step configuration for gap analysis
 */
export interface StepConfig {
  id: string;
  name: string;
  type?: 'manual' | 'automatic';
  isTerminal?: boolean;
  isStart?: boolean;
  roleId?: string;
  formId?: string;
}

/**
 * Workflow transition configuration for gap analysis
 */
export interface TransitionConfig {
  id: string;
  fromStepId: string;
  toStepId: string;
  condition?: string;
}

/**
 * Workflow configuration for gap analysis
 */
export interface WorkflowConfig {
  id: string;
  name: string;
  steps: StepConfig[];
  transitions: TransitionConfig[];
  startStepId?: string;
}

/**
 * Service configuration for gap analysis
 */
export interface ServiceConfig {
  id: string;
  name: string;
  type?: string;
  forms: FormConfig[];
  workflow?: WorkflowConfig;
}

/**
 * Rule definition for field gap detection
 */
export interface FieldGapRule {
  name: string;
  description: string;
  severity: GapSeverity;
  check: (config: ServiceConfig) => boolean;
  fix?: GapFix;
}

/**
 * Rule definition for workflow gap detection
 */
export interface WorkflowGapRule {
  name: string;
  description: string;
  severity: GapSeverity;
  check: (workflow: WorkflowConfig) => boolean;
}

/**
 * Rule definition for validation gap detection
 */
export interface ValidationGapRule {
  name: string;
  description: string;
  severity: GapSeverity;
  fieldTypes: string[];
  requiredValidation: Record<string, unknown>;
}

/**
 * Gap analysis options
 */
export interface GapAnalysisOptions {
  /** Include validation gap checks */
  checkValidation?: boolean;
  /** Include workflow gap checks */
  checkWorkflow?: boolean;
  /** Include missing field checks */
  checkFields?: boolean;
  /** Custom rules to add */
  customRules?: FieldGapRule[];
  /** Service type for context-specific rules */
  serviceType?: string;
}

// Zod schemas for validation

export const GapSeveritySchema = z.enum(['critical', 'warning', 'suggestion']);

export const GapTypeSchema = z.enum([
  'MISSING_FIELD',
  'ORPHAN_STEP',
  'MISSING_TRANSITION',
  'MISSING_VALIDATION',
  'INVALID_SEQUENCE',
  'MISSING_END_STATE',
  'MISSING_START_STATE',
]);

export const GapLocationSchema = z.object({
  entityType: z.enum(['form', 'field', 'workflow', 'step', 'section']),
  entityId: z.string().optional(),
  entityName: z.string().optional(),
  parentId: z.string().optional(),
  parentName: z.string().optional(),
});

export const GapFixSchema = z.object({
  action: z.enum([
    'add_field',
    'add_validation',
    'add_transition',
    'remove_step',
    'set_terminal',
    'add_start_state',
  ]),
  params: z.record(z.unknown()),
  description: z.string(),
});

export const GapSchema = z.object({
  id: z.string(),
  type: GapTypeSchema,
  severity: GapSeveritySchema,
  message: z.string(),
  suggestion: z.string(),
  location: GapLocationSchema,
  fix: GapFixSchema.optional(),
});

export const GapReportSchema = z.object({
  timestamp: z.number(),
  totalGaps: z.number().int().min(0),
  criticalGaps: z.array(GapSchema),
  warningGaps: z.array(GapSchema),
  suggestionGaps: z.array(GapSchema),
  summary: z.string(),
});

/**
 * Gap Analyzer
 *
 * Story 6-6: Gap Detection (Task 1)
 *
 * Core engine for detecting gaps in service configurations.
 * Analyzes forms, workflows, and validations for completeness.
 */

import type {
  Gap,
  GapAnalysisOptions,
  GapReport,
  ServiceConfig,
  WorkflowConfig,
  FieldConfig,
  StepConfig,
} from './types.js';

/**
 * Generate a unique gap ID
 */
function generateGapId(): string {
  return `gap-${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * GapAnalyzer class for detecting configuration gaps
 */
export class GapAnalyzer {
  private options: Required<Omit<GapAnalysisOptions, 'customRules'>> & {
    customRules: NonNullable<GapAnalysisOptions['customRules']>;
  };

  constructor(options: GapAnalysisOptions = {}) {
    this.options = {
      checkValidation: options.checkValidation ?? true,
      checkWorkflow: options.checkWorkflow ?? true,
      checkFields: options.checkFields ?? true,
      customRules: options.customRules ?? [],
      serviceType: options.serviceType ?? 'general',
    };
  }

  /**
   * Analyze a service configuration for all types of gaps
   */
  analyze(config: ServiceConfig): GapReport {
    const gaps: Gap[] = [];

    // Check for missing fields
    if (this.options.checkFields) {
      gaps.push(...this.analyzeMissingFields(config));
    }

    // Check for validation gaps
    if (this.options.checkValidation) {
      gaps.push(...this.analyzeValidationGaps(config));
    }

    // Check for workflow gaps
    if (this.options.checkWorkflow && config.workflow) {
      gaps.push(...this.analyzeWorkflowGaps(config.workflow));
    }

    // Apply custom rules
    for (const rule of this.options.customRules) {
      if (!rule.check(config)) {
        gaps.push({
          id: generateGapId(),
          type: 'MISSING_FIELD',
          severity: rule.severity,
          message: rule.description,
          suggestion: `Add the required ${rule.name}`,
          location: { entityType: 'form' },
          fix: rule.fix,
        });
      }
    }

    return this.generateReport(gaps);
  }

  /**
   * Analyze for missing required fields
   */
  analyzeMissingFields(config: ServiceConfig): Gap[] {
    const gaps: Gap[] = [];
    const allFields = this.getAllFields(config);
    const fieldNameLower = allFields.map((f) => f.name.toLowerCase());

    // Essential field checks based on service type
    const essentialFields = this.getEssentialFields(this.options.serviceType);

    for (const essential of essentialFields) {
      const hasField = fieldNameLower.some(
        (name) =>
          essential.patterns.some((pattern) => name.includes(pattern.toLowerCase())) ||
          allFields.some((f) => essential.types.includes(f.type))
      );

      if (!hasField) {
        gaps.push({
          id: generateGapId(),
          type: 'MISSING_FIELD',
          severity: essential.severity,
          message: essential.message,
          suggestion: essential.suggestion,
          location: {
            entityType: 'form',
            entityName: config.forms[0]?.name,
          },
          fix: essential.fix,
        });
      }
    }

    return gaps;
  }

  /**
   * Analyze for validation gaps in fields
   */
  analyzeValidationGaps(config: ServiceConfig): Gap[] {
    const gaps: Gap[] = [];
    const allFields = this.getAllFields(config);

    for (const field of allFields) {
      const validationGaps = this.checkFieldValidation(field);
      gaps.push(...validationGaps);
    }

    return gaps;
  }

  /**
   * Check validation for a single field
   */
  private checkFieldValidation(field: FieldConfig): Gap[] {
    const gaps: Gap[] = [];

    // Email fields should have pattern validation
    if (field.type === 'email' && !field.validation?.pattern) {
      gaps.push({
        id: generateGapId(),
        type: 'MISSING_VALIDATION',
        severity: 'warning',
        message: `Email field "${field.name}" lacks email format validation`,
        suggestion: 'Add email pattern validation',
        location: {
          entityType: 'field',
          entityId: field.id,
          entityName: field.name,
        },
        fix: {
          action: 'add_validation',
          params: {
            fieldId: field.id,
            validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
          },
          description: `Add email pattern validation to "${field.name}"`,
        },
      });
    }

    // Phone/tel fields should have pattern validation
    if (field.type === 'tel' && !field.validation?.pattern) {
      gaps.push({
        id: generateGapId(),
        type: 'MISSING_VALIDATION',
        severity: 'suggestion',
        message: `Phone field "${field.name}" lacks format validation`,
        suggestion: 'Add phone pattern validation',
        location: {
          entityType: 'field',
          entityId: field.id,
          entityName: field.name,
        },
        fix: {
          action: 'add_validation',
          params: {
            fieldId: field.id,
            validation: { pattern: '^[+]?[0-9\\s-()]+$' },
          },
          description: `Add phone pattern validation to "${field.name}"`,
        },
      });
    }

    // Text fields without any length constraints
    if (field.type === 'text' || field.type === 'textarea') {
      const hasLengthValidation =
        field.validation?.minLength !== undefined || field.validation?.maxLength !== undefined;

      if (!hasLengthValidation) {
        gaps.push({
          id: generateGapId(),
          type: 'MISSING_VALIDATION',
          severity: 'suggestion',
          message: `Text field "${field.name}" has no length constraints`,
          suggestion: 'Consider adding min/max length validation',
          location: {
            entityType: 'field',
            entityId: field.id,
            entityName: field.name,
          },
          fix: {
            action: 'add_validation',
            params: {
              fieldId: field.id,
              validation: { minLength: 1, maxLength: 255 },
            },
            description: `Add length constraints to "${field.name}"`,
          },
        });
      }
    }

    // Number fields should have min/max
    if (field.type === 'number') {
      const hasRangeValidation =
        field.validation?.min !== undefined || field.validation?.max !== undefined;

      if (!hasRangeValidation) {
        gaps.push({
          id: generateGapId(),
          type: 'MISSING_VALIDATION',
          severity: 'suggestion',
          message: `Number field "${field.name}" has no range constraints`,
          suggestion: 'Consider adding min/max validation',
          location: {
            entityType: 'field',
            entityId: field.id,
            entityName: field.name,
          },
        });
      }
    }

    return gaps;
  }

  /**
   * Analyze workflow for gaps
   */
  analyzeWorkflowGaps(workflow: WorkflowConfig): Gap[] {
    const gaps: Gap[] = [];

    // Check for missing start state
    if (!workflow.startStepId && workflow.steps.length > 0) {
      const hasStartStep = workflow.steps.some((s) => s.isStart);
      if (!hasStartStep) {
        gaps.push({
          id: generateGapId(),
          type: 'MISSING_START_STATE',
          severity: 'critical',
          message: 'Workflow has no designated start step',
          suggestion: 'Set one step as the start step',
          location: {
            entityType: 'workflow',
            entityId: workflow.id,
            entityName: workflow.name,
          },
          fix: {
            action: 'add_start_state',
            params: { stepId: workflow.steps[0]?.id },
            description: `Set "${workflow.steps[0]?.name}" as start step`,
          },
        });
      }
    }

    // Check for missing end state (terminal)
    const hasTerminalStep = workflow.steps.some((s) => s.isTerminal);
    if (!hasTerminalStep && workflow.steps.length > 0) {
      gaps.push({
        id: generateGapId(),
        type: 'MISSING_END_STATE',
        severity: 'critical',
        message: 'Workflow has no terminal (end) step',
        suggestion: 'Mark at least one step as terminal',
        location: {
          entityType: 'workflow',
          entityId: workflow.id,
          entityName: workflow.name,
        },
      });
    }

    // Check for orphan steps (not reachable from start)
    const orphanSteps = this.findOrphanSteps(workflow);
    for (const step of orphanSteps) {
      gaps.push({
        id: generateGapId(),
        type: 'ORPHAN_STEP',
        severity: 'critical',
        message: `Step "${step.name}" is not reachable from the start`,
        suggestion: 'Add a transition to this step or remove it',
        location: {
          entityType: 'step',
          entityId: step.id,
          entityName: step.name,
        },
        fix: {
          action: 'remove_step',
          params: { stepId: step.id },
          description: `Remove orphan step "${step.name}"`,
        },
      });
    }

    // Check for dead ends (no outgoing transitions except terminal)
    const deadEndSteps = this.findDeadEndSteps(workflow);
    for (const step of deadEndSteps) {
      gaps.push({
        id: generateGapId(),
        type: 'MISSING_TRANSITION',
        severity: 'critical',
        message: `Step "${step.name}" has no outgoing transitions`,
        suggestion: 'Add transitions or mark as terminal step',
        location: {
          entityType: 'step',
          entityId: step.id,
          entityName: step.name,
        },
        fix: {
          action: 'set_terminal',
          params: { stepId: step.id },
          description: `Mark "${step.name}" as terminal step`,
        },
      });
    }

    return gaps;
  }

  /**
   * Find steps that are not reachable from the start
   */
  private findOrphanSteps(workflow: WorkflowConfig): StepConfig[] {
    if (workflow.steps.length === 0) return [];

    // Build adjacency list
    const graph = new Map<string, Set<string>>();
    for (const step of workflow.steps) {
      graph.set(step.id, new Set());
    }
    for (const transition of workflow.transitions) {
      const neighbors = graph.get(transition.fromStepId);
      if (neighbors) {
        neighbors.add(transition.toStepId);
      }
    }

    // Find start step
    const startStepId =
      workflow.startStepId ?? workflow.steps.find((s) => s.isStart)?.id ?? workflow.steps[0]?.id;

    if (!startStepId) return [];

    // BFS to find reachable steps
    const reachable = new Set<string>();
    const queue = [startStepId];
    reachable.add(startStepId);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      const neighbors = graph.get(current) ?? new Set();
      for (const neighbor of neighbors) {
        if (!reachable.has(neighbor)) {
          reachable.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    // Return steps not in reachable set
    return workflow.steps.filter((s) => !reachable.has(s.id));
  }

  /**
   * Find steps with no outgoing transitions (and not terminal)
   */
  private findDeadEndSteps(workflow: WorkflowConfig): StepConfig[] {
    const stepsWithOutgoing = new Set<string>();
    for (const transition of workflow.transitions) {
      stepsWithOutgoing.add(transition.fromStepId);
    }

    return workflow.steps.filter((s) => !s.isTerminal && !stepsWithOutgoing.has(s.id));
  }

  /**
   * Get all fields from all forms and sections
   */
  private getAllFields(config: ServiceConfig): FieldConfig[] {
    const fields: FieldConfig[] = [];

    for (const form of config.forms) {
      fields.push(...form.fields);
      for (const section of form.sections) {
        fields.push(...section.fields);
      }
    }

    return fields;
  }

  /**
   * Get essential fields based on service type
   */
  private getEssentialFields(
    serviceType: string
  ): Array<{
    patterns: string[];
    types: string[];
    severity: Gap['severity'];
    message: string;
    suggestion: string;
    fix?: Gap['fix'];
  }> {
    const common = [
      {
        patterns: ['name', 'applicant', 'full name'],
        types: [],
        severity: 'critical' as const,
        message: 'No applicant name field found',
        suggestion: 'Add a field to collect applicant name',
        fix: {
          action: 'add_field' as const,
          params: {
            fieldName: 'Applicant Full Name',
            fieldType: 'text',
            validation: { required: true, minLength: 2 },
          },
          description: 'Add "Applicant Full Name" field',
        },
      },
      {
        patterns: ['email', 'e-mail'],
        types: ['email'],
        severity: 'warning' as const,
        message: 'No contact email field found',
        suggestion: 'Add an email field for notifications',
        fix: {
          action: 'add_field' as const,
          params: {
            fieldName: 'Email Address',
            fieldType: 'email',
            validation: { required: true },
          },
          description: 'Add "Email Address" field',
        },
      },
    ];

    // Add service-type specific fields
    if (serviceType === 'business_registration') {
      common.push({
        patterns: ['business', 'company', 'organization', 'entity'],
        types: [],
        severity: 'critical' as const,
        message: 'No business/company name field found',
        suggestion: 'Add a field to collect business name',
        fix: {
          action: 'add_field' as const,
          params: {
            fieldName: 'Business Name',
            fieldType: 'text',
            validation: { required: true, minLength: 2 },
          },
          description: 'Add "Business Name" field',
        },
      });
    }

    return common;
  }

  /**
   * Generate a gap report from detected gaps
   */
  private generateReport(gaps: Gap[]): GapReport {
    const criticalGaps = gaps.filter((g) => g.severity === 'critical');
    const warningGaps = gaps.filter((g) => g.severity === 'warning');
    const suggestionGaps = gaps.filter((g) => g.severity === 'suggestion');

    let summary: string;
    if (gaps.length === 0) {
      summary = 'No gaps detected. Configuration appears complete.';
    } else {
      const parts: string[] = [];
      if (criticalGaps.length > 0) {
        parts.push(`${String(criticalGaps.length)} critical issue${criticalGaps.length > 1 ? 's' : ''}`);
      }
      if (warningGaps.length > 0) {
        parts.push(`${String(warningGaps.length)} warning${warningGaps.length > 1 ? 's' : ''}`);
      }
      if (suggestionGaps.length > 0) {
        parts.push(
          `${String(suggestionGaps.length)} suggestion${suggestionGaps.length > 1 ? 's' : ''}`
        );
      }
      summary = `Found ${parts.join(', ')}.`;
    }

    return {
      timestamp: Date.now(),
      totalGaps: gaps.length,
      criticalGaps,
      warningGaps,
      suggestionGaps,
      summary,
    };
  }
}

/**
 * Create a new gap analyzer instance
 */
export function createGapAnalyzer(options?: GapAnalysisOptions): GapAnalyzer {
  return new GapAnalyzer(options);
}

export default GapAnalyzer;

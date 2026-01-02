/**
 * Gap Fixer
 *
 * Story 6-6: Gap Detection (Task 6)
 *
 * Converts gap fixes into refinement intents and applies them to the service configuration.
 */

import type { GapItem, GapFix } from './GapReport';
import type { RefinementIntent, AddFieldIntent, ModifyFieldIntent } from './refinement-parser';

/**
 * Change preview item for displaying proposed fixes
 */
export interface FixPreviewItem {
  gapId: string;
  message: string;
  fix: GapFix;
  intent: RefinementIntent;
}

/**
 * Result of applying gap fixes
 */
export interface ApplyFixesResult {
  success: boolean;
  appliedCount: number;
  failedCount: number;
  errors: Array<{ gapId: string; error: string }>;
}

/**
 * Convert a gap fix action to a refinement intent
 */
export function gapFixToIntent(gap: GapItem): RefinementIntent | null {
  if (!gap.hasFix || !gap.fix) {
    return null;
  }

  const { fix } = gap;

  switch (fix.action) {
    case 'add_field':
      return createAddFieldIntent(fix);
    case 'add_validation':
      return createModifyFieldIntent(fix);
    case 'set_start':
    case 'set_terminal':
    case 'add_start_state':
    case 'remove_step':
      // Workflow fixes return a special intent that will be handled separately
      return createWorkflowIntent(fix);
    default:
      return null;
  }
}

/**
 * Create an ADD_FIELD intent from a gap fix
 */
function createAddFieldIntent(fix: GapFix): AddFieldIntent {
  const params = fix.params ?? {};
  return {
    type: 'ADD_FIELD',
    fieldName: (params.fieldName as string) ?? 'New Field',
    fieldType: (params.fieldType as AddFieldIntent['fieldType']) ?? 'text',
    validation: params.validation as AddFieldIntent['validation'],
  };
}

/**
 * Create a MODIFY_FIELD intent from a gap fix
 */
function createModifyFieldIntent(fix: GapFix): ModifyFieldIntent {
  const params = fix.params ?? {};
  return {
    type: 'MODIFY_FIELD',
    fieldName: (params.fieldId as string) ?? '',
    changes: {
      ...(params.validation as Record<string, unknown>),
    },
  };
}

/**
 * Create a workflow-related intent (handled separately from field intents)
 */
function createWorkflowIntent(fix: GapFix): RefinementIntent {
  // For workflow fixes, we use a special modify intent that gets handled differently
  const params = fix.params ?? {};
  return {
    type: 'MODIFY_FIELD',
    fieldName: `workflow:${fix.action}`,
    changes: {
      ...(params as Record<string, unknown>),
    },
  };
}

/**
 * Generate preview items for a list of gaps
 */
export function generateFixPreviews(gaps: GapItem[]): FixPreviewItem[] {
  const previews: FixPreviewItem[] = [];

  for (const gap of gaps) {
    if (!gap.hasFix || !gap.fix) continue;

    const intent = gapFixToIntent(gap);
    if (!intent) continue;

    previews.push({
      gapId: gap.id,
      message: gap.message,
      fix: gap.fix,
      intent,
    });
  }

  return previews;
}

/**
 * Apply gap fixes to the service configuration
 *
 * This function applies the fixes by delegating to the appropriate handlers
 * based on the fix type.
 */
export async function applyGapFixes(
  gaps: GapItem[],
  handlers: {
    onAddField?: (intent: AddFieldIntent) => Promise<void>;
    onModifyField?: (intent: ModifyFieldIntent) => Promise<void>;
    onWorkflowChange?: (action: string, params: Record<string, unknown>) => Promise<void>;
  }
): Promise<ApplyFixesResult> {
  const result: ApplyFixesResult = {
    success: true,
    appliedCount: 0,
    failedCount: 0,
    errors: [],
  };

  for (const gap of gaps) {
    if (!gap.hasFix || !gap.fix) continue;

    const intent = gapFixToIntent(gap);
    if (!intent) continue;

    try {
      switch (intent.type) {
        case 'ADD_FIELD':
          if (handlers.onAddField) {
            await handlers.onAddField(intent);
            result.appliedCount++;
          }
          break;

        case 'MODIFY_FIELD':
          // Check if this is a workflow intent
          if (intent.fieldName.startsWith('workflow:')) {
            const action = intent.fieldName.replace('workflow:', '');
            if (handlers.onWorkflowChange) {
              await handlers.onWorkflowChange(action, intent.changes as Record<string, unknown>);
              result.appliedCount++;
            }
          } else if (handlers.onModifyField) {
            await handlers.onModifyField(intent);
            result.appliedCount++;
          }
          break;

        default:
          // Unsupported intent type
          result.errors.push({
            gapId: gap.id,
            error: `Unsupported fix type: ${intent.type}`,
          });
          result.failedCount++;
      }
    } catch (error) {
      result.errors.push({
        gapId: gap.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.failedCount++;
    }
  }

  result.success = result.failedCount === 0;
  return result;
}

/**
 * Filter gaps by IDs
 */
export function filterGapsByIds(gaps: GapItem[], gapIds: string[]): GapItem[] {
  const idSet = new Set(gapIds);
  return gaps.filter((g) => idSet.has(g.id));
}

/**
 * Get all fixable gaps from a list
 */
export function getFixableGaps(gaps: GapItem[]): GapItem[] {
  return gaps.filter((g) => g.hasFix && g.fix);
}

/**
 * Describe a fix action in human-readable form
 */
export function describeFixAction(fix: GapFix): string {
  const params = fix.params ?? {};
  switch (fix.action) {
    case 'add_field':
      return `Add field "${(params.fieldName as string) ?? 'Unknown'}" (${(params.fieldType as string) ?? 'text'})`;
    case 'add_validation':
      return `Add validation to "${(params.fieldId as string) ?? 'field'}"`;
    case 'set_start':
      return `Set "${(params.stepId as string) ?? 'step'}" as start step`;
    case 'set_terminal':
      return `Mark "${(params.stepId as string) ?? 'step'}" as terminal step`;
    case 'add_start_state':
      return `Add start state to workflow`;
    case 'remove_step':
      return `Remove orphan step "${(params.stepId as string) ?? 'step'}"`;
    default:
      return fix.description ?? 'Apply fix';
  }
}

export default {
  gapFixToIntent,
  generateFixPreviews,
  applyGapFixes,
  filterGapsByIds,
  getFixableGaps,
  describeFixAction,
};

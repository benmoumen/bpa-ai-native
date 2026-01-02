'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { GenerationResults } from './use-generation-flow';
import { GenerationStep } from './use-generation-flow';

/**
 * Generation Preview Component
 *
 * Story 6-4: Service Generation Flow (Task 5)
 *
 * Displays partial results from each generation step:
 * - Metadata preview after METADATA step
 * - Form field preview after FORM step
 * - Workflow preview after WORKFLOW step
 */

export interface GenerationPreviewProps {
  /** Current step */
  currentStep: GenerationStep;
  /** Completed steps */
  completedSteps: GenerationStep[];
  /** Generation results */
  results: GenerationResults;
  /** Callback when user wants to edit a section */
  onEdit?: (step: GenerationStep) => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Chevron icon for collapsible sections
 */
function ChevronIcon({
  className,
  isOpen,
}: {
  className?: string;
  isOpen: boolean;
}) {
  return (
    <svg
      className={cn('transition-transform duration-200', className, {
        'rotate-180': isOpen,
      })}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/**
 * Edit icon
 */
function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

/**
 * Collapsible preview section
 */
function PreviewSection({
  title,
  step,
  isCompleted,
  isCurrent,
  onEdit,
  children,
}: {
  title: string;
  step: GenerationStep;
  isCompleted: boolean;
  isCurrent: boolean;
  onEdit?: (step: GenerationStep) => void;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(isCurrent || isCompleted);

  React.useEffect(() => {
    if (isCurrent) setIsOpen(true);
  }, [isCurrent]);

  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        isCurrent && 'border-primary bg-primary/5',
        isCompleted && !isCurrent && 'border-muted'
      )}
    >
      <button
        className="flex w-full items-center justify-between p-3 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              isCurrent && 'bg-primary animate-pulse',
              isCompleted && !isCurrent && 'bg-green-500'
            )}
          />
          <span className="font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && onEdit && (
            <button
              className="p-1 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(step);
              }}
              title="Edit"
            >
              <EditIcon className="h-4 w-4" />
            </button>
          )}
          <ChevronIcon className="h-4 w-4" isOpen={isOpen} />
        </div>
      </button>
      {isOpen && <div className="border-t px-3 pb-3 pt-2">{children}</div>}
    </div>
  );
}

/**
 * Metadata preview
 */
function MetadataPreview({ metadata }: { metadata: GenerationResults['metadata'] }) {
  if (!metadata) {
    return (
      <p className="text-sm text-muted-foreground">No metadata generated yet</p>
    );
  }

  return (
    <dl className="space-y-2 text-sm">
      {metadata.name && (
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="font-medium">{metadata.name}</dd>
        </div>
      )}
      {metadata.description && (
        <div>
          <dt className="text-muted-foreground">Description</dt>
          <dd className="mt-1">{metadata.description}</dd>
        </div>
      )}
      {metadata.category && (
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Category</dt>
          <dd>{metadata.category}</dd>
        </div>
      )}
    </dl>
  );
}

/**
 * Form fields preview
 */
function FormFieldsPreview({
  fields,
}: {
  fields: GenerationResults['formFields'];
}) {
  if (!fields || fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No form fields generated yet</p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{fields.length} field(s)</p>
      <ul className="space-y-1.5">
        {fields.map((field, index) => (
          <li
            key={field.name || index}
            className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="font-medium">{field.label || field.name}</span>
              {field.required && (
                <span className="text-xs text-destructive">*</span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">{field.type}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Workflow preview
 */
function WorkflowPreview({
  workflow,
}: {
  workflow: GenerationResults['workflow'];
}) {
  if (!workflow) {
    return (
      <p className="text-sm text-muted-foreground">No workflow generated yet</p>
    );
  }

  const steps = workflow.steps || [];
  const transitions = workflow.transitions || [];

  return (
    <div className="space-y-3">
      {/* Steps */}
      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          Steps ({steps.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <div
              key={step.name || index}
              className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
            >
              <span className="font-medium">{step.name}</span>
              <span className="text-muted-foreground">({step.type})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transitions */}
      {transitions.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            Transitions ({transitions.length})
          </p>
          <ul className="space-y-1 text-xs">
            {transitions.map((t, index) => (
              <li key={index} className="flex items-center gap-1">
                <span className="font-medium">{t.from}</span>
                <span className="text-muted-foreground">&rarr;</span>
                <span className="font-medium">{t.to}</span>
                {t.condition && (
                  <span className="text-muted-foreground">
                    ({t.condition})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function GenerationPreview({
  currentStep,
  completedSteps,
  results,
  onEdit,
  className,
}: GenerationPreviewProps) {
  // Don't show if idle or in early steps
  const showPreview =
    currentStep !== GenerationStep.IDLE &&
    currentStep !== GenerationStep.ANALYZING;

  if (!showPreview) {
    return null;
  }

  const isMetadataCompleted = completedSteps.includes(GenerationStep.METADATA);
  const isFormCompleted = completedSteps.includes(GenerationStep.FORM);
  const isWorkflowCompleted = completedSteps.includes(GenerationStep.WORKFLOW);

  const isMetadataCurrent = currentStep === GenerationStep.METADATA;
  const isFormCurrent = currentStep === GenerationStep.FORM;
  const isWorkflowCurrent = currentStep === GenerationStep.WORKFLOW;

  return (
    <div className={cn('space-y-3', className)}>
      <h3 className="text-sm font-semibold">Generation Preview</h3>

      {/* Metadata section */}
      {(isMetadataCurrent || isMetadataCompleted) && (
        <PreviewSection
          title="Service Metadata"
          step={GenerationStep.METADATA}
          isCompleted={isMetadataCompleted}
          isCurrent={isMetadataCurrent}
          onEdit={onEdit}
        >
          <MetadataPreview metadata={results.metadata} />
        </PreviewSection>
      )}

      {/* Form fields section */}
      {(isFormCurrent || isFormCompleted) && (
        <PreviewSection
          title="Form Fields"
          step={GenerationStep.FORM}
          isCompleted={isFormCompleted}
          isCurrent={isFormCurrent}
          onEdit={onEdit}
        >
          <FormFieldsPreview fields={results.formFields} />
        </PreviewSection>
      )}

      {/* Workflow section */}
      {(isWorkflowCurrent || isWorkflowCompleted) && (
        <PreviewSection
          title="Workflow"
          step={GenerationStep.WORKFLOW}
          isCompleted={isWorkflowCompleted}
          isCurrent={isWorkflowCurrent}
          onEdit={onEdit}
        >
          <WorkflowPreview workflow={results.workflow} />
        </PreviewSection>
      )}
    </div>
  );
}

export default GenerationPreview;

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { GenerationResults } from './use-generation-flow';

/**
 * Generation Summary Component
 *
 * Story 6-4: Service Generation Flow (Task 7)
 *
 * Displays a complete summary of generated configuration
 * with approve/reject buttons for final confirmation.
 */

export interface GenerationSummaryProps {
  /** Generated results */
  results: GenerationResults;
  /** Whether currently saving */
  isSaving?: boolean;
  /** Callback when user approves */
  onApprove: () => void;
  /** Callback when user wants to start over */
  onStartOver: () => void;
  /** Callback when user wants to edit a specific section */
  onEdit?: (section: 'metadata' | 'form' | 'workflow') => void;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Check icon
 */
function CheckIcon({ className }: { className?: string }) {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Refresh icon
 */
function RefreshIcon({ className }: { className?: string }) {
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
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  );
}

/**
 * Spinner icon
 */
function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

/**
 * Summary section component
 */
function SummarySection({
  title,
  children,
  onEdit,
}: {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h4 className="font-medium">{title}</h4>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-xs text-primary hover:underline"
          >
            Edit
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function GenerationSummary({
  results,
  isSaving = false,
  onApprove,
  onStartOver,
  onEdit,
  className,
}: GenerationSummaryProps) {
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const cancelButtonRef = React.useRef<HTMLButtonElement>(null);

  const handleApprove = () => {
    setShowConfirmation(true);
  };

  const handleConfirmApprove = () => {
    setShowConfirmation(false);
    onApprove();
  };

  const handleCancelApprove = () => {
    setShowConfirmation(false);
  };

  // Handle keyboard events for modal
  const handleModalKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelApprove();
      }
    },
    []
  );

  // Focus cancel button when modal opens
  React.useEffect(() => {
    if (showConfirmation && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [showConfirmation]);

  // Count generated items
  const fieldCount = results.formFields?.length ?? 0;
  const stepCount = results.workflow?.steps?.length ?? 0;
  const transitionCount = results.workflow?.transitions?.length ?? 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
          <CheckIcon className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-semibold">Generation Complete</h3>
          <p className="text-sm text-muted-foreground">
            Review your service configuration below
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-muted p-2">
          <div className="text-lg font-bold">{fieldCount}</div>
          <div className="text-xs text-muted-foreground">Fields</div>
        </div>
        <div className="rounded-lg bg-muted p-2">
          <div className="text-lg font-bold">{stepCount}</div>
          <div className="text-xs text-muted-foreground">Steps</div>
        </div>
        <div className="rounded-lg bg-muted p-2">
          <div className="text-lg font-bold">{transitionCount}</div>
          <div className="text-xs text-muted-foreground">Transitions</div>
        </div>
      </div>

      {/* Metadata section */}
      {results.metadata && (
        <SummarySection
          title="Service Metadata"
          onEdit={onEdit ? () => onEdit('metadata') : undefined}
        >
          <dl className="space-y-2 text-sm">
            {results.metadata.name && (
              <div>
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{results.metadata.name}</dd>
              </div>
            )}
            {results.metadata.description && (
              <div>
                <dt className="text-muted-foreground">Description</dt>
                <dd>{results.metadata.description}</dd>
              </div>
            )}
            {results.metadata.category && (
              <div>
                <dt className="text-muted-foreground">Category</dt>
                <dd>{results.metadata.category}</dd>
              </div>
            )}
          </dl>
        </SummarySection>
      )}

      {/* Form fields section */}
      {results.formFields && results.formFields.length > 0 && (
        <SummarySection
          title={`Form Fields (${results.formFields.length})`}
          onEdit={onEdit ? () => onEdit('form') : undefined}
        >
          <div className="max-h-40 space-y-1 overflow-y-auto">
            {results.formFields.map((field, index) => (
              <div
                key={field.name || index}
                className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-sm"
              >
                <span className="flex items-center gap-1">
                  <span>{field.label || field.name}</span>
                  {field.required && (
                    <span className="text-xs text-destructive">*</span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground">
                  {field.type}
                </span>
              </div>
            ))}
          </div>
        </SummarySection>
      )}

      {/* Workflow section */}
      {results.workflow && (
        <SummarySection
          title="Workflow"
          onEdit={onEdit ? () => onEdit('workflow') : undefined}
        >
          <div className="space-y-3 text-sm">
            {/* Steps */}
            {results.workflow.steps && results.workflow.steps.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Steps
                </p>
                <div className="flex flex-wrap gap-1">
                  {results.workflow.steps.map((step, index) => (
                    <span
                      key={step.name || index}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      {step.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Transitions */}
            {results.workflow.transitions &&
              results.workflow.transitions.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    Transitions
                  </p>
                  <ul className="space-y-0.5 text-xs">
                    {results.workflow.transitions.map((t, index) => (
                      <li key={index}>
                        {t.from} &rarr; {t.to}
                        {t.condition && (
                          <span className="text-muted-foreground">
                            {' '}
                            ({t.condition})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        </SummarySection>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onStartOver}
          disabled={isSaving}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
            'hover:bg-muted',
            isSaving && 'cursor-not-allowed opacity-50'
          )}
        >
          <RefreshIcon className="h-4 w-4" />
          Start Over
        </button>
        <button
          onClick={handleApprove}
          disabled={isSaving}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors',
            'hover:bg-primary/90',
            isSaving && 'cursor-not-allowed opacity-50'
          )}
        >
          {isSaving ? (
            <>
              <SpinnerIcon className="h-4 w-4" />
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              Approve & Save
            </>
          )}
        </button>
      </div>

      {/* Confirmation dialog */}
      {showConfirmation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-description"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onKeyDown={handleModalKeyDown}
        >
          <div className="mx-4 w-full max-w-md rounded-lg bg-background p-6 shadow-lg">
            <h3 id="confirm-dialog-title" className="mb-2 text-lg font-semibold">
              Confirm Save
            </h3>
            <p id="confirm-dialog-description" className="mb-4 text-sm text-muted-foreground">
              Are you sure you want to save this service configuration? This
              will create the service with the generated metadata, form fields,
              and workflow.
            </p>
            <div className="flex justify-end gap-2">
              <button
                ref={cancelButtonRef}
                onClick={handleCancelApprove}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprove}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerationSummary;

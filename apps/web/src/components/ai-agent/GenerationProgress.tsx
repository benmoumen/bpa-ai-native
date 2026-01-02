'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  GenerationStep,
  ORDERED_STEPS,
  STEP_CONFIG,
} from './use-generation-flow';

/**
 * Generation Progress Indicator
 *
 * Story 6-4: Service Generation Flow (Task 4)
 *
 * Displays a stepper UI showing progress through generation steps.
 * Features:
 * - Visual step indicators with labels
 * - Current step highlight and animation
 * - Completed step checkmarks
 * - Progress percentage
 */

export interface GenerationProgressProps {
  /** Current step in the generation flow */
  currentStep: GenerationStep;
  /** Steps that have been completed */
  completedSteps: GenerationStep[];
  /** Optional CSS class name */
  className?: string;
}

/**
 * Check icon for completed steps
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
 * Spinner icon for current step
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

export function GenerationProgress({
  currentStep,
  completedSteps,
  className,
}: GenerationProgressProps) {
  const currentConfig = STEP_CONFIG[currentStep];
  const currentStepIndex = ORDERED_STEPS.indexOf(currentStep);

  // Calculate overall progress
  const progress = currentConfig.progress;

  // Don't render if idle
  if (currentStep === GenerationStep.IDLE) {
    return null;
  }

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      {/* Progress header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentStep !== GenerationStep.COMPLETED &&
            currentStep !== GenerationStep.ERROR &&
            currentStep !== GenerationStep.CANCELLED && (
              <SpinnerIcon className="h-4 w-4 text-primary" />
            )}
          <span className="text-sm font-medium">{currentConfig.label}</span>
        </div>
        <span className="text-sm text-muted-foreground">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Generation progress: ${progress}%`}
        className="mb-4 h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {ORDERED_STEPS.map((step, index) => {
          const stepConfig = STEP_CONFIG[step];
          const isCompleted = completedSteps.includes(step);
          const isCurrent = step === currentStep;
          const isPending = !isCompleted && !isCurrent;

          return (
            <React.Fragment key={step}>
              {/* Step connector */}
              {index > 0 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 transition-colors duration-300',
                    isCompleted || index <= currentStepIndex
                      ? 'bg-primary'
                      : 'bg-muted'
                  )}
                />
              )}

              {/* Step indicator */}
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium transition-all duration-300',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-background',
                    isPending && 'border-muted bg-background text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : isCurrent ? (
                    <SpinnerIcon className="h-4 w-4 text-primary" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs transition-colors duration-300',
                    isCurrent && 'font-medium text-primary',
                    isPending && 'text-muted-foreground'
                  )}
                >
                  {stepConfig.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Current step description */}
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {currentConfig.description}
      </p>
    </div>
  );
}

export default GenerationProgress;

'use client';

import * as React from 'react';

/**
 * Generation Flow State Machine
 *
 * Story 6-4: Service Generation Flow (Task 3)
 *
 * Manages multi-step service generation progress with:
 * - Step tracking and transitions
 * - localStorage persistence for resume capability
 * - Event callbacks for step changes
 */

/**
 * Generation step enum
 */
export enum GenerationStep {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  METADATA = 'METADATA',
  FORM = 'FORM',
  WORKFLOW = 'WORKFLOW',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ERROR = 'ERROR',
}

/**
 * Step metadata with progress percentages
 */
export const STEP_CONFIG: Record<
  GenerationStep,
  { label: string; progress: number; description: string }
> = {
  [GenerationStep.IDLE]: {
    label: 'Ready',
    progress: 0,
    description: 'Ready to start generation',
  },
  [GenerationStep.ANALYZING]: {
    label: 'Analyzing',
    progress: 5,
    description: 'Analyzing your requirements...',
  },
  [GenerationStep.METADATA]: {
    label: 'Metadata',
    progress: 25,
    description: 'Creating service metadata...',
  },
  [GenerationStep.FORM]: {
    label: 'Form',
    progress: 50,
    description: 'Building form fields...',
  },
  [GenerationStep.WORKFLOW]: {
    label: 'Workflow',
    progress: 75,
    description: 'Configuring workflow...',
  },
  [GenerationStep.REVIEW]: {
    label: 'Review',
    progress: 100,
    description: 'Ready for review',
  },
  [GenerationStep.COMPLETED]: {
    label: 'Completed',
    progress: 100,
    description: 'Generation completed',
  },
  [GenerationStep.CANCELLED]: {
    label: 'Cancelled',
    progress: 0,
    description: 'Generation cancelled',
  },
  [GenerationStep.ERROR]: {
    label: 'Error',
    progress: 0,
    description: 'An error occurred',
  },
};

/**
 * Ordered steps for progress display
 */
export const ORDERED_STEPS: GenerationStep[] = [
  GenerationStep.ANALYZING,
  GenerationStep.METADATA,
  GenerationStep.FORM,
  GenerationStep.WORKFLOW,
  GenerationStep.REVIEW,
];

/**
 * Partial results from each generation step
 */
export interface GenerationResults {
  /** Service metadata from METADATA step */
  metadata?: {
    name?: string;
    description?: string;
    category?: string;
    [key: string]: unknown;
  };
  /** Form fields from FORM step */
  formFields?: Array<{
    name: string;
    type: string;
    label?: string;
    required?: boolean;
    [key: string]: unknown;
  }>;
  /** Workflow configuration from WORKFLOW step */
  workflow?: {
    steps?: Array<{
      name: string;
      type: string;
      [key: string]: unknown;
    }>;
    transitions?: Array<{
      from: string;
      to: string;
      condition?: string;
    }>;
    [key: string]: unknown;
  };
}

/**
 * Generation flow state
 */
export interface GenerationFlowState {
  /** Current step */
  currentStep: GenerationStep;
  /** Session ID for this generation */
  sessionId: string | null;
  /** Service ID being generated */
  serviceId: string | null;
  /** Timestamp when generation started */
  startedAt: Date | null;
  /** Completed steps */
  completedSteps: GenerationStep[];
  /** Partial results from each step */
  results: GenerationResults;
  /** Error message if in ERROR state */
  error?: string;
}

/**
 * localStorage key for persistence
 */
const STORAGE_KEY = 'bpa-generation-flow';

/**
 * Get initial state from localStorage or defaults
 */
function getInitialState(serviceId?: string): GenerationFlowState {
  if (typeof window === 'undefined') {
    return createEmptyState();
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as GenerationFlowState;
      // Only restore if same service or no service specified
      if (!serviceId || parsed.serviceId === serviceId) {
        return {
          ...parsed,
          startedAt: parsed.startedAt ? new Date(parsed.startedAt) : null,
        };
      }
    }
  } catch {
    // Ignore storage errors
  }

  return createEmptyState();
}

/**
 * Create empty initial state
 */
function createEmptyState(): GenerationFlowState {
  return {
    currentStep: GenerationStep.IDLE,
    sessionId: null,
    serviceId: null,
    startedAt: null,
    completedSteps: [],
    results: {},
  };
}

/**
 * Hook options
 */
export interface UseGenerationFlowOptions {
  /** Service ID for the generation */
  serviceId?: string;
  /** Callback when step changes */
  onStepChange?: (step: GenerationStep, prevStep: GenerationStep) => void;
  /** Callback when generation completes */
  onComplete?: (results: GenerationResults) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

/**
 * Hook return type
 */
export interface UseGenerationFlowReturn {
  /** Current flow state */
  state: GenerationFlowState;
  /** Current step config */
  stepConfig: (typeof STEP_CONFIG)[GenerationStep];
  /** Whether generation is active */
  isGenerating: boolean;
  /** Whether can resume from previous session */
  canResume: boolean;
  /** Start new generation */
  start: (sessionId: string, serviceId: string) => void;
  /** Resume from last completed step */
  resume: () => void;
  /** Move to next step */
  nextStep: () => void;
  /** Move to specific step */
  goToStep: (step: GenerationStep) => void;
  /** Update results for current step */
  updateResults: (results: Partial<GenerationResults>) => void;
  /** Mark current step as complete */
  completeStep: () => void;
  /** Cancel generation */
  cancel: () => void;
  /** Set error state */
  setError: (error: string) => void;
  /** Reset to initial state */
  reset: () => void;
  /** Clear stored state */
  clearStorage: () => void;
}

/**
 * Generation flow state machine hook
 */
export function useGenerationFlow({
  serviceId,
  onStepChange,
  onComplete,
  onError,
}: UseGenerationFlowOptions = {}): UseGenerationFlowReturn {
  const [state, setState] = React.useState<GenerationFlowState>(() =>
    getInitialState(serviceId)
  );

  // Persist state to localStorage
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (state.currentStep === GenerationStep.IDLE) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors
    }
  }, [state]);

  // Get current step config
  const stepConfig = STEP_CONFIG[state.currentStep];

  // Check if generation is active
  const isGenerating =
    state.currentStep !== GenerationStep.IDLE &&
    state.currentStep !== GenerationStep.COMPLETED &&
    state.currentStep !== GenerationStep.CANCELLED &&
    state.currentStep !== GenerationStep.ERROR;

  // Check if can resume
  const canResume =
    state.completedSteps.length > 0 &&
    state.currentStep !== GenerationStep.COMPLETED &&
    state.currentStep !== GenerationStep.CANCELLED;

  /**
   * Start new generation
   */
  const start = React.useCallback(
    (newSessionId: string, newServiceId: string) => {
      const prevStep = state.currentStep;
      setState({
        currentStep: GenerationStep.ANALYZING,
        sessionId: newSessionId,
        serviceId: newServiceId,
        startedAt: new Date(),
        completedSteps: [],
        results: {},
      });
      onStepChange?.(GenerationStep.ANALYZING, prevStep);
    },
    [state.currentStep, onStepChange]
  );

  /**
   * Resume from last completed step
   */
  const resume = React.useCallback(() => {
    if (state.completedSteps.length === 0) return;

    const lastCompleted = state.completedSteps[state.completedSteps.length - 1];
    const currentIndex = ORDERED_STEPS.indexOf(lastCompleted);
    const nextStep = ORDERED_STEPS[currentIndex + 1] ?? GenerationStep.REVIEW;

    const prevStep = state.currentStep;
    setState((prev) => ({
      ...prev,
      currentStep: nextStep,
    }));
    onStepChange?.(nextStep, prevStep);
  }, [state.completedSteps, state.currentStep, onStepChange]);

  /**
   * Move to next step
   */
  const nextStep = React.useCallback(() => {
    setState((prev) => {
      const currentIndex = ORDERED_STEPS.indexOf(prev.currentStep);
      if (currentIndex === -1) return prev;

      const next = ORDERED_STEPS[currentIndex + 1];
      const prevStep = prev.currentStep;

      if (next) {
        // Defer callback to after state update
        setTimeout(() => onStepChange?.(next, prevStep), 0);
        return {
          ...prev,
          currentStep: next,
          completedSteps: [...prev.completedSteps, prevStep],
        };
      } else {
        // No more steps - complete
        setTimeout(() => {
          onStepChange?.(GenerationStep.COMPLETED, prevStep);
          onComplete?.(prev.results);
        }, 0);
        return {
          ...prev,
          currentStep: GenerationStep.COMPLETED,
          completedSteps: [...prev.completedSteps, prevStep],
        };
      }
    });
  }, [onStepChange, onComplete]);

  /**
   * Go to specific step
   */
  const goToStep = React.useCallback(
    (step: GenerationStep) => {
      const prevStep = state.currentStep;
      setState((prev) => ({
        ...prev,
        currentStep: step,
      }));
      onStepChange?.(step, prevStep);
    },
    [state.currentStep, onStepChange]
  );

  /**
   * Update results for current step
   */
  const updateResults = React.useCallback(
    (results: Partial<GenerationResults>) => {
      setState((prev) => ({
        ...prev,
        results: { ...prev.results, ...results },
      }));
    },
    []
  );

  /**
   * Mark current step as complete
   */
  const completeStep = React.useCallback(() => {
    nextStep();
  }, [nextStep]);

  /**
   * Cancel generation
   */
  const cancel = React.useCallback(() => {
    const prevStep = state.currentStep;
    setState((prev) => ({
      ...prev,
      currentStep: GenerationStep.CANCELLED,
    }));
    onStepChange?.(GenerationStep.CANCELLED, prevStep);
  }, [state.currentStep, onStepChange]);

  /**
   * Set error state
   */
  const setError = React.useCallback(
    (error: string) => {
      const prevStep = state.currentStep;
      setState((prev) => ({
        ...prev,
        currentStep: GenerationStep.ERROR,
        error,
      }));
      onStepChange?.(GenerationStep.ERROR, prevStep);
      onError?.(error);
    },
    [state.currentStep, onStepChange, onError]
  );

  /**
   * Reset to initial state
   */
  const reset = React.useCallback(() => {
    setState(createEmptyState());
  }, []);

  /**
   * Clear stored state
   */
  const clearStorage = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    reset();
  }, [reset]);

  return {
    state,
    stepConfig,
    isGenerating,
    canResume,
    start,
    resume,
    nextStep,
    goToStep,
    updateResults,
    completeStep,
    cancel,
    setError,
    reset,
    clearStorage,
  };
}

export default useGenerationFlow;

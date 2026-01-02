import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  useGenerationFlow,
  GenerationStep,
  STEP_CONFIG,
  ORDERED_STEPS,
} from './use-generation-flow';

/**
 * Unit tests for useGenerationFlow hook
 *
 * Story 6-4: Service Generation Flow (Task 8)
 */

describe('useGenerationFlow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should start in IDLE state', () => {
      const { result } = renderHook(() => useGenerationFlow());

      expect(result.current.state.currentStep).toBe(GenerationStep.IDLE);
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.canResume).toBe(false);
    });

    it('should have empty results initially', () => {
      const { result } = renderHook(() => useGenerationFlow());

      expect(result.current.state.results).toEqual({});
      expect(result.current.state.completedSteps).toEqual([]);
    });
  });

  describe('start()', () => {
    it('should transition to ANALYZING step', () => {
      const { result } = renderHook(() => useGenerationFlow());

      act(() => {
        result.current.start('session-123', 'service-456');
      });

      expect(result.current.state.currentStep).toBe(GenerationStep.ANALYZING);
      expect(result.current.state.sessionId).toBe('session-123');
      expect(result.current.state.serviceId).toBe('service-456');
      expect(result.current.isGenerating).toBe(true);
    });

    it('should set startedAt timestamp', () => {
      const { result } = renderHook(() => useGenerationFlow());

      act(() => {
        result.current.start('session-123', 'service-456');
      });

      expect(result.current.state.startedAt).toBeInstanceOf(Date);
    });

    it('should call onStepChange callback', () => {
      const onStepChange = vi.fn();
      const { result } = renderHook(() =>
        useGenerationFlow({ onStepChange })
      );

      act(() => {
        result.current.start('session-123', 'service-456');
      });

      expect(onStepChange).toHaveBeenCalledWith(
        GenerationStep.ANALYZING,
        GenerationStep.IDLE
      );
    });
  });

  describe('nextStep()', () => {
    it('should transition through ordered steps', () => {
      const { result } = renderHook(() => useGenerationFlow());

      // Start generation
      act(() => {
        result.current.start('session-123', 'service-456');
      });

      // Move through steps
      expect(result.current.state.currentStep).toBe(GenerationStep.ANALYZING);

      act(() => {
        result.current.nextStep();
      });
      expect(result.current.state.currentStep).toBe(GenerationStep.METADATA);
      expect(result.current.state.completedSteps).toContain(GenerationStep.ANALYZING);

      act(() => {
        result.current.nextStep();
      });
      expect(result.current.state.currentStep).toBe(GenerationStep.FORM);

      act(() => {
        result.current.nextStep();
      });
      expect(result.current.state.currentStep).toBe(GenerationStep.WORKFLOW);

      act(() => {
        result.current.nextStep();
      });
      expect(result.current.state.currentStep).toBe(GenerationStep.REVIEW);
    });

    it('should complete when reaching end of steps', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useGenerationFlow({ onComplete })
      );

      act(() => {
        result.current.start('session-123', 'service-456');
      });

      // Go through all steps
      ORDERED_STEPS.forEach(() => {
        act(() => {
          result.current.nextStep();
        });
      });

      expect(result.current.state.currentStep).toBe(GenerationStep.COMPLETED);
      expect(result.current.isGenerating).toBe(false);

      // Wait for deferred callback
      await vi.waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('goToStep()', () => {
    it('should transition to specific step', () => {
      const { result } = renderHook(() => useGenerationFlow());

      act(() => {
        result.current.start('session-123', 'service-456');
      });

      act(() => {
        result.current.goToStep(GenerationStep.WORKFLOW);
      });

      expect(result.current.state.currentStep).toBe(GenerationStep.WORKFLOW);
    });
  });

  describe('updateResults()', () => {
    it('should update partial results', () => {
      const { result } = renderHook(() => useGenerationFlow());

      act(() => {
        result.current.start('session-123', 'service-456');
      });

      act(() => {
        result.current.updateResults({
          metadata: { name: 'Test Service', description: 'A test' },
        });
      });

      expect(result.current.state.results.metadata).toEqual({
        name: 'Test Service',
        description: 'A test',
      });
    });

    it('should merge results without overwriting', () => {
      const { result } = renderHook(() => useGenerationFlow());

      act(() => {
        result.current.start('session-123', 'service-456');
        result.current.updateResults({
          metadata: { name: 'Test' },
        });
        result.current.updateResults({
          formFields: [{ name: 'field1', type: 'text' }],
        });
      });

      expect(result.current.state.results.metadata).toEqual({ name: 'Test' });
      expect(result.current.state.results.formFields).toHaveLength(1);
    });
  });

  describe('cancel()', () => {
    it('should transition to CANCELLED state', () => {
      const { result } = renderHook(() => useGenerationFlow());

      act(() => {
        result.current.start('session-123', 'service-456');
      });

      act(() => {
        result.current.cancel();
      });

      expect(result.current.state.currentStep).toBe(GenerationStep.CANCELLED);
      expect(result.current.isGenerating).toBe(false);
    });

    it('should call onStepChange with CANCELLED', () => {
      const onStepChange = vi.fn();
      const { result } = renderHook(() =>
        useGenerationFlow({ onStepChange })
      );

      act(() => {
        result.current.start('session-123', 'service-456');
      });

      act(() => {
        result.current.cancel();
      });

      expect(onStepChange).toHaveBeenCalledWith(
        GenerationStep.CANCELLED,
        GenerationStep.ANALYZING
      );
    });
  });

  describe('setError()', () => {
    it('should transition to ERROR state with message', () => {
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useGenerationFlow({ onError })
      );

      act(() => {
        result.current.start('session-123', 'service-456');
      });

      act(() => {
        result.current.setError('Something went wrong');
      });

      expect(result.current.state.currentStep).toBe(GenerationStep.ERROR);
      expect(result.current.state.error).toBe('Something went wrong');
      expect(onError).toHaveBeenCalledWith('Something went wrong');
    });
  });

  describe('reset()', () => {
    it('should reset to initial state', () => {
      const { result } = renderHook(() => useGenerationFlow());

      act(() => {
        result.current.start('session-123', 'service-456');
        result.current.updateResults({
          metadata: { name: 'Test' },
        });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.state.currentStep).toBe(GenerationStep.IDLE);
      expect(result.current.state.sessionId).toBeNull();
      expect(result.current.state.results).toEqual({});
    });
  });

  describe('localStorage persistence', () => {
    it('should persist state to localStorage', () => {
      const { result } = renderHook(() => useGenerationFlow());

      act(() => {
        result.current.start('session-123', 'service-456');
      });

      const stored = localStorage.getItem('bpa-generation-flow');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.currentStep).toBe(GenerationStep.ANALYZING);
      expect(parsed.sessionId).toBe('session-123');
    });

    it('should restore state from localStorage', () => {
      // Set up localStorage with previous state
      const storedState = {
        currentStep: GenerationStep.FORM,
        sessionId: 'session-old',
        serviceId: 'service-old',
        startedAt: new Date().toISOString(),
        completedSteps: [GenerationStep.ANALYZING, GenerationStep.METADATA],
        results: { metadata: { name: 'Previous' } },
      };
      localStorage.setItem('bpa-generation-flow', JSON.stringify(storedState));

      const { result } = renderHook(() => useGenerationFlow());

      expect(result.current.state.currentStep).toBe(GenerationStep.FORM);
      expect(result.current.state.sessionId).toBe('session-old');
      expect(result.current.canResume).toBe(true);
    });

    it('should clear storage on clearStorage()', () => {
      const { result } = renderHook(() => useGenerationFlow());

      act(() => {
        result.current.start('session-123', 'service-456');
      });

      expect(localStorage.getItem('bpa-generation-flow')).toBeTruthy();

      act(() => {
        result.current.clearStorage();
      });

      expect(localStorage.getItem('bpa-generation-flow')).toBeNull();
      expect(result.current.state.currentStep).toBe(GenerationStep.IDLE);
    });
  });

  describe('resume()', () => {
    it('should not allow resume after cancel', () => {
      const { result } = renderHook(() => useGenerationFlow());

      act(() => {
        result.current.start('session-123', 'service-456');
        result.current.nextStep(); // Complete ANALYZING, move to METADATA
        result.current.nextStep(); // Complete METADATA, move to FORM
        result.current.cancel();
      });

      // canResume is false after CANCELLED state
      expect(result.current.canResume).toBe(false);
    });

    it('should track completed steps during generation', () => {
      const { result } = renderHook(() => useGenerationFlow());

      act(() => {
        result.current.start('session-123', 'service-456');
        result.current.nextStep(); // Complete ANALYZING, move to METADATA
        result.current.nextStep(); // Complete METADATA, move to FORM
      });

      // Verify completed steps are tracked
      expect(result.current.state.completedSteps).toContain(GenerationStep.ANALYZING);
      expect(result.current.state.completedSteps).toContain(GenerationStep.METADATA);
      expect(result.current.state.completedSteps).toHaveLength(2);
    });

    it('should restore from persisted state on mount', () => {
      // Set up localStorage with previous interrupted state
      const storedState = {
        currentStep: GenerationStep.FORM,
        sessionId: 'session-old',
        serviceId: 'service-old',
        startedAt: new Date().toISOString(),
        completedSteps: [GenerationStep.ANALYZING, GenerationStep.METADATA],
        results: { metadata: { name: 'Previous' } },
      };
      localStorage.setItem('bpa-generation-flow', JSON.stringify(storedState));

      const { result } = renderHook(() => useGenerationFlow());

      // Should restore the previous state
      expect(result.current.state.currentStep).toBe(GenerationStep.FORM);
      expect(result.current.state.sessionId).toBe('session-old');
      expect(result.current.state.completedSteps).toHaveLength(2);
      // canResume is true since we have completed steps and are in a generation step
      expect(result.current.canResume).toBe(true);
    });

    it('should move to next step when resume is called', () => {
      // Set up localStorage with previous state
      const storedState = {
        currentStep: GenerationStep.FORM,
        sessionId: 'session-old',
        serviceId: 'service-old',
        startedAt: new Date().toISOString(),
        completedSteps: [GenerationStep.ANALYZING, GenerationStep.METADATA],
        results: { metadata: { name: 'Previous' } },
      };
      localStorage.setItem('bpa-generation-flow', JSON.stringify(storedState));

      const { result } = renderHook(() => useGenerationFlow());

      act(() => {
        result.current.resume();
      });

      // Resume moves to next step after last completed (METADATA index 1 -> FORM index 2)
      // Note: resume() calculates next from last completed step
      expect(result.current.state.currentStep).toBe(GenerationStep.FORM);
    });
  });

  describe('STEP_CONFIG', () => {
    it('should have config for all steps', () => {
      Object.values(GenerationStep).forEach((step) => {
        expect(STEP_CONFIG[step]).toBeDefined();
        expect(STEP_CONFIG[step].label).toBeTruthy();
        expect(typeof STEP_CONFIG[step].progress).toBe('number');
        expect(STEP_CONFIG[step].description).toBeTruthy();
      });
    });

    it('should have increasing progress percentages', () => {
      let lastProgress = 0;
      ORDERED_STEPS.forEach((step) => {
        expect(STEP_CONFIG[step].progress).toBeGreaterThanOrEqual(lastProgress);
        lastProgress = STEP_CONFIG[step].progress;
      });
    });
  });

  describe('ORDERED_STEPS', () => {
    it('should contain main generation steps', () => {
      expect(ORDERED_STEPS).toContain(GenerationStep.ANALYZING);
      expect(ORDERED_STEPS).toContain(GenerationStep.METADATA);
      expect(ORDERED_STEPS).toContain(GenerationStep.FORM);
      expect(ORDERED_STEPS).toContain(GenerationStep.WORKFLOW);
      expect(ORDERED_STEPS).toContain(GenerationStep.REVIEW);
    });

    it('should not contain terminal states', () => {
      expect(ORDERED_STEPS).not.toContain(GenerationStep.IDLE);
      expect(ORDERED_STEPS).not.toContain(GenerationStep.COMPLETED);
      expect(ORDERED_STEPS).not.toContain(GenerationStep.CANCELLED);
      expect(ORDERED_STEPS).not.toContain(GenerationStep.ERROR);
    });
  });
});

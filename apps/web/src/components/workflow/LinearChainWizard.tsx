'use client';

/**
 * LinearChainWizard Component
 *
 * A wizard dialog for quickly creating linear approval chains.
 * Creates 2-5 workflow steps with automatic transitions between them.
 * Story 4-6: Linear Approval Chain Configuration
 */

import * as React from 'react';
import { Loader2, Plus, Minus, AlertTriangle, Workflow, ArrowRight } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCreateRole } from '@/hooks/use-roles';
import {
  useCreateTransition,
  useCreateDefaultStatuses,
} from '@/hooks/use-transitions';

interface LinearChainWizardProps {
  serviceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface StepConfig {
  name: string;
  error?: string;
}

const DEFAULT_STEP_COUNT = 3;
const MIN_STEPS = 2;
const MAX_RECOMMENDED_STEPS = 5;
const MAX_STEPS = 10;

export function LinearChainWizard({
  serviceId,
  open,
  onOpenChange,
  onSuccess,
}: LinearChainWizardProps) {
  const [steps, setSteps] = React.useState<StepConfig[]>(
    Array.from({ length: DEFAULT_STEP_COUNT }, () => ({ name: '' }))
  );
  const [isCreating, setIsCreating] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState<string>('');

  const createRole = useCreateRole(serviceId);
  const createDefaultStatuses = useCreateDefaultStatuses(serviceId);
  const createTransition = useCreateTransition(serviceId);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setSteps(Array.from({ length: DEFAULT_STEP_COUNT }, () => ({ name: '' })));
      setSubmitError(null);
      setProgress('');
    }
  }, [open]);

  const handleStepCountChange = (delta: number) => {
    setSteps((prev) => {
      const newCount = Math.max(MIN_STEPS, Math.min(MAX_STEPS, prev.length + delta));
      if (newCount > prev.length) {
        return [...prev, ...Array.from({ length: newCount - prev.length }, () => ({ name: '' }))];
      } else if (newCount < prev.length) {
        return prev.slice(0, newCount);
      }
      return prev;
    });
  };

  const handleStepNameChange = (index: number, name: string) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, name, error: undefined } : step))
    );
  };

  const validate = (): boolean => {
    let isValid = true;
    const names = new Set<string>();

    const newSteps = steps.map((step) => {
      if (!step.name.trim()) {
        isValid = false;
        return { ...step, error: 'Step name is required' };
      }
      const normalizedName = step.name.trim().toLowerCase();
      if (names.has(normalizedName)) {
        isValid = false;
        return { ...step, error: 'Step names must be unique' };
      }
      names.add(normalizedName);
      return { ...step, error: undefined };
    });

    setSteps(newSteps);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsCreating(true);
    setSubmitError(null);

    try {
      const roleIds: string[] = [];

      // Step 1: Create all roles
      for (let i = 0; i < steps.length; i++) {
        setProgress(`Creating step ${i + 1} of ${steps.length}: ${steps[i].name}...`);

        const role = await createRole.mutateAsync({
          name: steps[i].name.trim(),
          roleType: 'USER',
          isStartRole: i === 0,
          sortOrder: i,
        });
        roleIds.push(role.id);

        // Step 2: Create default statuses for this role
        setProgress(`Creating statuses for step ${i + 1}...`);
        await createDefaultStatuses.mutateAsync(role.id);
      }

      // Step 3: Fetch statuses and create transitions
      for (let i = 0; i < roleIds.length - 1; i++) {
        setProgress(`Creating transition ${i + 1} of ${roleIds.length - 1}...`);

        // Fetch the statuses we just created
        const response = await fetch(`/api/v1/roles/${roleIds[i]}/statuses`);
        const statusData = await response.json();
        const statuses = statusData.data || [];

        // Find the PASSED status
        const passedStatus = statuses.find(
          (s: { code: string }) => s.code === 'PASSED'
        );

        if (!passedStatus) {
          throw new Error(`Could not find PASSED status for role ${steps[i].name}`);
        }

        // Create transition from PASSED to next role
        await createTransition.mutateAsync({
          fromStatusId: passedStatus.id,
          toRoleId: roleIds[i + 1],
          sortOrder: 0,
        });
      }

      setProgress('Chain created successfully!');

      // Close dialog and notify success
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
      }, 500);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create approval chain'
      );
      setProgress('');
    } finally {
      setIsCreating(false);
    }
  };

  const showComplexityWarning = steps.length > MAX_RECOMMENDED_STEPS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Quick Workflow Setup
            </DialogTitle>
            <DialogDescription>
              Create a linear approval chain with automatic transitions between steps.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Step Count Selector */}
            <div className="flex items-center justify-between rounded-md border bg-slate-50 p-3">
              <div>
                <Label className="text-sm font-medium">Number of Steps</Label>
                <p className="text-xs text-black/50">
                  Recommended: {MIN_STEPS}-{MAX_RECOMMENDED_STEPS} steps
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleStepCountChange(-1)}
                  disabled={steps.length <= MIN_STEPS || isCreating}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center text-lg font-semibold">
                  {steps.length}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleStepCountChange(1)}
                  disabled={steps.length >= MAX_STEPS || isCreating}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Complexity Warning */}
            {showComplexityWarning && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Complex Workflow
                  </p>
                  <p className="text-xs text-amber-700">
                    Workflows with more than {MAX_RECOMMENDED_STEPS} steps may be difficult to manage.
                    Consider simplifying or using parallel branches.
                  </p>
                </div>
              </div>
            )}

            {/* Step Name Inputs */}
            <div className="space-y-3">
              <Label>Step Names</Label>
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                      {index + 1}
                    </span>
                    <Input
                      placeholder={`Step ${index + 1} name (e.g., ${getSuggestedName(index)})`}
                      value={step.name}
                      onChange={(e) => handleStepNameChange(index, e.target.value)}
                      aria-invalid={!!step.error}
                      disabled={isCreating}
                      className="flex-1"
                    />
                    {index < steps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-black/30 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
              {steps.some((s) => s.error) && (
                <p className="text-sm text-red-600">
                  {steps.find((s) => s.error)?.error}
                </p>
              )}
            </div>

            {/* Progress indicator */}
            {progress && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                {progress}
              </div>
            )}

            {/* Submit error */}
            {submitError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {submitError}
              </div>
            )}

            {/* Preview */}
            <div className="rounded-md border bg-slate-50 p-3">
              <Label className="text-xs text-black/60">What will be created:</Label>
              <ul className="mt-2 space-y-1 text-xs text-black/70">
                <li>• {steps.length} workflow steps (roles)</li>
                <li>• 4 status options per step (Pending, Approved, Returned, Rejected)</li>
                <li>• {steps.length - 1} transitions (each step flows to the next on approval)</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Workflow className="mr-2 h-4 w-4" />
                  Create Chain
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Get a suggested step name based on position
 */
function getSuggestedName(index: number): string {
  const suggestions = [
    'Application Review',
    'Technical Verification',
    'Manager Approval',
    'Director Approval',
    'Final Review',
    'Compliance Check',
    'Quality Assurance',
    'Executive Sign-off',
  ];
  return suggestions[index] || `Step ${index + 1}`;
}

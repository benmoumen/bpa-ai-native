'use client';

/**
 * CreateFormDialog Component
 *
 * Modal dialog for creating new forms within a service.
 * Form type is preset to either APPLICANT or GUIDE based on props.
 * Simple form with just name input and type badge display.
 */

import * as React from 'react';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useCreateForm } from '@/hooks/use-forms';
import type { FormType } from '@/lib/api/forms';

interface CreateFormDialogProps {
  serviceId: string;
  formType: FormType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  name: string;
}

interface FormErrors {
  name?: string;
}

const MAX_NAME_LENGTH = 255;

const formTypeLabels: Record<FormType, string> = {
  APPLICANT: 'Applicant Form',
  GUIDE: 'Guide Form',
};

const formTypeDescriptions: Record<FormType, string> = {
  APPLICANT: 'Data collection form for citizens and applicants.',
  GUIDE: 'Workflow form for operators and staff members.',
};

const formTypeBadgeVariants: Record<FormType, 'default' | 'secondary'> = {
  APPLICANT: 'default',
  GUIDE: 'secondary',
};

export function CreateFormDialog({
  serviceId,
  formType,
  open,
  onOpenChange,
}: CreateFormDialogProps) {
  const [formData, setFormData] = React.useState<FormData>({
    name: '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const createForm = useCreateForm(serviceId);
  const isPending = createForm.isPending;

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setFormData({ name: '' });
      setErrors({});
      setSubmitError(null);
    }
  }, [open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Form name is required';
    } else if (formData.name.length > MAX_NAME_LENGTH) {
      newErrors.name = `Name must be ${MAX_NAME_LENGTH} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitError(null);

    try {
      await createForm.mutateAsync({
        name: formData.name.trim(),
        type: formType,
      });

      onOpenChange(false);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create {formTypeLabels[formType]}</DialogTitle>
            <DialogDescription>
              {formTypeDescriptions[formType]}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Form Type Badge */}
            <div className="grid gap-2">
              <Label>Form Type</Label>
              <div>
                <Badge variant={formTypeBadgeVariants[formType]}>
                  {formType}
                </Badge>
              </div>
              <p className="text-xs text-black/50">
                The form type is preset and cannot be changed.
              </p>
            </div>

            {/* Name field */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Form Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder={
                  formType === 'APPLICANT'
                    ? 'e.g., Business Registration Form'
                    : 'e.g., Application Review Form'
                }
                maxLength={MAX_NAME_LENGTH}
                autoFocus
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-red-600">
                  {errors.name}
                </p>
              )}
              <p className="text-xs text-black/50">
                {formData.name.length}/{MAX_NAME_LENGTH} characters
              </p>
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {submitError}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Creating...' : 'Create Form'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

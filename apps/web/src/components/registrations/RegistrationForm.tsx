'use client';

/**
 * RegistrationForm Component
 *
 * Modal form for creating and editing registrations.
 * Auto-generates key from name using slugify pattern.
 * Key field is readonly in edit mode.
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
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateRegistration,
  useUpdateRegistration,
} from '@/hooks/use-registrations';
import {
  generateKeyFromName,
  type Registration,
} from '@/lib/api/registrations';

interface RegistrationFormProps {
  serviceId: string;
  registration: Registration | null; // null for create mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  name: string;
  shortName: string;
  key: string;
  description: string;
}

interface FormErrors {
  name?: string;
  shortName?: string;
  key?: string;
}

const MAX_NAME_LENGTH = 100;
const MAX_SHORT_NAME_LENGTH = 20;
const MAX_KEY_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;

export function RegistrationForm({
  serviceId,
  registration,
  open,
  onOpenChange,
}: RegistrationFormProps) {
  const isEditMode = !!registration;

  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    shortName: '',
    key: '',
    description: '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [keyManuallyEdited, setKeyManuallyEdited] = React.useState(false);

  const createRegistration = useCreateRegistration(serviceId);
  const updateRegistration = useUpdateRegistration(serviceId);

  const isPending = createRegistration.isPending || updateRegistration.isPending;

  // Reset form when dialog opens/closes or registration changes
  React.useEffect(() => {
    if (open) {
      if (registration) {
        // Edit mode: populate with existing data
        setFormData({
          name: registration.name,
          shortName: registration.shortName,
          key: registration.key,
          description: registration.description || '',
        });
        setKeyManuallyEdited(true); // Prevent auto-generation in edit mode
      } else {
        // Create mode: reset form
        setFormData({
          name: '',
          shortName: '',
          key: '',
          description: '',
        });
        setKeyManuallyEdited(false);
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [open, registration]);

  // Auto-generate key from name (only in create mode and if not manually edited)
  React.useEffect(() => {
    if (!isEditMode && !keyManuallyEdited && formData.name) {
      const generatedKey = generateKeyFromName(formData.name);
      setFormData((prev) => ({ ...prev, key: generatedKey }));
    }
  }, [formData.name, isEditMode, keyManuallyEdited]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Track if key was manually edited
    if (name === 'key') {
      setKeyManuallyEdited(true);
    }

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
      newErrors.name = 'Name is required';
    } else if (formData.name.length > MAX_NAME_LENGTH) {
      newErrors.name = `Name must be ${MAX_NAME_LENGTH} characters or less`;
    }

    // Short name validation
    if (!formData.shortName.trim()) {
      newErrors.shortName = 'Short name is required';
    } else if (formData.shortName.length > MAX_SHORT_NAME_LENGTH) {
      newErrors.shortName = `Short name must be ${MAX_SHORT_NAME_LENGTH} characters or less`;
    }

    // Key validation (only in create mode)
    if (!isEditMode) {
      if (!formData.key.trim()) {
        newErrors.key = 'Key is required';
      } else if (formData.key.length > MAX_KEY_LENGTH) {
        newErrors.key = `Key must be ${MAX_KEY_LENGTH} characters or less`;
      } else if (!/^[a-z][a-z0-9-]*$/.test(formData.key)) {
        newErrors.key =
          'Key must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitError(null);

    try {
      if (isEditMode && registration) {
        // Update existing registration (key cannot be changed)
        await updateRegistration.mutateAsync({
          id: registration.id,
          data: {
            name: formData.name.trim(),
            shortName: formData.shortName.trim(),
            description: formData.description.trim() || undefined,
          },
        });
      } else {
        // Create new registration
        await createRegistration.mutateAsync({
          name: formData.name.trim(),
          shortName: formData.shortName.trim(),
          key: formData.key.trim(),
          description: formData.description.trim() || undefined,
        });
      }

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
            <DialogTitle>
              {isEditMode ? 'Edit Registration' : 'Add Registration'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update the registration details. The unique key cannot be changed.'
                : 'Create a new registration type that applicants can apply for.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name field */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Business License Application"
                maxLength={MAX_NAME_LENGTH}
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

            {/* Short Name field */}
            <div className="grid gap-2">
              <Label htmlFor="shortName">
                Short Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="shortName"
                name="shortName"
                value={formData.shortName}
                onChange={handleInputChange}
                placeholder="e.g., BLA"
                maxLength={MAX_SHORT_NAME_LENGTH}
                aria-invalid={!!errors.shortName}
                aria-describedby={errors.shortName ? 'shortName-error' : undefined}
              />
              {errors.shortName && (
                <p id="shortName-error" className="text-sm text-red-600">
                  {errors.shortName}
                </p>
              )}
              <p className="text-xs text-black/50">
                {formData.shortName.length}/{MAX_SHORT_NAME_LENGTH} characters
              </p>
            </div>

            {/* Key field */}
            <div className="grid gap-2">
              <Label htmlFor="key">
                Unique Key <span className="text-red-500">*</span>
              </Label>
              <Input
                id="key"
                name="key"
                value={formData.key}
                onChange={handleInputChange}
                placeholder="e.g., business-license-application"
                maxLength={MAX_KEY_LENGTH}
                readOnly={isEditMode}
                disabled={isEditMode}
                className={isEditMode ? 'bg-black/5 cursor-not-allowed' : ''}
                aria-invalid={!!errors.key}
                aria-describedby={errors.key ? 'key-error' : 'key-hint'}
              />
              {errors.key && (
                <p id="key-error" className="text-sm text-red-600">
                  {errors.key}
                </p>
              )}
              <p id="key-hint" className="text-xs text-black/50">
                {isEditMode
                  ? 'The key cannot be changed after creation.'
                  : 'Auto-generated from name. Only lowercase letters, numbers, and hyphens.'}
              </p>
            </div>

            {/* Description field */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description of this registration type..."
                rows={3}
                maxLength={MAX_DESCRIPTION_LENGTH}
              />
              <p className="text-xs text-black/50">
                {formData.description.length}/{MAX_DESCRIPTION_LENGTH} characters
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
              {isPending
                ? isEditMode
                  ? 'Saving...'
                  : 'Creating...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Create Registration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

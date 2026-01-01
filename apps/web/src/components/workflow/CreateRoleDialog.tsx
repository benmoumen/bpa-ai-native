'use client';

/**
 * CreateRoleDialog Component
 *
 * Modal dialog for creating new workflow roles (steps) within a service.
 * Supports both creation and editing modes.
 * Story 4-2: Define Workflow Steps
 */

import * as React from 'react';
import { Loader2, User, Bot } from 'lucide-react';

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateRole, useUpdateRole } from '@/hooks/use-roles';
import { useForms } from '@/hooks/use-forms';
import type { Role, RoleType, CreateRoleInput, UpdateRoleInput } from '@/lib/api/roles';
import type { Form, FormType } from '@/lib/api/forms';

interface CreateRoleDialogProps {
  serviceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRole?: Role | null;
}

interface FormData {
  name: string;
  roleType: RoleType;
  shortName: string;
  description: string;
  formId: string;
}

interface FormErrors {
  name?: string;
  roleType?: string;
  shortName?: string;
}

const MAX_NAME_LENGTH = 255;
const MAX_SHORT_NAME_LENGTH = 50;

const roleTypeIcons: Record<RoleType, React.ReactNode> = {
  USER: <User className="h-4 w-4" />,
  BOT: <Bot className="h-4 w-4" />,
};

const roleTypeLabels: Record<RoleType, string> = {
  USER: 'Human (Manual)',
  BOT: 'Bot (Automated)',
};

const roleTypeDescriptions: Record<RoleType, string> = {
  USER: 'Step processed by human operators (staff/approvers)',
  BOT: 'Step processed automatically by system bots',
};

const formTypeLabels: Record<FormType, string> = {
  APPLICANT: 'Applicant Form',
  GUIDE: 'Operator Guide',
};

const formTypeColors: Record<FormType, string> = {
  APPLICANT: 'text-blue-600',
  GUIDE: 'text-purple-600',
};

export function CreateRoleDialog({
  serviceId,
  open,
  onOpenChange,
  editRole,
}: CreateRoleDialogProps) {
  const isEditMode = !!editRole;

  const [formData, setFormData] = React.useState<FormData>({
    name: '',
    roleType: 'USER',
    shortName: '',
    description: '',
    formId: '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const createRole = useCreateRole(serviceId);
  const updateRole = useUpdateRole(serviceId);
  const { data: formsData } = useForms(serviceId, { isActive: true });
  const forms = formsData?.data || [];
  const isPending = createRole.isPending || updateRole.isPending;

  // Reset form when dialog opens/closes or when editRole changes
  React.useEffect(() => {
    if (open) {
      if (editRole) {
        setFormData({
          name: editRole.name,
          roleType: editRole.roleType,
          shortName: editRole.shortName || '',
          description: editRole.description || '',
          formId: editRole.formId || '',
        });
      } else {
        setFormData({
          name: '',
          roleType: 'USER',
          shortName: '',
          description: '',
          formId: '',
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [open, editRole]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleRoleTypeChange = (value: RoleType) => {
    setFormData((prev) => ({ ...prev, roleType: value }));
    if (errors.roleType) {
      setErrors((prev) => ({ ...prev, roleType: undefined }));
    }
  };

  const handleFormChange = (value: string) => {
    // Empty string means "No form" selection
    setFormData((prev) => ({ ...prev, formId: value === '__none__' ? '' : value }));
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Step name is required';
    } else if (formData.name.length > MAX_NAME_LENGTH) {
      newErrors.name = `Name must be ${MAX_NAME_LENGTH} characters or less`;
    }

    // Short name validation (optional but has max length)
    if (formData.shortName.length > MAX_SHORT_NAME_LENGTH) {
      newErrors.shortName = `Short name must be ${MAX_SHORT_NAME_LENGTH} characters or less`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setSubmitError(null);

    try {
      if (isEditMode && editRole) {
        const updateData: UpdateRoleInput = {
          name: formData.name.trim(),
          shortName: formData.shortName.trim() || undefined,
          description: formData.description.trim() || undefined,
          formId: formData.formId || undefined,
        };
        await updateRole.mutateAsync({ roleId: editRole.id, data: updateData });
      } else {
        const createData: CreateRoleInput = {
          name: formData.name.trim(),
          roleType: formData.roleType,
          shortName: formData.shortName.trim() || undefined,
          description: formData.description.trim() || undefined,
          formId: formData.formId || undefined,
        };
        await createRole.mutateAsync(createData);
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
              {isEditMode ? 'Edit Workflow Step' : 'Add Workflow Step'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update the step configuration for this workflow.'
                : 'Define a new step in the workflow process.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Role Type selector (only in create mode) */}
            {!isEditMode && (
              <div className="grid gap-2">
                <Label htmlFor="roleType">
                  Step Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.roleType}
                  onValueChange={handleRoleTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select step type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['USER', 'BOT'] as RoleType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {roleTypeIcons[type]}
                          <span>{roleTypeLabels[type]}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-black/50">
                  {roleTypeDescriptions[formData.roleType]}
                </p>
              </div>
            )}

            {/* Show role type badge in edit mode */}
            {isEditMode && editRole && (
              <div className="grid gap-2">
                <Label>Step Type</Label>
                <div className="flex items-center gap-2 text-sm">
                  {roleTypeIcons[editRole.roleType]}
                  <span>{roleTypeLabels[editRole.roleType]}</span>
                </div>
                <p className="text-xs text-black/50">
                  Step type cannot be changed after creation.
                </p>
              </div>
            )}

            {/* Form selector (for USER roles) */}
            {(formData.roleType === 'USER' || (isEditMode && editRole?.roleType === 'USER')) && (
              <div className="grid gap-2">
                <Label htmlFor="formId">Assigned Form</Label>
                <Select
                  value={formData.formId || '__none__'}
                  onValueChange={handleFormChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a form (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-black/50 italic">No form</span>
                    </SelectItem>
                    {forms.length > 0 && (
                      <>
                        {/* Group forms by type */}
                        {(['GUIDE', 'APPLICANT'] as FormType[]).map((type) => {
                          const typeForms = forms.filter((f: Form) => f.type === type);
                          if (typeForms.length === 0) return null;
                          return (
                            <React.Fragment key={type}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-black/40 uppercase tracking-wide">
                                {formTypeLabels[type]}
                              </div>
                              {typeForms.map((form: Form) => (
                                <SelectItem key={form.id} value={form.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{form.name}</span>
                                    <span className={`text-xs ${formTypeColors[form.type]}`}>
                                      ({form.type})
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-black/50">
                  Optional form to display at this workflow step
                </p>
              </div>
            )}

            {/* Name field */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Step Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Initial Review, Manager Approval"
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

            {/* Short Name field */}
            <div className="grid gap-2">
              <Label htmlFor="shortName">Short Name</Label>
              <Input
                id="shortName"
                name="shortName"
                value={formData.shortName}
                onChange={handleInputChange}
                placeholder="e.g., Review, Approval"
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
                Optional abbreviated name for compact displays ({formData.shortName.length}/{MAX_SHORT_NAME_LENGTH})
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
                placeholder="Describe what happens at this workflow step..."
                rows={3}
              />
              <p className="text-xs text-black/50">
                Optional description of this step&apos;s purpose
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
                  : 'Add Step'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

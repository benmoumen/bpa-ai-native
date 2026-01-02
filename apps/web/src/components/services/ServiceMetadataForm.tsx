'use client';

/**
 * ServiceMetadataForm Component
 *
 * Editable form for service name, description, and category.
 * Story 2.4: Edit Service Metadata
 */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Resolver } from 'react-hook-form';
import { Loader2, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateService } from '@/hooks/use-services';
import type { Service } from '@/lib/api/services';

/**
 * Form validation schema
 */
const updateServiceSchema = z.object({
  name: z
    .string()
    .min(1, 'Service name is required')
    .max(255, 'Service name must be 255 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  category: z
    .string()
    .max(100, 'Category must be 100 characters or less')
    .optional()
    .or(z.literal('')),
});

type UpdateServiceFormData = z.infer<typeof updateServiceSchema>;

interface ServiceMetadataFormProps {
  service: Service;
  isEditable: boolean;
}

export function ServiceMetadataForm({
  service,
  isEditable,
}: ServiceMetadataFormProps) {
  const [showSuccess, setShowSuccess] = React.useState(false);
  const updateMutation = useUpdateService();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateServiceFormData>({
    // Type assertion needed due to Zod v4 / @hookform/resolvers type mismatch
    resolver: zodResolver(updateServiceSchema) as Resolver<UpdateServiceFormData>,
    defaultValues: {
      name: service.name,
      description: service.description || '',
      category: service.category || '',
    },
  });

  // Reset form when service changes
  React.useEffect(() => {
    reset({
      name: service.name,
      description: service.description || '',
      category: service.category || '',
    });
  }, [service, reset]);

  // Hide success message after 3 seconds
  React.useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const onSubmit = async (data: UpdateServiceFormData) => {
    try {
      await updateMutation.mutateAsync({
        id: service.id,
        data: {
          name: data.name,
          description: data.description || undefined,
          category: data.category || undefined,
        },
      });
      // Reset form with new values to clear isDirty state
      reset(data);
      setShowSuccess(true);
    } catch {
      // Error is handled by the mutation state
    }
  };

  const handleReset = () => {
    reset({
      name: service.name,
      description: service.description || '',
      category: service.category || '',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl">
      <div className="space-y-6">
        {/* Error display */}
        {updateMutation.isError && (
          <div
            role="alert"
            className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600"
          >
            {updateMutation.error?.message || 'Failed to update service'}
          </div>
        )}

        {/* Success display */}
        {showSuccess && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Service updated successfully
          </div>
        )}

        {/* Service Name */}
        <div className="grid gap-2">
          <Label htmlFor="name">
            Service Name {isEditable && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="name"
            placeholder="e.g., Business Registration"
            disabled={!isEditable || updateMutation.isPending}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of the service..."
            rows={4}
            disabled={!isEditable || updateMutation.isPending}
            {...register('description')}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* Category */}
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            placeholder="e.g., Business, Permits, Taxation"
            disabled={!isEditable || updateMutation.isPending}
            {...register('category')}
          />
          {errors.category && (
            <p className="text-sm text-red-500">{errors.category.message}</p>
          )}
        </div>

        {/* Action buttons - only show when editable */}
        {isEditable && (
          <div className="flex items-center gap-3 pt-4 border-t border-black/10">
            <Button
              type="submit"
              disabled={!isDirty || updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={!isDirty || updateMutation.isPending}
            >
              Discard Changes
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}

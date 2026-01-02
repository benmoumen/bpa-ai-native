'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Resolver } from 'react-hook-form';
import { Loader2, FileText, LayoutTemplate, ArrowLeft } from 'lucide-react';

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
import { createService, type Service } from '@/lib/api/services';
import { createServiceFromTemplate, type ServiceTemplate } from '@/lib/api/templates';
import { TemplateGallery } from './TemplateGallery';

type CreateMode = 'select' | 'blank' | 'template';

/**
 * Form validation schema
 */
const createServiceSchema = z.object({
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

type CreateServiceFormData = z.infer<typeof createServiceSchema>;

interface CreateServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (service: Service) => void;
}

/**
 * Dialog for creating a new service
 *
 * Provides two creation paths:
 * 1. Start from scratch (blank service)
 * 2. Use a template (pre-configured service)
 */
export function CreateServiceDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateServiceDialogProps) {
  const [mode, setMode] = React.useState<CreateMode>('select');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateServiceFormData>({
    // Type assertion needed due to Zod v4 / @hookform/resolvers type mismatch
    resolver: zodResolver(createServiceSchema) as Resolver<CreateServiceFormData>,
    defaultValues: {
      name: '',
      description: '',
      category: '',
    },
  });

  // Reset form and state when dialog closes
  React.useEffect(() => {
    if (!open) {
      reset();
      setError(null);
      setMode('select');
      setSelectedTemplateId(null);
    }
  }, [open, reset]);

  const onSubmitBlank = async (data: CreateServiceFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const service = await createService({
        name: data.name,
        description: data.description || undefined,
        category: data.category || undefined,
      });

      onSuccess?.(service);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSelectTemplate = async (template: ServiceTemplate) => {
    setIsSubmitting(true);
    setError(null);
    setSelectedTemplateId(template.id);

    try {
      const service = await createServiceFromTemplate(template.id);
      onSuccess?.(service);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service from template');
    } finally {
      setIsSubmitting(false);
      setSelectedTemplateId(null);
    }
  };

  const handleBack = () => {
    setMode('select');
    setError(null);
    reset();
  };

  // Determine dialog size based on mode
  const dialogClassName = mode === 'template'
    ? 'sm:max-w-[800px] max-h-[85vh] overflow-y-auto'
    : 'sm:max-w-[500px]';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogClassName}>
        {/* Mode Selection */}
        {mode === 'select' && (
          <>
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
              <DialogDescription>
                Choose how you want to create your new service.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Start from Scratch Option */}
              <button
                type="button"
                onClick={() => setMode('blank')}
                className="flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                <div className="rounded-lg bg-primary/10 p-2">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Start from Scratch</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a blank service and configure everything yourself.
                  </p>
                </div>
              </button>

              {/* Use Template Option */}
              <button
                type="button"
                onClick={() => setMode('template')}
                className="flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/50"
              >
                <div className="rounded-lg bg-primary/10 p-2">
                  <LayoutTemplate className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Use a Template</h3>
                  <p className="text-sm text-muted-foreground">
                    Start with a pre-configured template and customize it.
                  </p>
                </div>
              </button>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Blank Service Form */}
        {mode === 'blank' && (
          <form onSubmit={handleSubmit(onSubmitBlank)}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>Create Blank Service</DialogTitle>
              </div>
              <DialogDescription>
                Create a new government service. You can add forms and configure
                workflows after creation.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Error display */}
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Service Name */}
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Service Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Business Registration"
                  disabled={isSubmitting}
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
                  rows={3}
                  disabled={isSubmitting}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Business, Permits, Taxation"
                  disabled={isSubmitting}
                  {...register('category')}
                />
                {errors.category && (
                  <p className="text-sm text-red-500">{errors.category.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Creating...' : 'Create Service'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Template Selection */}
        {mode === 'template' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="h-8 w-8"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>Choose a Template</DialogTitle>
              </div>
              <DialogDescription>
                Select a template to get started quickly. Templates come with
                pre-configured forms and workflows.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {/* Error display */}
              {error && (
                <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <TemplateGallery
                onSelectTemplate={onSelectTemplate}
                selectedTemplateId={selectedTemplateId}
                isCreating={isSubmitting}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

'use client';

/**
 * Form Editor Page
 *
 * Displays and allows editing of form fields within a form.
 * Story 3.4: Add Form Fields
 */

import { Suspense, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

import {
  AppShell,
  CollapsibleSidebar,
  Header,
  SkipLinks,
} from '@/components';
import { FieldList } from '@/components/form-fields';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useForm } from '@/hooks/use-forms';
import { useService } from '@/hooks/use-services';
import type { FormType } from '@/lib/api/forms';

const formTypeLabels: Record<FormType, string> = {
  APPLICANT: 'Applicant Form',
  GUIDE: 'Guide Form',
};

const formTypeBadgeVariants: Record<FormType, 'default' | 'secondary'> = {
  APPLICANT: 'default',
  GUIDE: 'secondary',
};

interface FormEditorContentProps {
  serviceId: string;
  formId: string;
}

function FormEditorContent({ serviceId, formId }: FormEditorContentProps) {
  const router = useRouter();
  const { data: form, isLoading: formLoading, isError: formError, error: formErr } = useForm(formId);
  const { data: service, isLoading: serviceLoading } = useService(serviceId);

  const isLoading = formLoading || serviceLoading;

  if (isLoading) {
    return <FormEditorSkeleton />;
  }

  if (formError || !form) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-red-600">
          Failed to load form
        </p>
        <p className="mt-1 text-sm text-black/50">
          {formErr?.message || 'Form not found'}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(`/services/${serviceId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Service
        </Button>
      </div>
    );
  }

  const isEditable = service?.status === 'DRAFT';

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="border-b border-black/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-black/60" />
              <h1 className="text-2xl font-medium tracking-tight text-black">
                {form.name}
              </h1>
              <Badge variant={formTypeBadgeVariants[form.type]}>
                {formTypeLabels[form.type]}
              </Badge>
            </div>
            {service && (
              <p className="mt-2 text-sm text-black/60">
                Part of service: <span className="font-medium">{service.name}</span>
              </p>
            )}
          </div>
          <Button variant="outline" asChild>
            <Link href={`/services/${serviceId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Service
            </Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {!isEditable && (
          <div className="mb-6 rounded-md bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm text-amber-800">
              This form belongs to a <strong>{service?.status?.toLowerCase()}</strong> service
              and cannot be edited.
            </p>
          </div>
        )}

        <FieldList formId={formId} isEditable={isEditable} />
      </div>
    </div>
  );
}

function FormEditorSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-black/10 px-8 py-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-slate-100" />
            <div className="h-8 w-64 bg-slate-100" />
            <div className="h-6 w-24 bg-slate-100" />
          </div>
          <div className="mt-2">
            <div className="h-4 w-48 bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="px-8 py-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-16 bg-slate-100" />
              <div className="h-4 w-64 bg-slate-100" />
            </div>
            <div className="h-10 w-28 bg-slate-100" />
          </div>
          <div className="h-64 w-full bg-slate-100 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ serviceId: string; formId: string }>;
}

export default function FormEditorPage({ params }: PageProps) {
  const { serviceId, formId } = use(params);

  return (
    <>
      <SkipLinks />
      <Suspense
        fallback={
          <AppShell
            sidebar={<CollapsibleSidebar />}
            header={
              <Header
                breadcrumbs={[
                  { label: 'Home', href: '/' },
                  { label: 'Services', href: '/services' },
                  { label: 'Service', href: `/services/${serviceId}` },
                  { label: 'Form', current: true },
                ]}
                title="Form Editor"
              />
            }
          >
            <FormEditorSkeleton />
          </AppShell>
        }
      >
        <AppShell
          sidebar={<CollapsibleSidebar />}
          header={
            <Header
              breadcrumbs={[
                { label: 'Home', href: '/' },
                { label: 'Services', href: '/services' },
                { label: 'Service', href: `/services/${serviceId}` },
                { label: 'Form Editor', current: true },
              ]}
              title="Form Editor"
            />
          }
        >
          <FormEditorContent serviceId={serviceId} formId={formId} />
        </AppShell>
      </Suspense>
    </>
  );
}

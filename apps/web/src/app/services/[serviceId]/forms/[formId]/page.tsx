'use client';

/**
 * Form Editor Page
 *
 * Displays and allows editing of form fields within a form.
 * Story 3.4: Add Form Fields
 * Story 3.5: Configure Field Properties
 * Story 3.8: Form Preview Rendering
 */

import { Suspense, use, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Eye, EyeOff } from 'lucide-react';

import {
  AppShell,
  CollapsibleSidebar,
  Header,
  SkipLinks,
} from '@/components';
import {
  SectionList,
  FieldPropertiesPanel,
  SectionPropertiesPanel,
} from '@/components/form-fields';
import { FormPreview } from '@/components/form-preview';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useForm } from '@/hooks/use-forms';
import { useService } from '@/hooks/use-services';
import { useFormFields } from '@/hooks/use-form-fields';
import { useFormSections } from '@/hooks/use-form-sections';
import type { FormType, FormField, FormSection } from '@/lib/api/forms';

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
  const { data: fieldsData, refetch: refetchFields } = useFormFields(formId, { isActive: true });
  const { data: sectionsData, refetch: refetchSections } = useFormSections(formId, { isActive: true });
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [selectedSection, setSelectedSection] = useState<FormSection | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFieldSelect = useCallback((field: FormField | null) => {
    setSelectedField(field);
    if (field) {
      setSelectedSection(null);
    }
  }, []);

  const handleSectionSelect = useCallback((section: FormSection | null) => {
    setSelectedSection(section);
    if (section) {
      setSelectedField(null);
    }
  }, []);

  const handleCloseProperties = useCallback(() => {
    setSelectedField(null);
    setSelectedSection(null);
  }, []);

  const handleTogglePreview = useCallback(() => {
    setShowPreview((prev) => !prev);
    // Close properties panels when opening preview
    if (!showPreview) {
      setSelectedField(null);
      setSelectedSection(null);
    }
  }, [showPreview]);

  const handleRefreshPreview = useCallback(() => {
    refetchFields();
    refetchSections();
  }, [refetchFields, refetchSections]);

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

  const hasPropertiesPanel = selectedField || selectedSection;
  const hasRightPanel = hasPropertiesPanel || showPreview;

  // Get fields and sections for preview
  const fields = fieldsData?.data || [];
  const sections = sectionsData?.data || [];

  return (
    <div className="flex min-h-screen bg-white">
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-200 ${hasRightPanel ? (showPreview ? 'mr-[500px]' : 'mr-[400px]') : ''}`}>
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
            <div className="flex items-center gap-2">
              <Button
                variant={showPreview ? 'default' : 'outline'}
                onClick={handleTogglePreview}
              >
                {showPreview ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </>
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/services/${serviceId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Service
                </Link>
              </Button>
            </div>
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

          <SectionList
            formId={formId}
            isEditable={isEditable}
            selectedFieldId={selectedField?.id}
            selectedSectionId={selectedSection?.id}
            onFieldSelect={handleFieldSelect}
            onSectionSelect={handleSectionSelect}
          />
        </div>
      </div>

      {/* Field Properties Panel - Slides in from right */}
      {selectedField && isEditable && !showPreview && (
        <div className="fixed right-0 top-0 h-full w-[400px] shadow-lg animate-in slide-in-from-right duration-200">
          <FieldPropertiesPanel
            field={selectedField}
            formId={formId}
            onClose={handleCloseProperties}
          />
        </div>
      )}

      {/* Section Properties Panel - Slides in from right */}
      {selectedSection && isEditable && !showPreview && (
        <div className="fixed right-0 top-0 h-full w-[400px] shadow-lg animate-in slide-in-from-right duration-200">
          <SectionPropertiesPanel
            section={selectedSection}
            formId={formId}
            onClose={handleCloseProperties}
          />
        </div>
      )}

      {/* Form Preview Panel - Slides in from right */}
      {showPreview && form && (
        <div className="fixed right-0 top-0 h-full w-[500px] shadow-lg animate-in slide-in-from-right duration-200">
          <FormPreview
            form={form}
            fields={fields}
            sections={sections}
            onRefresh={handleRefreshPreview}
          />
        </div>
      )}
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

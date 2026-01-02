'use client';

/**
 * Service Detail Page
 *
 * Displays and allows editing of service metadata, registrations, and forms.
 * Story 2.4: Edit Service Metadata
 * Story 2.10: Registration CRUD within Service
 * Story 3.2: Create Applicant Form
 * Story 6-2: AI Agent Chat Integration (Demo)
 */

import { Suspense, use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Bot } from 'lucide-react';

import {
  AppShell,
  CollapsibleSidebar,
  Header,
  SkipLinks,
} from '@/components';
import { ServiceMetadataForm } from '@/components/services/ServiceMetadataForm';
import { RegistrationList } from '@/components/registrations';
import { FormList } from '@/components/forms';
import { RolesList, TransitionsList, WorkflowDiagram, ValidationPanel } from '@/components/workflow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useService } from '@/hooks/use-services';
import { ChatSidebar } from '@/components/ai-agent';

const statusVariantMap = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

const statusLabelMap = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
} as const;

function formatTimestamp(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
  } catch {
    return 'Unknown';
  }
}

interface ServiceDetailContentProps {
  serviceId: string;
}

function ServiceDetailContent({ serviceId }: ServiceDetailContentProps) {
  const router = useRouter();
  const { data: service, isLoading, isError, error } = useService(serviceId);
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (isLoading) {
    return <ServiceDetailSkeleton />;
  }

  if (isError || !service) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-red-600">
          Failed to load service
        </p>
        <p className="mt-1 text-sm text-black/50">
          {error?.message || 'Service not found'}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/services')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Services
        </Button>
      </div>
    );
  }

  const isEditable = service.status === 'DRAFT';

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="border-b border-black/10 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-medium tracking-tight text-black">
                {service.name}
              </h1>
              <Badge variant={statusVariantMap[service.status]}>
                {statusLabelMap[service.status]}
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-black/60">
              <span>Created: {formatTimestamp(service.createdAt)}</span>
              <span>Last modified: {formatTimestamp(service.updatedAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              onClick={() => setIsChatOpen(true)}
              className="gap-2"
            >
              <Bot className="h-4 w-4" />
              AI Assistant
            </Button>
            <Button variant="outline" asChild>
              <Link href="/services">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Services
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
              This service is <strong>{statusLabelMap[service.status].toLowerCase()}</strong> and cannot be edited.
              {service.status === 'PUBLISHED' && (
                <span> Future versions will support creating draft copies for modifications.</span>
              )}
            </p>
          </div>
        )}

        <ServiceMetadataForm
          service={service}
          isEditable={isEditable}
        />

        {/* Registrations Section */}
        <div className="mt-8 border-t border-black/10 pt-8">
          <RegistrationList serviceId={serviceId} isEditable={isEditable} />
        </div>

        {/* Forms Section */}
        <div className="mt-8 border-t border-black/10 pt-8">
          <FormList serviceId={serviceId} isEditable={isEditable} />
        </div>

        {/* Workflow Steps Section */}
        <div className="mt-8 border-t border-black/10 pt-8">
          <RolesList serviceId={serviceId} isEditable={isEditable} />
        </div>

        {/* Workflow Transitions Section */}
        <div className="mt-8 border-t border-black/10 pt-8">
          <TransitionsList serviceId={serviceId} isEditable={isEditable} />
        </div>

        {/* Workflow Diagram Section */}
        <div className="mt-8 border-t border-black/10 pt-8">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-black">Workflow Diagram</h2>
            <p className="text-sm text-black/60">
              Visual representation of workflow roles and transitions
            </p>
          </div>
          <WorkflowDiagram serviceId={serviceId} />
        </div>

        {/* Workflow Validation Section */}
        <div className="mt-8 border-t border-black/10 pt-8">
          <ValidationPanel serviceId={serviceId} />
        </div>
      </div>

      {/* AI Agent Chat Sidebar */}
      <ChatSidebar
        serviceId={serviceId}
        userId="demo-user"
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
    </div>
  );
}

function ServiceDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-black/10 px-8 py-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-8 w-64 bg-slate-100" />
            <div className="h-6 w-16 bg-slate-100" />
          </div>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-4 w-40 bg-slate-100" />
            <div className="h-4 w-40 bg-slate-100" />
          </div>
        </div>
      </div>
      <div className="px-8 py-6">
        <div className="animate-pulse space-y-6">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-slate-100" />
            <div className="h-10 w-full max-w-md bg-slate-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-24 bg-slate-100" />
            <div className="h-24 w-full max-w-md bg-slate-100" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-16 bg-slate-100" />
            <div className="h-10 w-full max-w-md bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{ serviceId: string }>;
}

export default function ServiceDetailPage({ params }: PageProps) {
  const { serviceId } = use(params);

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
                  { label: 'Loading...', current: true },
                ]}
                title="Service Details"
              />
            }
          >
            <ServiceDetailSkeleton />
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
                { label: 'Details', current: true },
              ]}
              title="Service Details"
            />
          }
        >
          <ServiceDetailContent serviceId={serviceId} />
        </AppShell>
      </Suspense>
    </>
  );
}

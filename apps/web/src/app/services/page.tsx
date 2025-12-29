'use client';

/**
 * Services List Page
 *
 * Displays all services with search, filter, and pagination.
 * Story 2.3: Service List with Search & Filter
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AppShell,
  CollapsibleSidebar,
  Header,
  SkipLinks,
} from '@/components';
import {
  SearchBar,
  StatusFilter,
  ServiceTable,
  Pagination,
  CreateServiceDialog,
} from '@/components/services';
import { Button } from '@/components/ui/button';
import { useServices, type ServiceStatus } from '@/hooks/use-services';
import { Plus } from 'lucide-react';
import * as React from 'react';
import type { Service } from '@/lib/api/services';

const ITEMS_PER_PAGE = 20;

function ServicesContent() {
  const searchParams = useSearchParams();
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);

  // Extract query params with validation
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const search = searchParams.get('search') || undefined;
  const statusParam = searchParams.get('status');
  const status = statusParam && statusParam !== 'ALL'
    ? (statusParam as ServiceStatus)
    : undefined;

  // Fetch services with React Query
  const { data, isLoading, isError, error } = useServices({
    page,
    limit: ITEMS_PER_PAGE,
    search,
    status,
  });

  const handleServiceCreated = (service: Service) => {
    console.log('Service created:', service);
    // React Query will auto-refetch due to cache invalidation in the mutation
  };

  const services = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <>
      <AppShell
        sidebar={<CollapsibleSidebar />}
        header={
          <Header
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Services', current: true },
            ]}
            title="Services"
          />
        }
      >
        <div className="min-h-screen bg-white">
          {/* Page Header */}
          <div className="border-b border-black/10 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-medium tracking-tight text-black">
                  Services
                </h1>
                <p className="mt-1 text-sm text-black/60">
                  Manage and configure government services
                </p>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Service
              </Button>
            </div>

            {/* Filters Row */}
            <div className="mt-6 flex items-center gap-4">
              <SearchBar className="w-80" />
              <StatusFilter />
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            {isError ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <p className="text-lg font-medium text-red-600">
                  Failed to load services
                </p>
                <p className="mt-1 text-sm text-black/50">
                  {error?.message || 'Please try again later'}
                </p>
              </div>
            ) : (
              <>
                <ServiceTable services={services} isLoading={isLoading} />

                {/* Pagination */}
                {!isLoading && total > 0 && (
                  <div className="mt-6 border-t border-black/10 pt-6">
                    <Pagination total={total} perPage={ITEMS_PER_PAGE} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </AppShell>

      <CreateServiceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleServiceCreated}
      />
    </>
  );
}

export default function ServicesPage() {
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
                  { label: 'Services', current: true },
                ]}
                title="Services"
              />
            }
          >
            <div className="min-h-screen bg-white px-8 py-6">
              <div className="animate-pulse">
                <div className="h-8 w-48 bg-slate-100" />
                <div className="mt-2 h-4 w-64 bg-slate-100" />
              </div>
            </div>
          </AppShell>
        }
      >
        <ServicesContent />
      </Suspense>
    </>
  );
}

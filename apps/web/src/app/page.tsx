'use client';

import {
  AppShell,
  CollapsibleSidebar,
  Header,
  SplitPanel,
  SkipLinks,
} from '@/components';

/**
 * Home page demonstrating the shell layout system.
 *
 * This page integrates all shell components:
 * - AppShell: Main layout container with responsive grid
 * - CollapsibleSidebar: Navigation sidebar (64px/240px)
 * - Header: Top bar with breadcrumbs
 * - SplitPanel: Resizable content panels
 * - SkipLinks: Accessibility navigation
 */
export default function Home() {
  return (
    <>
      <SkipLinks />
      <AppShell
        sidebar={<CollapsibleSidebar />}
        header={
          <Header
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Dashboard', current: true },
            ]}
            title="Dashboard"
          />
        }
      >
        <SplitPanel
          leftPanelHeader={
            <h2 className="text-sm font-medium text-muted-foreground">
              Services
            </h2>
          }
          rightPanelHeader={
            <h2 className="text-sm font-medium text-muted-foreground">
              Service Designer
            </h2>
          }
          leftPanel={
            <div className="p-4">
              <div className="space-y-3">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <h3 className="font-medium">Business Registration</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Register new businesses with AI-assisted form generation.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <h3 className="font-medium">Import/Export Permits</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage trade permits and documentation.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-4">
                  <h3 className="font-medium">Tax Registration</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Process tax registration and compliance.
                  </p>
                </div>
              </div>
            </div>
          }
          rightPanel={
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="max-w-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                  <svg
                    className="h-8 w-8 text-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold">Select a Service</h2>
                <p className="mt-2 text-muted-foreground">
                  Choose a service from the list to view its configuration and
                  design forms using AI assistance.
                </p>
              </div>
            </div>
          }
        />
      </AppShell>
    </>
  );
}

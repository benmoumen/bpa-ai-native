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
            <div className="p-8 bg-white min-h-screen">
               <div className="mb-10 pb-4 border-b border-black/10">
                  <h1 className="text-3xl font-light tracking-tight text-black">Services</h1>
                  <p className="mt-2 text-muted-foreground font-light">Manage and create government services.</p>
               </div>

              <div className="grid grid-cols-1 gap-px bg-border border border-border">
                <div className="block bg-white p-8 hover:bg-slate-50 transition-colors cursor-default group">
                    <div className="flex items-start gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-black text-white">
                         <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-xl font-medium text-black group-hover:underline decoration-1 underline-offset-4">New Service</h3>
                        <p className="mt-2 text-base text-muted-foreground font-light leading-relaxed">
                          Start a new configuration process.
                        </p>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                         <svg className="h-6 w-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                         </svg>
                      </div>
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground border-y border-border">
                    Recent
                </div>

                <div className="block bg-white p-8 hover:bg-slate-50 transition-colors cursor-default group">
                    <div className="flex items-start gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-black/10 text-black">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-xl font-medium text-black group-hover:underline decoration-1 underline-offset-4">Business Registration</h3>
                        <p className="mt-2 text-base text-muted-foreground font-light leading-relaxed">
                          LLC and Corp registration flows.
                        </p>
                      </div>
                    </div>
                </div>

                <div className="block bg-white p-8 hover:bg-slate-50 transition-colors cursor-default group">
                    <div className="flex items-start gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-black/10 text-black">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-xl font-medium text-black group-hover:underline decoration-1 underline-offset-4">Import/Export Permits</h3>
                        <p className="mt-2 text-base text-muted-foreground font-light leading-relaxed">
                          Cross-border trade documentation.
                        </p>
                      </div>
                    </div>
                </div>

                <div className="block bg-white p-8 hover:bg-slate-50 transition-colors cursor-default group">
                    <div className="flex items-start gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-black/10 text-black">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-xl font-medium text-black group-hover:underline decoration-1 underline-offset-4">Tax Registration</h3>
                        <p className="mt-2 text-base text-muted-foreground font-light leading-relaxed">
                          Fiscal compliance and reporting.
                        </p>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          }
          rightPanel={
            <div className="grid h-full place-content-center bg-gradient-to-br from-slate-50/50 to-white p-6">
              <div className="w-80 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 shadow-sm">
                  <svg
                    className="h-10 w-10 text-accent"
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
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Select a Service</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  Choose a service from the list to view its configuration and design forms using AI assistance.
                </p>
                <div className="mt-8 inline-flex flex-col gap-3 text-sm text-muted-foreground/70">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>AI-powered form generation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Real-time collaboration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Version control built-in</span>
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </AppShell>
    </>
  );
}

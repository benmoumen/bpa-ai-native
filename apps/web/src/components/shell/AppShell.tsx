'use client';

import { ReactNode, useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';

// Helper to get initial breakpoint values (SSR-safe)
function getInitialBreakpoints() {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false };
  }
  const width = window.innerWidth;
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
  };
}

interface AppShellProps {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * AppShell - Main application layout container
 *
 * Implements the three-region layout:
 * - Fixed sidebar (collapsible, 64px/240px)
 * - Fixed header (64px height)
 * - Scrollable main content area
 *
 * Responsive breakpoints:
 * - Mobile (<768px): Sidebar hidden, hamburger menu
 * - Tablet (768-1024px): Collapsed sidebar only
 * - Desktop (>1024px): Full expandable sidebar
 *
 * Uses CSS Grid for layout with ARIA landmarks for accessibility.
 */
export function AppShell({ sidebar, header, children, className }: AppShellProps) {
  const { sidebarExpanded, sidebarHoverExpanded } = useUIStore();
  const initialBreakpoints = getInitialBreakpoints();
  const [isMobile, setIsMobile] = useState(initialBreakpoints.isMobile);
  const [isTablet, setIsTablet] = useState(initialBreakpoints.isTablet);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const wasMobileRef = useRef(initialBreakpoints.isMobile);

  // Memoized handler to check breakpoints and close menu on resize to desktop
  const checkBreakpoints = useCallback(() => {
    const width = window.innerWidth;
    const nowMobile = width < 768;
    const nowTablet = width >= 768 && width < 1024;

    // Close mobile menu when transitioning from mobile to non-mobile
    if (wasMobileRef.current && !nowMobile) {
      setMobileMenuOpen(false);
    }

    wasMobileRef.current = nowMobile;
    setIsMobile(nowMobile);
    setIsTablet(nowTablet);
  }, []);

  // Responsive breakpoint detection via resize event listener (callback only)
  useEffect(() => {
    window.addEventListener('resize', checkBreakpoints);
    return () => window.removeEventListener('resize', checkBreakpoints);
  }, [checkBreakpoints]);

  // Determine sidebar visibility
  const showSidebar = !isMobile || mobileMenuOpen;
  const isExpanded = isTablet ? false : sidebarExpanded || sidebarHoverExpanded;

  return (
    <div
      className={cn(
        'grid min-h-screen',
        'grid-rows-[var(--header-height)_1fr]',
        // Mobile: no sidebar column
        isMobile && 'grid-cols-[1fr]',
        // Tablet: collapsed sidebar only
        isTablet && 'grid-cols-[var(--sidebar-width-collapsed)_1fr]',
        // Desktop: expandable sidebar
        !isMobile &&
          !isTablet &&
          (isExpanded
            ? 'grid-cols-[var(--sidebar-width-expanded)_1fr]'
            : 'grid-cols-[var(--sidebar-width-collapsed)_1fr]'),
        'transition-[grid-template-columns] duration-200 ease-in-out',
        className
      )}
    >
      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - spans full height */}
      {showSidebar && (
        <aside
          id="main-navigation"
          className={cn(
            'row-span-2 overflow-hidden',
            // Mobile: fixed overlay sidebar
            isMobile && 'fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width-expanded)]',
            // Tablet/Desktop: in grid
            !isMobile && 'relative'
          )}
          role="navigation"
          aria-label="Main navigation"
        >
          {sidebar}
        </aside>
      )}

      {/* Header - fixed at top */}
      <header
        className={cn(
          'sticky top-0 z-40 border-b border-border bg-background',
          // On mobile, span full width
          isMobile && 'col-span-full'
        )}
        role="banner"
      >
        {/* Mobile menu toggle */}
        {isMobile && (
          <button
            type="button"
            className="absolute left-4 top-1/2 z-50 -translate-y-1/2 rounded-lg p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        )}
        {header}
      </header>

      {/* Main content area */}
      <main
        id="main-content"
        className={cn(
          'overflow-auto',
          // On mobile, span full width
          isMobile && 'col-span-full'
        )}
        role="main"
        aria-label="Main content"
        tabIndex={-1}
      >
        {children}
      </main>
    </div>
  );
}

'use client';

import { ReactNode, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  href: string;
}

interface CollapsibleSidebarProps {
  logo?: ReactNode;
  navItems?: NavItem[];
  bottomItems?: NavItem[];
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { id: 'home', label: 'Dashboard', icon: <Home size={20} />, href: '/' },
  { id: 'services', label: 'Services', icon: <FileText size={20} />, href: '/services' },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} />, href: '/settings' },
];

const defaultBottomItems: NavItem[] = [
  { id: 'help', label: 'Help & Support', icon: <HelpCircle size={20} />, href: '/help' },
];

/**
 * CollapsibleSidebar - Expandable/collapsible navigation sidebar
 *
 * Updated with Next.js Link integration and premium "Trust Blue" / Dark Slate aesthetics.
 */
export function CollapsibleSidebar({
  logo,
  navItems = defaultNavItems,
  bottomItems = defaultBottomItems,
  className,
}: CollapsibleSidebarProps) {
  const pathname = usePathname();
  const {
    sidebarExpanded,
    sidebarHoverExpanded,
    toggleSidebar,
    setSidebarHoverExpanded,
  } = useUIStore();

  const isExpanded = sidebarExpanded || sidebarHoverExpanded;

  const handleMouseEnter = useCallback(() => {
    if (!sidebarExpanded) {
      setSidebarHoverExpanded(true);
    }
  }, [sidebarExpanded, setSidebarHoverExpanded]);

  const handleMouseLeave = useCallback(() => {
    setSidebarHoverExpanded(false);
  }, [setSidebarHoverExpanded]);

  // Determine active state based on current path
  const isActive = (href: string) => {
    if (href === '/' && pathname !== '/') return false;
    return pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col text-sidebar-foreground',
        'bg-sidebar-background border-r border-sidebar-border',
        'transition-[width] duration-300 cubic-bezier(0.4, 0, 0.2, 1)',
        'shadow-sidebar z-50',
        isExpanded ? 'w-[var(--sidebar-width-expanded)]' : 'w-[var(--sidebar-width-collapsed)]',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo Section - Swiss Text */ }
      <div className="flex h-[var(--header-height)] items-center px-6 border-b border-border bg-white">
        {logo || (
          <Link href="/" className="flex items-center gap-3 overflow-hidden group">
            {/* Simple geometric logo */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-black text-white">
              <span className="text-xl font-bold tracking-tight">BP</span>
            </div>
            {isExpanded && (
              <div className="flex flex-col justify-center">
                 <span className="whitespace-nowrap text-lg font-bold tracking-tight text-black leading-none">
                    BPA Designer
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                    Government AI
                  </span>
              </div>
            )}
          </Link>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-8" aria-label="Primary navigation">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex w-full items-center gap-6 px-6 py-4 group border-l-4',
                    'transition-colors duration-150',
                    active
                      ? 'border-black bg-sidebar-accent text-black font-semibold'
                      : 'border-transparent text-sidebar-foreground/70 hover:text-black hover:bg-sidebar-accent/50',
                    !isExpanded && 'justify-center px-0 border-l-0'
                  )}
                  title={!isExpanded ? item.label : undefined}
                >
                  <span className={cn("shrink-0", active && "text-black")}>
                    {item.icon}
                  </span>
                  {isExpanded && (
                    <span className="truncate text-base tracking-tight font-medium">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border py-4 bg-white">
        <ul className="space-y-1">
          {bottomItems.map((item) => (
             <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  'flex w-full items-center gap-6 px-6 py-4',
                  'transition-colors duration-150',
                  'text-sidebar-foreground/60 hover:text-black hover:bg-sidebar-accent/50',
                   !isExpanded && 'justify-center px-0'
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {isExpanded && (
                  <span className="truncate text-sm font-medium">
                    {item.label}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Toggle Button - Minimalist Arrow */}
        <div className="mt-4 px-6 pb-6">
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              'flex w-full items-center gap-4 py-2',
              'transition-colors duration-150',
              'text-sidebar-foreground/40 hover:text-black',
               !isExpanded && 'justify-center'
            )}
            aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarExpanded}
          >
            <span className="shrink-0">
              {sidebarExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </span>
            {isExpanded && (
              <span className="truncate text-xs uppercase tracking-widest font-bold">
                {sidebarExpanded ? 'Collapse' : 'Expand'}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

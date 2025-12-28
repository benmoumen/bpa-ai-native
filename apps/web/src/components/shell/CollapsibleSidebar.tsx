'use client';

import { ReactNode, useState, useCallback } from 'react';
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
  href?: string;
  onClick?: () => void;
}

interface CollapsibleSidebarProps {
  logo?: ReactNode;
  navItems?: NavItem[];
  bottomItems?: NavItem[];
  className?: string;
}

const defaultNavItems: NavItem[] = [
  { id: 'home', label: 'Dashboard', icon: <Home size={20} /> },
  { id: 'services', label: 'Services', icon: <FileText size={20} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
];

const defaultBottomItems: NavItem[] = [
  { id: 'help', label: 'Help & Support', icon: <HelpCircle size={20} /> },
];

/**
 * CollapsibleSidebar - Expandable/collapsible navigation sidebar
 *
 * Features:
 * - Toggle between 64px (collapsed) and 240px (expanded)
 * - Hover-to-expand functionality when collapsed
 * - Keyboard accessible toggle button
 * - Smooth transition animations
 * - Icon-only mode when collapsed with tooltips
 */
export function CollapsibleSidebar({
  logo,
  navItems = defaultNavItems,
  bottomItems = defaultBottomItems,
  className,
}: CollapsibleSidebarProps) {
  const {
    sidebarExpanded,
    sidebarHoverExpanded,
    toggleSidebar,
    setSidebarHoverExpanded,
    activeNavItem,
    setActiveNavItem,
  } = useUIStore();

  const [, setFocusedItem] = useState<string | null>(null);

  const isExpanded = sidebarExpanded || sidebarHoverExpanded;

  const handleMouseEnter = useCallback(() => {
    if (!sidebarExpanded) {
      setSidebarHoverExpanded(true);
    }
  }, [sidebarExpanded, setSidebarHoverExpanded]);

  const handleMouseLeave = useCallback(() => {
    setSidebarHoverExpanded(false);
  }, [setSidebarHoverExpanded]);

  const handleNavClick = useCallback(
    (item: NavItem) => {
      setActiveNavItem(item.id);
      item.onClick?.();
    },
    [setActiveNavItem]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, item: NavItem) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNavClick(item);
      }
    },
    [handleNavClick]
  );

  return (
    <div
      className={cn(
        'flex h-full flex-col text-sidebar-foreground',
        'bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950',
        'transition-[width] duration-200 ease-in-out',
        'shadow-[2px_0_8px_-2px_rgba(0,0,0,0.1)]',
        isExpanded ? 'w-[var(--sidebar-width-expanded)]' : 'w-[var(--sidebar-width-collapsed)]',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Logo Section */}
      <div className="flex h-[var(--header-height)] items-center justify-center border-b border-white/10 px-3">
        {logo || (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25">
              <span className="text-sm font-bold tracking-tight">BP</span>
            </div>
            {isExpanded && (
              <span className="whitespace-nowrap text-base font-semibold tracking-tight text-white">
                BPA Designer
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-4" aria-label="Primary navigation">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleNavClick(item)}
                onKeyDown={(e) => handleKeyDown(e, item)}
                onFocus={() => setFocusedItem(item.id)}
                onBlur={() => setFocusedItem(null)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5',
                  'transition-all duration-150',
                  'hover:bg-white/10',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
                  activeNavItem === item.id && 'bg-white/15 text-white shadow-sm',
                  activeNavItem !== item.id && 'text-slate-300',
                  !isExpanded && 'justify-center'
                )}
                aria-current={activeNavItem === item.id ? 'page' : undefined}
                title={!isExpanded ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {isExpanded && (
                  <span className="truncate text-sm font-medium">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/10 py-4">
        <ul className="space-y-1 px-2">
          {bottomItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => handleNavClick(item)}
                onKeyDown={(e) => handleKeyDown(e, item)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5',
                  'transition-all duration-150',
                  'text-slate-400 hover:text-slate-200 hover:bg-white/10',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
                  !isExpanded && 'justify-center'
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {isExpanded && (
                  <span className="truncate text-sm font-medium">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Toggle Button */}
        <div className="mt-2 px-2">
          <button
            type="button"
            onClick={toggleSidebar}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5',
              'transition-all duration-150',
              'text-slate-500 hover:text-slate-300 hover:bg-white/5',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50',
              !isExpanded && 'justify-center'
            )}
            aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-expanded={sidebarExpanded}
          >
            <span className="shrink-0">
              {sidebarExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </span>
            {isExpanded && (
              <span className="truncate text-sm font-medium">
                {sidebarExpanded ? 'Collapse' : 'Expand'}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

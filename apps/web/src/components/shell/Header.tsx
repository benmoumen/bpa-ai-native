'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, Bell, User, Sun, Moon, Monitor } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';

interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  actions?: ReactNode;
  logo?: ReactNode;
  className?: string;
}

const ThemeIcon = ({ theme }: { theme: 'light' | 'dark' | 'system' }) => {
  switch (theme) {
    case 'light':
      return <Sun size={20} className="text-muted-foreground" />;
    case 'dark':
      return <Moon size={20} className="text-muted-foreground" />;
    case 'system':
      return <Monitor size={20} className="text-muted-foreground" />;
  }
};

/**
 * Header - Application header with breadcrumb navigation
 *
 * Features:
 * - Optional logo/brand mark slot
 * - Dynamic breadcrumb trail
 * - Page title display
 * - Theme toggle button (light/dark/system)
 * - Action buttons area (right side)
 * - Notification and user menu placeholders
 * - Accessible navigation with ARIA breadcrumb
 */
export function Header({
  breadcrumbs = [],
  title,
  actions,
  logo,
  className,
}: HeaderProps) {
  const { theme, cycleTheme } = useUIStore();

  return (
    <div
      className={cn(
        'flex h-full items-center justify-between px-6',
        'bg-white/80 backdrop-blur-sm',
        className
      )}
    >
      {/* Left Section - Logo, Breadcrumbs and Title */}
      <div className="flex items-center gap-4">
        {/* Logo/Brand Mark Slot */}
        {logo && <div className="shrink-0">{logo}</div>}

        <div className="flex flex-col justify-center">
        {/* Breadcrumb Navigation */}
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-1">
            <ol className="flex items-center gap-1 text-sm text-muted-foreground">
              {breadcrumbs.map((item, index) => (
                <li key={item.label} className="flex items-center gap-1">
                  {index > 0 && (
                    <ChevronRight
                      size={14}
                      className="text-muted-foreground/50"
                      aria-hidden="true"
                    />
                  )}
                  {item.current ? (
                    <span
                      className="font-medium text-foreground"
                      aria-current="page"
                    >
                      {item.label}
                    </span>
                  ) : item.href ? (
                    <a
                      href={item.href}
                      className="hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Page Title */}
        {title && (
          <h1 className="text-xl font-semibold text-foreground tracking-tight">{title}</h1>
        )}
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-4">
        {/* Custom Actions */}
        {actions}

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={cycleTheme}
          className={cn(
            'rounded-lg p-2',
            'hover:bg-muted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          aria-label={`Current theme: ${theme}. Click to change.`}
          title={`Theme: ${theme}`}
        >
          <ThemeIcon theme={theme} />
        </button>

        {/* Notifications */}
        <button
          type="button"
          className={cn(
            'relative rounded-lg p-2',
            'hover:bg-muted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          aria-label="Notifications"
        >
          <Bell size={20} className="text-muted-foreground" />
          {/* Notification badge placeholder */}
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-accent" />
        </button>

        {/* User Menu */}
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-lg p-2',
            'hover:bg-muted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          aria-label="User menu"
          aria-haspopup="menu"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
            <User size={16} className="text-muted-foreground" />
          </div>
        </button>
      </div>
    </div>
  );
}

'use client';

import { cn } from '@/lib/utils';

interface SkipLink {
  id: string;
  label: string;
  target: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

const defaultLinks: SkipLink[] = [
  { id: 'skip-main', label: 'Skip to main content', target: '#main-content' },
  { id: 'skip-nav', label: 'Skip to navigation', target: '#main-navigation' },
  { id: 'skip-chat', label: 'Skip to chat', target: '#chat-area' },
];

/**
 * SkipLinks - Accessibility skip links for keyboard navigation
 *
 * Features:
 * - Hidden until focused
 * - Allows keyboard users to skip repetitive content
 * - Links to main content, navigation, and chat area
 * - WCAG 2.1 AA compliant
 */
export function SkipLinks({ links = defaultLinks, className }: SkipLinksProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    e.preventDefault();
    const element = document.querySelector(target);
    if (element) {
      // Set focus to the target element
      (element as HTMLElement).focus();
      // Scroll into view
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={cn('skip-links-container', className)}>
      {links.map((link) => (
        <a
          key={link.id}
          id={link.id}
          href={link.target}
          onClick={(e) => handleClick(e, link.target)}
          className={cn(
            'skip-link',
            'fixed left-0 top-0 z-[9999]',
            'transform -translate-y-full',
            'bg-accent text-accent-foreground',
            'px-4 py-2 text-sm font-medium',
            'rounded-br-lg',
            'focus:translate-y-0',
            'transition-transform duration-200 ease-in-out',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
          )}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

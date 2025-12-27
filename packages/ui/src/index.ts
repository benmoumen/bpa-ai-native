/**
 * @bpa/ui - Shared React components
 *
 * This package exports reusable UI components for the BPA AI-Native platform.
 *
 * Usage:
 * import { Button } from '@bpa/ui';
 */

// Component props types for future components
export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

// Placeholder - components will be added in subsequent stories
export const UI_VERSION = '0.0.1' as const;

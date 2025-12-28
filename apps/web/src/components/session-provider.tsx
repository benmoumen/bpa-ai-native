'use client';

/**
 * Session Provider Component
 *
 * Wraps NextAuth SessionProvider with activity tracking
 * Must be used in the root layout
 */

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { useActivityTracker } from '@/hooks';

interface SessionProviderProps {
  children: React.ReactNode;
}

/**
 * Activity tracker component - runs inside session context
 */
function ActivityTracker({ children }: { children: React.ReactNode }) {
  // Track user activity and refresh session periodically
  useActivityTracker();
  return <>{children}</>;
}

/**
 * Session provider with activity tracking
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider>
      <ActivityTracker>{children}</ActivityTracker>
    </NextAuthSessionProvider>
  );
}

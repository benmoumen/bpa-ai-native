'use client';

/**
 * Activity Tracker Hook
 *
 * Tracks user activity and refreshes session to prevent inactivity timeout
 * NFR9: 30 minutes inactivity timeout
 */

import { useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

// How often to check for activity and refresh session (5 minutes)
const REFRESH_INTERVAL = 5 * 60 * 1000;

// Debounce delay for activity events (1 second)
const DEBOUNCE_DELAY = 1000;

/**
 * Hook to track user activity and refresh session
 * Call this hook in your root layout or main app component
 */
export function useActivityTracker() {
  const { update, status } = useSession();
  const lastActivityRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Debounced session refresh
  const refreshSession = useCallback(() => {
    if (status === 'authenticated') {
      // Update session to reset lastActivity in JWT
      update();
    }
  }, [status, update]);

  useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    // Debounced activity handler
    let debounceTimer: NodeJS.Timeout | null = null;
    const debouncedHandler = () => {
      handleActivity();
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
      }, DEBOUNCE_DELAY);
    };

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, debouncedHandler, { passive: true });
    });

    // Periodic session refresh
    timeoutRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      // Only refresh if there was recent activity
      if (timeSinceActivity < REFRESH_INTERVAL) {
        refreshSession();
      }
    }, REFRESH_INTERVAL);

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, debouncedHandler);
      });
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [status, handleActivity, refreshSession]);

  return {
    lastActivity: lastActivityRef.current,
  };
}

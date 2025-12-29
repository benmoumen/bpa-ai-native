'use client';

/**
 * ServiceSearchBar Component
 *
 * Search input with 300ms debounce for filtering services by name/description.
 * Uses URL query params for persistence.
 *
 * Pattern: URL is source of truth. Local state is only a "pending" buffer
 * while user is typing. After debounce completes, pending is cleared and
 * URL takes over again.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSyncExternalStore } from 'react';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

// Simple store for pending search value
function createPendingStore() {
  let pending: string | null = null;
  const listeners = new Set<() => void>();

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return pending;
    },
    getServerSnapshot() {
      return null;
    },
    set(value: string | null) {
      pending = value;
      listeners.forEach((l) => l());
    },
  };
}

// Module-level store instance
const pendingStore = createPendingStore();

export function SearchBar({
  className,
  placeholder = 'Search services...',
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  // Subscribe to pending store
  const pending = useSyncExternalStore(
    pendingStore.subscribe,
    pendingStore.getSnapshot,
    pendingStore.getServerSnapshot
  );

  // Displayed value: pending (if typing) or URL value
  const displayValue = pending ?? urlSearch;

  // Track debounce timer
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Push value to URL
  const pushToUrl = useCallback(
    (searchValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        params.set('search', searchValue);
        params.set('page', '1'); // Reset to first page on new search
      } else {
        params.delete('search');
      }
      router.push(`?${params.toString()}`);
      // Clear pending after pushing to URL
      pendingStore.set(null);
    },
    [router, searchParams]
  );

  const handleChange = (newValue: string) => {
    // Set pending value immediately for responsive UI
    pendingStore.set(newValue);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounce timer
    debounceTimer.current = setTimeout(() => {
      pushToUrl(newValue);
    }, 300);
  };

  const handleClear = () => {
    pendingStore.set(null);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    pushToUrl('');
  };

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        className="pl-10 pr-10"
        aria-label="Search services"
      />
      {displayValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

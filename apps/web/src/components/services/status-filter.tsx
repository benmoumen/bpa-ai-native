'use client';

/**
 * StatusFilter Component
 *
 * Dropdown filter for service status (Draft/Published/Archived).
 * Uses URL query params for persistence.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ServiceStatus } from '@/hooks/use-services';

interface StatusFilterProps {
  className?: string;
}

// 'ALL' is a UI-only filter value, not a real service status
type StatusFilterValue = ServiceStatus | 'ALL';

const statusOptions: { value: StatusFilterValue; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export function StatusFilter({ className }: StatusFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus: StatusFilterValue =
    (searchParams.get('status') as ServiceStatus) || 'ALL';

  const handleChange = (value: StatusFilterValue) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'ALL') {
      params.set('status', value);
      params.set('page', '1'); // Reset to first page on filter change
    } else {
      params.delete('status');
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <Select value={currentStatus} onValueChange={handleChange}>
      <SelectTrigger className={cn('w-[160px]', className)}>
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

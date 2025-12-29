'use client';

/**
 * ServiceTable Component
 *
 * Displays services in a table with columns for name, status, category, and last modified.
 * Swiss-style minimal design with black borders.
 */

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Service } from '@/lib/api/services';

interface ServiceTableProps {
  services: Service[];
  isLoading?: boolean;
}

const statusVariantMap = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

const statusLabelMap = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  ARCHIVED: 'Archived',
} as const;

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export function ServiceTable({ services, isLoading }: ServiceTableProps) {
  if (isLoading) {
    return <ServiceTableSkeleton />;
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-black/70">No services found</p>
        <p className="mt-1 text-sm text-black/50">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Last Modified</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => (
          <TableRow key={service.id}>
            <TableCell>
              <Link
                href={`/services/${service.id}`}
                className="font-medium text-black hover:underline focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
              >
                {service.name}
              </Link>
              {service.description && (
                <p className="mt-1 text-sm text-black/60 line-clamp-1">
                  {service.description}
                </p>
              )}
            </TableCell>
            <TableCell>
              <Badge variant={statusVariantMap[service.status]}>
                {statusLabelMap[service.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-black/70">
              {service.category || '—'}
            </TableCell>
            <TableCell className="text-black/70">
              {formatDate(service.updatedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ServiceTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Last Modified</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="h-5 w-48 animate-pulse bg-slate-100" />
              <div className="mt-1 h-4 w-64 animate-pulse bg-slate-100" />
            </TableCell>
            <TableCell>
              <div className="h-5 w-16 animate-pulse bg-slate-100" />
            </TableCell>
            <TableCell>
              <div className="h-5 w-24 animate-pulse bg-slate-100" />
            </TableCell>
            <TableCell>
              <div className="h-5 w-20 animate-pulse bg-slate-100" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

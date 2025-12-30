'use client';

/**
 * ServiceTable Component
 *
 * Displays services in a table with columns for name, status, category, last modified, and actions.
 * Swiss-style minimal design with black borders.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Pencil, Copy, Trash2, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteServiceDialog } from './DeleteServiceDialog';
import { useDuplicateService } from '@/hooks/use-services';
import type { Service } from '@/lib/api/services';

interface ServiceTableProps {
  services: Service[];
  isLoading?: boolean;
  onServiceDeleted?: () => void;
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

export function ServiceTable({
  services,
  isLoading,
  onServiceDeleted,
}: ServiceTableProps) {
  const router = useRouter();
  const rowRefs = useRef<(HTMLTableRowElement | null)[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [duplicatingServiceId, setDuplicatingServiceId] = useState<
    string | null
  >(null);

  const duplicateService = useDuplicateService();

  const handleDeleteClick = useCallback((service: Service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteSuccess = useCallback(() => {
    setServiceToDelete(null);
    onServiceDeleted?.();
  }, [onServiceDeleted]);

  const handleDuplicate = useCallback(
    async (service: Service) => {
      setDuplicatingServiceId(service.id);
      try {
        const duplicate = await duplicateService.mutateAsync(service.id);
        // Navigate to the detail page for the new duplicate (DRAFT services are editable)
        router.push(`/services/${duplicate.id}`);
      } catch {
        // Error is handled by React Query, but we could show a toast here
        setDuplicatingServiceId(null);
      }
    },
    [duplicateService, router]
  );

  // Handle keyboard navigation between rows
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTableRowElement>, index: number) => {
      const rows = rowRefs.current.filter(Boolean);
      let nextIndex: number | null = null;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = Math.min(index + 1, rows.length - 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = Math.max(index - 1, 0);
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = rows.length - 1;
          break;
      }

      if (nextIndex !== null && rows[nextIndex]) {
        rows[nextIndex]?.focus();
      }
    },
    []
  );

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
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Last Modified</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service, index) => {
            const isDraft = service.status === 'DRAFT';
            return (
              <TableRow
                key={service.id}
                ref={(el) => {
                  rowRefs.current[index] = el;
                }}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="focus:outline-none focus:ring-2 focus:ring-inset focus:ring-black"
              >
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
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Actions for ${service.name}`}
                      >
                        {duplicatingServiceId === service.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/services/${service.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(service)}
                        disabled={duplicatingServiceId === service.id}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:bg-red-50 focus:text-red-700"
                        disabled={!isDraft}
                        onClick={() => handleDeleteClick(service)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <DeleteServiceDialog
        service={serviceToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </>
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
          <TableHead className="w-[80px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 8 }).map((_, i) => (
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
            <TableCell>
              <div className="h-8 w-8 animate-pulse rounded bg-slate-100" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

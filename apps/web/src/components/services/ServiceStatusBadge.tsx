'use client';

/**
 * ServiceStatusBadge Component
 *
 * Displays a colored badge indicating service lifecycle status.
 * - DRAFT: Yellow/amber
 * - PUBLISHED: Green
 * - ARCHIVED: Gray
 */

import { Badge } from '@/components/ui/badge';
import type { ServiceStatus } from '@/hooks/use-services';

interface ServiceStatusBadgeProps {
  status: ServiceStatus;
  className?: string;
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

export function ServiceStatusBadge({
  status,
  className,
}: ServiceStatusBadgeProps) {
  return (
    <Badge variant={statusVariantMap[status]} className={className}>
      {statusLabelMap[status]}
    </Badge>
  );
}

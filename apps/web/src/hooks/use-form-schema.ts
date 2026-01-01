/**
 * Form Schema Hook
 *
 * React Query hook for fetching form JSON Schema, UI Schema, and visibility rules.
 *
 * Story 3.10: JSON Schema Generation
 */

import { useQuery } from '@tanstack/react-query';
import { getFormSchema, type FormSchemaResponse } from '@/lib/api/forms';

/**
 * Hook to fetch form schema (JSON Schema, UI Schema, and visibility rules)
 *
 * @param formId - ID of the form to fetch schema for
 * @param enabled - Whether to enable the query (default: true)
 * @returns Query result with form schema data
 */
export function useFormSchema(formId: string, enabled = true) {
  return useQuery<FormSchemaResponse>({
    queryKey: ['form-schema', formId],
    queryFn: () => getFormSchema(formId),
    enabled: enabled && !!formId,
    staleTime: 30000, // 30 seconds - schema changes less frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

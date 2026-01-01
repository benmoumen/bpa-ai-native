'use client';

/**
 * Determinants Hooks
 *
 * React Query hooks for fetching and managing determinants.
 * Determinants are business rule variables derived from form fields
 * used for workflow decisions and calculations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDeterminants,
  getDeterminant,
  createDeterminant,
  updateDeterminant,
  deleteDeterminant,
  linkFieldToDeterminant,
  unlinkFieldFromDeterminant,
  type Determinant,
  type DeterminantType,
  type CreateDeterminantInput,
  type UpdateDeterminantInput,
} from '@/lib/api/determinants';
import { formFieldKeys } from './use-form-fields';
import type { ApiResponse } from '@/lib/api/services';

export interface DeterminantsQueryParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  type?: DeterminantType;
  search?: string;
}

/**
 * Query key factory for determinants
 */
export const determinantKeys = {
  all: ['determinants'] as const,
  lists: () => [...determinantKeys.all, 'list'] as const,
  list: (serviceId: string, params?: DeterminantsQueryParams) =>
    [...determinantKeys.lists(), serviceId, params] as const,
  details: () => [...determinantKeys.all, 'detail'] as const,
  detail: (id: string) => [...determinantKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated list of determinants for a service
 */
export function useDeterminants(serviceId: string, params: DeterminantsQueryParams = {}) {
  return useQuery<ApiResponse<Determinant[]>, Error>({
    queryKey: determinantKeys.list(serviceId, params),
    queryFn: () => getDeterminants(serviceId, params),
    enabled: !!serviceId,
  });
}

/**
 * Hook to fetch a single determinant by ID
 */
export function useDeterminant(id: string) {
  return useQuery<Determinant, Error>({
    queryKey: determinantKeys.detail(id),
    queryFn: () => getDeterminant(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new determinant within a service
 */
export function useCreateDeterminant(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Determinant, Error, CreateDeterminantInput>({
    mutationFn: (input) => createDeterminant(serviceId, input),
    onSuccess: () => {
      // Invalidate and refetch determinants list for this service
      queryClient.invalidateQueries({
        queryKey: determinantKeys.list(serviceId),
      });
    },
  });
}

/**
 * Hook to update an existing determinant
 */
export function useUpdateDeterminant(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Determinant, Error, { id: string; data: UpdateDeterminantInput }>({
    mutationFn: ({ id, data }) => updateDeterminant(id, data),
    onSuccess: (data) => {
      // Invalidate and refetch determinants list for this service
      queryClient.invalidateQueries({
        queryKey: determinantKeys.list(serviceId),
      });
      // Update the detail cache with new data
      queryClient.setQueryData(determinantKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to soft delete a determinant
 *
 * Soft delete sets isActive=false rather than permanently removing.
 */
export function useDeleteDeterminant(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Determinant, Error, string>({
    mutationFn: deleteDeterminant,
    onSuccess: (data) => {
      // Invalidate determinants list for this service
      queryClient.invalidateQueries({
        queryKey: determinantKeys.list(serviceId),
      });
      // Remove the detail from cache
      queryClient.removeQueries({ queryKey: determinantKeys.detail(data.id) });
    },
  });
}

/**
 * Hook to link a form field to a determinant
 */
export function useLinkFieldToDeterminant(serviceId: string, formId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    { field: { id: string; determinantId: string }; determinant: Determinant },
    Error,
    { fieldId: string; determinantId: string }
  >({
    mutationFn: ({ fieldId, determinantId }) =>
      linkFieldToDeterminant(fieldId, determinantId),
    onSuccess: () => {
      // Invalidate determinants list (linkedFieldCount may have changed)
      queryClient.invalidateQueries({
        queryKey: determinantKeys.list(serviceId),
      });
      // Invalidate form fields list (determinantId changed)
      queryClient.invalidateQueries({
        queryKey: formFieldKeys.list(formId),
      });
    },
  });
}

/**
 * Hook to unlink a form field from its determinant
 */
export function useUnlinkFieldFromDeterminant(serviceId: string, formId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; determinantId: null }, Error, string>({
    mutationFn: unlinkFieldFromDeterminant,
    onSuccess: () => {
      // Invalidate determinants list (linkedFieldCount may have changed)
      queryClient.invalidateQueries({
        queryKey: determinantKeys.list(serviceId),
      });
      // Invalidate form fields list (determinantId changed)
      queryClient.invalidateQueries({
        queryKey: formFieldKeys.list(formId),
      });
    },
  });
}

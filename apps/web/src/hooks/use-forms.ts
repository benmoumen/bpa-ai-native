'use client';

/**
 * Forms Hooks
 *
 * React Query hooks for fetching and managing forms.
 * Forms represent data collection structures within a Service
 * (APPLICANT forms for citizens, GUIDE forms for operators).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getForms,
  getForm,
  createForm,
  updateForm,
  deleteForm,
  type Form,
  type FormType,
  type CreateFormInput,
  type UpdateFormInput,
} from '@/lib/api/forms';
import type { ApiResponse } from '@/lib/api/services';

export interface FormsQueryParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  type?: FormType;
}

/**
 * Query key factory for forms
 */
export const formKeys = {
  all: ['forms'] as const,
  lists: () => [...formKeys.all, 'list'] as const,
  list: (serviceId: string, params?: FormsQueryParams) =>
    [...formKeys.lists(), serviceId, params] as const,
  details: () => [...formKeys.all, 'detail'] as const,
  detail: (id: string) => [...formKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated list of forms for a service
 */
export function useForms(serviceId: string, params: FormsQueryParams = {}) {
  return useQuery<ApiResponse<Form[]>, Error>({
    queryKey: formKeys.list(serviceId, params),
    queryFn: () => getForms(serviceId, params),
    enabled: !!serviceId,
  });
}

/**
 * Hook to fetch a single form by ID
 */
export function useForm(id: string) {
  return useQuery<Form, Error>({
    queryKey: formKeys.detail(id),
    queryFn: () => getForm(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new form within a service
 */
export function useCreateForm(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Form, Error, CreateFormInput>({
    mutationFn: (input) => createForm(serviceId, input),
    onSuccess: () => {
      // Invalidate and refetch forms list for this service
      queryClient.invalidateQueries({
        queryKey: formKeys.list(serviceId),
      });
    },
  });
}

/**
 * Hook to update an existing form
 */
export function useUpdateForm(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Form, Error, { id: string; data: UpdateFormInput }>({
    mutationFn: ({ id, data }) => updateForm(id, data),
    onSuccess: (data) => {
      // Invalidate and refetch forms list for this service
      queryClient.invalidateQueries({
        queryKey: formKeys.list(serviceId),
      });
      // Update the detail cache with new data
      queryClient.setQueryData(formKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to soft delete a form
 *
 * Soft delete sets isActive=false rather than permanently removing.
 */
export function useDeleteForm(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Form, Error, string>({
    mutationFn: deleteForm,
    onSuccess: (data) => {
      // Invalidate forms list for this service
      queryClient.invalidateQueries({
        queryKey: formKeys.list(serviceId),
      });
      // Remove the detail from cache
      queryClient.removeQueries({ queryKey: formKeys.detail(data.id) });
    },
  });
}

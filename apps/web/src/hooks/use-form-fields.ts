'use client';

/**
 * Form Fields Hooks
 *
 * React Query hooks for fetching and managing form fields.
 * Form fields define the data structure within a form
 * (TEXT, NUMBER, DATE, SELECT, etc.).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFormFields,
  getFormField,
  createFormField,
  updateFormField,
  deleteFormField,
  type FormField,
  type CreateFormFieldInput,
  type UpdateFormFieldInput,
} from '@/lib/api/forms';
import type { ApiResponse } from '@/lib/api/services';

export interface FormFieldsQueryParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

/**
 * Query key factory for form fields
 */
export const formFieldKeys = {
  all: ['formFields'] as const,
  lists: () => [...formFieldKeys.all, 'list'] as const,
  list: (formId: string, params?: FormFieldsQueryParams) =>
    [...formFieldKeys.lists(), formId, params] as const,
  details: () => [...formFieldKeys.all, 'detail'] as const,
  detail: (id: string) => [...formFieldKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated list of fields for a form
 */
export function useFormFields(formId: string, params: FormFieldsQueryParams = {}) {
  return useQuery<ApiResponse<FormField[]>, Error>({
    queryKey: formFieldKeys.list(formId, params),
    queryFn: () => getFormFields(formId, params),
    enabled: !!formId,
  });
}

/**
 * Hook to fetch a single form field by ID
 */
export function useFormField(id: string) {
  return useQuery<FormField, Error>({
    queryKey: formFieldKeys.detail(id),
    queryFn: () => getFormField(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new field within a form
 */
export function useCreateFormField(formId: string) {
  const queryClient = useQueryClient();

  return useMutation<FormField, Error, CreateFormFieldInput>({
    mutationFn: (input) => createFormField(formId, input),
    onSuccess: () => {
      // Invalidate and refetch fields list for this form
      queryClient.invalidateQueries({
        queryKey: formFieldKeys.list(formId),
      });
    },
  });
}

/**
 * Hook to update an existing form field
 */
export function useUpdateFormField(formId: string) {
  const queryClient = useQueryClient();

  return useMutation<FormField, Error, { id: string; data: UpdateFormFieldInput }>({
    mutationFn: ({ id, data }) => updateFormField(id, data),
    onSuccess: (data) => {
      // Invalidate and refetch fields list for this form
      queryClient.invalidateQueries({
        queryKey: formFieldKeys.list(formId),
      });
      // Update the detail cache with new data
      queryClient.setQueryData(formFieldKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to soft delete a form field
 *
 * Soft delete sets isActive=false rather than permanently removing.
 */
export function useDeleteFormField(formId: string) {
  const queryClient = useQueryClient();

  return useMutation<FormField, Error, string>({
    mutationFn: deleteFormField,
    onSuccess: (data) => {
      // Invalidate fields list for this form
      queryClient.invalidateQueries({
        queryKey: formFieldKeys.list(formId),
      });
      // Remove the detail from cache
      queryClient.removeQueries({ queryKey: formFieldKeys.detail(data.id) });
    },
  });
}

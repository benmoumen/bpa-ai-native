'use client';

/**
 * Form Sections Hooks
 *
 * React Query hooks for fetching and managing form sections.
 * Form sections organize fields into logical groups within a form.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFormSections,
  getFormSection,
  createFormSection,
  updateFormSection,
  deleteFormSection,
  type FormSection,
  type CreateFormSectionInput,
  type UpdateFormSectionInput,
} from '@/lib/api/forms';
import type { ApiResponse } from '@/lib/api/services';
import { formFieldKeys } from './use-form-fields';

export interface FormSectionsQueryParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

/**
 * Query key factory for form sections
 */
export const formSectionKeys = {
  all: ['formSections'] as const,
  lists: () => [...formSectionKeys.all, 'list'] as const,
  list: (formId: string, params?: FormSectionsQueryParams) =>
    [...formSectionKeys.lists(), formId, params] as const,
  details: () => [...formSectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...formSectionKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated list of sections for a form
 */
export function useFormSections(formId: string, params: FormSectionsQueryParams = {}) {
  return useQuery<ApiResponse<FormSection[]>, Error>({
    queryKey: formSectionKeys.list(formId, params),
    queryFn: () => getFormSections(formId, params),
    enabled: !!formId,
  });
}

/**
 * Hook to fetch a single form section by ID
 */
export function useFormSection(id: string) {
  return useQuery<FormSection, Error>({
    queryKey: formSectionKeys.detail(id),
    queryFn: () => getFormSection(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new section within a form
 */
export function useCreateFormSection(formId: string) {
  const queryClient = useQueryClient();

  return useMutation<FormSection, Error, CreateFormSectionInput>({
    mutationFn: (input) => createFormSection(formId, input),
    onSuccess: () => {
      // Invalidate and refetch sections list for this form
      queryClient.invalidateQueries({
        queryKey: formSectionKeys.list(formId),
      });
    },
  });
}

/**
 * Hook to update an existing form section
 */
export function useUpdateFormSection(formId: string) {
  const queryClient = useQueryClient();

  return useMutation<FormSection, Error, { id: string; data: UpdateFormSectionInput }>({
    mutationFn: ({ id, data }) => updateFormSection(id, data),
    onSuccess: (data) => {
      // Invalidate and refetch sections list for this form
      queryClient.invalidateQueries({
        queryKey: formSectionKeys.list(formId),
      });
      // Update the detail cache with new data
      queryClient.setQueryData(formSectionKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to soft delete a form section
 *
 * Soft delete sets isActive=false rather than permanently removing.
 * Fields in the section become unsectioned (sectionId = null).
 */
export function useDeleteFormSection(formId: string) {
  const queryClient = useQueryClient();

  return useMutation<FormSection, Error, string>({
    mutationFn: deleteFormSection,
    onSuccess: (data) => {
      // Invalidate sections list for this form
      queryClient.invalidateQueries({
        queryKey: formSectionKeys.list(formId),
      });
      // Remove the detail from cache
      queryClient.removeQueries({ queryKey: formSectionKeys.detail(data.id) });
      // Also invalidate fields since their sectionId may have changed
      queryClient.invalidateQueries({
        queryKey: formFieldKeys.list(formId),
      });
    },
  });
}

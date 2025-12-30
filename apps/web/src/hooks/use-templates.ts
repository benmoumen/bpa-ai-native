'use client';

/**
 * Templates Hooks
 *
 * React Query hooks for fetching templates and creating services from templates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTemplates,
  getTemplate,
  getTemplateCategories,
  createServiceFromTemplate,
  type ServiceTemplate,
} from '@/lib/api/templates';
import type { Service, ApiResponse } from '@/lib/api/services';
import { serviceKeys } from './use-services';

export interface TemplatesQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}

/**
 * Query key factory for templates
 */
export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (params: TemplatesQueryParams) =>
    [...templateKeys.lists(), params] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  categories: () => [...templateKeys.all, 'categories'] as const,
};

/**
 * Hook to fetch paginated list of templates
 *
 * Templates are public - no authentication required.
 */
export function useTemplates(params: TemplatesQueryParams = {}) {
  return useQuery<ApiResponse<ServiceTemplate[]>, Error>({
    queryKey: templateKeys.list(params),
    queryFn: () => getTemplates(params),
  });
}

/**
 * Hook to fetch a single template by ID
 *
 * Templates are public - no authentication required.
 */
export function useTemplate(id: string) {
  return useQuery<ServiceTemplate, Error>({
    queryKey: templateKeys.detail(id),
    queryFn: () => getTemplate(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch template categories
 *
 * Templates are public - no authentication required.
 */
export function useTemplateCategories() {
  return useQuery<string[], Error>({
    queryKey: templateKeys.categories(),
    queryFn: getTemplateCategories,
  });
}

/**
 * Hook to create a service from a template
 *
 * Creates a new service using the specified template as a starting point.
 * The service is created in DRAFT status with name "[Template Name] (New)".
 * Requires authentication.
 */
export function useCreateServiceFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation<Service, Error, string>({
    mutationFn: createServiceFromTemplate,
    onSuccess: () => {
      // Invalidate services list to show the new service
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}

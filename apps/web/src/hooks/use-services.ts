'use client';

/**
 * Services Hooks
 *
 * React Query hooks for fetching and managing services
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getServices,
  getService,
  createService,
  updateService,
  type Service,
  type CreateServiceInput,
  type UpdateServiceInput,
  type ApiResponse,
} from '@/lib/api/services';

export type ServiceStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ServicesQueryParams {
  page?: number;
  limit?: number;
  status?: ServiceStatus;
  search?: string;
}

/**
 * Query key factory for services
 */
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (params: ServicesQueryParams) =>
    [...serviceKeys.lists(), params] as const,
  details: () => [...serviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated list of services
 */
export function useServices(params: ServicesQueryParams = {}) {
  return useQuery<ApiResponse<Service[]>, Error>({
    queryKey: serviceKeys.list(params),
    queryFn: () => getServices(params),
  });
}

/**
 * Hook to fetch a single service by ID
 */
export function useService(id: string) {
  return useQuery<Service, Error>({
    queryKey: serviceKeys.detail(id),
    queryFn: () => getService(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new service
 */
export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation<Service, Error, CreateServiceInput>({
    mutationFn: createService,
    onSuccess: () => {
      // Invalidate and refetch services list
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}

/**
 * Hook to update an existing service
 */
export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation<Service, Error, { id: string; data: UpdateServiceInput }>({
    mutationFn: ({ id, data }) => updateService(id, data),
    onSuccess: (data) => {
      // Invalidate and refetch services list and detail
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(data.id) });
    },
  });
}

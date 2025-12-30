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
  duplicateService,
  deleteServicePermanently,
  publishService,
  archiveService,
  restoreService,
  type Service,
  type CreateServiceInput,
  type UpdateServiceInput,
  type ApiResponse,
  type DeleteServiceResponse,
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

/**
 * Hook to duplicate an existing service
 *
 * Creates a copy of the service with name "[Original Name] (Copy)" and status DRAFT.
 * The duplicate is independent from the original.
 */
export function useDuplicateService() {
  const queryClient = useQueryClient();

  return useMutation<Service, Error, string>({
    mutationFn: duplicateService,
    onSuccess: () => {
      // Invalidate services list to show the new duplicate
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
    },
  });
}

/**
 * Hook to permanently delete a DRAFT service
 *
 * Only services with DRAFT status can be permanently deleted.
 * This action cannot be undone.
 */
export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation<DeleteServiceResponse, Error, string>({
    mutationFn: deleteServicePermanently,
    onSuccess: (data) => {
      // Invalidate services list to remove the deleted service
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      // Remove the detail from cache
      queryClient.removeQueries({ queryKey: serviceKeys.detail(data.id) });
    },
  });
}

/**
 * Hook to publish a DRAFT service
 *
 * Transitions a service from DRAFT to PUBLISHED status.
 * Only DRAFT services can be published.
 */
export function usePublishService() {
  const queryClient = useQueryClient();

  return useMutation<Service, Error, string>({
    mutationFn: publishService,
    onSuccess: (data) => {
      // Invalidate services list to show updated status
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      // Update the detail cache with new data
      queryClient.setQueryData(serviceKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to archive a PUBLISHED service
 *
 * Transitions a service from PUBLISHED to ARCHIVED status.
 * Only PUBLISHED services can be archived.
 */
export function useArchiveService() {
  const queryClient = useQueryClient();

  return useMutation<Service, Error, string>({
    mutationFn: archiveService,
    onSuccess: (data) => {
      // Invalidate services list to show updated status
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      // Update the detail cache with new data
      queryClient.setQueryData(serviceKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to restore an ARCHIVED service to DRAFT
 *
 * Transitions a service from ARCHIVED to DRAFT status.
 * Only ARCHIVED services can be restored.
 */
export function useRestoreService() {
  const queryClient = useQueryClient();

  return useMutation<Service, Error, string>({
    mutationFn: restoreService,
    onSuccess: (data) => {
      // Invalidate services list to show updated status
      queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
      // Update the detail cache with new data
      queryClient.setQueryData(serviceKeys.detail(data.id), data);
    },
  });
}

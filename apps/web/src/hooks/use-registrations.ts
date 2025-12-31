'use client';

/**
 * Registrations Hooks
 *
 * React Query hooks for fetching and managing registrations.
 * Registrations represent authorization types within a Service
 * (e.g., Business License, Import Permit, Export Certificate).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRegistrations,
  getRegistration,
  createRegistration,
  updateRegistration,
  deleteRegistration,
  type Registration,
  type CreateRegistrationInput,
  type UpdateRegistrationInput,
} from '@/lib/api/registrations';
import type { ApiResponse } from '@/lib/api/services';

export interface RegistrationsQueryParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

/**
 * Query key factory for registrations
 */
export const registrationKeys = {
  all: ['registrations'] as const,
  lists: () => [...registrationKeys.all, 'list'] as const,
  list: (serviceId: string, params?: RegistrationsQueryParams) =>
    [...registrationKeys.lists(), serviceId, params] as const,
  details: () => [...registrationKeys.all, 'detail'] as const,
  detail: (id: string) => [...registrationKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated list of registrations for a service
 */
export function useRegistrations(
  serviceId: string,
  params: RegistrationsQueryParams = {}
) {
  return useQuery<ApiResponse<Registration[]>, Error>({
    queryKey: registrationKeys.list(serviceId, params),
    queryFn: () => getRegistrations(serviceId, params),
    enabled: !!serviceId,
  });
}

/**
 * Hook to fetch a single registration by ID
 */
export function useRegistration(id: string) {
  return useQuery<Registration, Error>({
    queryKey: registrationKeys.detail(id),
    queryFn: () => getRegistration(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new registration within a service
 */
export function useCreateRegistration(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Registration, Error, CreateRegistrationInput>({
    mutationFn: (input) => createRegistration(serviceId, input),
    onSuccess: () => {
      // Invalidate and refetch registrations list for this service
      queryClient.invalidateQueries({
        queryKey: registrationKeys.list(serviceId),
      });
    },
  });
}

/**
 * Hook to update an existing registration
 */
export function useUpdateRegistration(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    Registration,
    Error,
    { id: string; data: UpdateRegistrationInput }
  >({
    mutationFn: ({ id, data }) => updateRegistration(id, data),
    onSuccess: (data) => {
      // Invalidate and refetch registrations list for this service
      queryClient.invalidateQueries({
        queryKey: registrationKeys.list(serviceId),
      });
      // Update the detail cache with new data
      queryClient.setQueryData(registrationKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to soft delete a registration
 *
 * Soft delete sets isActive=false rather than permanently removing.
 */
export function useDeleteRegistration(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Registration, Error, string>({
    mutationFn: deleteRegistration,
    onSuccess: (data) => {
      // Invalidate registrations list for this service
      queryClient.invalidateQueries({
        queryKey: registrationKeys.list(serviceId),
      });
      // Remove the detail from cache
      queryClient.removeQueries({ queryKey: registrationKeys.detail(data.id) });
    },
  });
}

'use client';

/**
 * Roles Hooks
 *
 * React Query hooks for fetching and managing workflow roles (steps)
 * Story 4-2: Define Workflow Steps
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getStartRole,
  setStartRole,
  type Role,
  type CreateRoleInput,
  type UpdateRoleInput,
} from '@/lib/api/roles';
import { ApiResponse } from '@/lib/api/services';

/**
 * Query key factory for roles
 */
export const roleKeys = {
  all: ['roles'] as const,
  lists: () => [...roleKeys.all, 'list'] as const,
  list: (serviceId: string) => [...roleKeys.lists(), serviceId] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
  startRole: (serviceId: string) =>
    [...roleKeys.all, 'start', serviceId] as const,
};

/**
 * Hook to fetch all roles for a service
 */
export function useRoles(serviceId: string) {
  return useQuery<ApiResponse<Role[]>, Error>({
    queryKey: roleKeys.list(serviceId),
    queryFn: () => getRoles(serviceId),
    enabled: !!serviceId,
  });
}

/**
 * Hook to fetch a single role by ID
 */
export function useRole(roleId: string) {
  return useQuery<Role, Error>({
    queryKey: roleKeys.detail(roleId),
    queryFn: () => getRole(roleId),
    enabled: !!roleId,
  });
}

/**
 * Hook to fetch the start role for a service
 */
export function useStartRole(serviceId: string) {
  return useQuery<Role | null, Error>({
    queryKey: roleKeys.startRole(serviceId),
    queryFn: () => getStartRole(serviceId),
    enabled: !!serviceId,
  });
}

/**
 * Hook to create a new role
 */
export function useCreateRole(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Role, Error, CreateRoleInput>({
    mutationFn: (input) => createRole(serviceId, input),
    onSuccess: () => {
      // Invalidate roles list for this service
      queryClient.invalidateQueries({ queryKey: roleKeys.list(serviceId) });
    },
  });
}

/**
 * Hook to update an existing role
 */
export function useUpdateRole(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Role, Error, { roleId: string; data: UpdateRoleInput }>({
    mutationFn: ({ roleId, data }) => updateRole(roleId, data),
    onSuccess: (data) => {
      // Invalidate roles list for this service
      queryClient.invalidateQueries({ queryKey: roleKeys.list(serviceId) });
      // Update the detail cache
      queryClient.setQueryData(roleKeys.detail(data.id), data);
      // If isStartRole changed, invalidate start role query
      queryClient.invalidateQueries({ queryKey: roleKeys.startRole(serviceId) });
    },
  });
}

/**
 * Hook to delete a role
 */
export function useDeleteRole(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; deleted: true }, Error, string>({
    mutationFn: deleteRole,
    onSuccess: (data) => {
      // Invalidate roles list for this service
      queryClient.invalidateQueries({ queryKey: roleKeys.list(serviceId) });
      // Remove from detail cache
      queryClient.removeQueries({ queryKey: roleKeys.detail(data.id) });
      // Invalidate start role in case deleted role was start
      queryClient.invalidateQueries({ queryKey: roleKeys.startRole(serviceId) });
    },
  });
}

/**
 * Hook to set a role as the start role
 */
export function useSetStartRole(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Role, Error, string>({
    mutationFn: (roleId) => setStartRole(serviceId, roleId),
    onSuccess: () => {
      // Invalidate roles list (isStartRole changed on multiple roles)
      queryClient.invalidateQueries({ queryKey: roleKeys.list(serviceId) });
      // Invalidate start role query
      queryClient.invalidateQueries({ queryKey: roleKeys.startRole(serviceId) });
    },
  });
}

/**
 * Hook to reorder a role (update sortOrder)
 */
export function useReorderRole(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Role, Error, { roleId: string; sortOrder: number }>({
    mutationFn: ({ roleId, sortOrder }) => updateRole(roleId, { sortOrder }),
    onSuccess: () => {
      // Invalidate roles list to reflect new order
      queryClient.invalidateQueries({ queryKey: roleKeys.list(serviceId) });
    },
  });
}

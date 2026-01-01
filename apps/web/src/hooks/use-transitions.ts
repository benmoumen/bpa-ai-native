'use client';

/**
 * Transitions Hooks
 *
 * React Query hooks for fetching and managing workflow transitions
 * Story 4-3: Configure Workflow Transitions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTransitions,
  getTransition,
  createTransition,
  updateTransition,
  deleteTransition,
  getRoleStatuses,
  createDefaultStatuses,
  updateRoleStatus,
  deleteRoleStatus,
  type WorkflowTransition,
  type CreateTransitionInput,
  type UpdateTransitionInput,
  type UpdateRoleStatusInput,
  type RoleStatus,
} from '@/lib/api/transitions';
import { roleKeys } from './use-roles';

/**
 * Query key factory for transitions
 */
export const transitionKeys = {
  all: ['transitions'] as const,
  lists: () => [...transitionKeys.all, 'list'] as const,
  list: (serviceId: string) => [...transitionKeys.lists(), serviceId] as const,
  details: () => [...transitionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transitionKeys.details(), id] as const,
};

/**
 * Query key factory for role statuses
 */
export const roleStatusKeys = {
  all: ['roleStatuses'] as const,
  lists: () => [...roleStatusKeys.all, 'list'] as const,
  list: (roleId: string) => [...roleStatusKeys.lists(), roleId] as const,
};

/**
 * Hook to fetch all transitions for a service
 */
export function useTransitions(serviceId: string) {
  return useQuery<WorkflowTransition[], Error>({
    queryKey: transitionKeys.list(serviceId),
    queryFn: () => getTransitions(serviceId),
    enabled: !!serviceId,
  });
}

/**
 * Hook to fetch a single transition by ID
 */
export function useTransition(transitionId: string) {
  return useQuery<WorkflowTransition, Error>({
    queryKey: transitionKeys.detail(transitionId),
    queryFn: () => getTransition(transitionId),
    enabled: !!transitionId,
  });
}

/**
 * Hook to fetch all statuses for a role
 */
export function useRoleStatuses(roleId: string) {
  return useQuery<RoleStatus[], Error>({
    queryKey: roleStatusKeys.list(roleId),
    queryFn: () => getRoleStatuses(roleId),
    enabled: !!roleId,
  });
}

/**
 * Hook to create a new transition
 */
export function useCreateTransition(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<WorkflowTransition, Error, CreateTransitionInput>({
    mutationFn: createTransition,
    onSuccess: () => {
      // Invalidate transitions list for this service
      queryClient.invalidateQueries({
        queryKey: transitionKeys.list(serviceId),
      });
    },
  });
}

/**
 * Hook to update an existing transition
 */
export function useUpdateTransition(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    WorkflowTransition,
    Error,
    { transitionId: string; data: UpdateTransitionInput }
  >({
    mutationFn: ({ transitionId, data }) => updateTransition(transitionId, data),
    onSuccess: (data) => {
      // Invalidate transitions list for this service
      queryClient.invalidateQueries({
        queryKey: transitionKeys.list(serviceId),
      });
      // Update the detail cache
      queryClient.setQueryData(transitionKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to delete a transition
 */
export function useDeleteTransition(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteTransition,
    onSuccess: () => {
      // Invalidate transitions list for this service
      queryClient.invalidateQueries({
        queryKey: transitionKeys.list(serviceId),
      });
    },
  });
}

/**
 * Hook to create default 4-status set for a role
 */
export function useCreateDefaultStatuses(serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<RoleStatus[], Error, string>({
    mutationFn: createDefaultStatuses,
    onSuccess: (data, roleId) => {
      // Update the role statuses cache
      queryClient.setQueryData(roleStatusKeys.list(roleId), data);
      // Invalidate roles to trigger re-fetch (statuses may affect display)
      queryClient.invalidateQueries({ queryKey: roleKeys.list(serviceId) });
    },
  });
}

/**
 * Hook to update a role status (name, sortOrder, conditions)
 * Story 4-4: Specify Step Actions
 */
export function useUpdateRoleStatus(roleId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    RoleStatus,
    Error,
    { statusId: string; data: UpdateRoleStatusInput }
  >({
    mutationFn: ({ statusId, data }) => updateRoleStatus(statusId, data),
    onSuccess: () => {
      // Invalidate role statuses list
      queryClient.invalidateQueries({
        queryKey: roleStatusKeys.list(roleId),
      });
    },
  });
}

/**
 * Hook to delete a role status
 * Story 4-4: Specify Step Actions
 */
export function useDeleteRoleStatus(roleId: string, serviceId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteRoleStatus,
    onSuccess: () => {
      // Invalidate role statuses list
      queryClient.invalidateQueries({
        queryKey: roleStatusKeys.list(roleId),
      });
      // Invalidate transitions as they may reference this status
      queryClient.invalidateQueries({
        queryKey: transitionKeys.list(serviceId),
      });
    },
  });
}

// Re-export types for convenience
export type {
  WorkflowTransition,
  RoleStatus,
  CreateTransitionInput,
  UpdateTransitionInput,
  UpdateRoleStatusInput,
};

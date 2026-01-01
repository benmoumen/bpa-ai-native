import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInstitutionsForRole,
  getAssignmentsForRole,
  assignInstitution,
  unassignInstitution,
} from '@/lib/api/role-institutions';
import { roleKeys } from './use-roles';

export const roleInstitutionKeys = {
  all: ['role-institutions'] as const,
  lists: () => [...roleInstitutionKeys.all, 'list'] as const,
  list: (serviceId: string, roleId: string) =>
    [...roleInstitutionKeys.lists(), { serviceId, roleId }] as const,
  assignments: () => [...roleInstitutionKeys.all, 'assignments'] as const,
  assignment: (serviceId: string, roleId: string) =>
    [...roleInstitutionKeys.assignments(), { serviceId, roleId }] as const,
};

export function useInstitutionsForRole(serviceId: string, roleId: string) {
  return useQuery({
    queryKey: roleInstitutionKeys.list(serviceId, roleId),
    queryFn: () => getInstitutionsForRole(serviceId, roleId),
    enabled: !!serviceId && !!roleId,
  });
}

export function useAssignmentsForRole(serviceId: string, roleId: string) {
  return useQuery({
    queryKey: roleInstitutionKeys.assignment(serviceId, roleId),
    queryFn: () => getAssignmentsForRole(serviceId, roleId),
    enabled: !!serviceId && !!roleId,
  });
}

export function useAssignInstitution(serviceId: string, roleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (institutionId: string) =>
      assignInstitution(serviceId, roleId, institutionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roleInstitutionKeys.list(serviceId, roleId),
      });
      queryClient.invalidateQueries({
        queryKey: roleInstitutionKeys.assignment(serviceId, roleId),
      });
      queryClient.invalidateQueries({
        queryKey: roleKeys.validation(serviceId),
      });
    },
  });
}

export function useUnassignInstitution(serviceId: string, roleId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (institutionId: string) =>
      unassignInstitution(serviceId, roleId, institutionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roleInstitutionKeys.list(serviceId, roleId),
      });
      queryClient.invalidateQueries({
        queryKey: roleInstitutionKeys.assignment(serviceId, roleId),
      });
      queryClient.invalidateQueries({
        queryKey: roleKeys.validation(serviceId),
      });
    },
  });
}

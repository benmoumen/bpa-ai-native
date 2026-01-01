import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRegistrationsForRole,
  bindRegistration,
  unbindRegistration,
  updateBinding,
  type RegistrationForBinding,
  type RoleRegistrationBinding,
} from '@/lib/api/role-registrations';

export const roleRegistrationKeys = {
  all: ['role-registrations'] as const,
  forRole: (serviceId: string, roleId: string) =>
    [...roleRegistrationKeys.all, 'forRole', serviceId, roleId] as const,
};

export function useRegistrationsForRole(serviceId: string, roleId: string) {
  return useQuery<RegistrationForBinding[], Error>({
    queryKey: roleRegistrationKeys.forRole(serviceId, roleId),
    queryFn: () => getRegistrationsForRole(serviceId, roleId),
    enabled: !!serviceId && !!roleId,
  });
}

export function useBindRegistration(serviceId: string, roleId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    RoleRegistrationBinding,
    Error,
    { registrationId: string; finalResultIssued?: boolean }
  >({
    mutationFn: ({ registrationId, finalResultIssued }) =>
      bindRegistration(serviceId, roleId, registrationId, finalResultIssued),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roleRegistrationKeys.forRole(serviceId, roleId),
      });
    },
  });
}

export function useUnbindRegistration(serviceId: string, roleId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (registrationId) =>
      unbindRegistration(serviceId, roleId, registrationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roleRegistrationKeys.forRole(serviceId, roleId),
      });
    },
  });
}

export function useUpdateBinding(serviceId: string, roleId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    RoleRegistrationBinding,
    Error,
    { bindingId: string; finalResultIssued: boolean }
  >({
    mutationFn: ({ bindingId, finalResultIssued }) =>
      updateBinding(bindingId, finalResultIssued),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roleRegistrationKeys.forRole(serviceId, roleId),
      });
    },
  });
}

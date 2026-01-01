import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInstitutions,
  getInstitution,
  createInstitution,
  seedDemoInstitutions,
} from '@/lib/api/institutions';

export const institutionKeys = {
  all: ['institutions'] as const,
  lists: () => [...institutionKeys.all, 'list'] as const,
  list: (includeInactive: boolean) =>
    [...institutionKeys.lists(), { includeInactive }] as const,
  details: () => [...institutionKeys.all, 'detail'] as const,
  detail: (id: string) => [...institutionKeys.details(), id] as const,
};

export function useInstitutions(includeInactive = false) {
  return useQuery({
    queryKey: institutionKeys.list(includeInactive),
    queryFn: () => getInstitutions(includeInactive),
  });
}

export function useInstitution(id: string) {
  return useQuery({
    queryKey: institutionKeys.detail(id),
    queryFn: () => getInstitution(id),
    enabled: !!id,
  });
}

export function useCreateInstitution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; code: string; country?: string }) =>
      createInstitution(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: institutionKeys.lists() });
    },
  });
}

export function useSeedDemoInstitutions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: seedDemoInstitutions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: institutionKeys.lists() });
    },
  });
}

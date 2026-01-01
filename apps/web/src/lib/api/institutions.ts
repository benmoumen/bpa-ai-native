import { apiClient } from './client';

export interface Institution {
  id: string;
  name: string;
  code: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
}

export async function getInstitutions(
  includeInactive = false,
): Promise<Institution[]> {
  const response = await apiClient.get<Institution[]>(
    `/institutions?includeInactive=${includeInactive}`,
  );
  return response.data;
}

export async function getInstitution(id: string): Promise<Institution> {
  const response = await apiClient.get<Institution>(`/institutions/${id}`);
  return response.data;
}

export async function createInstitution(data: {
  name: string;
  code: string;
  country?: string;
}): Promise<Institution> {
  const response = await apiClient.post<Institution>('/institutions', data);
  return response.data;
}

export async function seedDemoInstitutions(): Promise<Institution[]> {
  const response = await apiClient.post<Institution[]>('/institutions/seed');
  return response.data;
}

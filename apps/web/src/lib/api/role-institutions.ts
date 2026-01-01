import { apiClient } from './client';

export interface RoleInstitutionResponse {
  id: string;
  roleId: string;
  institutionId: string;
  institutionName: string;
  institutionCode: string;
  createdAt: string;
}

export interface InstitutionForAssignment {
  id: string;
  name: string;
  code: string;
  country?: string;
  isAssigned: boolean;
  assignmentId?: string;
}

export async function getInstitutionsForRole(
  serviceId: string,
  roleId: string,
): Promise<InstitutionForAssignment[]> {
  const response = await apiClient.get<InstitutionForAssignment[]>(
    `/services/${serviceId}/roles/${roleId}/institutions`,
  );
  return response.data;
}

export async function getAssignmentsForRole(
  serviceId: string,
  roleId: string,
): Promise<RoleInstitutionResponse[]> {
  const response = await apiClient.get<RoleInstitutionResponse[]>(
    `/services/${serviceId}/roles/${roleId}/institutions/assignments`,
  );
  return response.data;
}

export async function assignInstitution(
  serviceId: string,
  roleId: string,
  institutionId: string,
): Promise<RoleInstitutionResponse> {
  const response = await apiClient.post<RoleInstitutionResponse>(
    `/services/${serviceId}/roles/${roleId}/institutions/${institutionId}`,
  );
  return response.data;
}

export async function unassignInstitution(
  serviceId: string,
  roleId: string,
  institutionId: string,
): Promise<void> {
  await apiClient.delete(
    `/services/${serviceId}/roles/${roleId}/institutions/${institutionId}`,
  );
}

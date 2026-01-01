import { apiClient } from './client';

export interface RoleRegistrationBinding {
  id: string;
  roleId: string;
  registrationId: string;
  registrationName: string;
  registrationKey: string;
  finalResultIssued: boolean;
  createdAt: string;
}

export interface RegistrationForBinding {
  id: string;
  name: string;
  key: string;
  isBound: boolean;
  bindingId?: string;
  finalResultIssued?: boolean;
}

export async function getRegistrationsForRole(
  serviceId: string,
  roleId: string,
): Promise<RegistrationForBinding[]> {
  const response = await apiClient.get<RegistrationForBinding[]>(
    `/services/${serviceId}/roles/${roleId}/registrations`,
  );
  return response.data;
}

export async function getBindingsForRole(
  serviceId: string,
  roleId: string,
): Promise<RoleRegistrationBinding[]> {
  const response = await apiClient.get<RoleRegistrationBinding[]>(
    `/services/${serviceId}/roles/${roleId}/registrations/bindings`,
  );
  return response.data;
}

export async function bindRegistration(
  serviceId: string,
  roleId: string,
  registrationId: string,
  finalResultIssued: boolean = false,
): Promise<RoleRegistrationBinding> {
  const response = await apiClient.post<RoleRegistrationBinding>(
    `/services/${serviceId}/roles/${roleId}/registrations/${registrationId}`,
    { finalResultIssued },
  );
  return response.data;
}

export async function unbindRegistration(
  serviceId: string,
  roleId: string,
  registrationId: string,
): Promise<void> {
  await apiClient.delete(
    `/services/${serviceId}/roles/${roleId}/registrations/${registrationId}`,
  );
}

export async function updateBinding(
  bindingId: string,
  finalResultIssued: boolean,
): Promise<RoleRegistrationBinding> {
  const response = await apiClient.patch<RoleRegistrationBinding>(
    `/role-registrations/${bindingId}`,
    { finalResultIssued },
  );
  return response.data;
}

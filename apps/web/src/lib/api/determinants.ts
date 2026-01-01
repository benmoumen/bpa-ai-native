/**
 * Determinants API Client
 *
 * Client for interacting with the Determinants API endpoints.
 * Determinants are business rule variables derived from form fields
 * used for workflow decisions and calculations.
 */

import type { ApiError, ApiResponse } from './services';

export type DeterminantType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'DATE';

/**
 * Determinant entity
 */
export interface Determinant {
  id: string;
  serviceId: string;
  name: string;
  type: DeterminantType;
  sourceFieldId: string | null;
  formula: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  linkedFieldCount?: number;
}

export interface CreateDeterminantInput {
  name: string;
  type: DeterminantType;
  sourceFieldId?: string;
  formula?: string;
}

export interface UpdateDeterminantInput {
  name?: string;
  type?: DeterminantType;
  formula?: string;
  isActive?: boolean;
}

export interface LinkFieldToDeterminantInput {
  determinantId: string;
}

/**
 * Field type to determinant type mapping
 */
export const FIELD_TYPE_TO_DETERMINANT_TYPE: Record<string, DeterminantType> = {
  TEXT: 'STRING',
  EMAIL: 'STRING',
  PHONE: 'STRING',
  TEXTAREA: 'STRING',
  SELECT: 'STRING',
  RADIO: 'STRING',
  NUMBER: 'NUMBER',
  CHECKBOX: 'BOOLEAN',
  DATE: 'DATE',
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get list of determinants for a service
 */
export async function getDeterminants(
  serviceId: string,
  params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    type?: DeterminantType;
    search?: string;
  }
): Promise<ApiResponse<Determinant[]>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.isActive !== undefined)
    searchParams.set('isActive', String(params.isActive));
  if (params?.type) searchParams.set('type', params.type);
  if (params?.search) searchParams.set('search', params.search);

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/api/v1/services/${serviceId}/determinants${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to fetch determinants' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Get a single determinant by ID
 */
export async function getDeterminant(id: string): Promise<Determinant> {
  const response = await fetch(`${API_BASE_URL}/api/v1/determinants/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to fetch determinant' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Create a new determinant within a service
 */
export async function createDeterminant(
  serviceId: string,
  input: CreateDeterminantInput
): Promise<Determinant> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${serviceId}/determinants`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to create determinant' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Update an existing determinant
 */
export async function updateDeterminant(
  id: string,
  input: UpdateDeterminantInput
): Promise<Determinant> {
  const response = await fetch(`${API_BASE_URL}/api/v1/determinants/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to update determinant' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Soft delete a determinant (sets isActive=false)
 */
export async function deleteDeterminant(id: string): Promise<Determinant> {
  const response = await fetch(`${API_BASE_URL}/api/v1/determinants/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to delete determinant' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Link a form field to a determinant
 */
export async function linkFieldToDeterminant(
  fieldId: string,
  determinantId: string
): Promise<{ field: { id: string; determinantId: string }; determinant: Determinant }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/form-fields/${fieldId}/link-determinant`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ determinantId }),
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to link field to determinant' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Unlink a form field from its determinant
 */
export async function unlinkFieldFromDeterminant(
  fieldId: string
): Promise<{ id: string; determinantId: null }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/form-fields/${fieldId}/link-determinant`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to unlink field from determinant' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

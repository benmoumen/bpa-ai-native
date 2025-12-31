/**
 * Forms API Client
 *
 * Client for interacting with the Forms API endpoints.
 * Forms represent data collection structures within a Service
 * (APPLICANT forms for citizens, GUIDE forms for operators).
 */

import type { ApiError, ApiResponse } from './services';

export type FormType = 'APPLICANT' | 'GUIDE';

export interface Form {
  id: string;
  serviceId: string;
  type: FormType;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormInput {
  name: string;
  type: FormType;
}

export interface UpdateFormInput {
  name?: string;
  type?: FormType;
  isActive?: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get list of forms for a service
 */
export async function getForms(
  serviceId: string,
  params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    type?: FormType;
  }
): Promise<ApiResponse<Form[]>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.isActive !== undefined)
    searchParams.set('isActive', String(params.isActive));
  if (params?.type) searchParams.set('type', params.type);

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/api/v1/services/${serviceId}/forms${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to fetch forms' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Get a single form by ID
 */
export async function getForm(id: string): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/v1/forms/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to fetch form' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Create a new form within a service
 */
export async function createForm(
  serviceId: string,
  input: CreateFormInput
): Promise<Form> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${serviceId}/forms`,
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
      error: { code: 'UNKNOWN', message: 'Failed to create form' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Update an existing form
 */
export async function updateForm(
  id: string,
  input: UpdateFormInput
): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/v1/forms/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to update form' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Soft delete a form (sets isActive=false)
 */
export async function deleteForm(id: string): Promise<Form> {
  const response = await fetch(`${API_BASE_URL}/api/v1/forms/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to delete form' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Services API Client
 *
 * Client for interacting with the Services API endpoints
 */

export interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  category?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasNext?: boolean;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Create a new service
 */
export async function createService(
  input: CreateServiceInput
): Promise<Service> {
  const response = await fetch(`${API_BASE_URL}/api/v1/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to create service' },
    }));
    throw new Error(error.error.message);
  }

  const result: ApiResponse<Service> = await response.json();
  return result.data;
}

/**
 * Get list of services with pagination
 */
export async function getServices(params?: {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  search?: string;
}): Promise<ApiResponse<Service[]>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.search) searchParams.set('search', params.search);

  const url = `${API_BASE_URL}/api/v1/services${searchParams.toString() ? `?${searchParams}` : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }

  return response.json();
}

/**
 * Get a single service by ID
 */
export async function getService(id: string): Promise<Service> {
  const response = await fetch(`${API_BASE_URL}/api/v1/services/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch service');
  }

  const result: ApiResponse<Service> = await response.json();
  return result.data;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  category?: string;
}

/**
 * Update an existing service
 */
export async function updateService(
  id: string,
  input: UpdateServiceInput
): Promise<Service> {
  const response = await fetch(`${API_BASE_URL}/api/v1/services/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to update service' },
    }));
    throw new Error(error.error.message);
  }

  const result: ApiResponse<Service> = await response.json();
  return result.data;
}

export interface DeleteServiceResponse {
  id: string;
  deleted: true;
}

/**
 * Duplicate an existing service
 *
 * Creates a copy of the service with name "[Original Name] (Copy)" and status DRAFT.
 * The duplicate is independent from the original.
 */
export async function duplicateService(id: string): Promise<Service> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${id}/duplicate`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to duplicate service' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Permanently delete a DRAFT service
 *
 * Only services with DRAFT status can be permanently deleted.
 * This action cannot be undone.
 */
export async function deleteServicePermanently(
  id: string
): Promise<DeleteServiceResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${id}/permanent`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to delete service' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Publish a DRAFT service
 *
 * Transitions a service from DRAFT to PUBLISHED status.
 * Only DRAFT services can be published.
 */
export async function publishService(id: string): Promise<Service> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${id}/publish`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to publish service' },
    }));
    throw new Error(error.error.message);
  }

  const result: ApiResponse<Service> = await response.json();
  return result.data;
}

/**
 * Archive a PUBLISHED service
 *
 * Transitions a service from PUBLISHED to ARCHIVED status.
 * Only PUBLISHED services can be archived.
 */
export async function archiveService(id: string): Promise<Service> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${id}/archive`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to archive service' },
    }));
    throw new Error(error.error.message);
  }

  const result: ApiResponse<Service> = await response.json();
  return result.data;
}

/**
 * Restore an ARCHIVED service to DRAFT
 *
 * Transitions a service from ARCHIVED to DRAFT status.
 * Only ARCHIVED services can be restored.
 */
export async function restoreService(id: string): Promise<Service> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${id}/restore`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to restore service' },
    }));
    throw new Error(error.error.message);
  }

  const result: ApiResponse<Service> = await response.json();
  return result.data;
}

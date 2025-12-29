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

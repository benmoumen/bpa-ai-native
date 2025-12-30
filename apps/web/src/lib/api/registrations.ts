/**
 * Registrations API Client
 *
 * Client for interacting with the Registrations API endpoints.
 * Registrations represent authorization types within a Service
 * (e.g., Business License, Import Permit, Export Certificate).
 */

export interface Registration {
  id: string;
  serviceId: string;
  name: string;
  shortName: string;
  key: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegistrationInput {
  name: string;
  shortName: string;
  key?: string; // Auto-generated from name if not provided
  description?: string;
}

export interface UpdateRegistrationInput {
  name?: string;
  shortName?: string;
  description?: string;
  sortOrder?: number;
  // Note: key cannot be updated after creation
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    perPage?: number;
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
 * Get list of registrations for a service
 */
export async function getRegistrations(
  serviceId: string,
  params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }
): Promise<ApiResponse<Registration[]>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.isActive !== undefined)
    searchParams.set('isActive', String(params.isActive));
  if (params?.search) searchParams.set('search', params.search);

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/api/v1/services/${serviceId}/registrations${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to fetch registrations' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Get a single registration by ID
 */
export async function getRegistration(id: string): Promise<Registration> {
  const response = await fetch(`${API_BASE_URL}/api/v1/registrations/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to fetch registration' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Create a new registration within a service
 */
export async function createRegistration(
  serviceId: string,
  input: CreateRegistrationInput
): Promise<Registration> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${serviceId}/registrations`,
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
      error: { code: 'UNKNOWN', message: 'Failed to create registration' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Update an existing registration
 */
export async function updateRegistration(
  id: string,
  input: UpdateRegistrationInput
): Promise<Registration> {
  const response = await fetch(`${API_BASE_URL}/api/v1/registrations/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to update registration' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Soft delete a registration (sets isActive=false)
 */
export async function deleteRegistration(id: string): Promise<Registration> {
  const response = await fetch(`${API_BASE_URL}/api/v1/registrations/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to delete registration' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Helper function to generate a key from a name (slugify)
 */
export function generateKeyFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 50);
}

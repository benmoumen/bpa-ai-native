/**
 * Templates API Client
 *
 * Client for interacting with the Templates API endpoints.
 * Templates are read-only public resources (no auth required).
 */

import type { ApiResponse, ApiError, Service } from './services';

export interface ServiceTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  previewImageUrl: string | null;
  formCount: number;
  workflowSteps: number;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get list of templates with pagination and filtering
 *
 * Templates endpoint is public - no authentication required.
 */
export async function getTemplates(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}): Promise<ApiResponse<ServiceTemplate[]>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.category) searchParams.set('category', params.category);
  if (params?.search) searchParams.set('search', params.search);

  const url = `${API_BASE_URL}/api/v1/templates${searchParams.toString() ? `?${searchParams}` : ''}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch templates');
  }

  return response.json();
}

/**
 * Get a single template by ID
 *
 * Templates endpoint is public - no authentication required.
 */
export async function getTemplate(id: string): Promise<ServiceTemplate> {
  const response = await fetch(`${API_BASE_URL}/api/v1/templates/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch template');
  }

  return response.json();
}

/**
 * Get list of unique template categories
 *
 * Templates endpoint is public - no authentication required.
 */
export async function getTemplateCategories(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/templates/categories`);

  if (!response.ok) {
    throw new Error('Failed to fetch template categories');
  }

  const result: { data: string[] } = await response.json();
  return result.data;
}

/**
 * Create a service from a template
 *
 * Creates a new service using the specified template as a starting point.
 * The service is created in DRAFT status with name "[Template Name] (Copy)".
 * Requires authentication.
 */
export async function createServiceFromTemplate(
  templateId: string
): Promise<Service> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/from-template/${templateId}`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to create service from template' },
    }));
    throw new Error(error.error.message);
  }

  // API returns Service directly, not wrapped in ApiResponse
  return response.json();
}

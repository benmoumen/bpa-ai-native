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

// ============================================================================
// Form Fields API
// ============================================================================

/**
 * Field type enum matching the backend
 */
export type FieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'DATE'
  | 'SELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'FILE'
  | 'EMAIL'
  | 'PHONE';

/**
 * Form field entity
 */
export interface FormField {
  id: string;
  formId: string;
  sectionId: string | null;
  type: string;
  label: string;
  name: string;
  required: boolean;
  properties: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFormFieldInput {
  type: string;
  label: string;
  name: string;
  sectionId?: string;
  required?: boolean;
  properties?: Record<string, unknown>;
  sortOrder?: number;
}

export interface UpdateFormFieldInput {
  type?: string;
  label?: string;
  name?: string;
  sectionId?: string | null;
  required?: boolean;
  properties?: Record<string, unknown>;
  sortOrder?: number;
}

/**
 * Get list of fields for a form
 */
export async function getFormFields(
  formId: string,
  params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }
): Promise<ApiResponse<FormField[]>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.isActive !== undefined)
    searchParams.set('isActive', String(params.isActive));

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/api/v1/forms/${formId}/fields${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to fetch form fields' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Get a single form field by ID
 */
export async function getFormField(id: string): Promise<FormField> {
  const response = await fetch(`${API_BASE_URL}/api/v1/form-fields/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to fetch form field' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Create a new field within a form
 */
export async function createFormField(
  formId: string,
  input: CreateFormFieldInput
): Promise<FormField> {
  const response = await fetch(`${API_BASE_URL}/api/v1/forms/${formId}/fields`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to create form field' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Update an existing form field
 */
export async function updateFormField(
  id: string,
  input: UpdateFormFieldInput
): Promise<FormField> {
  const response = await fetch(`${API_BASE_URL}/api/v1/form-fields/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to update form field' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Soft delete a form field (sets isActive=false)
 */
export async function deleteFormField(id: string): Promise<FormField> {
  const response = await fetch(`${API_BASE_URL}/api/v1/form-fields/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to delete form field' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a label to a valid field name (camelCase)
 * Examples:
 *   "Full Name" -> "fullName"
 *   "Date of Birth" -> "dateOfBirth"
 *   "Phone Number (Optional)" -> "phoneNumberOptional"
 */
export function labelToFieldName(label: string): string {
  return label
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .trim()
    .split(/\s+/)
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}

/**
 * Get default label for a field type
 */
export function getDefaultFieldLabel(type: FieldType): string {
  const labels: Record<FieldType, string> = {
    TEXT: 'New Text Field',
    TEXTAREA: 'New Text Area Field',
    NUMBER: 'New Number Field',
    DATE: 'New Date Field',
    SELECT: 'New Select Field',
    RADIO: 'New Radio Field',
    CHECKBOX: 'New Checkbox Field',
    FILE: 'New File Field',
    EMAIL: 'New Email Field',
    PHONE: 'New Phone Field',
  };
  return labels[type];
}

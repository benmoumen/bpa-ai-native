/**
 * Forms API Client
 *
 * Client for interacting with the Forms API endpoints.
 * Forms represent data collection structures within a Service
 * (APPLICANT forms for citizens, GUIDE forms for operators).
 */

import type { ApiError, ApiResponse } from './services';

export type FormType = 'APPLICANT' | 'GUIDE';

// ============================================================================
// Visibility Rule Types
// ============================================================================

/**
 * Visibility mode - determines whether a field/section is always visible or conditional
 */
export type VisibilityMode = 'always' | 'conditional';

/**
 * Visibility operators for conditional logic
 */
export type VisibilityOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty';

/**
 * Single visibility condition - compares a source field against a value
 */
export interface VisibilityCondition {
  /** Name of the field to check (must exist in the same form) */
  fieldName: string;
  /** Comparison operator */
  operator: VisibilityOperator;
  /** Value to compare against (optional for is_empty/is_not_empty) */
  value?: string | number | boolean;
}

/**
 * Visibility rule - defines when a field or section should be visible
 */
export interface VisibilityRule {
  /** Visibility mode: always visible or conditional */
  mode: VisibilityMode;
  /** Array of conditions (used when mode is 'conditional') */
  conditions?: VisibilityCondition[];
  /** Logical operator to combine conditions (default: 'AND') */
  logic?: 'AND' | 'OR';
}

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
  visibilityRule: VisibilityRule | null;
  sortOrder: number;
  isActive: boolean;
  determinantId: string | null;
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
  visibilityRule?: VisibilityRule | null;
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
// Form Sections API
// ============================================================================

/**
 * Form section entity
 */
export interface FormSection {
  id: string;
  formId: string;
  parentSectionId: string | null;
  name: string;
  description: string | null;
  sortOrder: number;
  visibilityRule: VisibilityRule | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  fieldCount?: number;
  childSectionCount?: number;
}

export interface CreateFormSectionInput {
  name: string;
  description?: string;
  parentSectionId?: string;
  sortOrder?: number;
}

export interface UpdateFormSectionInput {
  name?: string;
  description?: string | null;
  parentSectionId?: string | null;
  sortOrder?: number;
  visibilityRule?: VisibilityRule | null;
  isActive?: boolean;
}

/**
 * Get list of sections for a form
 */
export async function getFormSections(
  formId: string,
  params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }
): Promise<ApiResponse<FormSection[]>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.isActive !== undefined)
    searchParams.set('isActive', String(params.isActive));

  const queryString = searchParams.toString();
  const url = `${API_BASE_URL}/api/v1/forms/${formId}/sections${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to fetch form sections' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Get a single form section by ID
 */
export async function getFormSection(id: string): Promise<FormSection> {
  const response = await fetch(`${API_BASE_URL}/api/v1/form-sections/${id}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to fetch form section' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Create a new section within a form
 */
export async function createFormSection(
  formId: string,
  input: CreateFormSectionInput
): Promise<FormSection> {
  const response = await fetch(`${API_BASE_URL}/api/v1/forms/${formId}/sections`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to create form section' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Update an existing form section
 */
export async function updateFormSection(
  id: string,
  input: UpdateFormSectionInput
): Promise<FormSection> {
  const response = await fetch(`${API_BASE_URL}/api/v1/form-sections/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to update form section' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Soft delete a form section (sets isActive=false)
 */
export async function deleteFormSection(id: string): Promise<FormSection> {
  const response = await fetch(`${API_BASE_URL}/api/v1/form-sections/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to delete form section' },
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

// ============================================================================
// Form Schema Types & API (Story 3.10)
// ============================================================================

/**
 * JSON Schema property for a single field
 */
export interface JsonSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean';
  title: string;
  description?: string;
  format?: 'email' | 'date' | 'data-url';
  enum?: string[];
  enumNames?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  default?: unknown;
}

/**
 * Generated JSON Schema (Draft-07)
 */
export interface GeneratedJsonSchema {
  $schema: 'http://json-schema.org/draft-07/schema#';
  type: 'object';
  title: string;
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
}

/**
 * UI Schema element for JSON Forms
 */
export interface UiSchemaElement {
  type: 'Control' | 'Group' | 'VerticalLayout' | 'HorizontalLayout';
  scope?: string;
  label?: string;
  elements?: UiSchemaElement[];
  options?: {
    multi?: boolean;
    format?: string;
  };
}

/**
 * Generated UI Schema for JSON Forms layout
 */
export interface GeneratedUiSchema {
  type: 'VerticalLayout';
  elements: UiSchemaElement[];
}

/**
 * Visibility rule condition for JSON Rules Engine
 */
export interface VisibilityConditionExport {
  fact: string;
  operator: string;
  value: unknown;
}

/**
 * JSON Rules Engine compatible rule
 */
export interface JsonRulesEngineRule {
  conditions: {
    all?: VisibilityConditionExport[];
    any?: VisibilityConditionExport[];
  };
  event: {
    type: 'visible' | 'hidden';
  };
}

/**
 * Visibility rule mapping for a field or section
 */
export interface VisibilityRuleMapping {
  targetId: string;
  targetName: string;
  targetType: 'field' | 'section';
  rule: JsonRulesEngineRule;
}

/**
 * Exported visibility rules for fields and sections
 */
export interface VisibilityRulesExport {
  fields: VisibilityRuleMapping[];
  sections: VisibilityRuleMapping[];
}

/**
 * Complete form schema response
 */
export interface FormSchemaResponse {
  formId: string;
  formName: string;
  version: string;
  jsonSchema: GeneratedJsonSchema;
  uiSchema: GeneratedUiSchema;
  rules: VisibilityRulesExport;
}

/**
 * Get form schema (JSON Schema, UI Schema, and visibility rules)
 */
export async function getFormSchema(formId: string): Promise<FormSchemaResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/forms/${formId}/schema`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to fetch form schema' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

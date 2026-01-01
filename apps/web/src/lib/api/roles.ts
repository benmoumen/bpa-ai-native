/**
 * Roles API Client
 *
 * Client for interacting with the Roles API endpoints
 * Story 4-2: Define Workflow Steps
 */

import { ApiError, ApiResponse } from './services';

export type RoleType = 'USER' | 'BOT';

export interface Role {
  id: string;
  serviceId: string;
  roleType: RoleType;
  name: string;
  shortName: string | null;
  description: string | null;
  isStartRole: boolean;
  sortOrder: number;
  isActive: boolean;
  conditions: unknown | null;
  formId: string | null;
  retryEnabled: boolean | null;
  retryIntervalMinutes: number | null;
  timeoutMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  roleType: RoleType;
  name: string;
  shortName?: string;
  description?: string;
  isStartRole?: boolean;
  sortOrder?: number;
  formId?: string;
  retryEnabled?: boolean;
  retryIntervalMinutes?: number;
  timeoutMinutes?: number;
}

export interface UpdateRoleInput {
  name?: string;
  shortName?: string;
  description?: string;
  isStartRole?: boolean;
  sortOrder?: number;
  isActive?: boolean;
  formId?: string;
  retryEnabled?: boolean;
  retryIntervalMinutes?: number;
  timeoutMinutes?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get all roles for a service
 */
export async function getRoles(serviceId: string): Promise<ApiResponse<Role[]>> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${serviceId}/roles`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch roles');
  }

  return response.json();
}

/**
 * Get a single role by ID
 */
export async function getRole(roleId: string): Promise<Role> {
  const response = await fetch(`${API_BASE_URL}/api/v1/roles/${roleId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch role');
  }

  const result: ApiResponse<Role> = await response.json();
  return result.data;
}

/**
 * Create a new role for a service
 */
export async function createRole(
  serviceId: string,
  input: CreateRoleInput
): Promise<Role> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${serviceId}/roles`,
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
      error: { code: 'UNKNOWN', message: 'Failed to create role' },
    }));
    throw new Error(error.error.message);
  }

  const result: ApiResponse<Role> = await response.json();
  return result.data;
}

/**
 * Update an existing role
 */
export async function updateRole(
  roleId: string,
  input: UpdateRoleInput
): Promise<Role> {
  const response = await fetch(`${API_BASE_URL}/api/v1/roles/${roleId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to update role' },
    }));
    throw new Error(error.error.message);
  }

  const result: ApiResponse<Role> = await response.json();
  return result.data;
}

/**
 * Delete a role
 */
export async function deleteRole(roleId: string): Promise<{ id: string; deleted: true }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/roles/${roleId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to delete role' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Get the start role for a service
 */
export async function getStartRole(serviceId: string): Promise<Role | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${serviceId}/roles/start`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch start role');
  }

  const result: ApiResponse<Role> = await response.json();
  return result.data;
}

/**
 * Set a role as the start role for a service
 */
export async function setStartRole(
  serviceId: string,
  roleId: string
): Promise<Role> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${serviceId}/roles/${roleId}/start`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to set start role' },
    }));
    throw new Error(error.error.message);
  }

  const result: ApiResponse<Role> = await response.json();
  return result.data;
}

// ============================================================================
// Workflow Graph Types (Story 4-7)
// ============================================================================

export type ActorType = 'APPLICANT' | 'OPERATOR' | 'SYSTEM';

export interface WorkflowNodeData extends Record<string, unknown> {
  name: string;
  roleType: RoleType;
  actorType: ActorType;
  formName?: string;
  statuses: { id: string; code: string; name: string }[];
  isStartRole: boolean;
}

export interface WorkflowNode {
  id: string;
  type: string;
  data: WorkflowNodeData;
  position: { x: number; y: number };
}

export interface WorkflowEdgeData extends Record<string, unknown> {
  statusCode: 'PASSED' | 'RETURNED' | 'REJECTED';
  conditionSummary?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  data: WorkflowEdgeData;
}

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/**
 * Get workflow graph data for visualization
 */
export async function getWorkflowGraph(serviceId: string): Promise<WorkflowGraph> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${serviceId}/roles/workflow-graph`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch workflow graph');
  }

  const result: ApiResponse<WorkflowGraph> = await response.json();
  return result.data;
}

// ============================================================================
// Workflow Validation Types (Story 4-8)
// ============================================================================

export type ValidationSeverity = 'ERROR' | 'WARNING';

export type ValidationIssueCode =
  | 'NO_START_ROLE'
  | 'MULTIPLE_START_ROLES'
  | 'NO_END_ROLE'
  | 'ORPHAN_ROLE'
  | 'UNREACHABLE_ROLE'
  | 'NO_TRANSITIONS'
  | 'NO_ROLES';

export interface ValidationIssue {
  code: ValidationIssueCode;
  severity: ValidationSeverity;
  message: string;
  roleId?: string;
  roleName?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  validatedAt: string;
  errorCount: number;
  warningCount: number;
}

/**
 * Validate workflow configuration for a service
 */
export async function validateWorkflow(serviceId: string): Promise<ValidationResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/services/${serviceId}/roles/validate`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to validate workflow');
  }

  const result: ApiResponse<ValidationResult> = await response.json();
  return result.data;
}

/**
 * Transitions API Client
 *
 * Client for interacting with the Workflow Transitions API endpoints
 * Story 4-3: Configure Workflow Transitions
 */

import { ApiError } from './services';

export type RoleStatusCode = 'PENDING' | 'PASSED' | 'RETURNED' | 'REJECTED';

export interface RoleStatus {
  id: string;
  roleId: string;
  code: RoleStatusCode;
  name: string;
  isDefault: boolean;
  sortOrder: number;
  conditions: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTransition {
  id: string;
  fromStatusId: string;
  toRoleId: string;
  sortOrder: number;
  conditions: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransitionInput {
  fromStatusId: string;
  toRoleId: string;
  sortOrder?: number;
  conditions?: Record<string, unknown>;
}

export interface UpdateTransitionInput {
  toRoleId?: string;
  sortOrder?: number;
  conditions?: Record<string, unknown>;
}

export interface UpdateRoleStatusInput {
  name?: string;
  sortOrder?: number;
  conditions?: Record<string, unknown>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Get all transitions for a service
 */
export async function getTransitions(serviceId: string): Promise<WorkflowTransition[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/transitions?serviceId=${serviceId}`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch transitions');
  }

  return response.json();
}

/**
 * Get transitions from a specific status
 */
export async function getTransitionsFromStatus(statusId: string): Promise<WorkflowTransition[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/transitions/from-status/${statusId}`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch transitions');
  }

  return response.json();
}

/**
 * Get transitions to a specific role
 */
export async function getTransitionsToRole(roleId: string): Promise<WorkflowTransition[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/transitions/to-role/${roleId}`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch transitions');
  }

  return response.json();
}

/**
 * Get a single transition by ID
 */
export async function getTransition(transitionId: string): Promise<WorkflowTransition> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/transitions/${transitionId}`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch transition');
  }

  return response.json();
}

/**
 * Create a new transition
 */
export async function createTransition(
  input: CreateTransitionInput
): Promise<WorkflowTransition> {
  const response = await fetch(`${API_BASE_URL}/api/v1/transitions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to create transition' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Update an existing transition
 */
export async function updateTransition(
  transitionId: string,
  input: UpdateTransitionInput
): Promise<WorkflowTransition> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/transitions/${transitionId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to update transition' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Delete a transition
 */
export async function deleteTransition(transitionId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/transitions/${transitionId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to delete transition' },
    }));
    throw new Error(error.error.message);
  }
}

/**
 * Get all statuses for a role
 */
export async function getRoleStatuses(roleId: string): Promise<RoleStatus[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/roles/${roleId}/statuses`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch role statuses');
  }

  return response.json();
}

/**
 * Create default 4-status set for a role
 */
export async function createDefaultStatuses(roleId: string): Promise<RoleStatus[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/roles/${roleId}/statuses/defaults`,
    {
      method: 'POST',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to create default statuses' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Update a role status (name, sortOrder, conditions)
 * Story 4-4: Specify Step Actions
 */
export async function updateRoleStatus(
  statusId: string,
  input: UpdateRoleStatusInput
): Promise<RoleStatus> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/role-statuses/${statusId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to update role status' },
    }));
    throw new Error(error.error.message);
  }

  return response.json();
}

/**
 * Delete a role status
 * Story 4-4: Specify Step Actions
 */
export async function deleteRoleStatus(statusId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/role-statuses/${statusId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: { code: 'UNKNOWN', message: 'Failed to delete role status' },
    }));
    throw new Error(error.error.message);
  }
}

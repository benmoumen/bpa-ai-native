/**
 * Context Layer - State management for AI Agent
 *
 * Implements Story 6-1d: Backend Event Stream (partial)
 * Placeholder for now, will be implemented in 6-1d
 */

export const CONTEXT_VERSION = '0.0.1' as const;

export interface ContextSnapshot {
  serviceId?: string;
  forms: unknown[];
  workflow: unknown;
  registrations: unknown[];
  timestamp: number;
}

// Placeholder exports - will be implemented in Story 6-1d
export function createContextSnapshot(_serviceId: string): Promise<ContextSnapshot> {
  throw new Error('Not implemented - see Story 6-1d');
}

export function subscribeToContextChanges(
  _serviceId: string,
  _callback: (snapshot: ContextSnapshot) => void,
): () => void {
  throw new Error('Not implemented - see Story 6-1d');
}

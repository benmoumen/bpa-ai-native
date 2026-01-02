/**
 * Observability Layer - Audit logging and cost tracking
 *
 * Implements Story 6-1e: Observability Layer
 * Placeholder for now, will be implemented in 6-1e
 */

export const OBSERVABILITY_VERSION = '0.0.1' as const;

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  sessionId: string;
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
  durationMs: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    costUsd: number;
  };
}

// Placeholder exports - will be implemented in Story 6-1e
export function logAuditEntry(_entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
  // Will be implemented in Story 6-1e
}

export function getSessionCost(_sessionId: string): number {
  return 0;
}

export function getAuditLog(_sessionId: string): AuditEntry[] {
  return [];
}

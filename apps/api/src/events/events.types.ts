/**
 * Event Types for WebSocket Communication
 *
 * Story 6-1d: Backend Event Stream
 */

export type EntityType =
  | 'service'
  | 'registration'
  | 'form'
  | 'formField'
  | 'formSection'
  | 'role'
  | 'transition'
  | 'determinant'
  | 'cost'
  | 'documentRequirement';

export type EventAction = 'created' | 'updated' | 'deleted';

export interface EntityEvent {
  /** Event ID for deduplication */
  id: string;
  /** Event type in format entity.action */
  type: `${EntityType}.${EventAction}`;
  /** Entity being affected */
  entityType: EntityType;
  /** Action performed */
  action: EventAction;
  /** Entity ID */
  entityId: string;
  /** Service ID for scoping */
  serviceId: string;
  /** User who triggered the event */
  userId: string;
  /** Timestamp of the event */
  timestamp: number;
  /** Entity data (for created/updated) */
  data?: Record<string, unknown>;
  /** Previous data (for updated) */
  previousData?: Record<string, unknown>;
}

export interface SubscribePayload {
  serviceId: string;
}

export interface UnsubscribePayload {
  serviceId: string;
}

export interface EventAck {
  eventId: string;
  received: boolean;
}

/**
 * WebSocket events from server to client
 */
export interface ServerToClientEvents {
  'entity.event': (event: EntityEvent) => void;
  'subscription.confirmed': (payload: { serviceId: string }) => void;
  'subscription.removed': (payload: { serviceId: string }) => void;
  error: (payload: { message: string; code?: string }) => void;
}

/**
 * WebSocket events from client to server
 */
export interface ClientToServerEvents {
  subscribe: (payload: SubscribePayload) => void;
  unsubscribe: (payload: UnsubscribePayload) => void;
  'event.ack': (payload: EventAck) => void;
}

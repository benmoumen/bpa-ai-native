/**
 * Context Types for AI Agent State Management
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

/**
 * Entity data types
 */
export type EntityData =
  | FormEntity
  | FormSectionEntity
  | FormFieldEntity
  | RoleEntity
  | TransitionEntity
  | RegistrationEntity
  | DeterminantEntity
  | Record<string, unknown>;

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
  data?: EntityData;
  /** Previous data (for updated) */
  previousData?: EntityData;
}

/**
 * Form entity
 */
export interface FormEntity {
  id: string;
  name: string;
  description?: string;
  type: 'APPLICANT' | 'GUIDE';
  sections: FormSectionEntity[];
  updatedAt: number;
}

/**
 * Form section entity
 */
export interface FormSectionEntity {
  id: string;
  title: string;
  order: number;
  fields: FormFieldEntity[];
}

/**
 * Form field entity
 */
export interface FormFieldEntity {
  id: string;
  name: string;
  label: string;
  fieldType: string;
  required: boolean;
  order: number;
}

/**
 * Role entity
 */
export interface RoleEntity {
  id: string;
  name: string;
  code: string;
  roleType: 'USER' | 'BOT';
  order: number;
}

/**
 * Transition entity
 */
export interface TransitionEntity {
  id: string;
  fromRoleId: string | null;
  toRoleId: string;
  condition?: string;
}

/**
 * Registration entity
 */
export interface RegistrationEntity {
  id: string;
  name: string;
  description?: string;
}

/**
 * Determinant entity
 */
export interface DeterminantEntity {
  id: string;
  name: string;
  fieldId: string;
  determinantType: string;
}

/**
 * Context snapshot for a service
 */
export interface ContextSnapshot {
  serviceId: string;
  serviceName: string;
  forms: FormEntity[];
  roles: RoleEntity[];
  transitions: TransitionEntity[];
  registrations: RegistrationEntity[];
  determinants: DeterminantEntity[];
  timestamp: number;
  version: number;
}

/**
 * Connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * Context store state
 */
export interface ContextStoreState {
  /** Current service context */
  context: ContextSnapshot | null;
  /** Connection state */
  connectionState: ConnectionState;
  /** Error message if any */
  error: string | null;
  /** Processed event IDs for deduplication */
  processedEventIds: Set<string>;
  /** Last event timestamp */
  lastEventTimestamp: number | null;

  // Actions
  setContext: (context: ContextSnapshot) => void;
  setConnectionState: (state: ConnectionState) => void;
  setError: (error: string | null) => void;
  applyEvent: (event: EntityEvent) => void;
  reset: () => void;
}

/**
 * WebSocket client options
 */
export interface EventsClientOptions {
  /** WebSocket server URL */
  url: string;
  /** Authentication token */
  token: string;
  /** Service ID to subscribe to */
  serviceId: string;
  /** Initial reconnection delay in ms */
  reconnectDelayMs?: number;
  /** Maximum reconnection delay in ms */
  maxReconnectDelayMs?: number;
  /** Backoff multiplier */
  backoffMultiplier?: number;
  /** Maximum reconnection attempts */
  maxReconnectAttempts?: number;
}

/**
 * Event listener callback
 */
export type EventListener = (event: EntityEvent) => void;

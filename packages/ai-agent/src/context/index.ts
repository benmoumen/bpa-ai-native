/**
 * Context Layer - State management and Real-Time Events
 *
 * Story 6-1d: Backend Event Stream
 */

export const CONTEXT_VERSION = '0.0.1' as const;

// Types
export type {
  EntityType,
  EventAction,
  EntityEvent,
  FormEntity,
  FormSectionEntity,
  FormFieldEntity,
  RoleEntity,
  TransitionEntity,
  RegistrationEntity,
  DeterminantEntity,
  ContextSnapshot,
  ConnectionState,
  ContextStoreState,
  EventsClientOptions,
  EventListener,
} from './types.js';

// Store
export { createContextStore, type ContextStore } from './store.js';

// Events Client
export {
  EventsClient,
  createEventsClient,
  TabCoordinator,
  createTabCoordinator,
} from './events.js';

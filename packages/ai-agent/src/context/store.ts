/**
 * Zustand Store for Context State Management
 *
 * Story 6-1d: Backend Event Stream
 */

import { createStore, type StoreApi } from 'zustand/vanilla';
import type {
  ContextSnapshot,
  ContextStoreState,
  ConnectionState,
  EntityEvent,
  FormEntity,
  RoleEntity,
  TransitionEntity,
  RegistrationEntity,
  DeterminantEntity,
} from './types.js';

/** Zustand store type */
export type ContextStore = StoreApi<ContextStoreState>;

/**
 * Default context snapshot
 */
const createDefaultContext = (serviceId: string): ContextSnapshot => ({
  serviceId,
  serviceName: '',
  forms: [],
  roles: [],
  transitions: [],
  registrations: [],
  determinants: [],
  timestamp: Date.now(),
  version: 0,
});

/**
 * Create context store for a service
 */
export function createContextStore(serviceId: string): ContextStore {
  return createStore<ContextStoreState>((set, get) => ({
    context: createDefaultContext(serviceId),
    connectionState: 'disconnected',
    error: null,
    processedEventIds: new Set<string>(),
    lastEventTimestamp: null,

    setContext: (context: ContextSnapshot) => {
      set({ context, error: null });
    },

    setConnectionState: (connectionState: ConnectionState) => {
      set({ connectionState });
    },

    setError: (error: string | null) => {
      set({ error });
    },

    applyEvent: (event: EntityEvent) => {
      const state = get();

      // Deduplication check
      if (state.processedEventIds.has(event.id)) {
        return;
      }

      // Add to processed events (keep last 1000)
      const newProcessedIds = new Set(state.processedEventIds);
      newProcessedIds.add(event.id);
      if (newProcessedIds.size > 1000) {
        const idsArray = Array.from(newProcessedIds);
        idsArray.splice(0, idsArray.length - 1000);
        newProcessedIds.clear();
        idsArray.forEach((id) => newProcessedIds.add(id));
      }

      const context = state.context;
      if (!context) return;

      // Apply event to context based on entity type and action
      const updatedContext = applyEventToContext(context, event);

      set({
        context: updatedContext,
        processedEventIds: newProcessedIds,
        lastEventTimestamp: event.timestamp,
      });
    },

    reset: () => {
      set({
        context: createDefaultContext(serviceId),
        connectionState: 'disconnected',
        error: null,
        processedEventIds: new Set(),
        lastEventTimestamp: null,
      });
    },
  }));
}

/**
 * Apply an event to the context snapshot
 */
function applyEventToContext(context: ContextSnapshot, event: EntityEvent): ContextSnapshot {
  const { entityType, action, entityId, data } = event;

  switch (entityType) {
    case 'form':
      return {
        ...context,
        forms: applyToArray(context.forms, action, entityId, data as FormEntity | undefined),
        version: context.version + 1,
        timestamp: event.timestamp,
      };

    case 'role':
      return {
        ...context,
        roles: applyToArray(context.roles, action, entityId, data as RoleEntity | undefined),
        version: context.version + 1,
        timestamp: event.timestamp,
      };

    case 'transition':
      return {
        ...context,
        transitions: applyToArray(
          context.transitions,
          action,
          entityId,
          data as TransitionEntity | undefined,
        ),
        version: context.version + 1,
        timestamp: event.timestamp,
      };

    case 'registration':
      return {
        ...context,
        registrations: applyToArray(
          context.registrations,
          action,
          entityId,
          data as RegistrationEntity | undefined,
        ),
        version: context.version + 1,
        timestamp: event.timestamp,
      };

    case 'determinant':
      return {
        ...context,
        determinants: applyToArray(
          context.determinants,
          action,
          entityId,
          data as DeterminantEntity | undefined,
        ),
        version: context.version + 1,
        timestamp: event.timestamp,
      };

    case 'service':
      // Update service name if provided
      if (action === 'updated' && data && 'name' in data) {
        return {
          ...context,
          serviceName: data.name as string,
          version: context.version + 1,
          timestamp: event.timestamp,
        };
      }
      return context;

    default:
      // For nested entities (formField, formSection), we'd need more complex updates
      // For now, bump version to signal staleness
      return {
        ...context,
        version: context.version + 1,
        timestamp: event.timestamp,
      };
  }
}

/**
 * Apply CRUD action to an array of entities
 */
function applyToArray<T extends { id: string }>(
  array: T[],
  action: EntityEvent['action'],
  entityId: string,
  data?: T,
): T[] {
  switch (action) {
    case 'created':
      if (!data) return array;
      // Avoid duplicates
      if (array.some((item) => item.id === entityId)) return array;
      return [...array, data];

    case 'updated':
      if (!data) return array;
      return array.map((item) => (item.id === entityId ? { ...item, ...data } : item));

    case 'deleted':
      return array.filter((item) => item.id !== entityId);

    default:
      return array;
  }
}


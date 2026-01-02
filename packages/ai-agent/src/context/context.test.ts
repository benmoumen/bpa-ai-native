import { describe, it, expect, beforeEach } from 'vitest';
import { createContextStore } from './store.js';
import type { EntityEvent, ContextSnapshot, FormEntity } from './types.js';

describe('createContextStore', () => {
  const serviceId = 'test-service-123';

  describe('initial state', () => {
    it('should initialize with default context', () => {
      const store = createContextStore(serviceId);
      const state = store.getState();

      expect(state.context?.serviceId).toBe(serviceId);
      expect(state.context?.forms).toEqual([]);
      expect(state.context?.roles).toEqual([]);
      expect(state.connectionState).toBe('disconnected');
      expect(state.error).toBeNull();
    });

    it('should initialize with empty processed events', () => {
      const store = createContextStore(serviceId);
      const state = store.getState();

      expect(state.processedEventIds.size).toBe(0);
      expect(state.lastEventTimestamp).toBeNull();
    });
  });

  describe('setContext', () => {
    it('should update context', () => {
      const store = createContextStore(serviceId);
      const newContext: ContextSnapshot = {
        serviceId,
        serviceName: 'Test Service',
        forms: [{ id: 'form-1', name: 'Form 1', type: 'APPLICANT', sections: [], updatedAt: Date.now() }],
        roles: [],
        transitions: [],
        registrations: [],
        determinants: [],
        timestamp: Date.now(),
        version: 1,
      };

      store.getState().setContext(newContext);
      const state = store.getState();

      expect(state.context).toEqual(newContext);
      expect(state.error).toBeNull();
    });
  });

  describe('setConnectionState', () => {
    it('should update connection state', () => {
      const store = createContextStore(serviceId);

      store.getState().setConnectionState('connecting');
      expect(store.getState().connectionState).toBe('connecting');

      store.getState().setConnectionState('connected');
      expect(store.getState().connectionState).toBe('connected');
    });
  });

  describe('setError', () => {
    it('should set and clear error', () => {
      const store = createContextStore(serviceId);

      store.getState().setError('Connection failed');
      expect(store.getState().error).toBe('Connection failed');

      store.getState().setError(null);
      expect(store.getState().error).toBeNull();
    });
  });

  describe('applyEvent', () => {
    let store: ReturnType<typeof createContextStore>;

    beforeEach(() => {
      store = createContextStore(serviceId);
    });

    describe('form events', () => {
      it('should add form on created event', () => {
        const form: FormEntity = {
          id: 'form-1',
          name: 'Test Form',
          type: 'APPLICANT',
          sections: [],
          updatedAt: Date.now(),
        };

        const event: EntityEvent = {
          id: 'evt-1',
          type: 'form.created',
          entityType: 'form',
          action: 'created',
          entityId: form.id,
          serviceId,
          userId: 'user-1',
          timestamp: Date.now(),
          data: form,
        };

        store.getState().applyEvent(event);
        const state = store.getState();

        expect(state.context?.forms).toHaveLength(1);
        expect(state.context?.forms[0]).toEqual(form);
        expect(state.context?.version).toBe(1);
      });

      it('should update form on updated event', () => {
        // First add a form
        const form: FormEntity = {
          id: 'form-1',
          name: 'Original Name',
          type: 'APPLICANT',
          sections: [],
          updatedAt: Date.now(),
        };

        store.getState().applyEvent({
          id: 'evt-1',
          type: 'form.created',
          entityType: 'form',
          action: 'created',
          entityId: form.id,
          serviceId,
          userId: 'user-1',
          timestamp: Date.now(),
          data: form,
        });

        // Then update it
        const updatedForm = { ...form, name: 'Updated Name' };
        store.getState().applyEvent({
          id: 'evt-2',
          type: 'form.updated',
          entityType: 'form',
          action: 'updated',
          entityId: form.id,
          serviceId,
          userId: 'user-1',
          timestamp: Date.now(),
          data: updatedForm,
        });

        const state = store.getState();
        expect(state.context?.forms[0]?.name).toBe('Updated Name');
        expect(state.context?.version).toBe(2);
      });

      it('should remove form on deleted event', () => {
        // First add a form
        const form: FormEntity = {
          id: 'form-1',
          name: 'Test Form',
          type: 'APPLICANT',
          sections: [],
          updatedAt: Date.now(),
        };

        store.getState().applyEvent({
          id: 'evt-1',
          type: 'form.created',
          entityType: 'form',
          action: 'created',
          entityId: form.id,
          serviceId,
          userId: 'user-1',
          timestamp: Date.now(),
          data: form,
        });

        // Then delete it
        store.getState().applyEvent({
          id: 'evt-2',
          type: 'form.deleted',
          entityType: 'form',
          action: 'deleted',
          entityId: form.id,
          serviceId,
          userId: 'user-1',
          timestamp: Date.now(),
        });

        const state = store.getState();
        expect(state.context?.forms).toHaveLength(0);
      });
    });

    describe('role events', () => {
      it('should add role on created event', () => {
        const role = {
          id: 'role-1',
          name: 'Reviewer',
          code: 'REVIEWER',
          roleType: 'USER' as const,
          order: 1,
        };

        store.getState().applyEvent({
          id: 'evt-1',
          type: 'role.created',
          entityType: 'role',
          action: 'created',
          entityId: role.id,
          serviceId,
          userId: 'user-1',
          timestamp: Date.now(),
          data: role,
        });

        const state = store.getState();
        expect(state.context?.roles).toHaveLength(1);
        expect(state.context?.roles[0]?.name).toBe('Reviewer');
      });
    });

    describe('service events', () => {
      it('should update service name on updated event', () => {
        store.getState().applyEvent({
          id: 'evt-1',
          type: 'service.updated',
          entityType: 'service',
          action: 'updated',
          entityId: serviceId,
          serviceId,
          userId: 'user-1',
          timestamp: Date.now(),
          data: { name: 'New Service Name' },
        });

        const state = store.getState();
        expect(state.context?.serviceName).toBe('New Service Name');
      });
    });

    describe('deduplication', () => {
      it('should ignore duplicate events', () => {
        const form: FormEntity = {
          id: 'form-1',
          name: 'Test Form',
          type: 'APPLICANT',
          sections: [],
          updatedAt: Date.now(),
        };

        const event: EntityEvent = {
          id: 'evt-1',
          type: 'form.created',
          entityType: 'form',
          action: 'created',
          entityId: form.id,
          serviceId,
          userId: 'user-1',
          timestamp: Date.now(),
          data: form,
        };

        // Apply same event twice
        store.getState().applyEvent(event);
        store.getState().applyEvent(event);

        const state = store.getState();
        expect(state.context?.forms).toHaveLength(1);
        expect(state.context?.version).toBe(1);
      });

      it('should track processed event IDs', () => {
        const event: EntityEvent = {
          id: 'evt-1',
          type: 'form.created',
          entityType: 'form',
          action: 'created',
          entityId: 'form-1',
          serviceId,
          userId: 'user-1',
          timestamp: Date.now(),
          data: { id: 'form-1', name: 'Form 1', type: 'APPLICANT', sections: [], updatedAt: Date.now() },
        };

        store.getState().applyEvent(event);
        const state = store.getState();

        expect(state.processedEventIds.has('evt-1')).toBe(true);
      });

      it('should limit processed event IDs to 1000', () => {
        // Apply 1100 events
        for (let i = 0; i < 1100; i++) {
          store.getState().applyEvent({
            id: `evt-${String(i)}`,
            type: 'form.updated',
            entityType: 'form',
            action: 'updated',
            entityId: 'form-1',
            serviceId,
            userId: 'user-1',
            timestamp: Date.now(),
          });
        }

        const state = store.getState();
        expect(state.processedEventIds.size).toBeLessThanOrEqual(1000);
      });
    });

    describe('timestamp tracking', () => {
      it('should update lastEventTimestamp', () => {
        const timestamp = Date.now();

        store.getState().applyEvent({
          id: 'evt-1',
          type: 'form.created',
          entityType: 'form',
          action: 'created',
          entityId: 'form-1',
          serviceId,
          userId: 'user-1',
          timestamp,
          data: { id: 'form-1', name: 'Form 1', type: 'APPLICANT', sections: [], updatedAt: timestamp },
        });

        const state = store.getState();
        expect(state.lastEventTimestamp).toBe(timestamp);
      });
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const store = createContextStore(serviceId);

      // Make some changes
      store.getState().setConnectionState('connected');
      store.getState().setError('Some error');
      store.getState().applyEvent({
        id: 'evt-1',
        type: 'form.created',
        entityType: 'form',
        action: 'created',
        entityId: 'form-1',
        serviceId,
        userId: 'user-1',
        timestamp: Date.now(),
        data: { id: 'form-1', name: 'Form 1', type: 'APPLICANT', sections: [], updatedAt: Date.now() },
      });

      // Reset
      store.getState().reset();

      const state = store.getState();
      expect(state.connectionState).toBe('disconnected');
      expect(state.error).toBeNull();
      expect(state.context?.forms).toHaveLength(0);
      expect(state.processedEventIds.size).toBe(0);
    });
  });
});

describe('EventsClient', () => {
  // Note: EventsClient tests would require mocking socket.io-client
  // These are integration tests that should run against a test server
  // For now, we test the basic instantiation

  it('should be importable', async () => {
    const { EventsClient, createEventsClient } = await import('./events.js');
    expect(EventsClient).toBeDefined();
    expect(createEventsClient).toBeDefined();
  });

  it('should create client with options', async () => {
    const { createEventsClient } = await import('./events.js');

    const client = createEventsClient({
      url: 'http://localhost:4000',
      token: 'test-token',
      serviceId: 'service-123',
    });

    expect(client.isConnected()).toBe(false);
  });
});

describe('TabCoordinator', () => {
  it('should be importable', async () => {
    const { TabCoordinator, createTabCoordinator } = await import('./events.js');
    expect(TabCoordinator).toBeDefined();
    expect(createTabCoordinator).toBeDefined();
  });

  // Note: BroadcastChannel tests require browser environment
  // These would be better tested in integration/e2e tests
});

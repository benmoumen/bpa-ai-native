/**
 * WebSocket Event Client for Real-Time Updates
 *
 * Story 6-1d: Backend Event Stream
 *
 * Features:
 * - Socket.IO client with JWT authentication
 * - Automatic reconnection with exponential backoff
 * - Event deduplication via store
 * - Multi-tab coordination
 */

import { io, Socket } from 'socket.io-client';
import type {
  EntityEvent,
  EventsClientOptions,
  EventListener,
  ConnectionState,
} from './types.js';
import type { ContextStore } from './store.js';

/**
 * Default client options
 */
const DEFAULT_OPTIONS: Partial<EventsClientOptions> = {
  reconnectDelayMs: 1000,
  maxReconnectDelayMs: 30000,
  backoffMultiplier: 2,
  maxReconnectAttempts: 10,
};

/**
 * Events Client for WebSocket Communication
 */
export class EventsClient {
  private socket: Socket | null = null;
  private readonly options: Required<EventsClientOptions>;
  private store: ContextStore | null = null;
  private listeners: Set<EventListener> = new Set();
  private reconnectAttempt = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: EventsClientOptions) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    } as Required<EventsClientOptions>;
  }

  /**
   * Update connection state in store
   * Note: ESLint incorrectly infers 'error' type from Zustand store,
   * but the store.getState() is correctly typed as ContextStoreState
   */
  private updateConnectionState(connState: ConnectionState): void {
    if (this.store) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.store.getState().setConnectionState(connState);
    }
  }

  /**
   * Update error in store
   */
  private updateError(errorMsg: string | null): void {
    if (this.store) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.store.getState().setError(errorMsg);
    }
  }

  /**
   * Apply event to store
   */
  private applyEventToStore(event: EntityEvent): void {
    if (this.store) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.store.getState().applyEvent(event);
    }
  }

  /**
   * Connect to the WebSocket server
   */
  connect(store?: ContextStore): void {
    if (this.socket?.connected) {
      return;
    }

    if (store) {
      this.store = store;
    }

    this.updateConnectionState('connecting');

    this.socket = io(this.options.url, {
      path: '/ws/events',
      transports: ['websocket'],
      auth: {
        token: this.options.token,
      },
      reconnection: false, // We handle reconnection manually
    });

    this.setupEventHandlers();
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.clearReconnectTimeout();
    this.reconnectAttempt = 0;

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.updateConnectionState('disconnected');
  }

  /**
   * Subscribe to entity events for a service
   */
  subscribe(serviceId?: string): void {
    const targetServiceId = serviceId || this.options.serviceId;

    if (this.socket?.connected) {
      this.socket.emit('subscribe', { serviceId: targetServiceId });
    }
  }

  /**
   * Unsubscribe from entity events for a service
   */
  unsubscribe(serviceId?: string): void {
    const targetServiceId = serviceId || this.options.serviceId;

    if (this.socket?.connected) {
      this.socket.emit('unsubscribe', { serviceId: targetServiceId });
    }
  }

  /**
   * Add an event listener
   */
  addEventListener(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(listener: EventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.reconnectAttempt = 0;
      this.updateConnectionState('connected');
      this.updateError(null);

      // Auto-subscribe to service
      this.subscribe();
    });

    this.socket.on('disconnect', (reason) => {
      this.updateConnectionState('disconnected');

      // Attempt reconnection for recoverable disconnects
      if (reason === 'io server disconnect') {
        // Server disconnected us, don't reconnect
        this.updateError('Server disconnected the connection');
      } else {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      this.updateError(`Connection error: ${error.message}`);
      this.attemptReconnect();
    });

    this.socket.on('entity.event', (event: EntityEvent) => {
      // Apply to store
      this.applyEventToStore(event);

      // Notify listeners
      this.listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.error('Event listener error:', err);
        }
      });

      // Acknowledge receipt
      this.socket?.emit('event.ack', { eventId: event.id, received: true });
    });

    this.socket.on('subscription.confirmed', (payload: { serviceId: string }) => {
      console.debug(`Subscribed to service ${payload.serviceId}`);
    });

    this.socket.on('error', (payload: { message: string }) => {
      this.updateError(payload.message);
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempt >= this.options.maxReconnectAttempts) {
      this.updateError('Maximum reconnection attempts reached');
      this.updateConnectionState('disconnected');
      return;
    }

    this.clearReconnectTimeout();
    this.updateConnectionState('reconnecting');

    const delay = Math.min(
      this.options.reconnectDelayMs * Math.pow(this.options.backoffMultiplier, this.reconnectAttempt),
      this.options.maxReconnectDelayMs,
    );

    this.reconnectAttempt++;

    this.reconnectTimeout = setTimeout(() => {
      this.socket?.connect();
    }, delay);
  }

  /**
   * Clear reconnect timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
}

/**
 * Create an events client
 */
export function createEventsClient(options: EventsClientOptions): EventsClient {
  return new EventsClient(options);
}

/**
 * BroadcastChannel message shape
 */
interface BroadcastMessage {
  type: string;
  payload: EntityEvent;
}

/**
 * Multi-tab coordination using BroadcastChannel
 */
export class TabCoordinator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private channel: any = null;
  private readonly channelName: string;
  private store: ContextStore | null = null;

  constructor(serviceId: string) {
    this.channelName = `bpa-events-${serviceId}`;

    // BroadcastChannel is only available in browser
    if (typeof globalThis !== 'undefined' && 'BroadcastChannel' in globalThis) {
      this.channel = new (globalThis as { BroadcastChannel: new (name: string) => unknown }).BroadcastChannel(this.channelName);
      this.setupChannelHandler();
    }
  }

  /**
   * Set the store to sync
   */
  setStore(store: ContextStore): void {
    this.store = store;
  }

  /**
   * Broadcast an event to other tabs
   */
  broadcastEvent(event: EntityEvent): void {
    if (this.channel) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      this.channel.postMessage({
        type: 'event',
        payload: event,
      });
    }
  }

  /**
   * Close the channel
   */
  close(): void {
    if (this.channel) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      this.channel.close();
      this.channel = null;
    }
  }

  /**
   * Setup channel message handler
   */
  private setupChannelHandler(): void {
    if (!this.channel) return;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    this.channel.onmessage = (event: { data: BroadcastMessage }) => {
      const { type, payload } = event.data;

      if (type === 'event' && this.store) {
        // Apply event from another tab (deduplication handled by store)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        this.store.getState().applyEvent(payload);
      }
    };
  }
}

/**
 * Create a tab coordinator for multi-tab event sync
 */
export function createTabCoordinator(serviceId: string): TabCoordinator {
  return new TabCoordinator(serviceId);
}

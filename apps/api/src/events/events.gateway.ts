import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from './ws-jwt-auth.guard';
import type {
  EntityEvent,
  SubscribePayload,
  UnsubscribePayload,
  EventAck,
  ServerToClientEvents,
  ClientToServerEvents,
} from './events.types';

/**
 * WebSocket Gateway for Real-Time Entity Events
 *
 * Story 6-1d: Backend Event Stream
 *
 * Features:
 * - JWT authentication for WebSocket connections
 * - Room-based subscription by service ID
 * - Entity CRUD event broadcasting
 * - Event deduplication support via event IDs
 */
@WebSocketGateway({
  path: '/ws/events',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(WsJwtAuthGuard)
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server<ClientToServerEvents, ServerToClientEvents>;

  private readonly logger = new Logger(EventsGateway.name);

  /** Track subscriptions: socketId -> Set<serviceId> */
  private subscriptions = new Map<string, Set<string>>();

  /** Track pending events for acknowledgment */
  private pendingEvents = new Map<string, EntityEvent>();

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
    this.subscriptions.set(client.id, new Set());
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.subscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SubscribePayload,
  ): void {
    const { serviceId } = payload;

    // Join the service room
    void client.join(`service:${serviceId}`);

    // Track subscription
    const clientSubs = this.subscriptions.get(client.id);
    if (clientSubs) {
      clientSubs.add(serviceId);
    }

    this.logger.log(`Client ${client.id} subscribed to service ${serviceId}`);

    // Confirm subscription
    client.emit('subscription.confirmed', { serviceId });
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: UnsubscribePayload,
  ): void {
    const { serviceId } = payload;

    // Leave the service room
    void client.leave(`service:${serviceId}`);

    // Remove subscription tracking
    const clientSubs = this.subscriptions.get(client.id);
    if (clientSubs) {
      clientSubs.delete(serviceId);
    }

    this.logger.log(
      `Client ${client.id} unsubscribed from service ${serviceId}`,
    );

    // Confirm removal
    client.emit('subscription.removed', { serviceId });
  }

  @SubscribeMessage('event.ack')
  handleEventAck(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: EventAck,
  ): void {
    const { eventId } = payload;
    this.pendingEvents.delete(eventId);
    this.logger.debug(`Event ${eventId} acknowledged by ${client.id}`);
  }

  /**
   * Broadcast an entity event to all subscribers of the service
   */
  broadcastEvent(event: EntityEvent): void {
    const room = `service:${event.serviceId}`;

    // Track for potential retry
    this.pendingEvents.set(event.id, event);

    // Broadcast to room
    this.server.to(room).emit('entity.event', event);

    this.logger.debug(
      `Broadcasted ${event.type} for entity ${event.entityId} to room ${room}`,
    );

    // Clean up old pending events (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [id, evt] of this.pendingEvents) {
      if (evt.timestamp < fiveMinutesAgo) {
        this.pendingEvents.delete(id);
      }
    }
  }

  /**
   * Get the number of subscribers for a service
   */
  async getSubscriberCount(serviceId: string): Promise<number> {
    const room = `service:${serviceId}`;
    const sockets = await this.server.in(room).fetchSockets();
    return sockets.length;
  }
}

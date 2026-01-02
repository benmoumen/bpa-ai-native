import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EventsGateway } from './events.gateway';
import type { EntityEvent, EntityType, EventAction } from './events.types';

/**
 * Events Service for Broadcasting Entity Changes
 *
 * Story 6-1d: Backend Event Stream
 *
 * This service is injected into entity services to broadcast
 * CRUD events to connected WebSocket clients.
 */
@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(private readonly eventsGateway: EventsGateway) {}

  /**
   * Emit an entity created event
   */
  emitCreated<T extends Record<string, unknown>>(
    entityType: EntityType,
    entityId: string,
    serviceId: string,
    userId: string,
    data: T,
  ): void {
    this.emit(entityType, 'created', entityId, serviceId, userId, data);
  }

  /**
   * Emit an entity updated event
   */
  emitUpdated<T extends Record<string, unknown>>(
    entityType: EntityType,
    entityId: string,
    serviceId: string,
    userId: string,
    data: T,
    previousData?: T,
  ): void {
    this.emit(
      entityType,
      'updated',
      entityId,
      serviceId,
      userId,
      data,
      previousData,
    );
  }

  /**
   * Emit an entity deleted event
   */
  emitDeleted(
    entityType: EntityType,
    entityId: string,
    serviceId: string,
    userId: string,
  ): void {
    this.emit(entityType, 'deleted', entityId, serviceId, userId);
  }

  /**
   * Internal emit helper
   */
  private emit<T extends Record<string, unknown>>(
    entityType: EntityType,
    action: EventAction,
    entityId: string,
    serviceId: string,
    userId: string,
    data?: T,
    previousData?: T,
  ): void {
    const event: EntityEvent = {
      id: randomUUID(),
      type: `${entityType}.${action}`,
      entityType,
      action,
      entityId,
      serviceId,
      userId,
      timestamp: Date.now(),
      data,
      previousData,
    };

    this.logger.debug(
      `Emitting ${event.type} for ${entityId} in service ${serviceId}`,
    );
    this.eventsGateway.broadcastEvent(event);
  }

  /**
   * Get subscriber count for a service
   */
  async getSubscriberCount(serviceId: string): Promise<number> {
    return this.eventsGateway.getSubscriberCount(serviceId);
  }
}

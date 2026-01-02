/**
 * Events Module Exports
 *
 * Story 6-1d: Backend Event Stream
 */

export { EventsModule } from './events.module';
export { EventsService } from './events.service';
export { EventsGateway } from './events.gateway';
export type {
  EntityEvent,
  EntityType,
  EventAction,
  SubscribePayload,
  UnsubscribePayload,
  EventAck,
  ServerToClientEvents,
  ClientToServerEvents,
} from './events.types';

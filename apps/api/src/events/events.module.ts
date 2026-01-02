import { Module, Global } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EventsService } from './events.service';
import { WsJwtAuthGuard } from './ws-jwt-auth.guard';

/**
 * Events Module for WebSocket Communication
 *
 * Story 6-1d: Backend Event Stream
 *
 * Global module that provides:
 * - WebSocket gateway at /ws/events
 * - EventsService for broadcasting entity events
 * - JWT authentication for WebSocket connections
 */
@Global()
@Module({
  providers: [EventsGateway, EventsService, WsJwtAuthGuard],
  exports: [EventsService],
})
export class EventsModule {}

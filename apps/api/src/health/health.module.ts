import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaHealthIndicator } from './prisma.health';

/**
 * HealthModule provides health check endpoints for the application.
 *
 * Includes:
 * - Database connectivity check (Prisma)
 * - Memory usage checks (heap and RSS)
 * - Kubernetes-compatible liveness/readiness probes
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
})
export class HealthModule {}

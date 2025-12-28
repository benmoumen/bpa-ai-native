import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth';
import { PrismaHealthIndicator } from './prisma.health';
import { SkipTransform } from '../common';

/**
 * Health check controller providing system health status.
 *
 * Endpoints:
 * - GET /health - Full health check including database
 * - GET /health/live - Kubernetes liveness probe (is the app running?)
 * - GET /health/ready - Kubernetes readiness probe (is the app ready to serve?)
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private prismaHealth: PrismaHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  @SkipTransform()
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  @ApiResponse({ status: 503, description: 'System is unhealthy' })
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Check database connection
      () => this.prismaHealth.isHealthy('database'),

      // Check heap memory usage (max 150MB)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // Check RSS memory (max 300MB)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  @Get('live')
  @Public()
  @SkipTransform()
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  @ApiResponse({ status: 200, description: 'Application is running' })
  liveness(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  @Public()
  @HealthCheck()
  @SkipTransform()
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  @ApiResponse({
    status: 200,
    description: 'Application is ready to serve requests',
  })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  async readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Only check database for readiness
      () => this.prismaHealth.isHealthy('database'),
    ]);
  }
}

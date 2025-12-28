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
 * Memory threshold configuration for health checks.
 * Configurable via environment variables.
 */
const MEMORY_HEAP_THRESHOLD =
  parseInt(process.env.HEALTH_MEMORY_HEAP_MB || '150', 10) * 1024 * 1024;

const MEMORY_RSS_THRESHOLD =
  parseInt(process.env.HEALTH_MEMORY_RSS_MB || '300', 10) * 1024 * 1024;

/**
 * Health check controller providing system health status.
 *
 * Endpoints:
 * - GET /health - Full health check including database
 * - GET /health/live - Kubernetes liveness probe (is the app running?)
 * - GET /health/ready - Kubernetes readiness probe (is the app ready to serve?)
 *
 * Configuration:
 * - HEALTH_MEMORY_HEAP_MB: Max heap memory in MB (default: 150)
 * - HEALTH_MEMORY_RSS_MB: Max RSS memory in MB (default: 300)
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

      // Check heap memory usage (configurable via HEALTH_MEMORY_HEAP_MB)
      () => this.memory.checkHeap('memory_heap', MEMORY_HEAP_THRESHOLD),

      // Check RSS memory (configurable via HEALTH_MEMORY_RSS_MB)
      () => this.memory.checkRSS('memory_rss', MEMORY_RSS_THRESHOLD),
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

import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma';

/**
 * Custom health indicator for Prisma database connectivity.
 *
 * Checks if the database is accessible by executing a simple query.
 */
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const isHealthy = await this.prisma.isHealthy();

      if (isHealthy) {
        return this.getStatus(key, true);
      }

      throw new HealthCheckError(
        'Prisma check failed',
        this.getStatus(key, false, { message: 'Database query failed' }),
      );
    } catch (error) {
      throw new HealthCheckError(
        'Prisma check failed',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}

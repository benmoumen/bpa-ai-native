import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@bpa/db';

/**
 * PrismaService extends PrismaClient and integrates with NestJS lifecycle.
 *
 * Features:
 * - Automatic connection on module initialization
 * - Graceful shutdown on application termination
 * - Connection pooling (configured via DATABASE_URL parameters)
 * - Logging integration with NestJS Logger
 *
 * Connection Pooling Configuration:
 * Prisma uses connection pooling by default. Pool settings are configured
 * via DATABASE_URL query parameters:
 *   - connection_limit: Max connections (default: num_cpus * 2 + 1)
 *   - pool_timeout: Seconds to wait for connection (default: 10)
 *
 * Example: postgresql://user:pass@host/db?connection_limit=20&pool_timeout=30
 *
 * Note: Prisma 7+ uses driver adapters or Prisma Accelerate.
 * For query logging, set DEBUG="prisma:query" environment variable.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connection established');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  /**
   * Check if the database connection is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

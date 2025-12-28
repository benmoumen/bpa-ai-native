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
 * - Connection pooling via Prisma default settings
 * - Logging integration with NestJS Logger
 *
 * Note: Prisma 7+ uses driver adapters or Prisma Accelerate.
 * The DATABASE_URL env var is used for connection configuration.
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

/**
 * @bpa/db - Database client and Prisma schema
 *
 * This package exports the Prisma client for database access.
 *
 * Usage:
 * import { prisma, PrismaClient } from '@bpa/db';
 *
 * Setup (required before first use):
 * 1. Copy .env.example to .env and set DATABASE_URL
 * 2. Run `pnpm --filter @bpa/db db:generate` to generate the Prisma client
 * 3. Run `pnpm --filter @bpa/db db:push` to sync schema with database
 *
 * Note: Prisma 7 requires a driver adapter for database connections.
 * This package uses @prisma/adapter-pg for PostgreSQL.
 */

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

// Re-export Prisma client and types from generated code
export { PrismaClient, Prisma } from './generated/prisma/client.js';
export type { User, Session } from './generated/prisma/client.js';

// Re-export model types (Prisma 7 exports them as ModelName)
export type { ServiceModel as Service } from './generated/prisma/models/Service.js';
export type { RegistrationModel as Registration } from './generated/prisma/models/Registration.js';
export type { ServiceTemplateModel as ServiceTemplate } from './generated/prisma/models/ServiceTemplate.js';
export type { RequirementModel as Requirement } from './generated/prisma/models/Requirement.js';
export type { DocumentRequirementModel as DocumentRequirement } from './generated/prisma/models/DocumentRequirement.js';
export type { CostModel as Cost } from './generated/prisma/models/Cost.js';
export type { FormModel as Form } from './generated/prisma/models/Form.js';
export type { FormSectionModel as FormSection } from './generated/prisma/models/FormSection.js';
export type { FormFieldModel as FormField } from './generated/prisma/models/FormField.js';

// Re-export enums if any
export * from './generated/prisma/enums.js';

// Import for singleton creation
import { PrismaClient } from './generated/prisma/client.js';

// Type for the global Prisma singleton
type PrismaClientType = InstanceType<typeof PrismaClient>;

// Singleton pattern for Prisma client
// Prevents multiple instances during development hot-reloading
const globalForPrisma = globalThis as unknown as { prisma: PrismaClientType | undefined };

/**
 * Creates a new PrismaClient instance with the PostgreSQL driver adapter
 */
function createPrismaClient(): PrismaClientType {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please copy .env.example to .env and configure your database connection.'
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

/**
 * Shared Prisma client instance
 * Use this for all database operations to ensure connection pooling
 */
export const prisma: PrismaClientType = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Database version constant
export const DB_VERSION = '0.0.2' as const;

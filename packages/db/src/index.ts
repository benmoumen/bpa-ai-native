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
 * Note: This file exports placeholders until prisma generate is run.
 * After generation, update this file to import from './generated/prisma'.
 */

// Type placeholder - actual types from Prisma after generation
export type PrismaClient = unknown;
export type Prisma = unknown;

// Placeholder singleton - replace with actual client after prisma generate
export const prisma: unknown = null;

// Database version constant
export const DB_VERSION = '0.0.1' as const;

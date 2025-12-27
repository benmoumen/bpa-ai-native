/**
 * Database Seed Script
 *
 * This script populates the database with initial/test data.
 *
 * Usage:
 *   pnpm --filter @bpa/db db:seed
 *
 * Note: Requires DATABASE_URL to be set in .env
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  console.log('🌱 Starting database seed...');

  // TODO: Add seed data when needed
  // Example:
  // await prisma.user.upsert({
  //   where: { email: 'admin@example.com' },
  //   update: {},
  //   create: {
  //     email: 'admin@example.com',
  //     name: 'Admin User',
  //     keycloakId: 'keycloak-admin-id',
  //   },
  // });

  console.log('✅ Database seed completed.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});

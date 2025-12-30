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

  // Seed service templates
  const templates = [
    {
      id: 'template-business-registration',
      name: 'Business Registration',
      description: 'Standard template for business registration services. Includes company information form, document upload, and multi-step approval workflow.',
      category: 'Business',
      formCount: 3,
      workflowSteps: 4,
      config: {
        forms: ['company-info', 'directors', 'documents'],
        workflow: ['submission', 'review', 'approval', 'issuance'],
      },
      isActive: true,
    },
    {
      id: 'template-import-permit',
      name: 'Import Permit Application',
      description: 'Template for import permit applications. Features product declaration, customs classification, and automated compliance checks.',
      category: 'Trade',
      formCount: 4,
      workflowSteps: 5,
      config: {
        forms: ['applicant-info', 'product-details', 'classification', 'documents'],
        workflow: ['submission', 'compliance-check', 'technical-review', 'approval', 'permit-issuance'],
      },
      isActive: true,
    },
    {
      id: 'template-license-renewal',
      name: 'License Renewal',
      description: 'Simplified template for license renewals. Pre-populates data from previous applications and streamlines the renewal process.',
      category: 'Licensing',
      formCount: 2,
      workflowSteps: 3,
      config: {
        forms: ['renewal-info', 'confirmation'],
        workflow: ['submission', 'verification', 'renewal-issuance'],
      },
      isActive: true,
    },
  ];

  console.log('📋 Seeding service templates...');
  for (const template of templates) {
    await prisma.serviceTemplate.upsert({
      where: { id: template.id },
      update: {
        name: template.name,
        description: template.description,
        category: template.category,
        formCount: template.formCount,
        workflowSteps: template.workflowSteps,
        config: template.config,
        isActive: template.isActive,
      },
      create: template,
    });
    console.log(`  ✓ ${template.name}`);
  }

  console.log('✅ Database seed completed.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Seed failed:', e);
  process.exit(1);
});

/**
 * Mock module for @bpa/db
 * Used in unit tests to avoid actual database connections
 */

export enum ServiceStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export const Prisma = {
  ServiceWhereInput: {} as Record<string, unknown>,
  ServiceOrderByWithRelationInput: {} as Record<string, unknown>,
};

export interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  status: ServiceStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PrismaClient {
  service = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  $connect = jest.fn();
  $disconnect = jest.fn();
}

export const prisma = new PrismaClient();

/**
 * Mock for @bpa/db package
 * Used in e2e tests to avoid ESM compatibility issues with Prisma 7
 */

/**
 * Mock PrismaClient for testing
 */
export class PrismaClient {
  async $connect(): Promise<void> {
    // Mock connection
  }

  async $disconnect(): Promise<void> {
    // Mock disconnection
  }

  async $queryRaw(): Promise<unknown[]> {
    return [{ '?column?': 1 }];
  }

  async $executeRaw(): Promise<number> {
    return 1;
  }

  // Mock model accessors
  user = {
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  session = {
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

export const Prisma = {
  PrismaClientKnownRequestError: class extends Error {
    code: string;
    constructor(message: string, { code }: { code: string }) {
      super(message);
      this.code = code;
    }
  },
};

export const DB_VERSION = '0.0.2-mock';

// Mock singleton
export const prisma = new PrismaClient();

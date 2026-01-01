/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
/**
 * RoleStatuses API Integration Tests (E2E)
 *
 * Tests the full HTTP request/response cycle for RoleStatus CRUD operations.
 * Implements the 4-Status Model: PENDING, PASSED, RETURNED, REJECTED.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  ExecutionContext,
  CanActivate,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  HttpExceptionFilter,
  TransformInterceptor,
  LoggingInterceptor,
} from '../src/common';
import { RoleStatusesController } from '../src/role-statuses/role-statuses.controller';
import { RoleStatusesService } from '../src/role-statuses/role-statuses.service';
import { PrismaService } from '../src/prisma';
import type { AuthUser } from '@bpa/types';

/**
 * Mock auth guard that bypasses JWT validation and injects a test user
 */
class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      keycloakId: 'kc-test-123',
      roles: ['SERVICE_DESIGNER'],
      countryCode: 'SV',
    } as AuthUser;
    return true;
  }
}

describe('RoleStatuses API (e2e)', () => {
  let app: INestApplication<App>;

  // In-memory data stores
  const mockRoles = new Map<string, { id: string; name: string }>();
  const mockStatuses = new Map<
    string,
    {
      id: string;
      roleId: string;
      code: string;
      name: string;
      isDefault: boolean;
      sortOrder: number;
      conditions: unknown;
      createdAt: Date;
      updatedAt: Date;
    }
  >();

  const testRoleId = 'test-role-123';

  const mockPrismaService = {
    role: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const role = mockRoles.get(where.id);
        return Promise.resolve(role ?? null);
      }),
    },
    roleStatus: {
      create: jest.fn().mockImplementation(({ data }) => {
        const id = `status-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date();
        const status = {
          id,
          roleId: data.roleId,
          code: data.code,
          name: data.name,
          isDefault: data.isDefault ?? false,
          sortOrder: data.sortOrder ?? 0,
          conditions: data.conditions ?? null,
          createdAt: now,
          updatedAt: now,
        };
        mockStatuses.set(id, status);
        return Promise.resolve(status);
      }),
      findMany: jest.fn().mockImplementation(({ where, orderBy }) => {
        let statuses = Array.from(mockStatuses.values());

        if (where?.roleId) {
          statuses = statuses.filter((s) => s.roleId === where.roleId);
        }

        // Apply sorting
        if (orderBy?.sortOrder) {
          statuses.sort((a, b) =>
            orderBy.sortOrder === 'asc'
              ? a.sortOrder - b.sortOrder
              : b.sortOrder - a.sortOrder,
          );
        }

        return Promise.resolve(statuses);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const status = mockStatuses.get(where.id);
        return Promise.resolve(status ?? null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const statuses = Array.from(mockStatuses.values());
        const found = statuses.find((s) => {
          if (where.roleId && s.roleId !== where.roleId) return false;
          if (where.code && s.code !== where.code) return false;
          return true;
        });
        return Promise.resolve(found ?? null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const status = mockStatuses.get(where.id);
        if (!status) {
          const error = new Error('Record to update not found.');
          (error as Error & { code: string }).code = 'P2025';
          return Promise.reject(error);
        }

        const updated = {
          ...status,
          ...data,
          updatedAt: new Date(),
        };
        mockStatuses.set(where.id, updated);
        return Promise.resolve(updated);
      }),
      updateMany: jest.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        mockStatuses.forEach((status, id) => {
          if (where.roleId && status.roleId !== where.roleId) return;
          if (
            where.isDefault !== undefined &&
            status.isDefault !== where.isDefault
          )
            return;

          const updated = { ...status, ...data, updatedAt: new Date() };
          mockStatuses.set(id, updated);
          count++;
        });
        return Promise.resolve({ count });
      }),
      delete: jest.fn().mockImplementation(({ where }) => {
        const status = mockStatuses.get(where.id);
        if (status) {
          mockStatuses.delete(where.id);
        }
        return Promise.resolve(status ?? null);
      }),
    },
    $transaction: jest.fn().mockImplementation(async (operations) => {
      // For createDefaults, the operations are an array of create operations
      const results: unknown[] = [];
      for (const op of operations) {
        results.push(await op);
      }
      return results;
    }),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeAll(async () => {
    // Seed test role
    mockRoles.set(testRoleId, { id: testRoleId, name: 'Test Role' });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              KEYCLOAK_URL: 'http://test-keycloak',
              KEYCLOAK_REALM: 'test-realm',
            }),
          ],
        }),
      ],
      controllers: [RoleStatusesController],
      providers: [
        RoleStatusesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: APP_GUARD,
          useClass: MockAuthGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    const reflector = app.get(Reflector);

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(
      new LoggingInterceptor(),
      new TransformInterceptor(reflector),
    );

    await app.init();
  });

  afterAll(async () => {
    mockRoles.clear();
    mockStatuses.clear();
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear statuses between tests to avoid conflicts
    mockStatuses.clear();
  });

  describe('POST /api/v1/roles/:roleId/statuses', () => {
    it('should create a PENDING status', async () => {
      const createDto = {
        code: 'PENDING',
        name: 'Awaiting Review',
        isDefault: true,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses`)
        .send(createDto)
        .expect(201);

      expect(response.body.data).toMatchObject({
        code: 'PENDING',
        name: 'Awaiting Review',
        isDefault: true,
      });
      expect(response.body.data.id).toBeDefined();
    });

    it('should create a PASSED status', async () => {
      const createDto = {
        code: 'PASSED',
        name: 'Approved',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses`)
        .send(createDto)
        .expect(201);

      expect(response.body.data.code).toBe('PASSED');
      expect(response.body.data.isDefault).toBe(false);
    });

    it('should create a RETURNED status', async () => {
      const createDto = {
        code: 'RETURNED',
        name: 'Sent Back for Corrections',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses`)
        .send(createDto)
        .expect(201);

      expect(response.body.data.code).toBe('RETURNED');
    });

    it('should create a REJECTED status', async () => {
      const createDto = {
        code: 'REJECTED',
        name: 'Permanently Rejected',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses`)
        .send(createDto)
        .expect(201);

      expect(response.body.data.code).toBe('REJECTED');
    });

    it('should return 400 for invalid status code', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses`)
        .send({ code: 'INVALID_CODE', name: 'Test' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/roles/non-existent-role/statuses')
        .send({ code: 'PENDING', name: 'Test' })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should return 409 for duplicate status code in same role', async () => {
      // First create a PENDING status
      await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses`)
        .send({ code: 'PENDING', name: 'First Pending' });

      // Try to create another PENDING status
      const response = await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses`)
        .send({ code: 'PENDING', name: 'Second Pending' })
        .expect(409);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/roles/:roleId/statuses', () => {
    beforeEach(async () => {
      // Seed statuses for each test
      const statuses = [
        { code: 'PENDING', name: 'Pending', sortOrder: 0 },
        { code: 'PASSED', name: 'Approved', sortOrder: 1 },
        { code: 'RETURNED', name: 'Returned', sortOrder: 2 },
        { code: 'REJECTED', name: 'Rejected', sortOrder: 3 },
      ];

      for (const status of statuses) {
        await request(app.getHttpServer())
          .post(`/api/v1/roles/${testRoleId}/statuses`)
          .send(status);
      }
    });

    it('should return all statuses for a role', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/roles/${testRoleId}/statuses`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(4);
    });

    it('should return statuses sorted by sortOrder', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/roles/${testRoleId}/statuses`)
        .expect(200);

      const codes = response.body.data.map((s: { code: string }) => s.code);
      expect(codes).toEqual(['PENDING', 'PASSED', 'RETURNED', 'REJECTED']);
    });

    it('should return all 4 status codes (4-Status Model)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/roles/${testRoleId}/statuses`)
        .expect(200);

      const codes = response.body.data.map((s: { code: string }) => s.code);
      expect(codes).toContain('PENDING');
      expect(codes).toContain('PASSED');
      expect(codes).toContain('RETURNED');
      expect(codes).toContain('REJECTED');
    });
  });

  describe('GET /api/v1/roles/:roleId/statuses/:id', () => {
    let existingStatusId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses`)
        .send({ code: 'PENDING', name: 'Status to Find' });

      existingStatusId = response.body.data.id;
    });

    it('should return a status by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/roles/${testRoleId}/statuses/${existingStatusId}`)
        .expect(200);

      expect(response.body.data.id).toBe(existingStatusId);
      expect(response.body.data.name).toBe('Status to Find');
    });

    it('should return 404 for non-existent status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/roles/${testRoleId}/statuses/non-existent-id`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PATCH /api/v1/roles/:roleId/statuses/:id', () => {
    let statusToUpdateId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses`)
        .send({ code: 'PENDING', name: 'Status to Update' });

      statusToUpdateId = response.body.data.id;
    });

    it('should update status name', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/roles/${testRoleId}/statuses/${statusToUpdateId}`)
        .send({ name: 'Updated Status Name' })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Status Name');
    });

    it('should update isDefault', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/roles/${testRoleId}/statuses/${statusToUpdateId}`)
        .send({ isDefault: true })
        .expect(200);

      expect(response.body.data.isDefault).toBe(true);
    });

    it('should not allow updating status code', async () => {
      // Code should be rejected as it's not in UpdateRoleStatusDto
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/roles/${testRoleId}/statuses/${statusToUpdateId}`)
        .send({ code: 'PASSED' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/roles/${testRoleId}/statuses/non-existent-id`)
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/v1/roles/:roleId/statuses/:id', () => {
    let statusToDeleteId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses`)
        .send({ code: 'PENDING', name: 'Status to Delete' });

      statusToDeleteId = response.body.data.id;
    });

    it('should delete a status', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/roles/${testRoleId}/statuses/${statusToDeleteId}`)
        .expect(204);

      // Verify status is deleted
      expect(mockStatuses.has(statusToDeleteId)).toBe(false);
    });

    it('should return 404 for non-existent status', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/roles/${testRoleId}/statuses/non-existent-id`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/v1/roles/:roleId/statuses/:id/default', () => {
    let statusForDefaultId: string;

    beforeEach(async () => {
      // Create default status
      await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses`)
        .send({ code: 'PENDING', name: 'Initial Default', isDefault: true });

      // Create another status
      const response = await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses`)
        .send({ code: 'PASSED', name: 'Approved', isDefault: false });

      statusForDefaultId = response.body.data.id;
    });

    it('should set a status as default', async () => {
      const response = await request(app.getHttpServer())
        .post(
          `/api/v1/roles/${testRoleId}/statuses/${statusForDefaultId}/default`,
        )
        .expect(200);

      expect(response.body.data.isDefault).toBe(true);
    });

    it('should return 404 for non-existent status', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses/non-existent-id/default`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/v1/roles/:roleId/statuses/defaults', () => {
    it('should create all 4 default statuses', async () => {
      // Mock the $transaction to actually create the statuses
      mockPrismaService.$transaction.mockImplementation(() => {
        const defaults = [
          { code: 'PENDING', name: 'Pending', isDefault: true, sortOrder: 0 },
          { code: 'PASSED', name: 'Approved', isDefault: false, sortOrder: 1 },
          {
            code: 'RETURNED',
            name: 'Returned',
            isDefault: false,
            sortOrder: 2,
          },
          {
            code: 'REJECTED',
            name: 'Rejected',
            isDefault: false,
            sortOrder: 3,
          },
        ];

        const results = defaults.map((d, idx) => {
          const id = `default-status-${idx}`;
          const now = new Date();
          const status = {
            id,
            roleId: testRoleId,
            code: d.code,
            name: d.name,
            isDefault: d.isDefault,
            sortOrder: d.sortOrder,
            conditions: null,
            createdAt: now,
            updatedAt: now,
          };
          mockStatuses.set(id, status);
          return status;
        });

        return results;
      });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/roles/${testRoleId}/statuses/defaults`)
        .expect(201);

      expect(response.body.data).toHaveLength(4);

      const codes = response.body.data.map((s: { code: string }) => s.code);
      expect(codes).toEqual(['PENDING', 'PASSED', 'RETURNED', 'REJECTED']);

      // Verify PENDING is the default
      const pendingStatus = response.body.data.find(
        (s: { code: string }) => s.code === 'PENDING',
      );
      expect(pendingStatus.isDefault).toBe(true);
    });
  });

  describe('4-Status Model Validation', () => {
    it('should enforce valid status codes only', async () => {
      const validCodes = ['PENDING', 'PASSED', 'RETURNED', 'REJECTED'];

      for (const code of validCodes) {
        mockStatuses.clear(); // Clear to avoid duplicates

        const response = await request(app.getHttpServer())
          .post(`/api/v1/roles/${testRoleId}/statuses`)
          .send({ code, name: `Test ${code}` })
          .expect(201);

        expect(response.body.data.code).toBe(code);
      }
    });

    it('should reject invalid status codes', async () => {
      const invalidCodes = ['APPROVED', 'DENIED', 'IN_PROGRESS', 'CANCELLED'];

      for (const code of invalidCodes) {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/roles/${testRoleId}/statuses`)
          .send({ code, name: `Test ${code}` })
          .expect(400);

        expect(response.body.error).toBeDefined();
      }
    });
  });
});

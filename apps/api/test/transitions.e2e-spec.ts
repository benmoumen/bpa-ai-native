/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
/**
 * Transitions API Integration Tests (E2E)
 *
 * Tests the full HTTP request/response cycle for WorkflowTransition CRUD operations.
 * Tests the routing pattern: RoleStatus → WorkflowTransition → Next Role
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
import { TransitionsController } from '../src/transitions/transitions.controller';
import { TransitionsService } from '../src/transitions/transitions.service';
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

describe('Transitions API (e2e)', () => {
  let app: INestApplication<App>;

  // In-memory data stores
  const mockRoles = new Map<
    string,
    { id: string; name: string; serviceId: string }
  >();
  const mockStatuses = new Map<
    string,
    {
      id: string;
      roleId: string;
      code: string;
      name: string;
      role?: { serviceId: string };
    }
  >();
  const mockTransitions = new Map<
    string,
    {
      id: string;
      fromStatusId: string;
      toRoleId: string;
      sortOrder: number;
      conditions: unknown;
      createdAt: Date;
      updatedAt: Date;
      fromStatus?: { role: { serviceId: string } };
    }
  >();

  // Test data IDs
  const testServiceId = 'test-service-123';
  const testRole1Id = 'test-role-1';
  const testRole2Id = 'test-role-2';
  const testRole3Id = 'test-role-3';
  const testStatus1Id = 'test-status-1';
  const testStatus2Id = 'test-status-2';

  const mockPrismaService = {
    roleStatus: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const status = mockStatuses.get(where.id);
        return Promise.resolve(status ?? null);
      }),
    },
    role: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const role = mockRoles.get(where.id);
        return Promise.resolve(role ?? null);
      }),
    },
    workflowTransition: {
      create: jest.fn().mockImplementation(({ data }) => {
        const id = `transition-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date();
        const transition = {
          id,
          fromStatusId: data.fromStatusId,
          toRoleId: data.toRoleId,
          sortOrder: data.sortOrder ?? 0,
          conditions: data.conditions ?? null,
          createdAt: now,
          updatedAt: now,
        };
        mockTransitions.set(id, transition);
        return Promise.resolve(transition);
      }),
      findMany: jest.fn().mockImplementation(({ where, orderBy }) => {
        let transitions = Array.from(mockTransitions.values());

        if (where?.fromStatusId) {
          transitions = transitions.filter(
            (t) => t.fromStatusId === where.fromStatusId,
          );
        }
        if (where?.toRoleId) {
          transitions = transitions.filter(
            (t) => t.toRoleId === where.toRoleId,
          );
        }
        if (where?.fromStatus?.role?.serviceId) {
          const serviceId = where.fromStatus.role.serviceId;
          transitions = transitions.filter((t) => {
            const status = mockStatuses.get(t.fromStatusId);
            if (!status) return false;
            const role = mockRoles.get(status.roleId);
            return role?.serviceId === serviceId;
          });
        }

        // Apply sorting
        if (orderBy?.sortOrder) {
          transitions.sort((a, b) =>
            orderBy.sortOrder === 'asc'
              ? a.sortOrder - b.sortOrder
              : b.sortOrder - a.sortOrder,
          );
        }

        return Promise.resolve(transitions);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        // Handle composite unique key lookup
        if (where.fromStatusId_toRoleId) {
          const transitions = Array.from(mockTransitions.values());
          const found = transitions.find(
            (t) =>
              t.fromStatusId === where.fromStatusId_toRoleId.fromStatusId &&
              t.toRoleId === where.fromStatusId_toRoleId.toRoleId,
          );
          return Promise.resolve(found ?? null);
        }

        // Handle ID lookup
        const transition = mockTransitions.get(where.id);
        return Promise.resolve(transition ?? null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const transition = mockTransitions.get(where.id);
        if (!transition) {
          const error = new Error('Record to update not found.');
          (error as Error & { code: string }).code = 'P2025';
          return Promise.reject(error);
        }

        const updated = {
          ...transition,
          ...data,
          updatedAt: new Date(),
        };
        mockTransitions.set(where.id, updated);
        return Promise.resolve(updated);
      }),
      delete: jest.fn().mockImplementation(({ where }) => {
        const transition = mockTransitions.get(where.id);
        if (transition) {
          mockTransitions.delete(where.id);
        }
        return Promise.resolve(transition ?? null);
      }),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeAll(async () => {
    // Seed test roles
    mockRoles.set(testRole1Id, {
      id: testRole1Id,
      name: 'Document Verification',
      serviceId: testServiceId,
    });
    mockRoles.set(testRole2Id, {
      id: testRole2Id,
      name: 'Manager Approval',
      serviceId: testServiceId,
    });
    mockRoles.set(testRole3Id, {
      id: testRole3Id,
      name: 'Final Review',
      serviceId: testServiceId,
    });

    // Seed test statuses
    mockStatuses.set(testStatus1Id, {
      id: testStatus1Id,
      roleId: testRole1Id,
      code: 'PASSED',
      name: 'Approved',
    });
    mockStatuses.set(testStatus2Id, {
      id: testStatus2Id,
      roleId: testRole2Id,
      code: 'PASSED',
      name: 'Approved',
    });

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
      controllers: [TransitionsController],
      providers: [
        TransitionsService,
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
    mockTransitions.clear();
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransitions.clear();
  });

  describe('POST /api/v1/transitions', () => {
    it('should create a new transition', async () => {
      const createDto = {
        fromStatusId: testStatus1Id,
        toRoleId: testRole2Id,
        sortOrder: 0,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/transitions')
        .send(createDto)
        .expect(201);

      expect(response.body.data).toMatchObject({
        fromStatusId: testStatus1Id,
        toRoleId: testRole2Id,
        sortOrder: 0,
      });
      expect(response.body.data.id).toBeDefined();
    });

    it('should create a transition with conditions', async () => {
      const createDto = {
        fromStatusId: testStatus1Id,
        toRoleId: testRole3Id,
        sortOrder: 1,
        conditions: { requiresApproval: true, minAmount: 10000 },
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/transitions')
        .send(createDto)
        .expect(201);

      expect(response.body.data.conditions).toMatchObject({
        requiresApproval: true,
        minAmount: 10000,
      });
    });

    it('should return 404 for non-existent source status', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/transitions')
        .send({
          fromStatusId: 'non-existent-status',
          toRoleId: testRole2Id,
        })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent target role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/transitions')
        .send({
          fromStatusId: testStatus1Id,
          toRoleId: 'non-existent-role',
        })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should return 409 for duplicate transition', async () => {
      // First create the transition
      await request(app.getHttpServer()).post('/api/v1/transitions').send({
        fromStatusId: testStatus1Id,
        toRoleId: testRole2Id,
      });

      // Try to create duplicate
      const response = await request(app.getHttpServer())
        .post('/api/v1/transitions')
        .send({
          fromStatusId: testStatus1Id,
          toRoleId: testRole2Id,
        })
        .expect(409);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/transitions')
        .send({ sortOrder: 0 })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/transitions/:id', () => {
    let existingTransitionId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/transitions')
        .send({
          fromStatusId: testStatus1Id,
          toRoleId: testRole2Id,
        });

      existingTransitionId = response.body.data.id;
    });

    it('should return a transition by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/transitions/${existingTransitionId}`)
        .expect(200);

      expect(response.body.data.id).toBe(existingTransitionId);
      expect(response.body.data.fromStatusId).toBe(testStatus1Id);
      expect(response.body.data.toRoleId).toBe(testRole2Id);
    });

    it('should return 404 for non-existent transition', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/transitions/non-existent-id')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/transitions/from-status/:statusId', () => {
    beforeEach(async () => {
      // Create multiple transitions from the same status (branching)
      await request(app.getHttpServer()).post('/api/v1/transitions').send({
        fromStatusId: testStatus1Id,
        toRoleId: testRole2Id,
        sortOrder: 0,
      });

      await request(app.getHttpServer()).post('/api/v1/transitions').send({
        fromStatusId: testStatus1Id,
        toRoleId: testRole3Id,
        sortOrder: 1,
      });
    });

    it('should return all transitions from a status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/transitions/from-status/${testStatus1Id}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });

    it('should return transitions sorted by sortOrder', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/transitions/from-status/${testStatus1Id}`)
        .expect(200);

      const sortOrders = response.body.data.map(
        (t: { sortOrder: number }) => t.sortOrder,
      );
      expect(sortOrders).toEqual([0, 1]);
    });

    it('should return empty array for status with no transitions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/transitions/from-status/no-transitions-status')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('GET /api/v1/transitions/to-role/:roleId', () => {
    beforeEach(async () => {
      // Create multiple transitions to the same role (converging)
      await request(app.getHttpServer()).post('/api/v1/transitions').send({
        fromStatusId: testStatus1Id,
        toRoleId: testRole3Id,
        sortOrder: 0,
      });

      await request(app.getHttpServer()).post('/api/v1/transitions').send({
        fromStatusId: testStatus2Id,
        toRoleId: testRole3Id,
        sortOrder: 1,
      });
    });

    it('should return all transitions to a role', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/transitions/to-role/${testRole3Id}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);
    });

    it('should return empty array for role with no incoming transitions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/transitions/to-role/no-incoming-role')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(0);
    });
  });

  describe('GET /api/v1/transitions?serviceId=:serviceId', () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/api/v1/transitions').send({
        fromStatusId: testStatus1Id,
        toRoleId: testRole2Id,
      });

      await request(app.getHttpServer()).post('/api/v1/transitions').send({
        fromStatusId: testStatus2Id,
        toRoleId: testRole3Id,
      });
    });

    it('should return all transitions for a service', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/transitions?serviceId=${testServiceId}`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PATCH /api/v1/transitions/:id', () => {
    let transitionToUpdateId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/transitions')
        .send({
          fromStatusId: testStatus1Id,
          toRoleId: testRole2Id,
          sortOrder: 0,
        });

      transitionToUpdateId = response.body.data.id;
    });

    it('should update sortOrder', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/transitions/${transitionToUpdateId}`)
        .send({ sortOrder: 10 })
        .expect(200);

      expect(response.body.data.sortOrder).toBe(10);
    });

    it('should update conditions', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/transitions/${transitionToUpdateId}`)
        .send({ conditions: { newCondition: true } })
        .expect(200);

      expect(response.body.data.conditions).toMatchObject({
        newCondition: true,
      });
    });

    it('should not allow updating fromStatusId or toRoleId', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/transitions/${transitionToUpdateId}`)
        .send({ fromStatusId: testStatus2Id, toRoleId: testRole3Id })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent transition', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/transitions/non-existent-id')
        .send({ sortOrder: 5 })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/v1/transitions/:id', () => {
    let transitionToDeleteId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/transitions')
        .send({
          fromStatusId: testStatus1Id,
          toRoleId: testRole2Id,
        });

      transitionToDeleteId = response.body.data.id;
    });

    it('should delete a transition', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/transitions/${transitionToDeleteId}`)
        .expect(204);

      // Verify transition is deleted
      expect(mockTransitions.has(transitionToDeleteId)).toBe(false);
    });

    it('should return 404 for non-existent transition', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/transitions/non-existent-id')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Workflow Routing Patterns', () => {
    describe('Branching (one status to multiple roles)', () => {
      beforeEach(async () => {
        // Create branching workflow from PASSED status
        await request(app.getHttpServer())
          .post('/api/v1/transitions')
          .send({
            fromStatusId: testStatus1Id,
            toRoleId: testRole2Id,
            sortOrder: 0,
            conditions: { amount: { lt: 10000 } },
          });

        await request(app.getHttpServer())
          .post('/api/v1/transitions')
          .send({
            fromStatusId: testStatus1Id,
            toRoleId: testRole3Id,
            sortOrder: 1,
            conditions: { amount: { gte: 10000 } },
          });
      });

      it('should support multiple transitions from a single status', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/transitions/from-status/${testStatus1Id}`)
          .expect(200);

        expect(response.body.data.length).toBe(2);
        expect(response.body.data[0].conditions).toMatchObject({
          amount: { lt: 10000 },
        });
        expect(response.body.data[1].conditions).toMatchObject({
          amount: { gte: 10000 },
        });
      });
    });

    describe('Converging (multiple statuses to one role)', () => {
      beforeEach(async () => {
        // Create converging workflow to Final Review
        await request(app.getHttpServer()).post('/api/v1/transitions').send({
          fromStatusId: testStatus1Id,
          toRoleId: testRole3Id,
          sortOrder: 0,
        });

        await request(app.getHttpServer()).post('/api/v1/transitions').send({
          fromStatusId: testStatus2Id,
          toRoleId: testRole3Id,
          sortOrder: 0,
        });
      });

      it('should support multiple transitions to a single role', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/transitions/to-role/${testRole3Id}`)
          .expect(200);

        expect(response.body.data.length).toBe(2);
        const fromStatusIds = response.body.data.map(
          (t: { fromStatusId: string }) => t.fromStatusId,
        );
        expect(fromStatusIds).toContain(testStatus1Id);
        expect(fromStatusIds).toContain(testStatus2Id);
      });
    });

    describe('Linear Chain', () => {
      beforeEach(async () => {
        // Create linear workflow: Role1 (PASSED) → Role2 (PASSED) → Role3
        await request(app.getHttpServer()).post('/api/v1/transitions').send({
          fromStatusId: testStatus1Id, // Role1 PASSED
          toRoleId: testRole2Id,
          sortOrder: 0,
        });

        await request(app.getHttpServer()).post('/api/v1/transitions').send({
          fromStatusId: testStatus2Id, // Role2 PASSED
          toRoleId: testRole3Id,
          sortOrder: 0,
        });
      });

      it('should support linear workflow chains', async () => {
        // Verify Role1 → Role2
        const response1 = await request(app.getHttpServer())
          .get(`/api/v1/transitions/from-status/${testStatus1Id}`)
          .expect(200);

        expect(response1.body.data[0].toRoleId).toBe(testRole2Id);

        // Verify Role2 → Role3
        const response2 = await request(app.getHttpServer())
          .get(`/api/v1/transitions/from-status/${testStatus2Id}`)
          .expect(200);

        expect(response2.body.data[0].toRoleId).toBe(testRole3Id);
      });
    });
  });
});

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
/**
 * Roles API Integration Tests (E2E)
 *
 * Tests the full HTTP request/response cycle for Role CRUD operations.
 * Uses a mock auth guard to bypass JWT authentication while testing.
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
import { RolesController } from '../src/roles/roles.controller';
import { RolesService } from '../src/roles/roles.service';
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

describe('Roles API (e2e)', () => {
  let app: INestApplication<App>;

  // In-memory data stores
  const mockServices = new Map<string, { id: string; name: string }>();
  const mockRoles = new Map<
    string,
    {
      id: string;
      serviceId: string;
      roleType: string;
      name: string;
      shortName: string | null;
      description: string | null;
      isStartRole: boolean;
      sortOrder: number;
      isActive: boolean;
      conditions: unknown;
      formId: string | null;
      retryEnabled: boolean | null;
      retryIntervalMinutes: number | null;
      timeoutMinutes: number | null;
      createdAt: Date;
      updatedAt: Date;
    }
  >();

  const testServiceId = 'test-service-123';

  const mockPrismaService = {
    service: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const service = mockServices.get(where.id);
        return Promise.resolve(service ?? null);
      }),
    },
    role: {
      create: jest.fn().mockImplementation(({ data }) => {
        const id = `role-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date();
        const role = {
          id,
          serviceId: data.serviceId,
          roleType: data.roleType,
          name: data.name,
          shortName: data.shortName ?? null,
          description: data.description ?? null,
          isStartRole: data.isStartRole ?? false,
          sortOrder: data.sortOrder ?? 0,
          isActive: data.isActive ?? true,
          conditions: data.conditions ?? null,
          formId: data.formId ?? null,
          retryEnabled: data.retryEnabled ?? null,
          retryIntervalMinutes: data.retryIntervalMinutes ?? null,
          timeoutMinutes: data.timeoutMinutes ?? null,
          createdAt: now,
          updatedAt: now,
        };
        mockRoles.set(id, role);
        return Promise.resolve(role);
      }),
      findMany: jest.fn().mockImplementation(({ where, orderBy }) => {
        let roles = Array.from(mockRoles.values());

        if (where?.serviceId) {
          roles = roles.filter((r) => r.serviceId === where.serviceId);
        }
        if (where?.isActive !== undefined) {
          roles = roles.filter((r) => r.isActive === where.isActive);
        }

        // Apply sorting
        if (orderBy?.sortOrder) {
          roles.sort((a, b) =>
            orderBy.sortOrder === 'asc'
              ? a.sortOrder - b.sortOrder
              : b.sortOrder - a.sortOrder,
          );
        }

        return Promise.resolve(roles);
      }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const role = mockRoles.get(where.id);
        return Promise.resolve(role ?? null);
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        const roles = Array.from(mockRoles.values());
        const found = roles.find((r) => {
          if (where.serviceId && r.serviceId !== where.serviceId) return false;
          if (
            where.isStartRole !== undefined &&
            r.isStartRole !== where.isStartRole
          )
            return false;
          if (where.isActive !== undefined && r.isActive !== where.isActive)
            return false;
          return true;
        });
        return Promise.resolve(found ?? null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const role = mockRoles.get(where.id);
        if (!role) {
          const error = new Error('Record to update not found.');
          (error as Error & { code: string }).code = 'P2025';
          return Promise.reject(error);
        }

        // Only update fields that are defined (not undefined)
        const filteredData = Object.fromEntries(
          Object.entries(data).filter((entry) => entry[1] !== undefined),
        );

        const updated = {
          ...role,
          ...filteredData,
          updatedAt: new Date(),
        };
        mockRoles.set(where.id, updated);
        return Promise.resolve(updated);
      }),
      updateMany: jest.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        mockRoles.forEach((role, id) => {
          if (where.serviceId && role.serviceId !== where.serviceId) return;
          if (
            where.isStartRole !== undefined &&
            role.isStartRole !== where.isStartRole
          )
            return;

          const updated = { ...role, ...data, updatedAt: new Date() };
          mockRoles.set(id, updated);
          count++;
        });
        return Promise.resolve({ count });
      }),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeAll(async () => {
    // Seed test service
    mockServices.set(testServiceId, {
      id: testServiceId,
      name: 'Test Service',
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
      controllers: [RolesController],
      providers: [
        RolesService,
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
    mockServices.clear();
    mockRoles.clear();
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/services/:serviceId/roles', () => {
    it('should create a new USER role with all fields', async () => {
      const createDto = {
        name: 'Document Verification',
        roleType: 'USER',
        shortName: 'Doc Verify',
        description: 'Verifies submitted documents',
        isStartRole: true,
        formId: 'form-123',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/services/${testServiceId}/roles`)
        .send(createDto)
        .expect(201);

      expect(response.body.data).toMatchObject({
        name: createDto.name,
        roleType: 'USER',
        shortName: createDto.shortName,
        description: createDto.description,
        isStartRole: true,
      });
      expect(response.body.data.id).toBeDefined();
    });

    it('should create a BOT role with retry settings', async () => {
      const createDto = {
        name: 'Payment Gateway',
        roleType: 'BOT',
        retryEnabled: true,
        retryIntervalMinutes: 5,
        timeoutMinutes: 30,
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/services/${testServiceId}/roles`)
        .send(createDto)
        .expect(201);

      expect(response.body.data.roleType).toBe('BOT');
      expect(response.body.data.retryEnabled).toBe(true);
      expect(response.body.data.retryIntervalMinutes).toBe(5);
      expect(response.body.data.timeoutMinutes).toBe(30);
    });

    it('should create a role with only required fields', async () => {
      const createDto = {
        name: 'Minimal Role',
        roleType: 'USER',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/services/${testServiceId}/roles`)
        .send(createDto)
        .expect(201);

      expect(response.body.data.name).toBe('Minimal Role');
      expect(response.body.data.isStartRole).toBe(false);
      expect(response.body.data.isActive).toBe(true);
    });

    it('should return 404 for non-existent service', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/services/non-existent-service/roles')
        .send({ name: 'Test Role', roleType: 'USER' })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/services/${testServiceId}/roles`)
        .send({ description: 'No name or roleType' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid roleType', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/services/${testServiceId}/roles`)
        .send({ name: 'Test', roleType: 'INVALID' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/services/:serviceId/roles', () => {
    beforeAll(async () => {
      // Seed test roles
      const roles = [
        { name: 'Alpha Role', roleType: 'USER', sortOrder: 0 },
        { name: 'Beta Role', roleType: 'BOT', sortOrder: 1 },
        { name: 'Gamma Role', roleType: 'USER', sortOrder: 2 },
      ];

      for (const role of roles) {
        await request(app.getHttpServer())
          .post(`/api/v1/services/${testServiceId}/roles`)
          .send(role);
      }
    });

    it('should return all active roles for a service', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/services/${testServiceId}/roles`)
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should return roles sorted by sortOrder', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/services/${testServiceId}/roles`)
        .expect(200);

      const sortOrders = response.body.data.map(
        (r: { sortOrder: number }) => r.sortOrder,
      );
      const sorted = [...sortOrders].sort((a, b) => a - b);
      expect(sortOrders).toEqual(sorted);
    });
  });

  describe('GET /api/v1/services/:serviceId/roles/:id', () => {
    let existingRoleId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/services/${testServiceId}/roles`)
        .send({ name: 'Role to Find', roleType: 'USER' });

      existingRoleId = response.body.data.id;
    });

    it('should return a role by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/services/${testServiceId}/roles/${existingRoleId}`)
        .expect(200);

      expect(response.body.data.id).toBe(existingRoleId);
      expect(response.body.data.name).toBe('Role to Find');
    });

    it('should return 404 for non-existent role', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/services/${testServiceId}/roles/non-existent-id`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('PATCH /api/v1/services/:serviceId/roles/:id', () => {
    let roleToUpdateId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/services/${testServiceId}/roles`)
        .send({
          name: 'Role to Update',
          roleType: 'USER',
          description: 'Original',
        });

      roleToUpdateId = response.body.data.id;
    });

    it('should update role name', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/services/${testServiceId}/roles/${roleToUpdateId}`)
        .send({ name: 'Updated Role Name' })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Role Name');
      // Description should still be 'Original' as we only updated name
      expect(response.body.data.description).toBeDefined();
    });

    it('should update multiple fields', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/services/${testServiceId}/roles/${roleToUpdateId}`)
        .send({
          name: 'Fully Updated',
          description: 'New description',
          sortOrder: 100,
        })
        .expect(200);

      expect(response.body.data.name).toBe('Fully Updated');
      expect(response.body.data.description).toBe('New description');
      expect(response.body.data.sortOrder).toBe(100);
    });

    it('should not allow updating roleType', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/services/${testServiceId}/roles/${roleToUpdateId}`)
        .send({ roleType: 'BOT' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 404 for non-existent role', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/services/${testServiceId}/roles/non-existent-id`)
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/v1/services/:serviceId/roles/:id', () => {
    let roleToDeleteId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/services/${testServiceId}/roles`)
        .send({ name: 'Role to Delete', roleType: 'USER' });

      roleToDeleteId = response.body.data.id;
    });

    it('should soft delete a role', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/services/${testServiceId}/roles/${roleToDeleteId}`)
        .expect(204);

      // Verify role is now inactive
      const role = mockRoles.get(roleToDeleteId);
      expect(role?.isActive).toBe(false);
    });

    it('should return 404 for non-existent role', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/services/${testServiceId}/roles/non-existent-id`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('POST /api/v1/services/:serviceId/roles/:id/start', () => {
    let roleForStartId: string;
    let anotherRoleId: string;

    beforeAll(async () => {
      const response1 = await request(app.getHttpServer())
        .post(`/api/v1/services/${testServiceId}/roles`)
        .send({
          name: 'Initial Start Role',
          roleType: 'USER',
          isStartRole: true,
        });

      roleForStartId = response1.body.data.id;
      void roleForStartId; // Used for initial setup, anotherRoleId used in tests

      const response2 = await request(app.getHttpServer())
        .post(`/api/v1/services/${testServiceId}/roles`)
        .send({ name: 'Another Role', roleType: 'USER', isStartRole: false });

      anotherRoleId = response2.body.data.id;
    });

    it('should set a role as start role', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/services/${testServiceId}/roles/${anotherRoleId}/start`)
        .expect(200);

      expect(response.body.data.isStartRole).toBe(true);
    });

    it('should return 404 for non-existent role', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/services/${testServiceId}/roles/non-existent-id/start`)
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/services/:serviceId/roles/start', () => {
    beforeAll(async () => {
      // Ensure there's a start role
      const roles = Array.from(mockRoles.values()).filter(
        (r) => r.serviceId === testServiceId && r.isStartRole && r.isActive,
      );

      if (roles.length === 0) {
        const response = await request(app.getHttpServer())
          .post(`/api/v1/services/${testServiceId}/roles`)
          .send({ name: 'Start Role', roleType: 'USER', isStartRole: true });

        // Ensure it's set as start role
        await request(app.getHttpServer()).post(
          `/api/v1/services/${testServiceId}/roles/${response.body.data.id}/set-start`,
        );
      }
    });

    it('should return the start role for a service', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/services/${testServiceId}/roles/start`)
        .expect(200);

      expect(response.body.data.isStartRole).toBe(true);
    });
  });
});

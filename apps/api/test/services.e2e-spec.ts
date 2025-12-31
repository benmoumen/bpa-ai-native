/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */
/**
 * Services API Integration Tests (E2E)
 *
 * Tests the full HTTP request/response cycle for Service CRUD operations.
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
import { ServicesController } from '../src/services/services.controller';
import { ServicesService } from '../src/services/services.service';
import { PrismaService } from '../src/prisma';
import type { AuthUser } from '@bpa/types';
import { ServiceStatus } from '@bpa/db';

/**
 * Mock auth guard that bypasses JWT validation and injects a test user
 */
class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Inject mock user into request
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

describe('Services API (e2e)', () => {
  let app: INestApplication<App>;

  // Track created services for cleanup
  const createdServiceIds: string[] = [];

  // Mock Prisma service with in-memory data store
  const mockServices = new Map<
    string,
    {
      id: string;
      name: string;
      description: string | null;
      category: string | null;
      status: ServiceStatus;
      createdBy: string;
      createdAt: Date;
      updatedAt: Date;
    }
  >();

  const mockPrismaService = {
    service: {
      create: jest.fn().mockImplementation(
        ({
          data,
        }: {
          data: {
            name: string;
            description?: string | null;
            category?: string | null;
            status?: ServiceStatus;
            createdBy: string;
          };
        }) => {
          const id = `service-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const now = new Date();
          const service = {
            id,
            name: data.name,
            description: data.description ?? null,
            category: data.category ?? null,
            status: data.status ?? ServiceStatus.DRAFT,
            createdBy: data.createdBy,
            createdAt: now,
            updatedAt: now,
          };
          mockServices.set(id, service);
          createdServiceIds.push(id);
          return Promise.resolve(service);
        },
      ),
      findMany: jest
        .fn()
        .mockImplementation(({ where, skip, take, orderBy }) => {
          let services = Array.from(mockServices.values());

          // Apply filters
          if (where?.status) {
            services = services.filter((s) => s.status === where.status);
          }
          if (where?.OR) {
            const searchTerm = where.OR[0]?.name?.contains?.toLowerCase();
            if (searchTerm) {
              services = services.filter(
                (s) =>
                  s.name.toLowerCase().includes(searchTerm) ||
                  (s.description &&
                    s.description.toLowerCase().includes(searchTerm)),
              );
            }
          }

          // Apply sorting
          const sortField = orderBy
            ? (Object.keys(orderBy)[0] as keyof (typeof services)[0])
            : 'createdAt';
          const sortOrder = orderBy ? Object.values(orderBy)[0] : 'desc';
          services.sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (aVal === null) return 1;
            if (bVal === null) return -1;
            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
          });

          // Apply pagination
          const start = skip ?? 0;
          const end = start + (take ?? 20);
          return Promise.resolve(services.slice(start, end));
        }),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        const service = mockServices.get(where.id);
        return Promise.resolve(service ?? null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const service = mockServices.get(where.id);
        if (!service) {
          // Simulate Prisma P2025 error for record not found
          const error = new Error('Record to update not found.');
          (error as Error & { code: string }).code = 'P2025';
          return Promise.reject(error);
        }

        const updated = {
          ...service,
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && {
            description: data.description,
          }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.status !== undefined && { status: data.status }),
          updatedAt: new Date(),
        };
        mockServices.set(where.id, updated);
        return Promise.resolve(updated);
      }),
      count: jest.fn().mockImplementation(({ where } = {}) => {
        let services = Array.from(mockServices.values());
        if (where?.status) {
          services = services.filter((s) => s.status === where.status);
        }
        return Promise.resolve(services.length);
      }),
      delete: jest.fn().mockImplementation(({ where }) => {
        const service = mockServices.get(where.id);
        if (service) {
          mockServices.delete(where.id);
        }
        return Promise.resolve(service ?? null);
      }),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeAll(async () => {
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
      controllers: [ServicesController],
      providers: [
        ServicesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        // Register mock auth guard as global guard (same as APP_GUARD in main app)
        {
          provide: APP_GUARD,
          useClass: MockAuthGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    const reflector = app.get(Reflector);

    // Apply global middleware (matching main.ts configuration)
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
    // Clean up created services
    mockServices.clear();
    createdServiceIds.length = 0;
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    // Clear mocks but keep data between tests within a describe block
    jest.clearAllMocks();
  });

  describe('POST /api/v1/services', () => {
    it('should create a new service with all fields', async () => {
      const createDto = {
        name: 'Business Registration Service',
        description: 'Service for registering new businesses',
        category: 'Registration',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/services')
        .send(createDto)
        .expect(201);

      expect(response.body.data).toMatchObject({
        name: createDto.name,
        description: createDto.description,
        category: createDto.category,
        status: 'DRAFT',
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.timestamp).toBeDefined();
    });

    it('should create a service with only required fields', async () => {
      const createDto = {
        name: 'Minimal Service',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/services')
        .send(createDto)
        .expect(201);

      expect(response.body.data.name).toBe('Minimal Service');
      expect(response.body.data.description).toBeNull();
      expect(response.body.data.category).toBeNull();
      expect(response.body.data.status).toBe('DRAFT');
    });

    it('should return 400 for missing required name', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/services')
        .send({ description: 'No name provided' })
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('Bad Request');
    });

    it('should return 400 for empty name', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/services')
        .send({ name: '' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for name exceeding max length', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/services')
        .send({ name: 'A'.repeat(256) })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/v1/services', () => {
    beforeAll(async () => {
      // Seed test data
      const testServices = [
        {
          name: 'Alpha Service',
          description: 'First service',
          category: 'Category A',
        },
        {
          name: 'Beta Service',
          description: 'Second service',
          category: 'Category B',
        },
        {
          name: 'Gamma Service',
          description: 'Third service',
          category: 'Category A',
        },
      ];

      for (const svc of testServices) {
        await request(app.getHttpServer()).post('/api/v1/services').send(svc);
      }
    });

    it('should return paginated list of services', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/services')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.total).toBeGreaterThanOrEqual(3);
      expect(response.body.meta.page).toBe(1);
      expect(response.body.meta.perPage).toBe(20);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/services?page=1&limit=2')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.perPage).toBe(2);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/services?status=DRAFT')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      response.body.data.forEach((service: { status: string }) => {
        expect(service.status).toBe('DRAFT');
      });
    });

    it('should search by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/services?search=Alpha')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      const found = response.body.data.some((s: { name: string }) =>
        s.name.includes('Alpha'),
      );
      expect(found).toBe(true);
    });

    it('should support sorting', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/services?sortBy=name&sortOrder=asc')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/services/:id', () => {
    let existingServiceId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/services')
        .send({ name: 'Service to Find', description: 'Test find one' });

      existingServiceId = response.body.data.id;
    });

    it('should return a service by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/services/${existingServiceId}`)
        .expect(200);

      expect(response.body.data.id).toBe(existingServiceId);
      expect(response.body.data.name).toBe('Service to Find');
    });

    it('should return 404 for non-existent service', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/services/non-existent-id')
        .expect(404);

      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('Not Found');
    });
  });

  describe('PATCH /api/v1/services/:id', () => {
    let serviceToUpdateId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/services')
        .send({
          name: 'Service to Update',
          description: 'Original description',
        });

      serviceToUpdateId = response.body.data.id;
    });

    it('should update service name', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/services/${serviceToUpdateId}`)
        .send({ name: 'Updated Service Name' })
        .expect(200);

      expect(response.body.data.name).toBe('Updated Service Name');
      expect(response.body.data.description).toBe('Original description');
    });

    it('should update multiple fields', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/services/${serviceToUpdateId}`)
        .send({
          name: 'Fully Updated',
          description: 'New description',
          category: 'New Category',
        })
        .expect(200);

      expect(response.body.data.name).toBe('Fully Updated');
      expect(response.body.data.description).toBe('New description');
      expect(response.body.data.category).toBe('New Category');
    });

    it('should return 404 for non-existent service', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/services/non-existent-id')
        .send({ name: 'New Name' })
        .expect(404);

      expect(response.body.error).toBeDefined();
    });

    it('should return 400 for invalid update data', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/services/${serviceToUpdateId}`)
        .send({ name: '' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('DELETE /api/v1/services/:id', () => {
    let serviceToArchiveId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/services')
        .send({ name: 'Service to Archive' });

      serviceToArchiveId = response.body.data.id;
    });

    it('should archive (soft delete) a service', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/services/${serviceToArchiveId}`)
        .expect(200);

      expect(response.body.data.id).toBe(serviceToArchiveId);
      expect(response.body.data.status).toBe('ARCHIVED');
    });

    it('should return 404 for non-existent service', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/services/non-existent-id')
        .expect(404);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Response format validation', () => {
    it('should wrap successful responses with TransformInterceptor', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/services')
        .send({ name: 'Response Format Test' })
        .expect(201);

      // Verify response is wrapped by TransformInterceptor
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('timestamp');
      expect(new Date(response.body.meta.timestamp).getTime()).not.toBeNaN();
    });

    it('should return structured errors with HttpExceptionFilter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/services/not-found-id')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('requestId');
    });
  });
});

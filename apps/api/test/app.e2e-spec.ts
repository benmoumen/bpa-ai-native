import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import {
  HttpExceptionFilter,
  TransformInterceptor,
  LoggingInterceptor,
} from './../src/common';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const reflector = app.get(Reflector);

    // Apply global prefix and all global middleware (matching main.ts)
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(
      new LoggingInterceptor(),
      new TransformInterceptor(reflector),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Root endpoint', () => {
    it('/api/v1 (GET) should return Hello World wrapped in { data, meta }', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1')
        .expect(200);

      // Verify response is wrapped by TransformInterceptor
      const body = response.body as {
        data: string;
        meta: { timestamp: string };
      };
      expect(body.data).toBe('Hello World!');
      expect(body.meta).toBeDefined();
      expect(body.meta.timestamp).toBeDefined();
      expect(new Date(body.meta.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe('Health endpoints', () => {
    it('/api/v1/health/live (GET) should return liveness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/live')
        .expect(200);

      // Health endpoints use @SkipTransform() so they return raw format
      const body = response.body as { status: string };
      expect(body.status).toBe('ok');
    });
  });

  describe('Error handling', () => {
    it('should return 404 with structured error for unknown routes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/unknown-route')
        .expect(404);

      // Verify error response format from HttpExceptionFilter
      // NestJS NotFoundException returns "Not Found" as the error name
      const body = response.body as {
        error: { code: string; message: string; requestId: string };
      };
      expect(body.error).toBeDefined();
      expect(body.error.code).toBe('Not Found');
      expect(body.error.message).toBeDefined();
      expect(body.error.requestId).toBeDefined();
    });
  });
});

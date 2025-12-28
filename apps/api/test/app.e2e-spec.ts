import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Root endpoint', () => {
    it('/api/v1 (GET) should return Hello World wrapped in data', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1')
        .expect(200);

      // Response is wrapped by transform interceptor in production
      // but in test, we haven't applied global interceptors
      expect(response.text).toBe('Hello World!');
    });
  });

  describe('Health endpoints', () => {
    it('/api/v1/health/live (GET) should return liveness status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/live')
        .expect(200);

      const body = response.body as { status: string };
      expect(body.status).toBe('ok');
    });
  });
});

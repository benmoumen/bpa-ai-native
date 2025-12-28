import { NestFactory, Reflector } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  HttpExceptionFilter,
  TransformInterceptor,
  LoggingInterceptor,
  createValidationPipe,
} from './common';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Get Reflector for interceptors that need it
  const reflector = app.get(Reflector);

  // Global prefix for all API routes
  app.setGlobalPrefix('api/v1');

  // Configure Swagger/OpenAPI documentation
  // Note: Swagger is mounted at /api/docs (not /api/v1/docs) intentionally.
  // API documentation covers all versions and is not version-specific.
  // This follows the common pattern where docs are accessible at a stable URL.
  const config = new DocumentBuilder()
    .setTitle('BPA AI-Native API')
    .setDescription(
      'Backend API for BPA Service Designer - AI-powered form and workflow configuration',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token from Keycloak SSO',
      },
      'JWT-auth',
    )
    .addTag('Health', 'System health and readiness endpoints')
    .addTag('Auth', 'Authentication and user management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Global validation pipe for DTO validation
  app.useGlobalPipes(createValidationPipe());

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(reflector),
  );

  // Enable CORS for frontend development
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // Enable graceful shutdown
  app.enableShutdownHooks();

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}

void bootstrap();

# Story 1.6: Backend API Foundation

Status: done

---

## Story

As a **Developer**,
I want a robust NestJS API foundation with validation, documentation, and error handling,
So that future feature development has consistent patterns and maintainability.

---

## Acceptance Criteria

1. **Given** the API is running, **When** a developer navigates to `/api/docs`, **Then** Swagger UI displays all available endpoints **And** developers can test endpoints interactively ✓

2. **Given** an API endpoint receives invalid data, **When** validation fails, **Then** a 400 response is returned with detailed error messages **And** the response follows the standard error format ✓

3. **Given** an unhandled exception occurs, **When** the exception filter catches it, **Then** a structured error response is returned **And** the original error is logged (not exposed to client) ✓

4. **Given** the API returns data, **When** the response interceptor processes it, **Then** responses are wrapped in a consistent format `{ data: T, meta?: {...} }` ✓

5. **Given** a client makes a request, **When** the logging interceptor runs, **Then** request/response details are logged with timing information ✓

6. **Given** the API needs database access, **When** Prisma client is used, **Then** it is properly injected via NestJS dependency injection **And** connection pooling is configured ✓

7. **Given** a client checks `/health`, **When** the health module runs, **Then** it returns database connectivity status **And** overall system health ✓

---

## Tasks / Subtasks

- [x] Task 1: Setup Swagger/OpenAPI documentation (AC: #1)
  - [x] Install @nestjs/swagger and swagger-ui-express
  - [x] Configure SwaggerModule in main.ts
  - [x] Add API documentation decorators to existing controllers
  - [x] Configure API versioning (/api/v1)

- [x] Task 2: Implement global validation pipe (AC: #2)
  - [x] Install class-validator and class-transformer
  - [x] Create global ValidationPipe configuration
  - [x] Create example DTOs with validation decorators
  - [x] Configure whitelist and forbidNonWhitelisted options

- [x] Task 3: Implement exception filter (AC: #3)
  - [x] Create `common/filters/http-exception.filter.ts`
  - [x] Handle HttpException and unknown exceptions
  - [x] Implement structured error response format
  - [x] Add request ID tracking for error correlation

- [x] Task 4: Implement response interceptor (AC: #4)
  - [x] Create `common/interceptors/transform.interceptor.ts`
  - [x] Wrap responses in `{ data, meta }` format
  - [x] Handle pagination metadata

- [x] Task 5: Implement logging interceptor (AC: #5)
  - [x] Create `common/interceptors/logging.interceptor.ts`
  - [x] Log request method, URL, timing
  - [x] Integrate with NestJS Logger

- [x] Task 6: Integrate Prisma with NestJS (AC: #6)
  - [x] Create PrismaModule and PrismaService
  - [x] Configure connection pooling
  - [x] Add onModuleInit and enableShutdownHooks
  - [x] Export for use in feature modules

- [x] Task 7: Implement health check module (AC: #7)
  - [x] Install @nestjs/terminus
  - [x] Create HealthModule with HealthController
  - [x] Add Prisma health indicator
  - [x] Add memory health indicator

- [x] Task 8: Verification (AC: all)
  - [x] Run `pnpm lint` and `pnpm build`
  - [x] Test Swagger UI at /api/docs
  - [x] Test validation error responses
  - [x] Test health endpoint with database check

---

## Dev Notes

### Critical Architecture Constraints

- **API Style**: REST + OpenAPI as specified in architecture.md
- **Versioning**: API v1 prefix (`/api/v1/*`)
- **Response Format**: Consistent `{ data, meta }` wrapper
- **Error Format**: Standard `{ error: { code, message, requestId } }`

### Version Matrix

| Technology | Version | Critical Notes |
|------------|---------|----------------|
| @nestjs/swagger | ^7.0.0 | OpenAPI 3.0 support |
| class-validator | ^0.14.0 | DTO validation |
| class-transformer | ^0.5.0 | DTO transformation |
| @nestjs/terminus | ^10.0.0 | Health checks |
| @prisma/client | From packages/db | Database access |

### File Structure to Create

```
apps/api/src/
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   ├── transform.interceptor.ts
│   │   └── logging.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── dto/
│       └── api-response.dto.ts
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── health/
│   ├── health.module.ts
│   └── health.controller.ts
└── main.ts (update with Swagger, pipes, filters)
```

### Swagger Configuration

```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('BPA AI-Native API')
  .setDescription('Backend API for BPA Service Designer')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### Standard Error Response

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: Record<string, any>;
  };
}
```

### Standard Success Response

```typescript
interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
    timestamp?: string;
  };
}
```

### References

- [Source: _bmad-output/architecture.md#REST + OpenAPI Architecture - lines 342-355]
- [Source: _bmad-output/architecture.md#Backend Error Handling - lines 913-934]
- [Source: _bmad-output/architecture.md#Directory Structure - lines 758-764]
- [External: docs.nestjs.com/openapi/introduction]
- [External: docs.nestjs.com/techniques/validation]
- [External: docs.nestjs.com/recipes/terminus]

---

## Dev Agent Record

### Agent Model Used

Claude (Opus 4.5)

### Debug Log References

- Fixed Prisma 7 ESM compatibility by removing constructor options (uses DATABASE_URL env var)
- Created mock for @bpa/db in e2e tests to handle ESM/CommonJS mismatch

### Completion Notes List

1. **Swagger/OpenAPI**: Configured at `/api/docs` with JWT bearer auth support
2. **Validation**: Global ValidationPipe with transform, whitelist, forbidNonWhitelisted
3. **Exception Filter**: Structured `{ error: { code, message, requestId } }` format with X-Request-ID header support
4. **Response Interceptor**: Wraps all responses in `{ data, meta }` with timestamp and pagination support
5. **Logging Interceptor**: Request/response logging with timing (ms)
6. **Prisma Integration**: PrismaService with NestJS lifecycle hooks, global PrismaModule
7. **Health Checks**: `/health`, `/health/live`, `/health/ready` endpoints with DB and memory checks
8. **API Versioning**: All endpoints prefixed with `/api/v1`

### Files Created

- `apps/api/src/common/dto/api-response.dto.ts`
- `apps/api/src/common/filters/http-exception.filter.ts`
- `apps/api/src/common/interceptors/transform.interceptor.ts`
- `apps/api/src/common/interceptors/logging.interceptor.ts`
- `apps/api/src/common/pipes/validation.pipe.ts`
- `apps/api/src/common/index.ts`
- `apps/api/src/prisma/prisma.service.ts`
- `apps/api/src/prisma/prisma.module.ts`
- `apps/api/src/prisma/index.ts`
- `apps/api/src/health/health.controller.ts`
- `apps/api/src/health/prisma.health.ts`
- `apps/api/src/health/health.module.ts`
- `apps/api/src/health/index.ts`
- `apps/api/__mocks__/@bpa/db.ts` (test mock)
- `apps/api/src/common/filters/http-exception.filter.spec.ts` (unit tests)
- `apps/api/src/common/interceptors/transform.interceptor.spec.ts` (unit tests)

### Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-28 | Story created from sprint-status.yaml requirements | Development |
| 2025-12-28 | Implemented all acceptance criteria, all tests passing | Development |
| 2025-12-28 | Code review: Added unit tests for HttpExceptionFilter and TransformInterceptor | Review |
| 2025-12-28 | Code review: Fixed error logging severity (500s→error, 4xx→warn) | Review |
| 2025-12-28 | Code review: Made health memory thresholds configurable via env vars | Review |
| 2025-12-28 | Code review: Documented connection pooling and Swagger path decisions | Review |

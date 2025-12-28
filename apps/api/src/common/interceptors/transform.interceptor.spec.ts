import { TransformInterceptor } from './transform.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<unknown>;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new TransformInterceptor(reflector);

    mockExecutionContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(),
    } as unknown as ExecutionContext;

    mockCallHandler = {
      handle: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  it('should wrap simple response in { data, meta } format', (done) => {
    const testData = { id: 1, name: 'Test' };
    jest.spyOn(reflector, 'get').mockReturnValue(false);
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(testData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toHaveProperty('data', testData);
        expect(result).toHaveProperty('meta');
        expect(result.meta).toHaveProperty('timestamp');
        done();
      },
    });
  });

  it('should handle paginated response with items array', (done) => {
    const paginatedData = {
      items: [{ id: 1 }, { id: 2 }],
      total: 100,
      page: 1,
      perPage: 10,
    };
    jest.spyOn(reflector, 'get').mockReturnValue(false);
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(paginatedData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result.data).toEqual(paginatedData.items);
        expect(result.meta).toHaveProperty('total', 100);
        expect(result.meta).toHaveProperty('page', 1);
        expect(result.meta).toHaveProperty('perPage', 10);
        expect(result.meta).toHaveProperty('timestamp');
        done();
      },
    });
  });

  it('should not double-wrap already formatted response', (done) => {
    const alreadyFormatted = {
      data: { id: 1 },
      meta: { timestamp: '2025-01-01T00:00:00Z' },
    };
    jest.spyOn(reflector, 'get').mockReturnValue(false);
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(alreadyFormatted));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual(alreadyFormatted);
        done();
      },
    });
  });

  it('should skip transform when SkipTransform decorator is used', (done) => {
    const rawResponse = { status: 'ok' };
    jest.spyOn(reflector, 'get').mockReturnValue(true);
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(rawResponse));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toEqual(rawResponse);
        done();
      },
    });
  });

  it('should handle string response', (done) => {
    const stringResponse = 'Hello World!';
    jest.spyOn(reflector, 'get').mockReturnValue(false);
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(stringResponse));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result.data).toBe(stringResponse);
        expect(result.meta).toHaveProperty('timestamp');
        done();
      },
    });
  });

  it('should handle null response', (done) => {
    jest.spyOn(reflector, 'get').mockReturnValue(false);
    (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result.data).toBeNull();
        expect(result.meta).toHaveProperty('timestamp');
        done();
      },
    });
  });
});

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
    timestamp?: string;
  };
}

/**
 * Metadata key for bypassing transform interceptor
 */
export const SKIP_TRANSFORM_KEY = 'skipTransform';

/**
 * Decorator to skip response transformation for specific endpoints
 * Useful for health checks, streaming responses, etc.
 */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);

/**
 * Response interceptor that wraps all responses in the standard format:
 * { data: T, meta?: { ... } }
 *
 * Supports pagination metadata when the response includes total, page, perPage.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // Check if transform should be skipped
    const skipTransform = this.reflector.get<boolean>(
      SKIP_TRANSFORM_KEY,
      context.getHandler(),
    );

    if (skipTransform) {
      return next.handle() as Observable<ApiResponse<T>>;
    }

    return next.handle().pipe(
      map((response: unknown) => {
        // If response is already in the correct format, return as-is
        if (this.isApiResponse(response)) {
          return response;
        }

        // Check if response includes pagination info
        if (this.isPaginatedResponse(response)) {
          const { items, total, page, perPage, ...rest } = response;
          return {
            data: items as T,
            meta: {
              total,
              page,
              perPage,
              timestamp: new Date().toISOString(),
              ...rest,
            },
          };
        }

        // Wrap simple responses
        return {
          data: response as T,
          meta: {
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }

  private isApiResponse(response: unknown): response is ApiResponse<T> {
    return (
      typeof response === 'object' &&
      response !== null &&
      'data' in response &&
      Object.keys(response).every((key) => ['data', 'meta'].includes(key))
    );
  }

  private isPaginatedResponse(response: unknown): response is {
    items: unknown[];
    total: number;
    page: number;
    perPage: number;
  } {
    return (
      typeof response === 'object' &&
      response !== null &&
      'items' in response &&
      Array.isArray((response as Record<string, unknown>).items)
    );
  }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

/**
 * Logging interceptor that logs request/response details with timing information.
 *
 * Logs include:
 * - HTTP method and URL
 * - Response status code
 * - Request duration in milliseconds
 * - User ID (if authenticated)
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const requestId = (request.headers['x-request-id'] as string) || 'N/A';

    // Get user info if available (from JWT auth)
    const user = request.user as { sub?: string; email?: string } | undefined;
    const userId = user?.sub || 'anonymous';

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const contentLength = response.get('content-length') || '0';
          const duration = Date.now() - startTime;

          this.logger.log(
            `${method} ${url} ${statusCode} ${contentLength}B - ${duration}ms`,
            {
              method,
              url,
              statusCode,
              duration,
              contentLength,
              userId,
              ip,
              userAgent: userAgent.substring(0, 100),
              requestId,
            },
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;

          this.logger.error(
            `${method} ${url} ERROR - ${duration}ms: ${error.message}`,
            {
              method,
              url,
              duration,
              error: error.message,
              userId,
              ip,
              requestId,
            },
          );
        },
      }),
    );
  }
}

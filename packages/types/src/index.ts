/**
 * @bpa/types - Shared TypeScript type definitions
 *
 * This package exports all shared types used across the BPA AI-Native platform.
 */

/**
 * Health check response type used by the API
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
}

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

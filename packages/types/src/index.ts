/**
 * @bpa/types - Shared TypeScript type definitions
 *
 * This package exports all shared types used across the BPA AI-Native platform.
 */

// =============================================================================
// Health & System Types
// =============================================================================

/**
 * Health check response type used by the API
 */
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
}

// =============================================================================
// Authentication Types
// =============================================================================

/**
 * Keycloak configuration for OAuth2 + PKCE flow
 */
export interface KeycloakConfig {
  /** Keycloak server URL (e.g., http://localhost:8080) */
  url: string;
  /** Keycloak realm name */
  realm: string;
  /** OAuth2 client ID */
  clientId: string;
  /** OAuth2 client secret (for confidential clients) */
  clientSecret?: string;
}

/**
 * User roles in the BPA system
 */
export type UserRole = 'SERVICE_DESIGNER' | 'COUNTRY_ADMIN' | 'UNCTAD_SUPPORT';

/**
 * Authenticated user information from JWT token
 */
export interface AuthUser {
  /** Unique user ID (from database) */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  name?: string;
  /** Keycloak subject ID */
  keycloakId: string;
  /** User's roles */
  roles: UserRole[];
  /** Country code for country-scoped access */
  countryCode?: string;
}

/**
 * JWT payload structure from Keycloak
 */
export interface KeycloakJwtPayload {
  /** Subject (user ID in Keycloak) */
  sub: string;
  /** Email address */
  email: string;
  /** Preferred username */
  preferred_username?: string;
  /** Full name */
  name?: string;
  /** Given name */
  given_name?: string;
  /** Family name */
  family_name?: string;
  /** Email verified flag */
  email_verified?: boolean;
  /** Realm roles */
  realm_access?: {
    roles: string[];
  };
  /** Resource access (client roles) */
  resource_access?: Record<string, { roles: string[] }>;
  /** Token expiration timestamp */
  exp: number;
  /** Token issued at timestamp */
  iat: number;
  /** Authorized party */
  azp?: string;
  /** Country code for country-scoped access (custom claim) */
  country_code?: string;
}

/**
 * Session data stored in the database
 */
export interface SessionData {
  /** Session ID */
  id: string;
  /** User ID */
  userId: string;
  /** Session token */
  token: string;
  /** Session expiration */
  expiresAt: Date;
  /** Session creation time */
  createdAt: Date;
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

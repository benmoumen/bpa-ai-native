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

// =============================================================================
// Registration Types
// =============================================================================

/**
 * Registration entity - represents an authorization type within a service
 * (e.g., permit, license, certificate that applicants apply for)
 */
export interface Registration {
  /** Unique registration ID */
  id: string;
  /** Parent service ID */
  serviceId: string;
  /** Registration name (max 100 chars) */
  name: string;
  /** Short name for UI display (max 20 chars) */
  shortName: string;
  /** Unique key within the service (max 50 chars) */
  key: string;
  /** Optional description */
  description?: string | null;
  /** Whether the registration is active */
  isActive: boolean;
  /** Display order within the service */
  sortOrder: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * DTO for creating a new registration
 */
export interface CreateRegistrationInput {
  /** Registration name (required, max 100 chars) */
  name: string;
  /** Short name (required, max 20 chars) */
  shortName: string;
  /** Unique key within service (optional, auto-generated from name if not provided) */
  key?: string;
  /** Optional description */
  description?: string;
  /** Display order (default: 0) */
  sortOrder?: number;
}

/**
 * DTO for updating an existing registration
 */
export interface UpdateRegistrationInput {
  /** Updated name */
  name?: string;
  /** Updated short name */
  shortName?: string;
  /** Updated description */
  description?: string;
  /** Updated active status */
  isActive?: boolean;
  /** Updated display order */
  sortOrder?: number;
}

/**
 * Registration list query parameters
 */
export interface ListRegistrationsQuery {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Filter by active status */
  isActive?: boolean;
  /** Search in name and description */
  search?: string;
  /** Sort by field */
  sortBy?: 'name' | 'sortOrder' | 'createdAt' | 'updatedAt';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// Requirement Types
// =============================================================================

/**
 * Requirement entity - global document type definitions (reusable templates)
 */
export interface Requirement {
  /** Unique requirement ID */
  id: string;
  /** Requirement name (max 100 chars) */
  name: string;
  /** Tooltip/description for the requirement */
  tooltip?: string | null;
  /** Document template reference URL */
  template?: string | null;
  /** Whether the requirement is active */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * DTO for creating a new requirement
 */
export interface CreateRequirementInput {
  /** Requirement name (required, max 100 chars) */
  name: string;
  /** Tooltip/description (optional) */
  tooltip?: string;
  /** Document template reference URL (optional) */
  template?: string;
}

/**
 * DTO for updating an existing requirement
 */
export interface UpdateRequirementInput {
  /** Updated name */
  name?: string;
  /** Updated tooltip */
  tooltip?: string;
  /** Updated template reference */
  template?: string;
  /** Updated active status */
  isActive?: boolean;
}

/**
 * Requirement list query parameters
 */
export interface ListRequirementsQuery {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Filter by active status */
  isActive?: boolean;
  /** Search in name and tooltip */
  search?: string;
  /** Sort by field */
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// Document Requirement Types
// =============================================================================

/**
 * DocumentRequirement entity - links global Requirements to specific Registrations
 */
export interface DocumentRequirement {
  /** Unique document requirement ID */
  id: string;
  /** Parent registration ID */
  registrationId: string;
  /** Referenced requirement ID */
  requirementId: string;
  /** Override name for this specific usage (optional) */
  nameOverride?: string | null;
  /** Whether this document is required */
  isRequired: boolean;
  /** Display order within the registration */
  sortOrder: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
  /** The referenced requirement (populated when included) */
  requirement?: Requirement;
}

/**
 * DTO for creating a new document requirement
 */
export interface CreateDocumentRequirementInput {
  /** Requirement ID to link (required) */
  requirementId: string;
  /** Override name for this specific usage (optional) */
  nameOverride?: string;
  /** Whether this document is required (default: true) */
  isRequired?: boolean;
  /** Display order (default: 0) */
  sortOrder?: number;
}

/**
 * DTO for updating an existing document requirement
 */
export interface UpdateDocumentRequirementInput {
  /** Updated override name */
  nameOverride?: string;
  /** Updated required flag */
  isRequired?: boolean;
  /** Updated display order */
  sortOrder?: number;
}

// =============================================================================
// Cost Types
// =============================================================================

/**
 * Cost type - defines how cost amounts are calculated
 */
export type CostType = 'FIXED' | 'FORMULA';

/**
 * Cost entity - registration-specific fees
 */
export interface Cost {
  /** Unique cost ID */
  id: string;
  /** Parent registration ID */
  registrationId: string;
  /** Cost name (max 100 chars) */
  name: string;
  /** Cost type (FIXED or FORMULA) */
  type: CostType;
  /** Fixed amount (required for FIXED type) */
  fixedAmount?: string | null; // Decimal as string for precision
  /** JSONata formula expression (required for FORMULA type) */
  formula?: string | null;
  /** Currency code (3 letters, default: USD) */
  currency: string;
  /** Display order within the registration */
  sortOrder: number;
  /** Whether the cost is active */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * DTO for creating a new cost
 */
export interface CreateCostInput {
  /** Cost name (required, max 100 chars) */
  name: string;
  /** Cost type (required) */
  type: CostType;
  /** Fixed amount (required for FIXED type) */
  fixedAmount?: string;
  /** JSONata formula expression (required for FORMULA type) */
  formula?: string;
  /** Currency code (default: USD) */
  currency?: string;
  /** Display order (default: 0) */
  sortOrder?: number;
}

/**
 * DTO for updating an existing cost
 */
export interface UpdateCostInput {
  /** Updated name */
  name?: string;
  /** Updated type */
  type?: CostType;
  /** Updated fixed amount */
  fixedAmount?: string;
  /** Updated formula */
  formula?: string;
  /** Updated currency */
  currency?: string;
  /** Updated display order */
  sortOrder?: number;
  /** Updated active status */
  isActive?: boolean;
}

/**
 * Cost list query parameters
 */
export interface ListCostsQuery {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter by cost type */
  type?: CostType;
  /** Search in name */
  search?: string;
  /** Sort by field */
  sortBy?: 'name' | 'sortOrder' | 'createdAt' | 'updatedAt';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// Form Types
// =============================================================================

/**
 * Form type - defines the purpose of a form
 */
export type FormType = 'APPLICANT' | 'GUIDE';

/**
 * Form entity - represents a data collection form within a service
 */
export interface Form {
  /** Unique form ID */
  id: string;
  /** Parent service ID */
  serviceId: string;
  /** Form type (APPLICANT or GUIDE) */
  type: FormType;
  /** Form name (max 255 chars) */
  name: string;
  /** Whether the form is active */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * DTO for creating a new form
 */
export interface CreateFormInput {
  /** Form name (required, max 255 chars) */
  name: string;
  /** Form type (required) */
  type: FormType;
  /** Whether the form is active (default: true) */
  isActive?: boolean;
}

/**
 * DTO for updating an existing form
 */
export interface UpdateFormInput {
  /** Updated name */
  name?: string;
  /** Updated type */
  type?: FormType;
  /** Updated active status */
  isActive?: boolean;
}

/**
 * Form list query parameters
 */
export interface ListFormsQuery {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter by form type */
  type?: FormType;
  /** Sort by field */
  sortBy?: 'name' | 'type' | 'createdAt' | 'updatedAt';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// Form Section Types
// =============================================================================

/**
 * FormSection entity - organizes form fields into groups with optional nesting
 */
export interface FormSection {
  /** Unique section ID */
  id: string;
  /** Parent form ID */
  formId: string;
  /** Parent section ID for nested sections */
  parentSectionId?: string | null;
  /** Section name (max 255 chars) */
  name: string;
  /** Section description */
  description?: string | null;
  /** Display order within the form or parent section */
  sortOrder: number;
  /** Conditional visibility configuration */
  visibilityRule?: VisibilityRule | null;
  /** Whether the section is active */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * DTO for creating a new form section
 */
export interface CreateFormSectionInput {
  /** Section name (required, max 255 chars) */
  name: string;
  /** Section description (optional) */
  description?: string;
  /** Parent section ID for nested sections (optional) */
  parentSectionId?: string;
  /** Display order (default: 0) */
  sortOrder?: number;
}

/**
 * DTO for updating an existing form section
 */
export interface UpdateFormSectionInput {
  /** Updated name */
  name?: string;
  /** Updated description */
  description?: string;
  /** Updated parent section ID */
  parentSectionId?: string | null;
  /** Updated display order */
  sortOrder?: number;
  /** Updated visibility rule */
  visibilityRule?: VisibilityRule | null;
  /** Updated active status */
  isActive?: boolean;
}

/**
 * Form section list query parameters
 */
export interface ListFormSectionsQuery {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter by parent section ID */
  parentSectionId?: string;
  /** Get only top-level sections */
  topLevelOnly?: boolean;
  /** Sort by field */
  sortBy?: 'name' | 'sortOrder' | 'createdAt' | 'updatedAt';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// Form Field Types
// =============================================================================

/**
 * FormField entity - represents a single field in a form
 */
export interface FormField {
  /** Unique field ID */
  id: string;
  /** Parent form ID */
  formId: string;
  /** Section ID the field belongs to */
  sectionId?: string | null;
  /** Field type (JSON Forms type: text, number, date, select, etc.) */
  type: string;
  /** Field label displayed to users */
  label: string;
  /** Field identifier used in form data */
  name: string;
  /** Whether the field is required */
  required: boolean;
  /** Type-specific properties (placeholder, min, max, options, etc.) */
  properties: Record<string, unknown>;
  /** Conditional visibility configuration */
  visibilityRule?: VisibilityRule | null;
  /** Display order within the form or section */
  sortOrder: number;
  /** Whether the field is active */
  isActive: boolean;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * DTO for creating a new form field
 */
export interface CreateFormFieldInput {
  /** Field type (required) */
  type: string;
  /** Field label (required, max 255 chars) */
  label: string;
  /** Field identifier (required, max 100 chars) */
  name: string;
  /** Section ID to assign the field to (optional) */
  sectionId?: string;
  /** Whether the field is required (default: false) */
  required?: boolean;
  /** Type-specific properties (default: {}) */
  properties?: Record<string, unknown>;
  /** Display order (default: 0) */
  sortOrder?: number;
}

/**
 * DTO for updating an existing form field
 */
export interface UpdateFormFieldInput {
  /** Updated type */
  type?: string;
  /** Updated label */
  label?: string;
  /** Updated name */
  name?: string;
  /** Updated section ID */
  sectionId?: string | null;
  /** Updated required status */
  required?: boolean;
  /** Updated properties */
  properties?: Record<string, unknown>;
  /** Updated visibility rule */
  visibilityRule?: VisibilityRule | null;
  /** Updated display order */
  sortOrder?: number;
  /** Updated active status */
  isActive?: boolean;
}

/**
 * Form field list query parameters
 */
export interface ListFormFieldsQuery {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter by section ID */
  sectionId?: string;
  /** Get only fields without a section */
  noSection?: boolean;
  /** Filter by field type */
  type?: string;
  /** Filter by required status */
  required?: boolean;
  /** Sort by field */
  sortBy?: 'name' | 'label' | 'type' | 'sortOrder' | 'createdAt' | 'updatedAt';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
}

// =============================================================================
// Visibility Rule Types
// =============================================================================

/**
 * Visibility mode - determines whether a field/section is always visible or conditional
 */
export type VisibilityMode = 'always' | 'conditional';

/**
 * Visibility operators for conditional logic
 */
export type VisibilityOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty';

/**
 * Single visibility condition - compares a source field against a value
 */
export interface VisibilityCondition {
  /** Name of the field to check (must exist in the same form) */
  fieldName: string;
  /** Comparison operator */
  operator: VisibilityOperator;
  /** Value to compare against (optional for is_empty/is_not_empty) */
  value?: string | number | boolean;
}

/**
 * Visibility rule - defines when a field or section should be visible
 */
export interface VisibilityRule {
  /** Visibility mode: always visible or conditional */
  mode: VisibilityMode;
  /** Array of conditions (used when mode is 'conditional') */
  conditions?: VisibilityCondition[];
  /** Logical operator to combine conditions (default: 'AND') */
  logic?: 'AND' | 'OR';
}

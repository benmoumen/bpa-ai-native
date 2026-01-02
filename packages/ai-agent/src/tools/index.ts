/**
 * Tool Registry - Dynamic tool generation from OpenAPI
 *
 * Implements Story 6-1a: Dynamic Tool Registry
 */

export const TOOLS_VERSION = '0.0.1' as const;

// Types
export type {
  ToolMetadata,
  BPATool,
  ToolRegistry,
  ToolExecutionContext,
  ToolExecutionResult,
  OpenAPISpec,
  PathItem,
  OperationObject,
  ParameterObject,
  RequestBodyObject,
  SchemaObject,
} from './types.js';

// Generator
export {
  generateToolsFromOpenAPI,
  filterTools,
  listTools,
  getToolMetadata,
} from './generator.js';

// Registry
export {
  createToolRegistry,
  initializeRegistry,
  initializeFromAPI,
  getRegistry,
  clearRegistry,
  getAllTools,
  getTool,
  getToolsByScope,
  getToolsByTags,
  getMutatingTools,
  getToolList,
  getToolInfo,
  isRegistryStale,
  getToolsForAI,
} from './registry.js';

// Executor
export { executeTool } from './executor.js';

// Schema utilities
export { openApiToZod, createParametersSchema, resolveRefs } from './schemas.js';

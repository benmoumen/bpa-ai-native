import type {
  OpenAPISpec,
  PathItem,
  OperationObject,
  ParameterObject,
  BPATool,
  ToolMetadata,
  ToolExecutionContext,
} from './types.js';
import { createParametersSchema } from './schemas.js';
import { executeTool } from './executor.js';

/**
 * HTTP methods that mutate data
 */
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Patterns that indicate destructive operations requiring confirmation
 */
const DESTRUCTIVE_PATTERNS = [
  /delete/i,
  /remove/i,
  /publish/i,
  /archive/i,
];

/**
 * Generate Vercel AI SDK tools from OpenAPI specification
 */
export function generateToolsFromOpenAPI(
  spec: OpenAPISpec,
  context: ToolExecutionContext,
): Map<string, BPATool> {
  const tools = new Map<string, BPATool>();

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    const operations = extractOperations(pathItem);

    for (const { method, operation } of operations) {
      const toolResult = generateTool(path, method, operation, spec, context);
      if (toolResult) {
        tools.set(toolResult.metadata.name, toolResult);
      }
    }
  }

  return tools;
}

/**
 * Extract operations from a path item
 */
function extractOperations(
  pathItem: PathItem,
): Array<{ method: ToolMetadata['method']; operation: OperationObject }> {
  const operations: Array<{ method: ToolMetadata['method']; operation: OperationObject }> = [];

  if (pathItem.get) {
    operations.push({ method: 'GET', operation: pathItem.get });
  }
  if (pathItem.post) {
    operations.push({ method: 'POST', operation: pathItem.post });
  }
  if (pathItem.put) {
    operations.push({ method: 'PUT', operation: pathItem.put });
  }
  if (pathItem.patch) {
    operations.push({ method: 'PATCH', operation: pathItem.patch });
  }
  if (pathItem.delete) {
    operations.push({ method: 'DELETE', operation: pathItem.delete });
  }

  return operations;
}

/**
 * Generate a single tool from an OpenAPI operation
 */
function generateTool(
  path: string,
  method: ToolMetadata['method'],
  operation: OperationObject,
  spec: OpenAPISpec,
  context: ToolExecutionContext,
): BPATool | null {
  // Skip operations without operationId
  if (!operation.operationId) {
    console.warn(`[ToolGenerator] Skipping operation without operationId: ${method} ${path}`);
    return null;
  }

  const name = operation.operationId;
  const description = operation.summary ?? operation.description ?? `${method} ${path}`;

  // Collect parameters
  const pathParams: ParameterObject[] = [];
  const queryParams: ParameterObject[] = [];

  for (const param of operation.parameters ?? []) {
    if (param.in === 'path') {
      pathParams.push(param);
    } else if (param.in === 'query') {
      queryParams.push(param);
    }
  }

  // Get request body schema
  const bodySchema = operation.requestBody?.content?.['application/json']?.schema;

  // Create Zod schema for parameters
  const parametersSchema = createParametersSchema(
    pathParams,
    queryParams,
    bodySchema,
    spec,
  );

  // Create metadata
  const metadata: ToolMetadata = {
    name,
    description,
    mutates: MUTATING_METHODS.has(method),
    scope: inferScope(path, operation.tags ?? []),
    requiresConfirmation: shouldRequireConfirmation(name, method),
    method,
    path,
    tags: operation.tags ?? [],
  };

  // Create the tool with execute handler
  const executeHandler = async (args: Record<string, unknown>): Promise<unknown> => {
    const result = await executeTool(metadata, args, context);

    if (!result.success) {
      throw new Error(
        `Tool execution failed: ${result.error?.message ?? 'Unknown error'}`,
      );
    }

    return result.data;
  };

  // Create BPATool directly to avoid SDK type complexity
  return {
    description,
    parameters: parametersSchema,
    execute: executeHandler,
    metadata,
  };
}

/**
 * Infer the scope of an operation from its path and tags
 */
function inferScope(path: string, tags: string[]): ToolMetadata['scope'] {
  const lowerPath = path.toLowerCase();
  const lowerTags = tags.map((t) => t.toLowerCase());

  if (lowerPath.includes('/forms') || lowerTags.includes('forms')) {
    return 'form';
  }
  if (lowerPath.includes('/workflow') || lowerTags.includes('workflow')) {
    return 'workflow';
  }
  if (lowerPath.includes('/registration') || lowerTags.includes('registrations')) {
    return 'registration';
  }
  if (lowerPath.includes('/services') || lowerTags.includes('services')) {
    return 'service';
  }

  return 'global';
}

/**
 * Determine if an operation should require confirmation
 */
function shouldRequireConfirmation(operationId: string, method: string): boolean {
  // DELETE operations always require confirmation
  if (method === 'DELETE') {
    return true;
  }

  // Check for destructive patterns in operation name
  return DESTRUCTIVE_PATTERNS.some((pattern) => pattern.test(operationId));
}

/**
 * Filter tools by scope or tags
 */
export function filterTools(
  tools: Map<string, BPATool>,
  options: {
    scopes?: ToolMetadata['scope'][];
    tags?: string[];
    mutatesOnly?: boolean;
    excludeNames?: string[];
  },
): Map<string, BPATool> {
  const filtered = new Map<string, BPATool>();

  for (const [name, tool] of tools) {
    const metadata = tool.metadata;

    // Exclude by name
    if (options.excludeNames?.includes(name)) {
      continue;
    }

    // Filter by scope
    if (options.scopes && !options.scopes.includes(metadata.scope)) {
      continue;
    }

    // Filter by tags
    if (options.tags) {
      const hasMatchingTag = metadata.tags.some((tag) =>
        options.tags?.includes(tag),
      );
      if (!hasMatchingTag) {
        continue;
      }
    }

    // Filter by mutates
    if (options.mutatesOnly && !metadata.mutates) {
      continue;
    }

    filtered.set(name, tool);
  }

  return filtered;
}

/**
 * Get tool metadata by name
 */
export function getToolMetadata(
  tools: Map<string, BPATool>,
  name: string,
): ToolMetadata | undefined {
  return tools.get(name)?.metadata;
}

/**
 * List all available tools with their metadata
 */
export function listTools(
  tools: Map<string, BPATool>,
): ToolMetadata[] {
  return Array.from(tools.values()).map((t) => t.metadata);
}

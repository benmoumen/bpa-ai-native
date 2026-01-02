import type {
  OpenAPISpec,
  BPATool,
  ToolMetadata,
  ToolRegistry,
  ToolExecutionContext,
} from './types.js';
import {
  generateToolsFromOpenAPI,
  filterTools,
  listTools,
  getToolMetadata,
} from './generator.js';

/**
 * Global tool registry instance
 */
let globalRegistry: ToolRegistry | null = null;

/**
 * Create a new tool registry from OpenAPI spec
 */
export function createToolRegistry(
  spec: OpenAPISpec,
  context: ToolExecutionContext,
): ToolRegistry {
  const tools = generateToolsFromOpenAPI(spec, context);
  const metadata = new Map<string, ToolMetadata>();

  for (const [name, tool] of tools) {
    metadata.set(name, tool.metadata);
  }

  return {
    tools,
    metadata,
    updatedAt: new Date(),
  };
}

/**
 * Initialize the global tool registry
 */
export function initializeRegistry(
  spec: OpenAPISpec,
  context: ToolExecutionContext,
): ToolRegistry {
  globalRegistry = createToolRegistry(spec, context);
  return globalRegistry;
}

/**
 * Get the global tool registry
 */
export function getRegistry(): ToolRegistry | null {
  return globalRegistry;
}

/**
 * Clear the global tool registry
 */
export function clearRegistry(): void {
  globalRegistry = null;
}

/**
 * Fetch OpenAPI spec from API and initialize registry
 */
export async function initializeFromAPI(
  context: ToolExecutionContext,
  specPath = '/openapi.json',
): Promise<ToolRegistry> {
  const url = new URL(specPath, context.apiBaseUrl);

  const headers: Record<string, string> = {};
  if (context.authToken) {
    headers['Authorization'] = `Bearer ${context.authToken}`;
  }

  const response = await fetch(url.toString(), { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${String(response.status)}`);
  }

  const spec = (await response.json()) as OpenAPISpec;
  return initializeRegistry(spec, context);
}

/**
 * Get all tools from registry
 */
export function getAllTools(registry?: ToolRegistry): Map<string, BPATool> {
  const reg = registry ?? globalRegistry;
  if (!reg) {
    throw new Error('Tool registry not initialized');
  }
  return reg.tools;
}

/**
 * Get a specific tool by name
 */
export function getTool(name: string, registry?: ToolRegistry): BPATool | undefined {
  const reg = registry ?? globalRegistry;
  if (!reg) {
    throw new Error('Tool registry not initialized');
  }
  return reg.tools.get(name);
}

/**
 * Get tools filtered by scope
 */
export function getToolsByScope(
  scope: ToolMetadata['scope'],
  registry?: ToolRegistry,
): Map<string, BPATool> {
  const reg = registry ?? globalRegistry;
  if (!reg) {
    throw new Error('Tool registry not initialized');
  }
  return filterTools(reg.tools, { scopes: [scope] });
}

/**
 * Get tools filtered by tags
 */
export function getToolsByTags(
  tags: string[],
  registry?: ToolRegistry,
): Map<string, BPATool> {
  const reg = registry ?? globalRegistry;
  if (!reg) {
    throw new Error('Tool registry not initialized');
  }
  return filterTools(reg.tools, { tags });
}

/**
 * Get only mutating tools
 */
export function getMutatingTools(registry?: ToolRegistry): Map<string, BPATool> {
  const reg = registry ?? globalRegistry;
  if (!reg) {
    throw new Error('Tool registry not initialized');
  }
  return filterTools(reg.tools, { mutatesOnly: true });
}

/**
 * Get all tool metadata as a list
 */
export function getToolList(registry?: ToolRegistry): ToolMetadata[] {
  const reg = registry ?? globalRegistry;
  if (!reg) {
    throw new Error('Tool registry not initialized');
  }
  return listTools(reg.tools);
}

/**
 * Get metadata for a specific tool
 */
export function getToolInfo(
  name: string,
  registry?: ToolRegistry,
): ToolMetadata | undefined {
  const reg = registry ?? globalRegistry;
  if (!reg) {
    throw new Error('Tool registry not initialized');
  }
  return getToolMetadata(reg.tools, name);
}

/**
 * Check if registry needs refresh (older than maxAge)
 */
export function isRegistryStale(
  maxAgeMs = 300000, // 5 minutes
  registry?: ToolRegistry,
): boolean {
  const reg = registry ?? globalRegistry;
  if (!reg) {
    return true;
  }
  return Date.now() - reg.updatedAt.getTime() > maxAgeMs;
}

/**
 * Convert registry tools to format suitable for Vercel AI SDK
 */
export function getToolsForAI(registry?: ToolRegistry): Record<string, BPATool> {
  const reg = registry ?? globalRegistry;
  if (!reg) {
    throw new Error('Tool registry not initialized');
  }

  const result: Record<string, BPATool> = {};
  for (const [name, tool] of reg.tools) {
    result[name] = tool;
  }
  return result;
}

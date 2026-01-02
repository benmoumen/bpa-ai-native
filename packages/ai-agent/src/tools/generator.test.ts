import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateToolsFromOpenAPI,
  filterTools,
  listTools,
  getToolMetadata,
} from './generator.js';
import type { OpenAPISpec, ToolExecutionContext, BPATool } from './types.js';

// Mock fetch for executor
vi.stubGlobal('fetch', vi.fn());

const mockContext: ToolExecutionContext = {
  apiBaseUrl: 'http://localhost:4000/api/v1',
  authToken: 'test-token',
};

const minimalSpec: OpenAPISpec = {
  openapi: '3.0.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/services': {
      get: {
        operationId: 'listServices',
        summary: 'List all services',
        tags: ['Services'],
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
          },
        ],
      },
      post: {
        operationId: 'createService',
        summary: 'Create a new service',
        tags: ['Services'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                },
                required: ['name'],
              },
            },
          },
        },
      },
    },
    '/services/{serviceId}': {
      get: {
        operationId: 'getService',
        summary: 'Get service by ID',
        tags: ['Services'],
        parameters: [
          {
            name: 'serviceId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
      },
      delete: {
        operationId: 'deleteService',
        summary: 'Delete a service',
        tags: ['Services'],
        parameters: [
          {
            name: 'serviceId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
      },
    },
    '/services/{serviceId}/forms': {
      post: {
        operationId: 'createForm',
        summary: 'Create a form for a service',
        tags: ['Forms'],
        parameters: [
          {
            name: 'serviceId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['APPLICANT', 'GUIDE'] },
                },
              },
            },
          },
        },
      },
    },
  },
};

describe('generateToolsFromOpenAPI', () => {
  it('should generate tools for all operations', () => {
    const tools = generateToolsFromOpenAPI(minimalSpec, mockContext);

    expect(tools.size).toBe(5);
    expect(tools.has('listServices')).toBe(true);
    expect(tools.has('createService')).toBe(true);
    expect(tools.has('getService')).toBe(true);
    expect(tools.has('deleteService')).toBe(true);
    expect(tools.has('createForm')).toBe(true);
  });

  it('should set correct metadata for GET operations', () => {
    const tools = generateToolsFromOpenAPI(minimalSpec, mockContext);
    const listTool = tools.get('listServices');

    expect(listTool?.metadata.mutates).toBe(false);
    expect(listTool?.metadata.method).toBe('GET');
    expect(listTool?.metadata.requiresConfirmation).toBe(false);
  });

  it('should set correct metadata for POST operations', () => {
    const tools = generateToolsFromOpenAPI(minimalSpec, mockContext);
    const createTool = tools.get('createService');

    expect(createTool?.metadata.mutates).toBe(true);
    expect(createTool?.metadata.method).toBe('POST');
    expect(createTool?.metadata.requiresConfirmation).toBe(false);
  });

  it('should require confirmation for DELETE operations', () => {
    const tools = generateToolsFromOpenAPI(minimalSpec, mockContext);
    const deleteTool = tools.get('deleteService');

    expect(deleteTool?.metadata.mutates).toBe(true);
    expect(deleteTool?.metadata.method).toBe('DELETE');
    expect(deleteTool?.metadata.requiresConfirmation).toBe(true);
  });

  it('should infer scope from path', () => {
    const tools = generateToolsFromOpenAPI(minimalSpec, mockContext);

    expect(tools.get('listServices')?.metadata.scope).toBe('service');
    expect(tools.get('createForm')?.metadata.scope).toBe('form');
  });

  it('should include tags in metadata', () => {
    const tools = generateToolsFromOpenAPI(minimalSpec, mockContext);

    expect(tools.get('listServices')?.metadata.tags).toContain('Services');
    expect(tools.get('createForm')?.metadata.tags).toContain('Forms');
  });
});

describe('filterTools', () => {
  let tools: Map<string, BPATool>;

  beforeEach(() => {
    tools = generateToolsFromOpenAPI(minimalSpec, mockContext);
  });

  it('should filter by scope', () => {
    const serviceScopeTools = filterTools(tools, { scopes: ['service'] });
    const formScopeTools = filterTools(tools, { scopes: ['form'] });

    expect(serviceScopeTools.size).toBe(4);
    expect(formScopeTools.size).toBe(1);
    expect(formScopeTools.has('createForm')).toBe(true);
  });

  it('should filter by tags', () => {
    const servicesTagTools = filterTools(tools, { tags: ['Services'] });
    const formsTagTools = filterTools(tools, { tags: ['Forms'] });

    expect(servicesTagTools.size).toBe(4);
    expect(formsTagTools.size).toBe(1);
  });

  it('should filter mutating tools only', () => {
    const mutatingTools = filterTools(tools, { mutatesOnly: true });

    expect(mutatingTools.size).toBe(3);
    expect(mutatingTools.has('createService')).toBe(true);
    expect(mutatingTools.has('deleteService')).toBe(true);
    expect(mutatingTools.has('createForm')).toBe(true);
    expect(mutatingTools.has('listServices')).toBe(false);
  });

  it('should exclude by name', () => {
    const filtered = filterTools(tools, {
      excludeNames: ['deleteService', 'createForm'],
    });

    expect(filtered.size).toBe(3);
    expect(filtered.has('deleteService')).toBe(false);
    expect(filtered.has('createForm')).toBe(false);
  });
});

describe('listTools', () => {
  it('should return array of metadata', () => {
    const tools = generateToolsFromOpenAPI(minimalSpec, mockContext);
    const list = listTools(tools);

    expect(list).toHaveLength(5);
    expect(list.every((m) => m.name.length > 0 && m.method.length > 0 && m.path.length > 0)).toBe(true);
  });
});

describe('getToolMetadata', () => {
  it('should return metadata for existing tool', () => {
    const tools = generateToolsFromOpenAPI(minimalSpec, mockContext);
    const metadata = getToolMetadata(tools, 'createService');

    expect(metadata?.name).toBe('createService');
    expect(metadata?.method).toBe('POST');
    expect(metadata?.path).toBe('/services');
  });

  it('should return undefined for non-existing tool', () => {
    const tools = generateToolsFromOpenAPI(minimalSpec, mockContext);
    const metadata = getToolMetadata(tools, 'nonExisting');

    expect(metadata).toBeUndefined();
  });
});

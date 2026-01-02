import { z } from 'zod';
import type { SchemaObject, OpenAPISpec } from './types.js';

/**
 * Convert OpenAPI schema to Zod schema
 */
export function openApiToZod(
  schema: SchemaObject,
  spec?: OpenAPISpec,
  required = false,
): z.ZodTypeAny {
  // Handle $ref
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/components/schemas/', '');
    const refSchema = spec?.components?.schemas?.[refPath];
    if (refSchema) {
      return openApiToZod(refSchema, spec, required);
    }
    // Fallback to unknown if ref not found
    return z.unknown();
  }

  let zodSchema: z.ZodTypeAny;

  switch (schema.type) {
    case 'string':
      zodSchema = createStringSchema(schema);
      break;

    case 'number':
    case 'integer':
      zodSchema = createNumberSchema(schema);
      break;

    case 'boolean':
      zodSchema = z.boolean();
      break;

    case 'array':
      zodSchema = createArraySchema(schema, spec);
      break;

    case 'object':
      zodSchema = createObjectSchema(schema, spec);
      break;

    default:
      // No type specified, allow any
      zodSchema = z.unknown();
  }

  // Add description if present
  if (schema.description) {
    zodSchema = zodSchema.describe(schema.description);
  }

  // Handle optional
  if (!required) {
    zodSchema = zodSchema.optional();
  }

  return zodSchema;
}

function createStringSchema(schema: SchemaObject): z.ZodString {
  let stringSchema = z.string();

  if (schema.minLength !== undefined) {
    stringSchema = stringSchema.min(schema.minLength);
  }
  if (schema.maxLength !== undefined) {
    stringSchema = stringSchema.max(schema.maxLength);
  }
  if (schema.pattern) {
    stringSchema = stringSchema.regex(new RegExp(schema.pattern));
  }
  if (schema.format === 'email') {
    stringSchema = stringSchema.email();
  }
  if (schema.format === 'uuid') {
    stringSchema = stringSchema.uuid();
  }
  if (schema.format === 'uri' || schema.format === 'url') {
    stringSchema = stringSchema.url();
  }

  return stringSchema;
}

function createNumberSchema(schema: SchemaObject): z.ZodNumber {
  let numberSchema = z.number();

  if (schema.type === 'integer') {
    numberSchema = numberSchema.int();
  }
  if (schema.minimum !== undefined) {
    numberSchema = numberSchema.min(schema.minimum);
  }
  if (schema.maximum !== undefined) {
    numberSchema = numberSchema.max(schema.maximum);
  }

  return numberSchema;
}

function createArraySchema(
  schema: SchemaObject,
  spec?: OpenAPISpec,
): z.ZodArray<z.ZodTypeAny> {
  const itemsSchema = schema.items
    ? openApiToZod(schema.items, spec, true)
    : z.unknown();

  return z.array(itemsSchema);
}

function createObjectSchema(
  schema: SchemaObject,
  spec?: OpenAPISpec,
): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};
  const requiredFields = new Set(schema.required ?? []);

  if (schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const isRequired = requiredFields.has(key);
      shape[key] = openApiToZod(propSchema, spec, isRequired);
    }
  }

  return z.object(shape);
}

/**
 * Create a Zod schema for tool parameters from OpenAPI operation
 */
export function createParametersSchema(
  pathParams: Array<{ name: string; schema?: SchemaObject; required?: boolean; description?: string }>,
  queryParams: Array<{ name: string; schema?: SchemaObject; required?: boolean; description?: string }>,
  bodySchema?: SchemaObject,
  spec?: OpenAPISpec,
): z.ZodObject<z.ZodRawShape> {
  const shape: z.ZodRawShape = {};

  // Add path parameters
  for (const param of pathParams) {
    const paramSchema = param.schema
      ? openApiToZod(param.schema, spec, param.required ?? true)
      : z.string();
    shape[param.name] = param.description
      ? paramSchema.describe(param.description)
      : paramSchema;
  }

  // Add query parameters
  for (const param of queryParams) {
    const paramSchema = param.schema
      ? openApiToZod(param.schema, spec, param.required ?? false)
      : z.string().optional();
    shape[param.name] = param.description
      ? paramSchema.describe(param.description)
      : paramSchema;
  }

  // Add body as 'data' parameter if present
  if (bodySchema) {
    shape['data'] = openApiToZod(bodySchema, spec, true).describe(
      'Request body data',
    );
  }

  return z.object(shape);
}

/**
 * Resolve all $ref references in a schema
 */
export function resolveRefs(
  schema: SchemaObject,
  spec: OpenAPISpec,
): SchemaObject {
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/components/schemas/', '');
    const refSchema = spec.components?.schemas?.[refPath];
    if (refSchema) {
      return resolveRefs(refSchema, spec);
    }
    return schema;
  }

  const resolved: SchemaObject = { ...schema };

  if (schema.properties) {
    resolved.properties = {};
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      resolved.properties[key] = resolveRefs(propSchema, spec);
    }
  }

  if (schema.items) {
    resolved.items = resolveRefs(schema.items, spec);
  }

  return resolved;
}

/**
 * Utilities for converting between InputProperty tree and JSON Schema
 * for workflow inputs editing
 */

import { JSONSchema } from '../types/index';

export interface InputProperty {
  /** Stable ID for React keys (doesn't change during edits) */
  id: string;
  /** Property name in the schema */
  name: string;
  /** JSON Schema type */
  type: 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';
  /** Whether this property is required */
  required: boolean;
  /** Optional description */
  description?: string;

  /** UI state: whether advanced fields are expanded */
  expanded?: boolean;

  // String-specific validations
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  enum?: string[];

  // Number/integer-specific validations
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;

  // Common fields
  default?: any;
  example?: any;

  // Nested structures
  /** Child properties for type === 'object' */
  properties?: InputProperty[];
  /** Item schema for type === 'array' */
  items?: InputProperty;
}

/**
 * Generate a unique ID for a new property
 */
export function generatePropertyId(): string {
  return `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert array of InputProperty to JSON Schema object
 * Returns undefined if properties array is empty
 */
export function propertiesToSchema(props: InputProperty[]): JSONSchema | undefined {
  if (props.length === 0) return undefined;

  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const prop of props) {
    const schemaProp = propertyToSchemaProperty(prop);
    properties[prop.name] = schemaProp;

    if (prop.required) {
      required.push(prop.name);
    }
  }

  const schema: JSONSchema = {
    type: 'object',
    properties,
  };

  if (required.length > 0) {
    schema.required = required;
  }

  return schema;
}

/**
 * Convert single InputProperty to JSON Schema property object
 * Handles recursion for nested objects
 */
function propertyToSchemaProperty(prop: InputProperty): any {
  const schemaProp: any = { type: prop.type };

  // Common fields
  if (prop.description) schemaProp.description = prop.description;
  if (prop.default !== undefined) schemaProp.default = prop.default;
  if (prop.example !== undefined) schemaProp.example = prop.example;

  // String-specific
  if (prop.type === 'string') {
    if (prop.format) schemaProp.format = prop.format;
    if (prop.pattern) schemaProp.pattern = prop.pattern;
    if (prop.minLength !== undefined) schemaProp.minLength = prop.minLength;
    if (prop.maxLength !== undefined) schemaProp.maxLength = prop.maxLength;
    if (prop.enum && prop.enum.length > 0) {
      // Filter out empty strings from enum values
      const filteredEnum = prop.enum.filter((v) => v !== '');
      if (filteredEnum.length > 0) {
        schemaProp.enum = filteredEnum;
      }
    }
  }

  // Number/integer-specific
  if (prop.type === 'number' || prop.type === 'integer') {
    if (prop.minimum !== undefined) schemaProp.minimum = prop.minimum;
    if (prop.maximum !== undefined) schemaProp.maximum = prop.maximum;
    if (prop.exclusiveMinimum !== undefined) schemaProp.exclusiveMinimum = prop.exclusiveMinimum;
    if (prop.exclusiveMaximum !== undefined) schemaProp.exclusiveMaximum = prop.exclusiveMaximum;
  }

  // Object-specific (RECURSIVE!)
  if (prop.type === 'object' && prop.properties && prop.properties.length > 0) {
    const nestedSchema = propertiesToSchema(prop.properties);
    if (nestedSchema) {
      schemaProp.properties = nestedSchema.properties;
      if (nestedSchema.required) {
        schemaProp.required = nestedSchema.required;
      }
    }
  }

  // Array-specific
  if (prop.type === 'array' && prop.items) {
    schemaProp.items = propertyToSchemaProperty(prop.items);
  }

  return schemaProp;
}

/**
 * Convert JSON Schema to array of InputProperty
 * Returns empty array if schema is undefined or not an object schema
 */
export function schemaToProperties(schema: JSONSchema | undefined): InputProperty[] {
  if (!schema || schema.type !== 'object' || !schema.properties) {
    return [];
  }

  const props: InputProperty[] = [];
  const required = new Set(schema.required || []);

  for (const [name, propSchema] of Object.entries(schema.properties)) {
    if (
      typeof propSchema !== 'object' ||
      propSchema === null ||
      !('type' in propSchema) ||
      !propSchema.type
    )
      continue;

    const property = schemaPropertyToProperty(name, propSchema, required.has(name));
    if (property) {
      props.push(property);
    }
  }

  return props;
}

/**
 * Convert JSON Schema property object to InputProperty
 * Handles recursion for nested objects
 * Returns null if schema contains unsupported features (anyOf, oneOf, $ref)
 */
function schemaPropertyToProperty(
  name: string,
  propSchema: any,
  required: boolean,
): InputProperty | null {
  // Skip unsupported features - direct users to text editor
  if (propSchema.anyOf || propSchema.oneOf || propSchema.allOf || propSchema.$ref) {
    return null;
  }

  // Validate type is supported
  const supportedTypes = ['string', 'number', 'integer', 'boolean', 'object', 'array'];
  if (!supportedTypes.includes(propSchema.type)) {
    return null;
  }

  const property: InputProperty = {
    id: generatePropertyId(),
    name,
    type: propSchema.type as InputProperty['type'],
    required,
    description: propSchema.description,
    expanded: false, // Default to collapsed
  };

  // Extract type-specific fields
  if (propSchema.type === 'string') {
    property.format = propSchema.format;
    property.pattern = propSchema.pattern;
    property.minLength = propSchema.minLength;
    property.maxLength = propSchema.maxLength;
    if (propSchema.enum && Array.isArray(propSchema.enum)) {
      property.enum = propSchema.enum;
    }
  }

  if (propSchema.type === 'number' || propSchema.type === 'integer') {
    property.minimum = propSchema.minimum;
    property.maximum = propSchema.maximum;
    property.exclusiveMinimum = propSchema.exclusiveMinimum;
    property.exclusiveMaximum = propSchema.exclusiveMaximum;
  }

  property.default = propSchema.default;
  property.example = propSchema.example;

  // Handle nested objects (RECURSION!)
  if (propSchema.type === 'object' && propSchema.properties) {
    const nestedSchema: JSONSchema = {
      type: 'object',
      properties: propSchema.properties,
      required: propSchema.required,
    };
    property.properties = schemaToProperties(nestedSchema);
  }

  // Handle arrays
  if (propSchema.type === 'array' && propSchema.items) {
    const itemProp = schemaPropertyToProperty('item', propSchema.items, false);
    if (itemProp) {
      // Remove the 'item' name since it's not a named property
      property.items = { ...itemProp, name: '' };
    }
  }

  return property;
}

/**
 * Merge UI state (like expanded flags) from old properties into new properties
 * Matches properties by name and preserves expanded state
 */
export function mergePropertyUIState(
  newProperties: InputProperty[],
  oldProperties: InputProperty[],
): InputProperty[] {
  // Create a map of old properties by name for quick lookup
  const oldPropsMap = new Map<string, InputProperty>();
  for (const oldProp of oldProperties) {
    oldPropsMap.set(oldProp.name, oldProp);
  }

  return newProperties.map((newProp) => {
    const oldProp = oldPropsMap.get(newProp.name);
    if (!oldProp) {
      // New property that didn't exist before, keep defaults
      return newProp;
    }

    // Preserve expanded state
    const merged: InputProperty = {
      ...newProp,
      expanded: oldProp.expanded,
    };

    // Recursively merge nested properties
    if (merged.type === 'object' && merged.properties && oldProp.properties) {
      merged.properties = mergePropertyUIState(merged.properties, oldProp.properties);
    }

    return merged;
  });
}

/**
 * Get all property names from a nested property tree (for duplicate detection)
 */
export function getAllPropertyNames(properties: InputProperty[]): string[] {
  const names: string[] = [];

  for (const prop of properties) {
    names.push(prop.name);

    // Recursively collect nested property names
    if (prop.type === 'object' && prop.properties) {
      names.push(...getAllPropertyNames(prop.properties));
    }
  }

  return names;
}

/**
 * Check if a schema contains complex/unsupported features
 * Returns true if the schema should be displayed in read-only mode
 */
export function hasComplexSchema(schema: JSONSchema | undefined): boolean {
  if (!schema || typeof schema !== 'object') return false;

  // Check for schema composition keywords
  if (schema.anyOf || schema.oneOf || schema.allOf || schema.not) {
    return true;
  }

  // Check for references
  if (schema.$ref) {
    return true;
  }

  // Recursively check properties
  if (schema.type === 'object' && schema.properties) {
    for (const propSchema of Object.values(schema.properties)) {
      if (typeof propSchema === 'object' && propSchema !== null) {
        if (hasComplexSchema(propSchema as JSONSchema)) {
          return true;
        }
      }
    }
  }

  // Check array items
  if (schema.type === 'array' && schema.items) {
    if (typeof schema.items === 'object' && schema.items !== null) {
      if (hasComplexSchema(schema.items as JSONSchema)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validate a JSON Schema using AJV
 * Returns validation result with any errors
 */
export function validateSchema(schema: JSONSchema): { valid: boolean; errors: string[] } {
  // Import AJV lazily to avoid bundle bloat if not used
  try {
    // TODO: Implement AJV validation when needed
    // For now, basic structural validation
    if (!schema || typeof schema !== 'object') {
      return { valid: false, errors: ['Schema must be an object'] };
    }

    if (schema.type === 'object' && !schema.properties) {
      return { valid: false, errors: ['Object schema must have properties'] };
    }

    return { valid: true, errors: [] };
  } catch (err) {
    return { valid: false, errors: [String(err)] };
  }
}

/**
 * Refinement Intent Parser
 *
 * Story 6-5: Iterative Refinement (Task 1)
 *
 * Parses user natural language commands into structured refinement intents.
 * Supports add, remove, modify field operations and undo functionality.
 */

/**
 * Field types that can be added to forms
 */
export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'textarea'
  | 'file';

/**
 * Validation rules that can be applied to fields
 */
export interface ValidationChange {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

/**
 * Intent for adding a new field
 */
export interface AddFieldIntent {
  type: 'ADD_FIELD';
  fieldName: string;
  fieldType: FieldType;
  section?: string;
  validation?: ValidationChange;
}

/**
 * Intent for removing a field
 */
export interface RemoveFieldIntent {
  type: 'REMOVE_FIELD';
  fieldName: string;
}

/**
 * Intent for modifying an existing field
 */
export interface ModifyFieldIntent {
  type: 'MODIFY_FIELD';
  fieldName: string;
  changes: ValidationChange & {
    newName?: string;
    newType?: FieldType;
  };
}

/**
 * Intent for removing a section and its fields
 */
export interface RemoveSectionIntent {
  type: 'REMOVE_SECTION';
  sectionName: string;
}

/**
 * Intent to undo recent changes
 */
export interface UndoIntent {
  type: 'UNDO';
  count?: number; // Number of operations to undo (default: 1)
}

/**
 * Intent for batch operations
 */
export interface BatchIntent {
  type: 'BATCH';
  commands: RefinementIntent[];
}

/**
 * Intent when command cannot be parsed
 */
export interface UnknownIntent {
  type: 'UNKNOWN';
  originalText: string;
}

/**
 * Union type of all possible refinement intents
 */
export type RefinementIntent =
  | AddFieldIntent
  | RemoveFieldIntent
  | ModifyFieldIntent
  | RemoveSectionIntent
  | UndoIntent
  | BatchIntent
  | UnknownIntent;

/**
 * Field type mappings from natural language to FieldType
 */
const FIELD_TYPE_PATTERNS: Array<{ patterns: RegExp[]; type: FieldType }> = [
  { patterns: [/\bemail\b/i, /\be-?mail\b/i], type: 'email' },
  { patterns: [/\bphone\b/i, /\btel(?:ephone)?\b/i, /\bmobile\b/i], type: 'tel' },
  { patterns: [/\bnumber\b/i, /\bnumeric\b/i, /\binteger\b/i, /\bamount\b/i, /\bquantity\b/i], type: 'number' },
  { patterns: [/\bdate\b/i, /\bbirthday\b/i, /\bdob\b/i], type: 'date' },
  { patterns: [/\bselect\b/i, /\bdropdown\b/i, /\bchoice\b/i, /\boption\b/i], type: 'select' },
  { patterns: [/\bcheckbox\b/i, /\btoggle\b/i, /\bboolean\b/i, /\byes.?no\b/i], type: 'checkbox' },
  { patterns: [/\btextarea\b/i, /\bmulti.?line\b/i, /\blong.?text\b/i, /\bdescription\b/i, /\bcomment\b/i], type: 'textarea' },
  { patterns: [/\bfile\b/i, /\bupload\b/i, /\battachment\b/i, /\bdocument\b/i], type: 'file' },
];

/**
 * Infer field type from field name or explicit type mention
 */
function inferFieldType(text: string): FieldType {
  const normalizedText = text.toLowerCase();

  for (const { patterns, type } of FIELD_TYPE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        return type;
      }
    }
  }

  // Default to text if no specific type detected
  return 'text';
}

/**
 * Extract field name from user input
 * Handles patterns like:
 * - "a phone number field"
 * - "the email field"
 * - "field named 'company'"
 * - "company name"
 */
function extractFieldName(text: string): string {
  // Try explicit field name patterns first
  const quotedMatch = text.match(/(?:field|named?|called?)\s+['"]([^'"]+)['"]/i);
  if (quotedMatch) {
    return quotedMatch[1].trim();
  }

  // Try "the X field" pattern
  const theFieldMatch = text.match(/\bthe\s+(\w+(?:\s+\w+)?)\s+field\b/i);
  if (theFieldMatch) {
    return theFieldMatch[1].trim();
  }

  // Try "a/an X field" pattern
  const aFieldMatch = text.match(/\ba[n]?\s+(\w+(?:\s+\w+)?)\s+field\b/i);
  if (aFieldMatch) {
    return aFieldMatch[1].trim();
  }

  // Try to extract noun phrases (simple heuristic)
  const words = text
    .replace(/^(add|remove|delete|modify|change|update|make)\s+/i, '')
    .replace(/\s+(field|section|required|optional)\s*$/i, '')
    .trim();

  return words || 'field';
}

/**
 * Extract section name from user input
 */
function extractSectionName(text: string): string {
  // Try explicit section name patterns
  const quotedMatch = text.match(/(?:section|group)\s+['"]([^'"]+)['"]/i);
  if (quotedMatch) {
    return quotedMatch[1].trim();
  }

  // Try "the X section" pattern
  const theSectionMatch = text.match(/\bthe\s+(\w+(?:\s+\w+)?)\s+section\b/i);
  if (theSectionMatch) {
    return theSectionMatch[1].trim();
  }

  // Default extraction
  const words = text
    .replace(/^(remove|delete)\s+/i, '')
    .replace(/\s+section\s*$/i, '')
    .trim();

  return words || 'section';
}

/**
 * Check if text indicates a required field modification
 * Must NOT contain "not required" or "optional"
 */
function isRequiredModification(text: string): boolean {
  // Exclude "not required" case
  if (/\bnot\s+required\b/i.test(text)) {
    return false;
  }
  return /\b(make|set|mark)\b.*\brequired\b/i.test(text) ||
         /\brequired\b.*\b(make|set|mark)\b/i.test(text);
}

/**
 * Check if text indicates an optional field modification
 */
function isOptionalModification(text: string): boolean {
  return /\b(make|set|mark)\b.*\boptional\b/i.test(text) ||
         /\boptional\b.*\b(make|set|mark)\b/i.test(text) ||
         /\b(make|set|mark)\b.*\bnot\s+required\b/i.test(text);
}

/**
 * Parse a single refinement command
 */
function parseSingleIntent(text: string): RefinementIntent {
  const normalizedText = text.trim().toLowerCase();

  // Check for UNDO intent
  if (/^undo(\s+last(\s+change)?)?$/i.test(text.trim())) {
    return { type: 'UNDO' };
  }

  // Check for UNDO with count
  const undoCountMatch = text.match(/^undo\s+(?:last\s+)?(\d+)\s*(?:changes?)?$/i);
  if (undoCountMatch) {
    return { type: 'UNDO', count: parseInt(undoCountMatch[1], 10) };
  }

  // Check for ADD_FIELD intent
  if (/^add\b/i.test(text.trim())) {
    const fieldName = extractFieldName(text);
    const fieldType = inferFieldType(text);

    // Check for section specification
    let section: string | undefined;
    const sectionMatch = text.match(/\b(?:to|in|under)\s+(?:the\s+)?['"]?(\w+(?:\s+\w+)?)['"]?\s+section\b/i);
    if (sectionMatch) {
      section = sectionMatch[1].trim();
    }

    return {
      type: 'ADD_FIELD',
      fieldName,
      fieldType,
      ...(section && { section }),
    };
  }

  // Check for REMOVE_SECTION intent
  if (/\bremove\b.*\bsection\b/i.test(normalizedText) || /\bdelete\b.*\bsection\b/i.test(normalizedText)) {
    return {
      type: 'REMOVE_SECTION',
      sectionName: extractSectionName(text),
    };
  }

  // Check for REMOVE_FIELD intent
  if (/^(remove|delete)\b/i.test(text.trim())) {
    return {
      type: 'REMOVE_FIELD',
      fieldName: extractFieldName(text),
    };
  }

  // Check for MODIFY_FIELD intent (required/optional)
  if (isRequiredModification(text)) {
    return {
      type: 'MODIFY_FIELD',
      fieldName: extractFieldName(text),
      changes: { required: true },
    };
  }

  if (isOptionalModification(text)) {
    return {
      type: 'MODIFY_FIELD',
      fieldName: extractFieldName(text),
      changes: { required: false },
    };
  }

  // Check for general modification (change, update, modify)
  if (/^(change|update|modify|rename)\b/i.test(text.trim())) {
    const changes: ModifyFieldIntent['changes'] = {};
    let fieldName: string;

    // Check for rename pattern: "change X to Y"
    const renameMatch = text.match(/^(?:change|rename|update|modify)\s+(?:the\s+)?['"]?(\w+(?:\s+\w+)?)['"]?\s+to\s+['"]?(\w+(?:\s+\w+)?)['"]?$/i);
    if (renameMatch) {
      fieldName = renameMatch[1].trim();
      changes.newName = renameMatch[2].trim();
    } else {
      // Check for type change: "change X to a number field"
      const typeMatch = text.match(/^(?:change|update|modify)\s+(?:the\s+)?['"]?(\w+(?:\s+\w+)?)['"]?\s+to\s+(?:a\s+)?(\w+)\s+(?:field|type)\b/i);
      if (typeMatch) {
        fieldName = typeMatch[1].trim();
        const newType = inferFieldType(typeMatch[2]);
        if (newType !== 'text') {
          changes.newType = newType;
        }
      } else {
        // Fallback: extract field name normally
        fieldName = extractFieldName(text);
      }
    }

    return {
      type: 'MODIFY_FIELD',
      fieldName,
      changes,
    };
  }

  // Unknown intent
  return {
    type: 'UNKNOWN',
    originalText: text,
  };
}

/**
 * Split text into individual commands
 * Handles:
 * - Comma-separated commands: "add phone, make name required"
 * - "and" separated: "add phone and remove fax"
 * - Semicolon separated: "add phone; remove fax"
 */
function splitCommands(text: string): string[] {
  // First, try to split by common separators
  const separatorPattern = /\s*(?:,\s*(?:and\s+)?|\s+and\s+|;\s*)\s*/i;
  const parts = text.split(separatorPattern).filter(Boolean);

  // If no splits found, return as single command
  if (parts.length <= 1) {
    return [text.trim()];
  }

  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Parse user input into structured refinement intents
 *
 * @param text - User's natural language command
 * @returns Parsed refinement intent or batch of intents
 *
 * @example
 * parseRefinementIntent("Add a phone number field")
 * // { type: 'ADD_FIELD', fieldName: 'phone number', fieldType: 'tel' }
 *
 * @example
 * parseRefinementIntent("Remove the address section")
 * // { type: 'REMOVE_SECTION', sectionName: 'address' }
 *
 * @example
 * parseRefinementIntent("Make email required")
 * // { type: 'MODIFY_FIELD', fieldName: 'email', changes: { required: true } }
 *
 * @example
 * parseRefinementIntent("Add phone, make name required, remove fax")
 * // { type: 'BATCH', commands: [...] }
 */
export function parseRefinementIntent(text: string): RefinementIntent {
  if (!text || typeof text !== 'string') {
    return { type: 'UNKNOWN', originalText: String(text) };
  }

  const trimmedText = text.trim();
  if (!trimmedText) {
    return { type: 'UNKNOWN', originalText: '' };
  }

  // Check for undo first (common single command)
  if (/^undo\b/i.test(trimmedText)) {
    return parseSingleIntent(trimmedText);
  }

  // Split into potential multiple commands
  const commands = splitCommands(trimmedText);

  // Single command
  if (commands.length === 1) {
    return parseSingleIntent(commands[0]);
  }

  // Multiple commands → batch
  const parsedCommands = commands.map(parseSingleIntent);

  // Filter out unknown intents from batch
  const validCommands = parsedCommands.filter((cmd) => cmd.type !== 'UNKNOWN');

  if (validCommands.length === 0) {
    return { type: 'UNKNOWN', originalText: trimmedText };
  }

  if (validCommands.length === 1) {
    return validCommands[0];
  }

  return {
    type: 'BATCH',
    commands: validCommands as Exclude<RefinementIntent, BatchIntent | UnknownIntent>[],
  };
}

/**
 * Check if an intent is destructive (removes data)
 */
export function isDestructiveIntent(intent: RefinementIntent): boolean {
  switch (intent.type) {
    case 'REMOVE_FIELD':
    case 'REMOVE_SECTION':
      return true;
    case 'BATCH':
      return intent.commands.some(isDestructiveIntent);
    default:
      return false;
  }
}

/**
 * Get a human-readable description of an intent
 */
export function describeIntent(intent: RefinementIntent): string {
  switch (intent.type) {
    case 'ADD_FIELD':
      const sectionNote = intent.section ? ` in "${intent.section}" section` : '';
      return `Add field "${intent.fieldName}" (${intent.fieldType})${sectionNote}`;
    case 'REMOVE_FIELD':
      return `Remove field "${intent.fieldName}"`;
    case 'MODIFY_FIELD':
      const changes: string[] = [];
      if (intent.changes.required !== undefined) {
        changes.push(intent.changes.required ? 'make required' : 'make optional');
      }
      if (intent.changes.newName) {
        changes.push(`rename to "${intent.changes.newName}"`);
      }
      if (intent.changes.newType) {
        changes.push(`change type to ${intent.changes.newType}`);
      }
      return `Modify field "${intent.fieldName}": ${changes.join(', ') || 'update'}`;
    case 'REMOVE_SECTION':
      return `Remove section "${intent.sectionName}" and all its fields`;
    case 'UNDO':
      return intent.count ? `Undo last ${intent.count} changes` : 'Undo last change';
    case 'BATCH':
      return `${intent.commands.length} changes: ${intent.commands.map(describeIntent).join('; ')}`;
    case 'UNKNOWN':
      return `Unknown command: "${intent.originalText}"`;
  }
}

export default parseRefinementIntent;

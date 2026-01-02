/**
 * Refinement Intent Parser Tests
 *
 * Story 6-5: Iterative Refinement (Task 1)
 */

import { describe, it, expect } from 'vitest';
import {
  parseRefinementIntent,
  isDestructiveIntent,
  describeIntent,
  type RefinementIntent,
  type AddFieldIntent,
  type RemoveFieldIntent,
  type ModifyFieldIntent,
  type RemoveSectionIntent,
  type UndoIntent,
  type BatchIntent,
} from './refinement-parser';

describe('parseRefinementIntent', () => {
  describe('ADD_FIELD intent', () => {
    it('parses "Add a phone number field"', () => {
      const result = parseRefinementIntent('Add a phone number field');
      expect(result.type).toBe('ADD_FIELD');
      const addIntent = result as AddFieldIntent;
      expect(addIntent.fieldType).toBe('tel');
      expect(addIntent.fieldName).toBe('phone number');
    });

    it('parses "Add email field"', () => {
      const result = parseRefinementIntent('Add email field');
      expect(result.type).toBe('ADD_FIELD');
      const addIntent = result as AddFieldIntent;
      expect(addIntent.fieldType).toBe('email');
    });

    it('parses "Add a date field for birthday"', () => {
      const result = parseRefinementIntent('Add a date field for birthday');
      expect(result.type).toBe('ADD_FIELD');
      const addIntent = result as AddFieldIntent;
      expect(addIntent.fieldType).toBe('date');
    });

    it('parses "Add company name" with default text type', () => {
      const result = parseRefinementIntent('Add company name');
      expect(result.type).toBe('ADD_FIELD');
      const addIntent = result as AddFieldIntent;
      expect(addIntent.fieldType).toBe('text');
      expect(addIntent.fieldName).toBe('company name');
    });

    it('parses field with section: "Add phone to the contact section"', () => {
      const result = parseRefinementIntent('Add phone to the contact section');
      expect(result.type).toBe('ADD_FIELD');
      const addIntent = result as AddFieldIntent;
      expect(addIntent.fieldType).toBe('tel');
      expect(addIntent.section).toBe('contact');
    });

    it('parses number field type', () => {
      const result = parseRefinementIntent('Add a number field for quantity');
      expect(result.type).toBe('ADD_FIELD');
      const addIntent = result as AddFieldIntent;
      expect(addIntent.fieldType).toBe('number');
    });

    it('parses checkbox field type', () => {
      const result = parseRefinementIntent('Add a checkbox for terms');
      expect(result.type).toBe('ADD_FIELD');
      const addIntent = result as AddFieldIntent;
      expect(addIntent.fieldType).toBe('checkbox');
    });

    it('parses textarea field type', () => {
      const result = parseRefinementIntent('Add a description textarea');
      expect(result.type).toBe('ADD_FIELD');
      const addIntent = result as AddFieldIntent;
      expect(addIntent.fieldType).toBe('textarea');
    });

    it('parses file upload field type', () => {
      const result = parseRefinementIntent('Add a file upload field');
      expect(result.type).toBe('ADD_FIELD');
      const addIntent = result as AddFieldIntent;
      expect(addIntent.fieldType).toBe('file');
    });

    it('parses select/dropdown field type', () => {
      const result = parseRefinementIntent('Add a dropdown for country');
      expect(result.type).toBe('ADD_FIELD');
      const addIntent = result as AddFieldIntent;
      expect(addIntent.fieldType).toBe('select');
    });
  });

  describe('REMOVE_FIELD intent', () => {
    it('parses "Remove the fax field"', () => {
      const result = parseRefinementIntent('Remove the fax field');
      expect(result.type).toBe('REMOVE_FIELD');
      const removeIntent = result as RemoveFieldIntent;
      expect(removeIntent.fieldName).toBe('fax');
    });

    it('parses "Delete phone number"', () => {
      const result = parseRefinementIntent('Delete phone number');
      expect(result.type).toBe('REMOVE_FIELD');
      const removeIntent = result as RemoveFieldIntent;
      expect(removeIntent.fieldName).toBe('phone number');
    });

    it('parses "Remove email"', () => {
      const result = parseRefinementIntent('Remove email');
      expect(result.type).toBe('REMOVE_FIELD');
      const removeIntent = result as RemoveFieldIntent;
      expect(removeIntent.fieldName).toBe('email');
    });
  });

  describe('REMOVE_SECTION intent', () => {
    it('parses "Remove the address section"', () => {
      const result = parseRefinementIntent('Remove the address section');
      expect(result.type).toBe('REMOVE_SECTION');
      const sectionIntent = result as RemoveSectionIntent;
      expect(sectionIntent.sectionName).toBe('address');
    });

    it('parses "Delete contact section"', () => {
      const result = parseRefinementIntent('Delete contact section');
      expect(result.type).toBe('REMOVE_SECTION');
      const sectionIntent = result as RemoveSectionIntent;
      expect(sectionIntent.sectionName).toBe('contact');
    });

    it('parses "Remove the personal details section"', () => {
      const result = parseRefinementIntent('Remove the personal details section');
      expect(result.type).toBe('REMOVE_SECTION');
      const sectionIntent = result as RemoveSectionIntent;
      expect(sectionIntent.sectionName).toBe('personal details');
    });
  });

  describe('MODIFY_FIELD intent', () => {
    it('parses "Make email required"', () => {
      const result = parseRefinementIntent('Make email required');
      expect(result.type).toBe('MODIFY_FIELD');
      const modifyIntent = result as ModifyFieldIntent;
      expect(modifyIntent.fieldName).toBe('email');
      expect(modifyIntent.changes.required).toBe(true);
    });

    it('parses "Set name field as required"', () => {
      const result = parseRefinementIntent('Set name field as required');
      expect(result.type).toBe('MODIFY_FIELD');
      const modifyIntent = result as ModifyFieldIntent;
      expect(modifyIntent.changes.required).toBe(true);
    });

    it('parses "Make phone optional"', () => {
      const result = parseRefinementIntent('Make phone optional');
      expect(result.type).toBe('MODIFY_FIELD');
      const modifyIntent = result as ModifyFieldIntent;
      expect(modifyIntent.fieldName).toBe('phone');
      expect(modifyIntent.changes.required).toBe(false);
    });

    it('parses "Make fax not required"', () => {
      const result = parseRefinementIntent('Make fax not required');
      expect(result.type).toBe('MODIFY_FIELD');
      const modifyIntent = result as ModifyFieldIntent;
      expect(modifyIntent.changes.required).toBe(false);
    });

    it('parses "Change phone to mobile"', () => {
      const result = parseRefinementIntent('Change phone to mobile');
      expect(result.type).toBe('MODIFY_FIELD');
      const modifyIntent = result as ModifyFieldIntent;
      expect(modifyIntent.fieldName).toBe('phone');
      expect(modifyIntent.changes.newName).toBe('mobile');
    });
  });

  describe('UNDO intent', () => {
    it('parses "undo"', () => {
      const result = parseRefinementIntent('undo');
      expect(result.type).toBe('UNDO');
    });

    it('parses "Undo"', () => {
      const result = parseRefinementIntent('Undo');
      expect(result.type).toBe('UNDO');
    });

    it('parses "undo last change"', () => {
      const result = parseRefinementIntent('undo last change');
      expect(result.type).toBe('UNDO');
    });

    it('parses "undo last"', () => {
      const result = parseRefinementIntent('undo last');
      expect(result.type).toBe('UNDO');
    });

    it('parses "undo 3 changes"', () => {
      const result = parseRefinementIntent('undo 3 changes');
      expect(result.type).toBe('UNDO');
      const undoIntent = result as UndoIntent;
      expect(undoIntent.count).toBe(3);
    });

    it('parses "undo last 5"', () => {
      const result = parseRefinementIntent('undo last 5');
      expect(result.type).toBe('UNDO');
      const undoIntent = result as UndoIntent;
      expect(undoIntent.count).toBe(5);
    });
  });

  describe('BATCH intent', () => {
    it('parses comma-separated commands', () => {
      const result = parseRefinementIntent('Add phone, make name required');
      expect(result.type).toBe('BATCH');
      const batchIntent = result as BatchIntent;
      expect(batchIntent.commands).toHaveLength(2);
      expect(batchIntent.commands[0].type).toBe('ADD_FIELD');
      expect(batchIntent.commands[1].type).toBe('MODIFY_FIELD');
    });

    it('parses "and" separated commands', () => {
      const result = parseRefinementIntent('Add phone and remove fax');
      expect(result.type).toBe('BATCH');
      const batchIntent = result as BatchIntent;
      expect(batchIntent.commands).toHaveLength(2);
      expect(batchIntent.commands[0].type).toBe('ADD_FIELD');
      expect(batchIntent.commands[1].type).toBe('REMOVE_FIELD');
    });

    it('parses semicolon-separated commands', () => {
      const result = parseRefinementIntent('Add email; make name required; remove fax');
      expect(result.type).toBe('BATCH');
      const batchIntent = result as BatchIntent;
      expect(batchIntent.commands).toHaveLength(3);
    });

    it('parses mixed separators', () => {
      const result = parseRefinementIntent('Add phone, make name required and remove fax');
      expect(result.type).toBe('BATCH');
      const batchIntent = result as BatchIntent;
      expect(batchIntent.commands).toHaveLength(3);
    });

    it('filters out unknown commands from batch', () => {
      const result = parseRefinementIntent('Add phone, gibberish command, remove fax');
      expect(result.type).toBe('BATCH');
      const batchIntent = result as BatchIntent;
      expect(batchIntent.commands).toHaveLength(2);
    });

    it('returns single valid command if only one in batch is valid', () => {
      const result = parseRefinementIntent('Add phone, gibberish command');
      expect(result.type).toBe('ADD_FIELD');
    });
  });

  describe('UNKNOWN intent', () => {
    it('returns UNKNOWN for empty string', () => {
      const result = parseRefinementIntent('');
      expect(result.type).toBe('UNKNOWN');
    });

    it('returns UNKNOWN for gibberish', () => {
      const result = parseRefinementIntent('asdfghjkl');
      expect(result.type).toBe('UNKNOWN');
    });

    it('returns UNKNOWN for null/undefined', () => {
      const result = parseRefinementIntent(null as unknown as string);
      expect(result.type).toBe('UNKNOWN');
    });

    it('returns UNKNOWN for unrecognized commands', () => {
      const result = parseRefinementIntent('Please help me with the form');
      expect(result.type).toBe('UNKNOWN');
    });
  });

  describe('edge cases', () => {
    it('handles extra whitespace', () => {
      const result = parseRefinementIntent('   Add   phone   field   ');
      expect(result.type).toBe('ADD_FIELD');
    });

    it('handles quoted field names', () => {
      const result = parseRefinementIntent('Add field named "Company Address"');
      expect(result.type).toBe('ADD_FIELD');
      const addIntent = result as AddFieldIntent;
      expect(addIntent.fieldName).toBe('Company Address');
    });

    it('handles field called pattern', () => {
      const result = parseRefinementIntent("Add field called 'phone'");
      expect(result.type).toBe('ADD_FIELD');
      const addIntent = result as AddFieldIntent;
      expect(addIntent.fieldName).toBe('phone');
    });
  });
});

describe('isDestructiveIntent', () => {
  it('returns true for REMOVE_FIELD', () => {
    const intent: RefinementIntent = { type: 'REMOVE_FIELD', fieldName: 'test' };
    expect(isDestructiveIntent(intent)).toBe(true);
  });

  it('returns true for REMOVE_SECTION', () => {
    const intent: RefinementIntent = { type: 'REMOVE_SECTION', sectionName: 'test' };
    expect(isDestructiveIntent(intent)).toBe(true);
  });

  it('returns false for ADD_FIELD', () => {
    const intent: RefinementIntent = { type: 'ADD_FIELD', fieldName: 'test', fieldType: 'text' };
    expect(isDestructiveIntent(intent)).toBe(false);
  });

  it('returns false for MODIFY_FIELD', () => {
    const intent: RefinementIntent = { type: 'MODIFY_FIELD', fieldName: 'test', changes: {} };
    expect(isDestructiveIntent(intent)).toBe(false);
  });

  it('returns true for BATCH with destructive command', () => {
    const intent: BatchIntent = {
      type: 'BATCH',
      commands: [
        { type: 'ADD_FIELD', fieldName: 'phone', fieldType: 'tel' },
        { type: 'REMOVE_FIELD', fieldName: 'fax' },
      ],
    };
    expect(isDestructiveIntent(intent)).toBe(true);
  });

  it('returns false for BATCH without destructive commands', () => {
    const intent: BatchIntent = {
      type: 'BATCH',
      commands: [
        { type: 'ADD_FIELD', fieldName: 'phone', fieldType: 'tel' },
        { type: 'MODIFY_FIELD', fieldName: 'email', changes: { required: true } },
      ],
    };
    expect(isDestructiveIntent(intent)).toBe(false);
  });
});

describe('describeIntent', () => {
  it('describes ADD_FIELD', () => {
    const intent: AddFieldIntent = { type: 'ADD_FIELD', fieldName: 'phone', fieldType: 'tel' };
    expect(describeIntent(intent)).toBe('Add field "phone" (tel)');
  });

  it('describes ADD_FIELD with section', () => {
    const intent: AddFieldIntent = {
      type: 'ADD_FIELD',
      fieldName: 'phone',
      fieldType: 'tel',
      section: 'contact',
    };
    expect(describeIntent(intent)).toBe('Add field "phone" (tel) in "contact" section');
  });

  it('describes REMOVE_FIELD', () => {
    const intent: RemoveFieldIntent = { type: 'REMOVE_FIELD', fieldName: 'fax' };
    expect(describeIntent(intent)).toBe('Remove field "fax"');
  });

  it('describes REMOVE_SECTION', () => {
    const intent: RemoveSectionIntent = { type: 'REMOVE_SECTION', sectionName: 'address' };
    expect(describeIntent(intent)).toBe('Remove section "address" and all its fields');
  });

  it('describes MODIFY_FIELD with required', () => {
    const intent: ModifyFieldIntent = {
      type: 'MODIFY_FIELD',
      fieldName: 'email',
      changes: { required: true },
    };
    expect(describeIntent(intent)).toBe('Modify field "email": make required');
  });

  it('describes MODIFY_FIELD with optional', () => {
    const intent: ModifyFieldIntent = {
      type: 'MODIFY_FIELD',
      fieldName: 'phone',
      changes: { required: false },
    };
    expect(describeIntent(intent)).toBe('Modify field "phone": make optional');
  });

  it('describes UNDO', () => {
    const intent: UndoIntent = { type: 'UNDO' };
    expect(describeIntent(intent)).toBe('Undo last change');
  });

  it('describes UNDO with count', () => {
    const intent: UndoIntent = { type: 'UNDO', count: 3 };
    expect(describeIntent(intent)).toBe('Undo last 3 changes');
  });

  it('describes BATCH', () => {
    const intent: BatchIntent = {
      type: 'BATCH',
      commands: [
        { type: 'ADD_FIELD', fieldName: 'phone', fieldType: 'tel' },
        { type: 'REMOVE_FIELD', fieldName: 'fax' },
      ],
    };
    const description = describeIntent(intent);
    expect(description).toContain('2 changes');
    expect(description).toContain('Add field "phone"');
    expect(description).toContain('Remove field "fax"');
  });
});

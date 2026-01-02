import { describe, it, expect, beforeEach } from 'vitest';
import {
  ConstraintEngine,
  createConstraintEngine,
  getConstraintEngine,
  initializeConstraintEngine,
  clearConstraintEngine,
} from './engine.js';
import { parseRules, validateCondition } from './parser.js';
import type { ConstraintContext, ConstraintConfig } from './types.js';

const mockContext: ConstraintContext = {
  tool: {
    name: 'createService',
    method: 'POST',
    path: '/services',
    mutates: true,
    requiresConfirmation: false,
  },
  context: {
    sessionCost: 0.5,
    serviceId: 'svc-123',
    userId: 'user-456',
    isPublished: false,
  },
  args: {
    name: 'Test Service',
  },
};

describe('ConstraintEngine', () => {
  let engine: ConstraintEngine;

  beforeEach(() => {
    engine = new ConstraintEngine();
  });

  describe('evaluate', () => {
    it('should allow operations when no rules match', () => {
      const result = engine.evaluate(mockContext);

      expect(result.allowed).toBe(true);
      expect(result.action).toBeUndefined();
      expect(result.message).toBeUndefined();
    });

    it('should require confirmation for delete operations', () => {
      const deleteContext: ConstraintContext = {
        ...mockContext,
        tool: {
          ...mockContext.tool,
          name: 'deleteService',
          method: 'DELETE',
        },
      };

      const result = engine.evaluate(deleteContext);

      expect(result.allowed).toBe(false);
      expect(result.action).toBe('require_confirmation');
      expect(result.message).toContain('delete');
    });

    it('should block when session cost exceeds limit', () => {
      const expensiveContext: ConstraintContext = {
        ...mockContext,
        context: {
          ...mockContext.context,
          sessionCost: 1.5,
        },
      };

      const result = engine.evaluate(expensiveContext);

      expect(result.allowed).toBe(false);
      expect(result.action).toBe('block');
      expect(result.message).toContain('cost limit');
    });

    it('should track all matched rules', () => {
      const deleteContext: ConstraintContext = {
        ...mockContext,
        tool: {
          ...mockContext.tool,
          name: 'deleteService',
          method: 'DELETE',
        },
        context: {
          ...mockContext.context,
          sessionCost: 1.5,
        },
      };

      const result = engine.evaluate(deleteContext);

      // Block should take priority
      expect(result.action).toBe('block');
      expect(result.matchedRules.length).toBeGreaterThan(1);
    });
  });

  describe('loadRules', () => {
    it('should load custom rules from YAML', () => {
      const customYaml = `
version: "1.0.0"
rules:
  - name: custom_rule
    condition: "tool.name === 'customAction'"
    action: warn
    message: "Custom warning message"
`;

      engine.loadRules(customYaml);

      const customContext: ConstraintContext = {
        ...mockContext,
        tool: {
          ...mockContext.tool,
          name: 'customAction',
        },
      };

      const result = engine.evaluate(customContext);

      expect(result.action).toBe('warn');
      expect(result.message).toBe('Custom warning message');
    });
  });

  describe('loadConfig', () => {
    it('should load config object directly', () => {
      const config: ConstraintConfig = {
        version: '1.0.0',
        rules: [
          {
            name: 'test_rule',
            condition: 'true',
            action: 'warn',
            message: 'Test message',
          },
        ],
      };

      engine.loadConfig(config);

      const result = engine.evaluate(mockContext);

      expect(result.action).toBe('warn');
      expect(result.message).toBe('Test message');
    });
  });

  describe('rule management', () => {
    it('should add rules dynamically', () => {
      engine.addRule({
        name: 'dynamic_rule',
        condition: 'tool.name === "createService"',
        action: 'warn',
        message: 'Dynamic warning',
      });

      const result = engine.evaluate(mockContext);

      expect(result.action).toBe('warn');
      expect(result.message).toBe('Dynamic warning');
    });

    it('should remove rules by name', () => {
      engine.addRule({
        name: 'to_remove',
        condition: 'true',
        action: 'block',
        message: 'Should be removed',
      });

      const removed = engine.removeRule('to_remove');
      expect(removed).toBe(true);

      const result = engine.evaluate(mockContext);
      expect(result.action).not.toBe('block');
    });

    it('should enable/disable rules', () => {
      engine.addRule({
        name: 'toggleable',
        condition: 'true',
        action: 'block',
        message: 'Toggleable rule',
      });

      engine.setRuleEnabled('toggleable', false);

      const result = engine.evaluate(mockContext);
      expect(result.action).not.toBe('block');

      engine.setRuleEnabled('toggleable', true);

      const result2 = engine.evaluate(mockContext);
      expect(result2.action).toBe('block');
    });
  });

  describe('priority handling', () => {
    it('should respect rule priority (lower = higher)', () => {
      engine.loadConfig({
        version: '1.0.0',
        rules: [
          {
            name: 'low_priority',
            condition: 'true',
            action: 'warn',
            message: 'Low priority',
            priority: 100,
          },
          {
            name: 'high_priority',
            condition: 'true',
            action: 'block',
            message: 'High priority',
            priority: 10,
          },
        ],
      });

      const result = engine.evaluate(mockContext);

      expect(result.action).toBe('block');
      expect(result.message).toBe('High priority');
    });
  });

  describe('transform action', () => {
    it('should transform args when transform rule matches', () => {
      engine.loadConfig({
        version: '1.0.0',
        rules: [
          {
            name: 'add_default',
            condition: 'true',
            action: 'transform',
            message: 'Adding default',
            transform: '{ ...args, status: "draft" }',
          },
        ],
      });

      const result = engine.evaluate(mockContext);

      expect(result.allowed).toBe(true);
      expect(result.action).toBe('transform');
      expect(result.transformedArgs).toEqual({
        name: 'Test Service',
        status: 'draft',
      });
    });
  });

  describe('settings', () => {
    it('should report confirmation enabled status', () => {
      expect(engine.areConfirmationsEnabled()).toBe(true);

      engine.loadConfig({
        version: '1.0.0',
        rules: [],
        settings: {
          confirmationsEnabled: false,
        },
      });

      expect(engine.areConfirmationsEnabled()).toBe(false);
    });

    it('should report max session cost', () => {
      expect(engine.getMaxSessionCost()).toBe(1.0);

      engine.loadConfig({
        version: '1.0.0',
        rules: [],
        settings: {
          maxSessionCost: 5.0,
        },
      });

      expect(engine.getMaxSessionCost()).toBe(5.0);
    });
  });
});

describe('parseRules', () => {
  it('should parse valid YAML', () => {
    const yaml = `
version: "1.0.0"
rules:
  - name: test
    condition: "true"
    action: warn
    message: "Test"
`;

    const config = parseRules(yaml);

    expect(config.version).toBe('1.0.0');
    expect(config.rules).toHaveLength(1);
    expect(config.rules[0].name).toBe('test');
  });

  it('should throw on invalid YAML', () => {
    const invalidYaml = `
version: "1.0.0"
rules:
  - name: test
    # missing required fields
`;

    expect(() => parseRules(invalidYaml)).toThrow();
  });

  it('should normalize rules with defaults', () => {
    const yaml = `
version: "1.0.0"
rules:
  - name: test
    condition: "true"
    action: warn
    message: "Test"
`;

    const config = parseRules(yaml);

    expect(config.rules[0].priority).toBe(100);
    expect(config.rules[0].enabled).toBe(true);
  });
});

describe('validateCondition', () => {
  it('should accept valid conditions', () => {
    const result = validateCondition('tool.name === "test"');
    expect(result.valid).toBe(true);
  });

  it('should reject dangerous patterns', () => {
    const dangerous = [
      'require("fs")',
      'eval("code")',
      'process.exit()',
      'global.something',
    ];

    for (const condition of dangerous) {
      const result = validateCondition(condition);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it('should reject syntax errors', () => {
    const result = validateCondition('tool.name ===');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('syntax');
  });
});

describe('global engine', () => {
  beforeEach(() => {
    clearConstraintEngine();
  });

  it('should create and return global engine', () => {
    const engine1 = getConstraintEngine();
    const engine2 = getConstraintEngine();

    expect(engine1).toBe(engine2);
  });

  it('should initialize with custom rules', () => {
    const yaml = `
version: "1.0.0"
rules:
  - name: global_rule
    condition: "true"
    action: warn
    message: "Global"
`;

    const engine = initializeConstraintEngine(yaml);

    const result = engine.evaluate(mockContext);
    expect(result.action).toBe('warn');
  });

  it('should clear global engine', () => {
    getConstraintEngine(); // Create it
    clearConstraintEngine();

    // Should create a new one
    const engine = getConstraintEngine();
    expect(engine).toBeDefined();
  });
});

describe('createConstraintEngine', () => {
  it('should create independent engine instances', () => {
    const engine1 = createConstraintEngine();
    const engine2 = createConstraintEngine();

    expect(engine1).not.toBe(engine2);
  });
});

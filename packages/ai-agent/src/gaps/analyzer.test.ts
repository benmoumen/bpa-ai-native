/**
 * Gap Analyzer Tests
 *
 * Story 6-6: Gap Detection (Task 1)
 */

import { describe, it, expect } from 'vitest';
import { GapAnalyzer, createGapAnalyzer } from './analyzer.js';
import type { ServiceConfig, WorkflowConfig } from './types.js';

describe('GapAnalyzer', () => {
  describe('analyzeMissingFields', () => {
    it('detects missing applicant name field', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [
              { id: 'f1', name: 'Email', type: 'email' },
              { id: 'f2', name: 'Phone', type: 'tel' },
            ],
          },
        ],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeMissingFields(config);

      expect(gaps.some((g) => g.message.includes('applicant name'))).toBe(true);
      expect(gaps.some((g) => g.severity === 'critical')).toBe(true);
    });

    it('does not flag when applicant name exists', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [
              { id: 'f1', name: 'Applicant Name', type: 'text' },
              { id: 'f2', name: 'Email', type: 'email' },
            ],
          },
        ],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeMissingFields(config);

      expect(gaps.some((g) => g.message.includes('applicant name'))).toBe(false);
    });

    it('detects missing email field', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [
              { id: 'f1', name: 'Full Name', type: 'text' },
              { id: 'f2', name: 'Phone', type: 'tel' },
            ],
          },
        ],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeMissingFields(config);

      expect(gaps.some((g) => g.message.includes('email'))).toBe(true);
    });

    it('includes fix suggestions for missing fields', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [],
          },
        ],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeMissingFields(config);

      const gapWithFix = gaps.find((g) => g.fix);
      expect(gapWithFix).toBeDefined();
      expect(gapWithFix?.fix?.action).toBe('add_field');
    });

    it('checks fields in sections', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [
              {
                id: 'sec-1',
                name: 'Personal Info',
                fields: [
                  { id: 'f1', name: 'Applicant Name', type: 'text' },
                  { id: 'f2', name: 'Email Address', type: 'email' },
                ],
              },
            ],
            fields: [],
          },
        ],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeMissingFields(config);

      // Should not flag missing name or email
      expect(gaps.some((g) => g.message.includes('applicant name'))).toBe(false);
      expect(gaps.some((g) => g.message.includes('email'))).toBe(false);
    });
  });

  describe('analyzeValidationGaps', () => {
    it('detects email field without pattern validation', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [{ id: 'f1', name: 'Email', type: 'email' }],
          },
        ],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeValidationGaps(config);

      expect(gaps.some((g) => g.type === 'MISSING_VALIDATION' && g.message.includes('Email'))).toBe(
        true
      );
    });

    it('does not flag email with pattern validation', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [
              {
                id: 'f1',
                name: 'Email',
                type: 'email',
                validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
              },
            ],
          },
        ],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeValidationGaps(config);

      expect(gaps.some((g) => g.message.includes('Email'))).toBe(false);
    });

    it('detects phone field without pattern validation', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [{ id: 'f1', name: 'Phone', type: 'tel' }],
          },
        ],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeValidationGaps(config);

      expect(gaps.some((g) => g.type === 'MISSING_VALIDATION' && g.message.includes('Phone'))).toBe(
        true
      );
      expect(gaps.find((g) => g.message.includes('Phone'))?.severity).toBe('suggestion');
    });

    it('detects text field without length constraints', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [{ id: 'f1', name: 'Description', type: 'text' }],
          },
        ],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeValidationGaps(config);

      expect(gaps.some((g) => g.message.includes('Description'))).toBe(true);
      expect(gaps.some((g) => g.message.includes('length'))).toBe(true);
    });

    it('does not flag text with length validation', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [
              {
                id: 'f1',
                name: 'Name',
                type: 'text',
                validation: { minLength: 2, maxLength: 100 },
              },
            ],
          },
        ],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeValidationGaps(config);

      expect(gaps.some((g) => g.message.includes('Name') && g.message.includes('length'))).toBe(
        false
      );
    });

    it('detects number field without range constraints', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [{ id: 'f1', name: 'Age', type: 'number' }],
          },
        ],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeValidationGaps(config);

      expect(gaps.some((g) => g.message.includes('Age') && g.message.includes('range'))).toBe(true);
    });

    it('includes fix suggestions for validation gaps', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [{ id: 'f1', name: 'Email', type: 'email' }],
          },
        ],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeValidationGaps(config);

      const emailGap = gaps.find((g) => g.message.includes('Email'));
      expect(emailGap?.fix).toBeDefined();
      expect(emailGap?.fix?.action).toBe('add_validation');
      expect(emailGap?.fix?.params).toHaveProperty('fieldId', 'f1');
    });
  });

  describe('analyzeWorkflowGaps', () => {
    it('detects missing start state', () => {
      const workflow: WorkflowConfig = {
        id: 'wf-1',
        name: 'Test Workflow',
        steps: [
          { id: 's1', name: 'Step 1' },
          { id: 's2', name: 'Step 2' },
        ],
        transitions: [{ id: 't1', fromStepId: 's1', toStepId: 's2' }],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeWorkflowGaps(workflow);

      expect(gaps.some((g) => g.type === 'MISSING_START_STATE')).toBe(true);
    });

    it('does not flag when start step is designated', () => {
      const workflow: WorkflowConfig = {
        id: 'wf-1',
        name: 'Test Workflow',
        steps: [
          { id: 's1', name: 'Step 1', isStart: true },
          { id: 's2', name: 'Step 2', isTerminal: true },
        ],
        transitions: [{ id: 't1', fromStepId: 's1', toStepId: 's2' }],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeWorkflowGaps(workflow);

      expect(gaps.some((g) => g.type === 'MISSING_START_STATE')).toBe(false);
    });

    it('detects missing end state', () => {
      const workflow: WorkflowConfig = {
        id: 'wf-1',
        name: 'Test Workflow',
        startStepId: 's1',
        steps: [
          { id: 's1', name: 'Step 1', isStart: true },
          { id: 's2', name: 'Step 2' },
        ],
        transitions: [{ id: 't1', fromStepId: 's1', toStepId: 's2' }],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeWorkflowGaps(workflow);

      expect(gaps.some((g) => g.type === 'MISSING_END_STATE')).toBe(true);
    });

    it('does not flag when terminal step exists', () => {
      const workflow: WorkflowConfig = {
        id: 'wf-1',
        name: 'Test Workflow',
        startStepId: 's1',
        steps: [
          { id: 's1', name: 'Step 1', isStart: true },
          { id: 's2', name: 'Step 2', isTerminal: true },
        ],
        transitions: [{ id: 't1', fromStepId: 's1', toStepId: 's2' }],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeWorkflowGaps(workflow);

      expect(gaps.some((g) => g.type === 'MISSING_END_STATE')).toBe(false);
    });

    it('detects orphan steps', () => {
      const workflow: WorkflowConfig = {
        id: 'wf-1',
        name: 'Test Workflow',
        startStepId: 's1',
        steps: [
          { id: 's1', name: 'Step 1', isStart: true },
          { id: 's2', name: 'Step 2', isTerminal: true },
          { id: 's3', name: 'Orphan Step' }, // Not connected
        ],
        transitions: [{ id: 't1', fromStepId: 's1', toStepId: 's2' }],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeWorkflowGaps(workflow);

      expect(gaps.some((g) => g.type === 'ORPHAN_STEP' && g.message.includes('Orphan Step'))).toBe(
        true
      );
    });

    it('detects dead ends (no outgoing transitions)', () => {
      const workflow: WorkflowConfig = {
        id: 'wf-1',
        name: 'Test Workflow',
        startStepId: 's1',
        steps: [
          { id: 's1', name: 'Step 1', isStart: true },
          { id: 's2', name: 'Step 2' }, // Dead end - no transitions out and not terminal
        ],
        transitions: [{ id: 't1', fromStepId: 's1', toStepId: 's2' }],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeWorkflowGaps(workflow);

      expect(
        gaps.some((g) => g.type === 'MISSING_TRANSITION' && g.message.includes('Step 2'))
      ).toBe(true);
    });

    it('does not flag terminal steps as dead ends', () => {
      const workflow: WorkflowConfig = {
        id: 'wf-1',
        name: 'Test Workflow',
        startStepId: 's1',
        steps: [
          { id: 's1', name: 'Step 1', isStart: true },
          { id: 's2', name: 'Step 2', isTerminal: true }, // Terminal - no outgoing needed
        ],
        transitions: [{ id: 't1', fromStepId: 's1', toStepId: 's2' }],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeWorkflowGaps(workflow);

      expect(gaps.some((g) => g.type === 'MISSING_TRANSITION')).toBe(false);
    });

    it('handles empty workflow', () => {
      const workflow: WorkflowConfig = {
        id: 'wf-1',
        name: 'Empty Workflow',
        steps: [],
        transitions: [],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeWorkflowGaps(workflow);

      expect(gaps).toHaveLength(0); // No gaps for empty workflow
    });

    it('includes fix suggestions for workflow gaps', () => {
      const workflow: WorkflowConfig = {
        id: 'wf-1',
        name: 'Test Workflow',
        steps: [
          { id: 's1', name: 'Step 1' },
          { id: 's2', name: 'Orphan' },
        ],
        transitions: [],
      };

      const analyzer = new GapAnalyzer();
      const gaps = analyzer.analyzeWorkflowGaps(workflow);

      const orphanGap = gaps.find((g) => g.type === 'ORPHAN_STEP');
      expect(orphanGap?.fix).toBeDefined();
    });
  });

  describe('analyze (full analysis)', () => {
    it('combines all gap types in report', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [{ id: 'f1', name: 'Description', type: 'text' }],
          },
        ],
        workflow: {
          id: 'wf-1',
          name: 'Workflow',
          steps: [{ id: 's1', name: 'Step 1' }],
          transitions: [],
        },
      };

      const analyzer = new GapAnalyzer();
      const report = analyzer.analyze(config);

      expect(report.totalGaps).toBeGreaterThan(0);
      expect(report.criticalGaps.length + report.warningGaps.length + report.suggestionGaps.length).toBe(
        report.totalGaps
      );
    });

    it('generates summary message', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [{ id: 'f1', name: 'Description', type: 'text' }],
          },
        ],
      };

      const analyzer = new GapAnalyzer();
      const report = analyzer.analyze(config);

      expect(report.summary).toBeDefined();
      expect(report.summary.length).toBeGreaterThan(0);
    });

    it('returns clean report when no gaps', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [
              {
                id: 'f1',
                name: 'Applicant Name',
                type: 'text',
                validation: { minLength: 2, maxLength: 100 },
              },
              {
                id: 'f2',
                name: 'Email',
                type: 'email',
                validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
              },
            ],
          },
        ],
        workflow: {
          id: 'wf-1',
          name: 'Workflow',
          startStepId: 's1',
          steps: [
            { id: 's1', name: 'Start', isStart: true },
            { id: 's2', name: 'End', isTerminal: true },
          ],
          transitions: [{ id: 't1', fromStepId: 's1', toStepId: 's2' }],
        },
      };

      const analyzer = new GapAnalyzer();
      const report = analyzer.analyze(config);

      expect(report.totalGaps).toBe(0);
      expect(report.summary).toContain('complete');
    });

    it('respects options to disable checks', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [{ id: 'f1', name: 'Email', type: 'email' }],
          },
        ],
      };

      const analyzer = new GapAnalyzer({
        checkValidation: false,
        checkFields: false,
      });
      const report = analyzer.analyze(config);

      // Only validation and field checks disabled, should have fewer gaps
      expect(report.totalGaps).toBeLessThan(3);
    });

    it('supports custom rules', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [
          {
            id: 'form-1',
            name: 'Application Form',
            sections: [],
            fields: [
              { id: 'f1', name: 'Applicant Name', type: 'text' },
              { id: 'f2', name: 'Email', type: 'email' },
            ],
          },
        ],
      };

      const analyzer = new GapAnalyzer({
        checkValidation: false,
        customRules: [
          {
            name: 'custom_field',
            description: 'Missing custom required field',
            severity: 'critical',
            check: (c) => c.forms.some((f) => f.fields.some((field) => field.name === 'Custom')),
          },
        ],
      });
      const report = analyzer.analyze(config);

      expect(report.criticalGaps.some((g) => g.message.includes('custom'))).toBe(true);
    });

    it('includes timestamp in report', () => {
      const config: ServiceConfig = {
        id: 'svc-1',
        name: 'Test Service',
        forms: [],
      };

      const before = Date.now();
      const analyzer = new GapAnalyzer();
      const report = analyzer.analyze(config);
      const after = Date.now();

      expect(report.timestamp).toBeGreaterThanOrEqual(before);
      expect(report.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('createGapAnalyzer factory', () => {
    it('creates analyzer with default options', () => {
      const analyzer = createGapAnalyzer();
      expect(analyzer).toBeInstanceOf(GapAnalyzer);
    });

    it('creates analyzer with custom options', () => {
      const analyzer = createGapAnalyzer({
        checkValidation: false,
        serviceType: 'business_registration',
      });
      expect(analyzer).toBeInstanceOf(GapAnalyzer);
    });
  });
});

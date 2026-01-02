/**
 * GapReport Component Tests
 *
 * Story 6-6: Gap Detection (Task 4)
 */

import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GapReport } from './GapReport';
import type { GapItem } from './GapReport';

describe('GapReport', () => {
  const mockOnFixAll = vi.fn();
  const mockOnFixSelected = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createGap = (overrides: Partial<GapItem> = {}): GapItem => ({
    id: `gap-${Math.random().toString(36).slice(2)}`,
    severity: 'warning',
    message: 'Test gap message',
    suggestion: 'Test suggestion',
    location: 'Test Form',
    hasFix: false,
    ...overrides,
  });

  describe('zero gaps state', () => {
    it('renders success message when no gaps', () => {
      render(
        <GapReport
          totalGaps={0}
          summary="No gaps detected"
          criticalGaps={[]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Configuration Complete')).toBeInTheDocument();
      expect(screen.getByText(/No gaps detected/)).toBeInTheDocument();
    });

    it('shows dismiss button in zero gaps state', () => {
      render(
        <GapReport
          totalGaps={0}
          summary="No gaps"
          criticalGaps={[]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss clicked in zero state', () => {
      render(
        <GapReport
          totalGaps={0}
          summary="No gaps"
          criticalGaps={[]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
          onDismiss={mockOnDismiss}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('with gaps', () => {
    it('renders header with summary', () => {
      render(
        <GapReport
          totalGaps={3}
          summary="Found 1 critical, 1 warning, 1 suggestion."
          criticalGaps={[createGap({ severity: 'critical' })]}
          warningGaps={[createGap({ severity: 'warning' })]}
          suggestionGaps={[createGap({ severity: 'suggestion' })]}
          fixableCount={0}
        />
      );

      expect(screen.getByText('Configuration Gaps Detected')).toBeInTheDocument();
      expect(screen.getByText(/Found 1 critical, 1 warning, 1 suggestion/)).toBeInTheDocument();
    });

    it('renders critical gaps section', () => {
      const criticalGap = createGap({
        severity: 'critical',
        message: 'Missing required field',
      });

      render(
        <GapReport
          totalGaps={1}
          summary="1 critical"
          criticalGaps={[criticalGap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
        />
      );

      expect(screen.getByText('Critical Issues')).toBeInTheDocument();
      expect(screen.getByText('Missing required field')).toBeInTheDocument();
    });

    it('renders warning gaps section', () => {
      const warningGap = createGap({
        severity: 'warning',
        message: 'Email validation missing',
      });

      render(
        <GapReport
          totalGaps={1}
          summary="1 warning"
          criticalGaps={[]}
          warningGaps={[warningGap]}
          suggestionGaps={[]}
          fixableCount={0}
        />
      );

      expect(screen.getByText('Warnings')).toBeInTheDocument();
      expect(screen.getByText('Email validation missing')).toBeInTheDocument();
    });

    it('renders suggestion gaps section', () => {
      const suggestionGap = createGap({
        severity: 'suggestion',
        message: 'Consider adding phone validation',
      });

      render(
        <GapReport
          totalGaps={1}
          summary="1 suggestion"
          criticalGaps={[]}
          warningGaps={[]}
          suggestionGaps={[suggestionGap]}
          fixableCount={0}
        />
      );

      expect(screen.getByText('Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Consider adding phone validation')).toBeInTheDocument();
    });

    it('displays gap location', () => {
      const gap = createGap({ location: 'Contact Form' });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
        />
      );

      expect(screen.getByText('Contact Form')).toBeInTheDocument();
    });

    it('displays gap suggestion', () => {
      const gap = createGap({ suggestion: 'Add an email field' });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
        />
      );

      expect(screen.getByText('Add an email field')).toBeInTheDocument();
    });
  });

  describe('collapsible sections', () => {
    it('collapses section when header clicked', () => {
      const gap = createGap({ severity: 'critical', message: 'Test gap' });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
        />
      );

      // Gap should be visible initially
      expect(screen.getByText('Test gap')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(screen.getByText('Critical Issues'));

      // Gap should be hidden
      expect(screen.queryByText('Test gap')).not.toBeInTheDocument();
    });

    it('expands collapsed section when clicked', () => {
      const gap = createGap({ severity: 'critical', message: 'Test gap' });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
        />
      );

      // Collapse
      fireEvent.click(screen.getByText('Critical Issues'));
      expect(screen.queryByText('Test gap')).not.toBeInTheDocument();

      // Expand
      fireEvent.click(screen.getByText('Critical Issues'));
      expect(screen.getByText('Test gap')).toBeInTheDocument();
    });
  });

  describe('fix functionality', () => {
    it('shows fix info when gap has fix', () => {
      const gap = createGap({
        hasFix: true,
        fix: { action: 'add_field', description: 'Add email field' },
      });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={1}
        />
      );

      expect(screen.getByText(/Auto-fix: Add email field/)).toBeInTheDocument();
    });

    it('shows fixable count message', () => {
      const gap = createGap({
        hasFix: true,
        fix: { action: 'add_field', description: 'Fix' },
      });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={1}
          onFixAll={mockOnFixAll}
        />
      );

      expect(screen.getByText(/1 gap has automatic fixes available/)).toBeInTheDocument();
    });

    it('shows plural message for multiple fixable gaps', () => {
      render(
        <GapReport
          totalGaps={2}
          summary="Test"
          criticalGaps={[
            createGap({ hasFix: true, fix: { action: 'add_field', description: 'Fix 1' } }),
            createGap({ hasFix: true, fix: { action: 'add_field', description: 'Fix 2' } }),
          ]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={2}
          onFixAll={mockOnFixAll}
        />
      );

      expect(screen.getByText(/2 gaps have automatic fixes available/)).toBeInTheDocument();
    });

    it('shows Fix All button with count', () => {
      render(
        <GapReport
          totalGaps={2}
          summary="Test"
          criticalGaps={[createGap({ hasFix: true })]}
          warningGaps={[createGap({ hasFix: true })]}
          suggestionGaps={[]}
          fixableCount={2}
          onFixAll={mockOnFixAll}
        />
      );

      expect(screen.getByRole('button', { name: /fix all/i })).toBeInTheDocument();
      expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    });

    it('calls onFixAll when Fix All clicked', () => {
      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[createGap({ hasFix: true })]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={1}
          onFixAll={mockOnFixAll}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /fix all/i }));
      expect(mockOnFixAll).toHaveBeenCalledTimes(1);
    });

    it('shows Select button when onFixSelected provided', () => {
      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[createGap({ hasFix: true })]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={1}
          onFixAll={mockOnFixAll}
          onFixSelected={mockOnFixSelected}
        />
      );

      expect(screen.getByRole('button', { name: /select/i })).toBeInTheDocument();
    });
  });

  describe('checkbox selection mode', () => {
    it('shows checkboxes when Select clicked', () => {
      const gap = createGap({
        id: 'gap-1',
        hasFix: true,
        fix: { action: 'add_field', description: 'Fix' },
      });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={1}
          onFixAll={mockOnFixAll}
          onFixSelected={mockOnFixSelected}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /select/i }));

      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('shows Select all and Clear buttons in selection mode', () => {
      const gap = createGap({ hasFix: true });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={1}
          onFixAll={mockOnFixAll}
          onFixSelected={mockOnFixSelected}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /select/i }));

      expect(screen.getByText('Select all')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onFixSelected with selected gap IDs', () => {
      const gap = createGap({
        id: 'gap-1',
        hasFix: true,
        fix: { action: 'add_field', description: 'Fix' },
      });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={1}
          onFixAll={mockOnFixAll}
          onFixSelected={mockOnFixSelected}
        />
      );

      // Enter selection mode
      fireEvent.click(screen.getByRole('button', { name: /select/i }));

      // Select the gap
      fireEvent.click(screen.getByRole('checkbox'));

      // Click Fix Selected (aria-label is "Fix N selected gaps")
      fireEvent.click(screen.getByRole('button', { name: /fix 1 selected gaps/i }));

      expect(mockOnFixSelected).toHaveBeenCalledWith(['gap-1']);
    });

    it('selects all fixable gaps when Select all clicked', () => {
      const gaps = [
        createGap({ id: 'gap-1', hasFix: true }),
        createGap({ id: 'gap-2', hasFix: true }),
        createGap({ id: 'gap-3', hasFix: false }),
      ];

      render(
        <GapReport
          totalGaps={3}
          summary="Test"
          criticalGaps={gaps}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={2}
          onFixAll={mockOnFixAll}
          onFixSelected={mockOnFixSelected}
        />
      );

      // Enter selection mode
      fireEvent.click(screen.getByRole('button', { name: /select/i }));

      // Select all
      fireEvent.click(screen.getByText('Select all'));

      // Fix Selected should show (2)
      expect(screen.getByText(/Fix Selected \(2\)/)).toBeInTheDocument();
    });

    it('clears selection when Clear clicked', () => {
      const gap = createGap({ id: 'gap-1', hasFix: true });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={1}
          onFixAll={mockOnFixAll}
          onFixSelected={mockOnFixSelected}
        />
      );

      // Enter selection mode and select
      fireEvent.click(screen.getByRole('button', { name: /select/i }));
      fireEvent.click(screen.getByRole('checkbox'));

      expect(screen.getByText(/Fix Selected \(1\)/)).toBeInTheDocument();

      // Clear selection
      fireEvent.click(screen.getByText('Clear'));

      expect(screen.getByText(/Fix Selected \(0\)/)).toBeInTheDocument();
    });

    it('exits selection mode when Cancel clicked', () => {
      const gap = createGap({ hasFix: true });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={1}
          onFixAll={mockOnFixAll}
          onFixSelected={mockOnFixSelected}
        />
      );

      // Enter selection mode
      fireEvent.click(screen.getByRole('button', { name: /select/i }));
      expect(screen.getByText('Cancel')).toBeInTheDocument();

      // Cancel
      fireEvent.click(screen.getByText('Cancel'));

      // Should be back to Fix All mode
      expect(screen.getByRole('button', { name: /fix all/i })).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('disables button and shows fixing text when isApplyingFixes', () => {
      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[createGap({ hasFix: true })]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={1}
          onFixAll={mockOnFixAll}
          isApplyingFixes={true}
        />
      );

      // The button shows "Fixing..." text and is disabled
      expect(screen.getByText('Fixing...')).toBeInTheDocument();
      const fixingButton = screen.getByRole('button', { name: /fix all gaps/i });
      expect(fixingButton).toBeDisabled();
    });
  });

  describe('dismiss button', () => {
    it('shows dismiss button when onDismiss provided', () => {
      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[createGap()]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByRole('button', { name: /dismiss report/i })).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss clicked', () => {
      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[createGap()]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
          onDismiss={mockOnDismiss}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /dismiss report/i }));
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard shortcuts', () => {
    it('calls onDismiss when Escape pressed', () => {
      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[createGap()]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
          onDismiss={mockOnDismiss}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label on region', () => {
      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[createGap()]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
        />
      );

      expect(screen.getByRole('region', { name: 'Gap detection report' })).toBeInTheDocument();
    });

    it('has accessible checkbox labels', () => {
      const gap = createGap({
        id: 'gap-1',
        message: 'Missing email field',
        hasFix: true,
      });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={1}
          onFixAll={mockOnFixAll}
          onFixSelected={mockOnFixSelected}
        />
      );

      // Enter selection mode
      fireEvent.click(screen.getByRole('button', { name: /select/i }));

      expect(screen.getByRole('checkbox', { name: /select missing email field for fixing/i })).toBeInTheDocument();
    });

    it('has proper role on gap list', () => {
      const gap = createGap({ severity: 'critical' });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
        />
      );

      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('has proper role on gap items', () => {
      const gap = createGap({ severity: 'critical' });

      render(
        <GapReport
          totalGaps={1}
          summary="Test"
          criticalGaps={[gap]}
          warningGaps={[]}
          suggestionGaps={[]}
          fixableCount={0}
        />
      );

      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });
  });
});

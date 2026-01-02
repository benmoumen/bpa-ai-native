/**
 * ChangePreview Component Tests
 *
 * Story 6-5: Iterative Refinement (Task 2)
 */

import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChangePreview } from './ChangePreview';
import type {
  AddFieldIntent,
  RemoveFieldIntent,
  ModifyFieldIntent,
  RemoveSectionIntent,
  BatchIntent,
  UndoIntent,
} from './refinement-parser';

describe('ChangePreview', () => {
  const mockOnApply = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ADD_FIELD intent', () => {
    it('renders add field preview correctly', () => {
      const intent: AddFieldIntent = {
        type: 'ADD_FIELD',
        fieldName: 'phone',
        fieldType: 'tel',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Proposed Changes')).toBeInTheDocument();
      expect(screen.getByText('1 change will be applied')).toBeInTheDocument();
      expect(screen.getByText('phone')).toBeInTheDocument();
      expect(screen.getByText('tel')).toBeInTheDocument();
    });

    it('shows section when provided', () => {
      const intent: AddFieldIntent = {
        type: 'ADD_FIELD',
        fieldName: 'email',
        fieldType: 'email',
        section: 'contact',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('contact')).toBeInTheDocument();
    });
  });

  describe('REMOVE_FIELD intent', () => {
    it('renders remove field preview correctly', () => {
      const intent: RemoveFieldIntent = {
        type: 'REMOVE_FIELD',
        fieldName: 'fax',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('fax')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('remove data');
    });

    it('shows destructive warning', () => {
      const intent: RemoveFieldIntent = {
        type: 'REMOVE_FIELD',
        fieldName: 'test',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('REMOVE_SECTION intent', () => {
    it('renders remove section preview correctly', () => {
      const intent: RemoveSectionIntent = {
        type: 'REMOVE_SECTION',
        sectionName: 'address',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('address')).toBeInTheDocument();
      expect(screen.getByText(/All fields in this section/)).toBeInTheDocument();
    });
  });

  describe('MODIFY_FIELD intent', () => {
    it('renders required change correctly', () => {
      const intent: ModifyFieldIntent = {
        type: 'MODIFY_FIELD',
        fieldName: 'email',
        changes: { required: true },
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('email')).toBeInTheDocument();
      expect(screen.getByText(/Make required/)).toBeInTheDocument();
    });

    it('renders optional change correctly', () => {
      const intent: ModifyFieldIntent = {
        type: 'MODIFY_FIELD',
        fieldName: 'phone',
        changes: { required: false },
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Make optional/)).toBeInTheDocument();
    });

    it('renders rename correctly', () => {
      const intent: ModifyFieldIntent = {
        type: 'MODIFY_FIELD',
        fieldName: 'phone',
        changes: { newName: 'mobile' },
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('phone')).toBeInTheDocument();
      expect(screen.getByText('mobile')).toBeInTheDocument();
    });
  });

  describe('UNDO intent', () => {
    it('renders undo preview correctly', () => {
      const intent: UndoIntent = {
        type: 'UNDO',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Undo the last change/)).toBeInTheDocument();
    });

    it('renders undo with count correctly', () => {
      const intent: UndoIntent = {
        type: 'UNDO',
        count: 3,
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/Undo the last 3 changes/)).toBeInTheDocument();
    });
  });

  describe('BATCH intent', () => {
    it('renders multiple changes correctly', () => {
      const intent: BatchIntent = {
        type: 'BATCH',
        commands: [
          { type: 'ADD_FIELD', fieldName: 'phone', fieldType: 'tel' },
          { type: 'REMOVE_FIELD', fieldName: 'fax' },
          { type: 'MODIFY_FIELD', fieldName: 'email', changes: { required: true } },
        ],
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('3 changes will be applied')).toBeInTheDocument();
      expect(screen.getByText('phone')).toBeInTheDocument();
      expect(screen.getByText('fax')).toBeInTheDocument();
      expect(screen.getByText('email')).toBeInTheDocument();
    });

    it('shows destructive warning when batch contains remove', () => {
      const intent: BatchIntent = {
        type: 'BATCH',
        commands: [
          { type: 'ADD_FIELD', fieldName: 'phone', fieldType: 'tel' },
          { type: 'REMOVE_FIELD', fieldName: 'fax' },
        ],
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('calls onApply when Apply button is clicked', () => {
      const intent: AddFieldIntent = {
        type: 'ADD_FIELD',
        fieldName: 'phone',
        fieldType: 'tel',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /apply/i }));
      expect(mockOnApply).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when Cancel button is clicked', () => {
      const intent: AddFieldIntent = {
        type: 'ADD_FIELD',
        fieldName: 'phone',
        fieldType: 'tel',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('disables buttons when isApplying is true', () => {
      const intent: AddFieldIntent = {
        type: 'ADD_FIELD',
        fieldName: 'phone',
        fieldType: 'tel',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
          isApplying={true}
        />
      );

      expect(screen.getByRole('button', { name: /applying/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });
  });

  describe('keyboard shortcuts', () => {
    it('calls onApply when Enter is pressed', () => {
      const intent: AddFieldIntent = {
        type: 'ADD_FIELD',
        fieldName: 'phone',
        fieldType: 'tel',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.keyDown(window, { key: 'Enter' });
      expect(mockOnApply).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when Escape is pressed', () => {
      const intent: AddFieldIntent = {
        type: 'ADD_FIELD',
        fieldName: 'phone',
        fieldType: 'tel',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('does not call onApply on Enter when isApplying', () => {
      const intent: AddFieldIntent = {
        type: 'ADD_FIELD',
        fieldName: 'phone',
        fieldType: 'tel',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
          isApplying={true}
        />
      );

      fireEvent.keyDown(window, { key: 'Enter' });
      expect(mockOnApply).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has proper aria-label on region', () => {
      const intent: AddFieldIntent = {
        type: 'ADD_FIELD',
        fieldName: 'phone',
        fieldType: 'tel',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('region', { name: 'Change preview' })).toBeInTheDocument();
    });

    it('has proper aria-label on changes list', () => {
      const intent: AddFieldIntent = {
        type: 'ADD_FIELD',
        fieldName: 'phone',
        fieldType: 'tel',
      };

      render(
        <ChangePreview
          intent={intent}
          onApply={mockOnApply}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('list', { name: 'List of changes' })).toBeInTheDocument();
    });
  });
});

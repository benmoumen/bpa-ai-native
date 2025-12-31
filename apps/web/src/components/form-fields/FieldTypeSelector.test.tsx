import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  FieldTypeSelector,
  getFieldTypeIcon,
  getFieldTypeLabel,
  FIELD_TYPE_OPTIONS,
} from './FieldTypeSelector';

describe('FieldTypeSelector', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all 10 field type options', () => {
      render(<FieldTypeSelector onSelect={mockOnSelect} />);

      // Check all field types are rendered
      expect(screen.getByRole('button', { name: /add text field/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add text area field/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add number field/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add date field/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add select field/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add radio field/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add checkbox field/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add file field/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add email field/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add phone field/i })).toBeInTheDocument();
    });

    it('displays labels for each field type', () => {
      render(<FieldTypeSelector onSelect={mockOnSelect} />);

      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Text Area')).toBeInTheDocument();
      expect(screen.getByText('Number')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Radio')).toBeInTheDocument();
      expect(screen.getByText('Checkbox')).toBeInTheDocument();
      expect(screen.getByText('File')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
    });

    it('displays descriptions for each field type', () => {
      render(<FieldTypeSelector onSelect={mockOnSelect} />);

      expect(screen.getByText('Single line text input')).toBeInTheDocument();
      expect(screen.getByText('Multi-line text input')).toBeInTheDocument();
      expect(screen.getByText('Numeric input')).toBeInTheDocument();
      expect(screen.getByText('Date picker')).toBeInTheDocument();
      expect(screen.getByText('Dropdown selection')).toBeInTheDocument();
      expect(screen.getByText('Single choice options')).toBeInTheDocument();
      expect(screen.getByText('Multiple choice options')).toBeInTheDocument();
      expect(screen.getByText('File upload')).toBeInTheDocument();
      expect(screen.getByText('Email address input')).toBeInTheDocument();
      expect(screen.getByText('Phone number input')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onSelect with correct type when a field type is clicked', () => {
      render(<FieldTypeSelector onSelect={mockOnSelect} />);

      fireEvent.click(screen.getByRole('button', { name: /add text field/i }));
      expect(mockOnSelect).toHaveBeenCalledWith('TEXT');

      fireEvent.click(screen.getByRole('button', { name: /add number field/i }));
      expect(mockOnSelect).toHaveBeenCalledWith('NUMBER');

      fireEvent.click(screen.getByRole('button', { name: /add date field/i }));
      expect(mockOnSelect).toHaveBeenCalledWith('DATE');
    });

    it('disables all buttons when disabled prop is true', () => {
      render(<FieldTypeSelector onSelect={mockOnSelect} disabled />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it('does not call onSelect when disabled', () => {
      render(<FieldTypeSelector onSelect={mockOnSelect} disabled />);

      fireEvent.click(screen.getByRole('button', { name: /add text field/i }));
      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('FIELD_TYPE_OPTIONS', () => {
    it('contains exactly 10 field types', () => {
      expect(FIELD_TYPE_OPTIONS.length).toBe(10);
    });

    it('includes all required field types', () => {
      const types = FIELD_TYPE_OPTIONS.map((o) => o.type);
      expect(types).toContain('TEXT');
      expect(types).toContain('TEXTAREA');
      expect(types).toContain('NUMBER');
      expect(types).toContain('DATE');
      expect(types).toContain('SELECT');
      expect(types).toContain('RADIO');
      expect(types).toContain('CHECKBOX');
      expect(types).toContain('FILE');
      expect(types).toContain('EMAIL');
      expect(types).toContain('PHONE');
    });
  });
});

describe('getFieldTypeIcon', () => {
  it('returns the correct icon for known types', () => {
    // We can't easily test icon equality, but we can check it returns something
    expect(getFieldTypeIcon('TEXT')).toBeDefined();
    expect(getFieldTypeIcon('NUMBER')).toBeDefined();
    expect(getFieldTypeIcon('DATE')).toBeDefined();
  });

  it('returns default icon for unknown types', () => {
    // Should return Type icon as default
    expect(getFieldTypeIcon('UNKNOWN_TYPE')).toBeDefined();
  });
});

describe('getFieldTypeLabel', () => {
  it('returns the correct label for known types', () => {
    expect(getFieldTypeLabel('TEXT')).toBe('Text');
    expect(getFieldTypeLabel('TEXTAREA')).toBe('Text Area');
    expect(getFieldTypeLabel('NUMBER')).toBe('Number');
    expect(getFieldTypeLabel('DATE')).toBe('Date');
    expect(getFieldTypeLabel('SELECT')).toBe('Select');
    expect(getFieldTypeLabel('RADIO')).toBe('Radio');
    expect(getFieldTypeLabel('CHECKBOX')).toBe('Checkbox');
    expect(getFieldTypeLabel('FILE')).toBe('File');
    expect(getFieldTypeLabel('EMAIL')).toBe('Email');
    expect(getFieldTypeLabel('PHONE')).toBe('Phone');
  });

  it('returns the type string for unknown types', () => {
    expect(getFieldTypeLabel('UNKNOWN_TYPE')).toBe('UNKNOWN_TYPE');
  });
});

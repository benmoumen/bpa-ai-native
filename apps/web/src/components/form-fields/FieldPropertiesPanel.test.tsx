import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FieldPropertiesPanel } from './FieldPropertiesPanel';

// Mock field data
const mockTextField = {
  id: 'field-1',
  formId: 'form-1',
  sectionId: null,
  type: 'TEXT',
  label: 'Full Name',
  name: 'fullName',
  required: true,
  properties: {
    placeholder: 'Enter your name',
    helpText: 'Your legal full name',
    minLength: 2,
    maxLength: 100,
  },
  sortOrder: 0,
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockSelectField = {
  id: 'field-2',
  formId: 'form-1',
  sectionId: null,
  type: 'SELECT',
  label: 'Country',
  name: 'country',
  required: false,
  properties: {
    options: [
      { label: 'USA', value: 'usa' },
      { label: 'Canada', value: 'canada' },
    ],
  },
  sortOrder: 1,
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockNumberField = {
  id: 'field-3',
  formId: 'form-1',
  sectionId: null,
  type: 'NUMBER',
  label: 'Age',
  name: 'age',
  required: true,
  properties: {
    min: 18,
    max: 120,
    decimalPlaces: 2,
  },
  sortOrder: 2,
  isActive: true,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

const mockUseUpdateFormField = vi.fn();

vi.mock('@/hooks/use-form-fields', () => ({
  useUpdateFormField: () => mockUseUpdateFormField(),
}));

// Wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('FieldPropertiesPanel', () => {
  const mockOnClose = vi.fn();
  const mockMutateAsync = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseUpdateFormField.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });
  });

  describe('Common Properties', () => {
    it('renders the panel with field type', () => {
      render(
        <FieldPropertiesPanel
          field={mockTextField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Field Properties')).toBeInTheDocument();
      expect(screen.getByText(/Type:/)).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('displays the label input with current value', () => {
      render(
        <FieldPropertiesPanel
          field={mockTextField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      const labelInput = screen.getByLabelText('Label');
      expect(labelInput).toHaveValue('Full Name');
    });

    it('displays the name input with current value', () => {
      render(
        <FieldPropertiesPanel
          field={mockTextField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      const nameInput = screen.getByLabelText('Name (identifier)');
      expect(nameInput).toHaveValue('fullName');
    });

    it('displays the required checkbox with current state', () => {
      render(
        <FieldPropertiesPanel
          field={mockTextField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      const requiredCheckbox = screen.getByLabelText('Required field');
      expect(requiredCheckbox).toBeChecked();
    });

    it('displays placeholder and help text inputs', () => {
      render(
        <FieldPropertiesPanel
          field={mockTextField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByLabelText('Placeholder')).toHaveValue('Enter your name');
      expect(screen.getByLabelText('Help Text')).toHaveValue('Your legal full name');
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <FieldPropertiesPanel
          field={mockTextField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      const closeButton = screen.getByRole('button', { name: /close properties panel/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Name Link Toggle', () => {
    it('shows linked state when name matches auto-generated from label', () => {
      render(
        <FieldPropertiesPanel
          field={mockTextField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Linked')).toBeInTheDocument();
    });

    it('shows custom state when name does not match auto-generated', () => {
      const customField = {
        ...mockTextField,
        name: 'customName',
      };

      render(
        <FieldPropertiesPanel
          field={customField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Custom')).toBeInTheDocument();
    });
  });

  describe('Text Field Properties', () => {
    it('renders min/max length inputs for TEXT fields', () => {
      render(
        <FieldPropertiesPanel
          field={mockTextField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Type-specific Properties')).toBeInTheDocument();
      expect(screen.getByLabelText('Min Length')).toHaveValue(2);
      expect(screen.getByLabelText('Max Length')).toHaveValue(100);
    });
  });

  describe('Number Field Properties', () => {
    it('renders min/max value and decimal places inputs for NUMBER fields', () => {
      render(
        <FieldPropertiesPanel
          field={mockNumberField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByLabelText('Min Value')).toHaveValue(18);
      expect(screen.getByLabelText('Max Value')).toHaveValue(120);
      expect(screen.getByLabelText('Decimal Places')).toHaveValue(2);
    });
  });

  describe('Select Field Properties', () => {
    it('renders options list for SELECT fields', () => {
      render(
        <FieldPropertiesPanel
          field={mockSelectField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByLabelText('Option 1 label')).toHaveValue('USA');
      expect(screen.getByLabelText('Option 1 value')).toHaveValue('usa');
      expect(screen.getByLabelText('Option 2 label')).toHaveValue('Canada');
      expect(screen.getByLabelText('Option 2 value')).toHaveValue('canada');
    });

    it('renders Add Option button', () => {
      render(
        <FieldPropertiesPanel
          field={mockSelectField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('button', { name: /add option/i })).toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('save button is disabled when no changes made', () => {
      render(
        <FieldPropertiesPanel
          field={mockTextField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).toBeDisabled();
    });

    it('save button is enabled after making changes', async () => {
      const user = userEvent.setup();

      render(
        <FieldPropertiesPanel
          field={mockTextField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      const labelInput = screen.getByLabelText('Label');
      await user.clear(labelInput);
      await user.type(labelInput, 'New Label');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('calls mutation when save button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <FieldPropertiesPanel
          field={mockTextField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      // Make a change
      const labelInput = screen.getByLabelText('Label');
      await user.clear(labelInput);
      await user.type(labelInput, 'New Label');

      // Click save
      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          id: 'field-1',
          data: expect.objectContaining({
            label: 'New Label',
          }),
        });
      });
    });

    it('shows saving state while mutation is pending', () => {
      mockUseUpdateFormField.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
        isError: false,
        error: null,
      });

      render(
        <FieldPropertiesPanel
          field={mockTextField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('shows error message when mutation fails', () => {
      mockUseUpdateFormField.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: false,
        isError: true,
        error: new Error('Network error'),
      });

      render(
        <FieldPropertiesPanel
          field={mockTextField}
          formId="form-1"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});

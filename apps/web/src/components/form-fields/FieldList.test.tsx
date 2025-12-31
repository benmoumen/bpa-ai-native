import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FieldList } from './FieldList';

// Mock form fields data
const mockFields = [
  {
    id: 'field-1',
    formId: 'form-1',
    sectionId: null,
    type: 'TEXT',
    label: 'Full Name',
    name: 'fullName',
    required: true,
    properties: {},
    sortOrder: 0,
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'field-2',
    formId: 'form-1',
    sectionId: null,
    type: 'EMAIL',
    label: 'Email Address',
    name: 'emailAddress',
    required: true,
    properties: {},
    sortOrder: 1,
    isActive: true,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
  {
    id: 'field-3',
    formId: 'form-1',
    sectionId: null,
    type: 'DATE',
    label: 'Date of Birth',
    name: 'dateOfBirth',
    required: false,
    properties: {},
    sortOrder: 2,
    isActive: true,
    createdAt: '2025-01-03T00:00:00Z',
    updatedAt: '2025-01-03T00:00:00Z',
  },
];

const mockUseFormFields = vi.fn();
const mockUseCreateFormField = vi.fn();
const mockUseUpdateFormField = vi.fn();
const mockUseDeleteFormField = vi.fn();

vi.mock('@/hooks/use-form-fields', () => ({
  useFormFields: () => mockUseFormFields(),
  useCreateFormField: () => mockUseCreateFormField(),
  useUpdateFormField: () => mockUseUpdateFormField(),
  useDeleteFormField: () => mockUseDeleteFormField(),
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

describe('FieldList', () => {
  const defaultProps = {
    formId: 'form-1',
    isEditable: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseFormFields.mockReturnValue({
      data: {
        data: mockFields,
        meta: { total: 3, page: 1, perPage: 20, hasNext: false },
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    mockUseCreateFormField.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    mockUseUpdateFormField.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });

    mockUseDeleteFormField.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  describe('Rendering', () => {
    it('renders the field list header', () => {
      render(<FieldList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Fields')).toBeInTheDocument();
      expect(
        screen.getByText('Define the data fields to collect from applicants')
      ).toBeInTheDocument();
    });

    it('renders Add Field button when editable', () => {
      render(<FieldList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByRole('button', { name: /add field/i })
      ).toBeInTheDocument();
    });

    it('does not render Add Field button when not editable', () => {
      render(<FieldList {...defaultProps} isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /add field/i })
      ).not.toBeInTheDocument();
    });

    it('renders fields in a table', () => {
      render(<FieldList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Full Name')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Date of Birth')).toBeInTheDocument();
    });

    it('displays field type badges', () => {
      render(<FieldList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Text')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
    });

    it('displays required status for each field', () => {
      render(<FieldList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Two required fields (Yes) and one optional (No)
      const yesLabels = screen.getAllByText('Yes');
      const noLabels = screen.getAllByText('No');

      expect(yesLabels.length).toBe(2);
      expect(noLabels.length).toBe(1);
    });
  });

  describe('Loading State', () => {
    it('renders loading skeleton when loading', () => {
      mockUseFormFields.mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<FieldList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Check for skeleton elements (animate-pulse class)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Error State', () => {
    it('renders error message when there is an error', () => {
      mockUseFormFields.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch fields'),
      });

      render(<FieldList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Failed to load fields')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch fields')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders empty state when no fields exist', () => {
      mockUseFormFields.mockReturnValue({
        data: { data: [], meta: { total: 0, page: 1, perPage: 20, hasNext: false } },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<FieldList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('No fields yet')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Add fields to define what data this form will collect.'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /add your first field/i })
      ).toBeInTheDocument();
    });

    it('does not show add button in empty state when not editable', () => {
      mockUseFormFields.mockReturnValue({
        data: { data: [], meta: { total: 0, page: 1, perPage: 20, hasNext: false } },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<FieldList {...defaultProps} isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /add your first field/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders action buttons for each field when editable', () => {
      render(<FieldList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const actionButtons = screen.getAllByRole('button', {
        name: /actions for/i,
      });
      expect(actionButtons.length).toBe(3);
    });

    it('does not show actions column when not editable', () => {
      render(<FieldList {...defaultProps} isEditable={false} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.queryByRole('button', { name: /actions for/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Field Ordering', () => {
    it('renders fields sorted by sortOrder', () => {
      const unsortedFields = [
        { ...mockFields[2], sortOrder: 2 },
        { ...mockFields[0], sortOrder: 0 },
        { ...mockFields[1], sortOrder: 1 },
      ];

      mockUseFormFields.mockReturnValue({
        data: {
          data: unsortedFields,
          meta: { total: 3, page: 1, perPage: 20, hasNext: false },
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<FieldList {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Get all row cells containing field labels
      const rows = screen.getAllByRole('row');
      // Skip header row
      const dataRows = rows.slice(1);

      // Fields should be in sortOrder: Full Name (0), Email Address (1), Date of Birth (2)
      expect(dataRows[0]).toHaveTextContent('Full Name');
      expect(dataRows[1]).toHaveTextContent('Email Address');
      expect(dataRows[2]).toHaveTextContent('Date of Birth');
    });
  });
});

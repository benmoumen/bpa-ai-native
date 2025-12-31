import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddFieldDialog } from './AddFieldDialog';

const mockMutateAsync = vi.fn();
const mockUseCreateFormField = vi.fn();

vi.mock('@/hooks/use-form-fields', () => ({
  useCreateFormField: (formId: string) => mockUseCreateFormField(formId),
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

describe('AddFieldDialog', () => {
  const mockOnOpenChange = vi.fn();
  const defaultProps = {
    formId: 'form-1',
    open: true,
    onOpenChange: mockOnOpenChange,
    nextSortOrder: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockMutateAsync.mockResolvedValue({
      id: 'new-field',
      type: 'TEXT',
      label: 'New Text Field',
      name: 'newTextField',
    });

    mockUseCreateFormField.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
  });

  describe('Rendering', () => {
    it('renders dialog title and description when open', () => {
      render(<AddFieldDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Add Field')).toBeInTheDocument();
      expect(
        screen.getByText('Select the type of field you want to add to this form.')
      ).toBeInTheDocument();
    });

    it('does not render dialog content when closed', () => {
      render(<AddFieldDialog {...defaultProps} open={false} />, {
        wrapper: createWrapper(),
      });

      expect(screen.queryByText('Add Field')).not.toBeInTheDocument();
    });

    it('renders all field type options', () => {
      render(<AddFieldDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Check for field type buttons
      expect(screen.getByRole('button', { name: /add text field/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add email field/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add number field/i })).toBeInTheDocument();
    });
  });

  describe('Field Creation', () => {
    it('creates field with correct type when option is clicked', async () => {
      render(<AddFieldDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      fireEvent.click(screen.getByRole('button', { name: /add text field/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          type: 'TEXT',
          label: 'New Text Field',
          name: 'newTextField',
          sortOrder: 0,
          required: false,
          properties: {},
        });
      });
    });

    it('creates field with correct default label for each type', async () => {
      render(<AddFieldDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Click email field type
      fireEvent.click(screen.getByRole('button', { name: /add email field/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'EMAIL',
            label: 'New Email Field',
            name: 'newEmailField',
          })
        );
      });
    });

    it('uses nextSortOrder when creating field', async () => {
      render(<AddFieldDialog {...defaultProps} nextSortOrder={5} />, {
        wrapper: createWrapper(),
      });

      fireEvent.click(screen.getByRole('button', { name: /add text field/i }));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            sortOrder: 5,
          })
        );
      });
    });

    it('closes dialog on successful creation', async () => {
      render(<AddFieldDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      fireEvent.click(screen.getByRole('button', { name: /add text field/i }));

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when creating field', () => {
      mockUseCreateFormField.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      });

      render(<AddFieldDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Creating field...')).toBeInTheDocument();
    });

    it('disables field type buttons when creating field', () => {
      mockUseCreateFormField.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      });

      render(<AddFieldDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const buttons = screen.getAllByRole('button', { name: /add .* field/i });
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message on creation failure', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Failed to create field'));

      render(<AddFieldDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      fireEvent.click(screen.getByRole('button', { name: /add text field/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create field')).toBeInTheDocument();
      });
    });

    it('clears error when dialog is closed and reopened', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Failed to create field'));

      const { rerender } = render(<AddFieldDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      fireEvent.click(screen.getByRole('button', { name: /add text field/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create field')).toBeInTheDocument();
      });

      // Close dialog
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <AddFieldDialog {...defaultProps} open={false} />
        </QueryClientProvider>
      );

      // Reopen dialog - need to reset mock first
      mockMutateAsync.mockResolvedValue({ id: 'new-field' });

      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <AddFieldDialog {...defaultProps} open={true} />
        </QueryClientProvider>
      );

      // Error should be cleared
      expect(screen.queryByText('Failed to create field')).not.toBeInTheDocument();
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeleteRegistrationDialog } from './DeleteRegistrationDialog';

// Mock the hook
const mockDeleteMutateAsync = vi.fn();

vi.mock('@/hooks/use-registrations', () => ({
  useDeleteRegistration: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
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

describe('DeleteRegistrationDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  const registration = {
    id: 'reg-1',
    serviceId: 'service-1',
    name: 'Business License',
    shortName: 'BL',
    key: 'business-license',
    description: 'Apply for a business license',
    isActive: true,
    sortOrder: 0,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  };

  const defaultProps = {
    serviceId: 'service-1',
    registration,
    open: true,
    onOpenChange: mockOnOpenChange,
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteMutateAsync.mockResolvedValue({});
  });

  describe('Rendering', () => {
    it('renders the dialog with correct title', () => {
      render(<DeleteRegistrationDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Title should be in a heading (DialogTitle)
      expect(screen.getByRole('heading', { name: 'Delete Registration' })).toBeInTheDocument();
    });

    it('renders confirmation message with registration name', () => {
      render(<DeleteRegistrationDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // The text appears in the dialog description
      expect(screen.getByRole('dialog')).toHaveTextContent('Are you sure you want to delete');
      expect(screen.getByRole('dialog')).toHaveTextContent('Business License');
    });

    it('displays soft-delete information', () => {
      render(<DeleteRegistrationDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(
        screen.getByText(
          /This will deactivate the registration/
        )
      ).toBeInTheDocument();
    });

    it('displays registration details', () => {
      render(<DeleteRegistrationDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Name:')).toBeInTheDocument();
      expect(screen.getByText('Short Name:')).toBeInTheDocument();
      expect(screen.getByText('Key:')).toBeInTheDocument();
      expect(screen.getByText('BL')).toBeInTheDocument();
      expect(screen.getByText('business-license')).toBeInTheDocument();
    });

    it('renders Cancel and Delete buttons', () => {
      render(<DeleteRegistrationDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Delete Registration/i })
      ).toBeInTheDocument();
    });

    it('does not render when registration is null', () => {
      render(
        <DeleteRegistrationDialog {...defaultProps} registration={null} />,
        { wrapper: createWrapper() }
      );

      expect(
        screen.queryByText('Delete Registration')
      ).not.toBeInTheDocument();
    });
  });

  describe('Delete Action', () => {
    it('calls delete mutation when Delete is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteRegistrationDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.click(
        screen.getByRole('button', { name: /Delete Registration/i })
      );

      await waitFor(() => {
        expect(mockDeleteMutateAsync).toHaveBeenCalledWith('reg-1');
      });
    });

    it('calls onSuccess callback after successful delete', async () => {
      const user = userEvent.setup();
      render(<DeleteRegistrationDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.click(
        screen.getByRole('button', { name: /Delete Registration/i })
      );

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('closes dialog after successful delete', async () => {
      const user = userEvent.setup();
      render(<DeleteRegistrationDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.click(
        screen.getByRole('button', { name: /Delete Registration/i })
      );

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('shows error message on delete failure', async () => {
      mockDeleteMutateAsync.mockRejectedValue(new Error('Cannot delete'));

      const user = userEvent.setup();
      render(<DeleteRegistrationDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.click(
        screen.getByRole('button', { name: /Delete Registration/i })
      );

      await waitFor(() => {
        expect(screen.getByText('Cannot delete')).toBeInTheDocument();
      });
    });

    it('does not close dialog on delete failure', async () => {
      mockDeleteMutateAsync.mockRejectedValue(new Error('Cannot delete'));

      const user = userEvent.setup();
      render(<DeleteRegistrationDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.click(
        screen.getByRole('button', { name: /Delete Registration/i })
      );

      await waitFor(() => {
        expect(screen.getByText('Cannot delete')).toBeInTheDocument();
      });

      // Dialog should still be open (onOpenChange not called with false)
      expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
    });
  });

  describe('Cancel Action', () => {
    it('closes dialog when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteRegistrationDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('does not call delete mutation when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<DeleteRegistrationDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(mockDeleteMutateAsync).not.toHaveBeenCalled();
    });
  });

  describe('Error Reset', () => {
    it('resets error when dialog is closed', async () => {
      mockDeleteMutateAsync.mockRejectedValue(new Error('Cannot delete'));

      const user = userEvent.setup();
      const { rerender } = render(
        <DeleteRegistrationDialog {...defaultProps} />,
        { wrapper: createWrapper() }
      );

      // Trigger error
      await user.click(
        screen.getByRole('button', { name: /Delete Registration/i })
      );

      await waitFor(() => {
        expect(screen.getByText('Cannot delete')).toBeInTheDocument();
      });

      // Close and reopen dialog
      rerender(<DeleteRegistrationDialog {...defaultProps} open={false} />);
      rerender(<DeleteRegistrationDialog {...defaultProps} open={true} />);

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Cannot delete')).not.toBeInTheDocument();
      });
    });
  });
});

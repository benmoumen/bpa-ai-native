import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateFormDialog } from './CreateFormDialog';

// Mock the hooks
const mockCreateMutateAsync = vi.fn();

vi.mock('@/hooks/use-forms', () => ({
  useCreateForm: () => ({
    mutateAsync: mockCreateMutateAsync,
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

describe('CreateFormDialog', () => {
  const mockOnOpenChange = vi.fn();

  const defaultProps = {
    serviceId: 'service-1',
    formType: 'APPLICANT' as const,
    open: true,
    onOpenChange: mockOnOpenChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutateAsync.mockResolvedValue({});
  });

  describe('APPLICANT Form Type', () => {
    it('renders the dialog with correct title for APPLICANT', () => {
      render(<CreateFormDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Create Applicant Form')).toBeInTheDocument();
      expect(
        screen.getByText('Data collection form for citizens and applicants.')
      ).toBeInTheDocument();
    });

    it('displays APPLICANT type badge', () => {
      render(<CreateFormDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('APPLICANT')).toBeInTheDocument();
      expect(
        screen.getByText('The form type is preset and cannot be changed.')
      ).toBeInTheDocument();
    });

    it('shows correct placeholder for APPLICANT form', () => {
      render(<CreateFormDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const nameInput = screen.getByLabelText(/Form Name/);
      expect(nameInput).toHaveAttribute(
        'placeholder',
        'e.g., Business Registration Form'
      );
    });
  });

  describe('GUIDE Form Type', () => {
    it('renders the dialog with correct title for GUIDE', () => {
      render(<CreateFormDialog {...defaultProps} formType="GUIDE" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Create Guide Form')).toBeInTheDocument();
      expect(
        screen.getByText('Workflow form for operators and staff members.')
      ).toBeInTheDocument();
    });

    it('displays GUIDE type badge', () => {
      render(<CreateFormDialog {...defaultProps} formType="GUIDE" />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('GUIDE')).toBeInTheDocument();
    });

    it('shows correct placeholder for GUIDE form', () => {
      render(<CreateFormDialog {...defaultProps} formType="GUIDE" />, {
        wrapper: createWrapper(),
      });

      const nameInput = screen.getByLabelText(/Form Name/);
      expect(nameInput).toHaveAttribute(
        'placeholder',
        'e.g., Application Review Form'
      );
    });
  });

  describe('Form Validation', () => {
    it('validates required name field on submit', async () => {
      const user = userEvent.setup();
      render(<CreateFormDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      // Submit without filling any fields
      await user.click(screen.getByRole('button', { name: /Create Form/i }));

      await waitFor(() => {
        expect(screen.getByText('Form name is required')).toBeInTheDocument();
      });
    });

    it('validates name is not just whitespace', async () => {
      const user = userEvent.setup();
      render(<CreateFormDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.type(screen.getByLabelText(/Form Name/), '   ');
      await user.click(screen.getByRole('button', { name: /Create Form/i }));

      await waitFor(() => {
        expect(screen.getByText('Form name is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('creates APPLICANT form on valid submit', async () => {
      const user = userEvent.setup();
      render(<CreateFormDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.type(
        screen.getByLabelText(/Form Name/),
        'Business Registration Form'
      );
      await user.click(screen.getByRole('button', { name: /Create Form/i }));

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith({
          name: 'Business Registration Form',
          type: 'APPLICANT',
        });
      });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('creates GUIDE form on valid submit', async () => {
      const user = userEvent.setup();
      render(<CreateFormDialog {...defaultProps} formType="GUIDE" />, {
        wrapper: createWrapper(),
      });

      await user.type(
        screen.getByLabelText(/Form Name/),
        'Application Review Form'
      );
      await user.click(screen.getByRole('button', { name: /Create Form/i }));

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith({
          name: 'Application Review Form',
          type: 'GUIDE',
        });
      });

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows error message on create failure', async () => {
      mockCreateMutateAsync.mockRejectedValue(
        new Error('Form name already exists in this service')
      );

      const user = userEvent.setup();
      render(<CreateFormDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.type(screen.getByLabelText(/Form Name/), 'Duplicate Form');
      await user.click(screen.getByRole('button', { name: /Create Form/i }));

      await waitFor(() => {
        expect(
          screen.getByText('Form name already exists in this service')
        ).toBeInTheDocument();
      });
    });

    it('trims whitespace from name before submitting', async () => {
      const user = userEvent.setup();
      render(<CreateFormDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.type(screen.getByLabelText(/Form Name/), '  My Form  ');
      await user.click(screen.getByRole('button', { name: /Create Form/i }));

      await waitFor(() => {
        expect(mockCreateMutateAsync).toHaveBeenCalledWith({
          name: 'My Form',
          type: 'APPLICANT',
        });
      });
    });
  });

  describe('Dialog Behavior', () => {
    it('closes dialog when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateFormDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.click(screen.getByRole('button', { name: /Cancel/i }));

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('resets form when dialog is reopened', async () => {
      const { rerender } = render(
        <CreateFormDialog {...defaultProps} open={false} />,
        { wrapper: createWrapper() }
      );

      // Open dialog
      rerender(<CreateFormDialog {...defaultProps} open={true} />);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Form Name/) as HTMLInputElement;
        expect(nameInput.value).toBe('');
      });
    });

    it('auto-focuses name input when dialog opens', () => {
      render(<CreateFormDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      const nameInput = screen.getByLabelText(/Form Name/);
      expect(nameInput).toHaveFocus();
    });
  });

  describe('Character Counter', () => {
    it('displays character count for name field', () => {
      render(<CreateFormDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('0/255 characters')).toBeInTheDocument();
    });

    it('updates character count as user types', async () => {
      const user = userEvent.setup();
      render(<CreateFormDialog {...defaultProps} />, {
        wrapper: createWrapper(),
      });

      await user.type(screen.getByLabelText(/Form Name/), 'My Test Form');

      await waitFor(() => {
        expect(screen.getByText('12/255 characters')).toBeInTheDocument();
      });
    });
  });
});
